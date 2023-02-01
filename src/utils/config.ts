import { getDb } from './sql'
import throttle from 'lodash/throttle'
import { listen } from '@tauri-apps/api/event'
import { emit } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'
import { isTauriEvent } from './common'
import { ref } from 'vue'

export const defaultConfig = {
  value1: 'default value1',
  value2: 42,
  value3: 10,
}

export type Config = typeof defaultConfig
type ConfigKey = keyof Config
type ConfigValue = Config[ConfigKey]

const emitted = Symbol()
type PartialConfig = {
  [K in keyof Config]?: Config[K]
}

function isConfigKey(key: unknown): key is ConfigKey {
  return typeof key === 'string' && key in defaultConfig
}
function isConfigValue(key: ConfigKey, value: unknown): value is ConfigValue {
  return typeof value === typeof defaultConfig[key]
}
function isConfig(config: unknown): config is Config {
  if (!config || typeof config !== 'object') {
    return false
  }
  const allKeys = [
    ...new Set([...Object.keys(config), ...Object.keys(defaultConfig)]),
  ]
  for (const key of allKeys) {
    if (!isConfigKey(key) || !(key in config) || !(key in defaultConfig)) {
      return false
    }
  }
  return true
}

type RefConfig = ReturnType<typeof ref<Config>> & { [emitted]?: boolean }
let refConfig: RefConfig
let configProxyPromise: Promise<Config> | undefined = undefined

export async function getConfig(): Promise<RefConfig> {
  configProxyPromise ??= (async () => {
    const db = await getDb()
    await db.execute(`
      CREATE TABLE IF NOT EXISTS configs (
        key   TEXT NOT NULL PRIMARY KEY,
        value TEXT NOT NULL
      );`)
    const records: PartialConfig = Object.fromEntries(
      await db
        .select<{ key: string; value: string }[]>(`SELECT * FROM configs`)
        .then((rawRecords) =>
          rawRecords.map((rawRecord) => [rawRecord.key, rawRecord.value])
        )
    )
    const initialConfigValue = Object.fromEntries(
      await Promise.all(
        Object.entries(defaultConfig).map(async ([key, defaultValue]) => {
          if (!isConfigKey(key)) return
          const value = await (async () => {
            const result = records[key]

            if (result === undefined) {
              await db.execute(`INSERT INTO configs VALUES($1, $2)`, [
                key,
                defaultValue,
              ])
            }
            const rawValue = result ?? defaultValue
            if (typeof defaultValue === 'number') {
              return Number(rawValue)
            }
            return rawValue
          })()
          const entry: [ConfigKey, ConfigValue] = [key, value]
          return entry
        })
      ).then((r) =>
        r.filter(
          (entry): entry is NonNullable<typeof entry> => entry !== undefined
        )
      )
    )
    if (!isConfig(initialConfigValue))
      throw new Error('configの読み込みに失敗しました')

    const dbUpdaters: { [K in ConfigKey]?: ReturnType<typeof throttle> } = {}
    const emitters: { [K in ConfigKey]?: ReturnType<typeof throttle> } = {}

    type ProxyHandler<T extends object> = {
      set(obj: T, prop: string, value: any): boolean
    }
    const proxyHandler: ProxyHandler<Config> = {
      set(obj: PartialConfig, prop: string, value) {
        if (!isConfigKey(prop)) {
          return false
        }
        Object.assign(obj, { [prop]: value })
        if (refConfig[emitted]) {
          return true
        }
        const dbUpdater = (dbUpdaters[prop] ??= throttle((value) => {
          db.execute(`UPDATE configs SET value = $2 WHERE key = $1;`, [
            prop,
            String(value),
          ])
        }, 1000))
        dbUpdater(value)

        const emitter = (emitters[prop] ??= throttle((value) => {
          emit('update-config', { key: prop, value })
          emit('update-config', null)
        }, 100))
        emitter(value)
        return true
      },
    }
    return new Proxy(initialConfigValue, proxyHandler)
  })()
  const configProxy = await configProxyPromise
  if (!configProxy) {
    throw new Error()
  }
  refConfig = ref(configProxy)
  return refConfig
}

type UpdateConfigEventPayload = {
  key: ConfigKey
  value: ConfigValue
}
function isUpdateConfigEventPayload(
  value: unknown
): value is UpdateConfigEventPayload {
  if (!value || typeof value !== 'object') {
    return false
  }

  const payload = value as Record<keyof UpdateConfigEventPayload, unknown>
  if (!isConfigKey(payload.key) || !isConfigValue(payload.key, payload.value)) {
    return false
  }
  return true
}

listen('update-config', async (e: unknown) => {
  if (!isTauriEvent(e)) {
    return
  }

  if (e.windowLabel === appWindow.label) {
    return
  }

  if (!isUpdateConfigEventPayload(e.payload)) {
    return
  }

  const configProxy = await configProxyPromise

  if (!isConfig(configProxy)) {
    return
  }

  const { key, value } = e.payload
  refConfig[emitted] = true
  if (!isConfig(refConfig.value)) {
    return
  }
  Object.assign(refConfig.value, { [key]: value })
  refConfig[emitted] = false
})
