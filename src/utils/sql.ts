import { invoke } from '@tauri-apps/api'
import { CommandlinePayload } from './common'
import Database from 'tauri-plugin-sql-api'

let dbPromise: Promise<Database> | undefined = undefined

export async function getDb(): Promise<Database> {
  if (dbPromise) {
    return await dbPromise
  }

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

    return Database.load(`sqlite:${exeDir}\\info.sq3`)
  })()
  return getDb()
}
