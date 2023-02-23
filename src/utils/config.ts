import { ref, Ref } from 'vue'
import { getDb, EDatabase } from './sql'
import {
  Json,
  isJson,
  JsonObject,
  JsonNonPrimitive,
  isJsonPrimitive,
  Key,
  isTauriEvent,
} from './common'
import throttle from 'lodash/throttle'
import { emit } from '@tauri-apps/api/event'
import { listen } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'

const defaultConfig = {
  string: 'default value1',
  number: 42,
  boolean: false,
  colors: {
    titlebar: { name: 'titlebar', label: 'タイトルバー', value: 'lightgray' },
    color1: { name: 'color1', label: '色1', value: 'lightblue' },
    color2: { name: 'color2', label: '色2', value: '#333000' },
  },
}

const keySymbol = Symbol('key')
const emittedSymbol = Symbol('emitted')

type Config = typeof defaultConfig

export type RefConfig = Ref<Config> & { [emittedSymbol]?: boolean }
let refConfigPromise: undefined | Promise<RefConfig>
let refConfig: undefined | RefConfig
let dbPromise: undefined | Promise<EDatabase>

function splitKey(joinedKey: string) {
  const [, currentKey, restKey] = joinedKey?.match(/^([^.]+)\.?(.*)$/) ?? []
  return [currentKey, restKey]
}
function deepGet<T extends JsonNonPrimitive>(
  target: T,
  joinedKey: string //ex. 'a.b.c'
): unknown {
  const [rawCurrentKey, restKey] = splitKey(joinedKey)
  if (!rawCurrentKey) throw new Error()
  const currentValue = (() => {
    if (Array.isArray(target)) {
      const currentKey = Number(rawCurrentKey)
      return target[currentKey]
    } else {
      const currentKey = rawCurrentKey
      return target[currentKey]
    }
  })()

  if (restKey) {
    if (!currentValue || isJsonPrimitive(currentValue)) throw new Error()
    return deepGet(currentValue, restKey)
  } else {
    return currentValue
  }
}
function deepSet<T extends JsonNonPrimitive>(
  target: T,
  joinedKey: string, // ex. 'a.b.c'
  value: Json,
  defaultTarget: T
) {
  const [rawCurrentKey, restKey] = splitKey(joinedKey)
  if (!rawCurrentKey) throw new Error()

  const [setter, getCurrentValue, getCurrentDefaultValue] = (() => {
    if (Array.isArray(target)) {
      if (!Array.isArray(defaultTarget)) throw new Error()
      const currentKey = Number(rawCurrentKey)
      return [
        (val: Json) => {
          target[currentKey] = val
        },
        () => target[currentKey],
        () => defaultTarget[currentKey],
      ]
    } else {
      if (Array.isArray(defaultTarget)) throw new Error()
      const currentKey = rawCurrentKey
      return [
        (val: Json) => {
          target[currentKey] = val
        },
        () => target[currentKey],
        () => defaultTarget[currentKey],
      ]
    }
  })()

  if (restKey) {
    if (!getCurrentValue()) {
      if (Array.isArray(getCurrentDefaultValue())) {
        setter([])
      } else {
        setter({})
      }
    }
    // 上の if 節で値があることが保証されている (currentValue ??= [] | {} と同義)
    const currentValue = getCurrentValue() as Json
    const currentDefaultValue = getCurrentDefaultValue() as Json
    if (isJsonPrimitive(currentValue) || isJsonPrimitive(currentDefaultValue))
      throw new Error()
    deepSet(currentValue, restKey, value, currentDefaultValue)
  } else {
    setter(value)
  }
  return true
}

async function getInitialConfig(db: EDatabase): Promise<Config> {
  const records: Record<string, string> = Object.fromEntries(
    await db
      .select<{ key: string; value: string }>(`SELECT * FROM configs`)
      .then((rawRecords) => {
        console.log({ rawRecords })
        const records: [string, string][] = rawRecords.map((rawRecord) => [
          rawRecord.key,
          rawRecord.value,
        ])
        return records.sort((a, b) => {
          const ak = a[0]
          const bk = b[0]
          if (ak < bk) return -1
          else if (ak > bk) return 1
          else return 0
        })
      })
  )

  const initialConfig = {}
  const keys = (function func(val: Json, prefix: string): string[] {
    if (isJsonPrimitive(val)) return [prefix]
    else
      return Object.entries(val).flatMap(([key, child]) => {
        const nextKey = String(prefix ? prefix + '.' + key : key)
        return func(child, nextKey)
      })
  })(defaultConfig, '')

  keys.map((key) => {
    const defaultValue = deepGet(defaultConfig, key)
    const rawValue =
      records[key] ??
      (() => {
        db.execute(`INSERT INTO configs VALUES($1, $2)`, [key, defaultValue])
        return defaultValue
      })()
    const value = (() => {
      if (typeof defaultValue === 'number') {
        return Number(rawValue)
      } else if (typeof defaultValue === 'boolean') {
        return rawValue === 'true' ? true : false
      } else {
        return rawValue
      }
    })()
    if (!isJsonPrimitive(value)) throw new Error()
    deepSet(initialConfig, key, value, defaultConfig)
  })
  return initialConfig as Config
}

type HasKey<T> = T & { [keySymbol]: string }

type Consumer = (value: unknown) => void
const dbUpdaters: Record<string, ReturnType<typeof throttle<Consumer>>> = {}
const emitters: Record<string, ReturnType<typeof throttle<Consumer>>> = {}

const proxyHandler = {
  set<T extends HasKey<JsonNonPrimitive>>(
    obj: T,
    prop: Key,
    value: unknown
  ): boolean {
    const anyProp = prop as any
    if (!(prop in obj))
      throw new Error(`オブジェクトは '${String(prop)}' メンバを持てません`)
    if (typeof obj[anyProp] !== typeof value)
      throw new Error(
        `'${String(prop)}' メンバの値の型は ${typeof obj[
          anyProp
        ]} である必要があります`
      )

    obj[anyProp] = value as any

    if (!refConfig || refConfig[emittedSymbol]) {
      return true
    }

    const key = obj[keySymbol]
      ? obj[keySymbol] + '.' + String(prop)
      : String(prop)
    const dbUpdater = (dbUpdaters[key] ??= throttle((value) => {
      dbPromise ??= getDb()
      dbPromise.then((db) =>
        db.execute(`UPDATE configs SET value = $2 WHERE key = $1;`, [
          key,
          String(value),
        ])
      )
    }, 1000))
    dbUpdater(value)
    const emitter = (emitters[key] ??= throttle((value) => {
      emit('update-config', { key, value })
    }, 100))
    emitter(value)

    return true
  },
}

export async function getConfig(): Promise<RefConfig> {
  refConfigPromise ??= (async () => {
    dbPromise ??= getDb()
    const db = await dbPromise
    await db.execute(`
      CREATE TABLE IF NOT EXISTS configs (
        key   TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL
      );`)
    const initialConfig = await getInitialConfig(db)

    const configProxy = (function func<T extends JsonNonPrimitive>(
      target: T,
      key: string
    ): HasKey<T> {
      const ifunc = (value: Json, childKey: string | number): Json => {
        if (isJsonPrimitive(value)) return value
        else
          return func(
            value,
            key ? key + '.' + String(childKey) : String(childKey)
          )
      }
      const processedTarget: JsonNonPrimitive & { [keySymbol]?: string } =
        (() => {
          if (Array.isArray(target)) {
            return target.map(ifunc)
          } else {
            return Object.map<JsonObject, Json>(target, ifunc)
          }
        })()
      processedTarget[keySymbol] = key

      return new Proxy(processedTarget, proxyHandler) as HasKey<T>
    })(initialConfig, '')

    return ref(configProxy)
  })()

  refConfig ??= await refConfigPromise
  return refConfig
}

listen('update-config', async (e: unknown) => {
  if (
    !refConfig ||
    !isTauriEvent(e) ||
    e.windowLabel === appWindow.label ||
    !(e.payload instanceof Object) ||
    !('key' in e.payload) ||
    !('value' in e.payload) ||
    typeof e.payload.key !== 'string' ||
    !isJson(e.payload.value)
  ) {
    return
  }

  const { key, value } = e.payload
  refConfig[emittedSymbol] = true
  try {
    deepSet(refConfig.value, key, value, defaultConfig)
  } catch (e) {}
  refConfig[emittedSymbol] = false
})
