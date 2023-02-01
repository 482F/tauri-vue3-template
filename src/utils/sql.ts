import { invoke } from '@tauri-apps/api'
import { CommandlinePayload } from './common'
import Database from 'tauri-plugin-sql-api'

let dbPromise: Promise<Database> | undefined = undefined

class EDatabase extends Database {
  select<T extends object[]>(
    query: string,
    bindValues?: unknown[] | undefined
  ): Promise<T>

  select<T extends object>(
    query: string,
    bindValues?: unknown[] | undefined
  ): Promise<T[]>

  async select<T>(query: string, bindValues?: unknown[] | undefined) {
    const selectFunc = Database.prototype.select<
      (T extends (infer U)[] ? U : T)[]
    >
    return await selectFunc.call(this, query, bindValues)
  }
}

export async function getDb(): Promise<EDatabase> {
  dbPromise ??= (async () => {
    const payload = await invoke('get_commandline').then((payload: unknown) => {
      const isCommandlinePayload = (
        data: unknown
      ): data is CommandlinePayload => {
        const payload = data as CommandlinePayload
        return Array.isArray(payload?.argv) && typeof payload?.cwd === 'string'
      }
      if (!isCommandlinePayload(payload)) {
        return
      }
      return payload
    })

    if (!payload) throw new Error('実行ファイルのパスが取得できませんでした')
    const exeDir = payload.argv[0]?.replace(/\\?[^\\]+$/, '')

    return EDatabase.load(`sqlite:${exeDir}\\info.sq3`)
  })()
  return await dbPromise
}
