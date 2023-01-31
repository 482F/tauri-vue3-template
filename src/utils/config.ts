import { getDb } from './sql'
import throttle from 'lodash/throttle'

export const defaultConfig = {
  value1: 'default value1',
  value2: 42,
}

export type Config = typeof defaultConfig
type ConfigKey = keyof Config
type ConfigValue = Config[ConfigKey]
type PartialConfig = {
  [K in keyof Config]?: Config[K]
}

function isConfigKey(key: string): key is ConfigKey {
  return key in defaultConfig
}
function isConfig(config: object): config is Config {
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

export async function initConfig(): Promise<Config> {
  const db = await getDb()
  await db.execute(`
    CREATE TABLE IF NOT EXISTS configs (
      key   TEXT NOT NULL PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  const records: PartialConfig = Object.fromEntries(
    await db
      .select<{ key: string; value: string }[]>(`SELECT * FROM configs`)
      .then((rawRecords) =>
        rawRecords.map((rawRecord) => [rawRecord.key, rawRecord.value])
      )
  )
  const config: PartialConfig = Object.fromEntries(
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
  if (!isConfig(config)) throw new Error('configの読み込みに失敗しました')

  const dbUpdaters: { [K in ConfigKey]?: Function } = {}
  Object.fromEntries(Object.keys(defaultConfig).map((key) => [key]))
  type ProxyHandler<T extends object> = {
    set(obj: T, prop: string, value: any): boolean
  }
  const proxyHandler: ProxyHandler<Config> = {
    set(obj: Config, prop: string, value) {
      if (!isConfigKey(prop)) {
        return false
      }
      Object.assign(obj, { [prop]: value })
      const dbUpdater = (dbUpdaters[prop] ??= throttle((value) => {
        db.execute(`UPDATE configs SET value = $2 WHERE key = $1;`, [
          prop,
          String(value),
        ])
      }, 1000))
      dbUpdater(value)
      return true
    },
  }
  const proxy = new Proxy(config, proxyHandler)
  return proxy
}
