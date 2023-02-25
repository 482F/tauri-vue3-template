import { WebviewWindow, WindowOptions } from '@tauri-apps/api/window'
import { defineComponent } from 'vue'

export function sleep(ms: number = 100) {
  new Promise((resolve) => setTimeout(resolve, ms))
}
export async function wait(
  func: (...args: any) => any,
  intervalMs: number = 100,
  timeoutMs: number = 0
) {
  let timeouted = false
  if (timeoutMs) {
    setTimeout(() => (timeouted = true), timeoutMs)
  }

  let result = null
  while (!result && !timeouted) {
    result = await func()
    await sleep(intervalMs)
  }
  return result
}

type TauriEvent = {
  event: string
  id: number
  payload: unknown
  windowLabel: string
}
export function isTauriEvent(value: unknown): value is TauriEvent {
  if (!value || typeof value !== 'object') {
    return false
  }
  const tauriEvent = value as Record<keyof TauriEvent, unknown>
  if (
    typeof tauriEvent.event !== 'string' ||
    typeof tauriEvent.id !== 'number' ||
    !('payload' in tauriEvent) ||
    typeof tauriEvent.windowLabel !== 'string'
  ) {
    return false
  }
  return true
}
export type CommandlinePayload = {
  argv: string[]
  cwd: string
}

type Window = {
  getComponent: () => ReturnType<typeof defineComponent>
  titlebar: boolean
}
const windows = {
  Config: {
    getComponent: () => import('../components/config/ConfigSetting.vue'),
    titlebar: true,
  },
  Default: {
    getComponent: () => import('../components/MainComponent.vue'),
    titlebar: true,
  },
} as const satisfies { [x: string]: Window }
type Hash = keyof typeof windows
function isHash(value: unknown): value is Hash {
  if (!Object.keys(windows).includes(value as Hash)) {
    return false
  }
  return true
}

const currentHash = location?.href?.match?.(/(?<=#).+$/)?.[0] || 'Default'
if (!isHash(currentHash)) {
  throw new Error('ハッシュ値が不正です')
}

export const currentWindow = windows[currentHash]

export function createWindow(
  label: string,
  hash: Hash,
  title?: string,
  options: WindowOptions = {}
) {
  const url = hash ? '#' + hash : ''
  const defaultOptions: WindowOptions = {
    url,
    title,
    fullscreen: false,
    height: 600,
    width: 800,
    resizable: true,
    decorations: false,
  }
  title ??= document.title
  const webview = new WebviewWindow(label, { ...defaultOptions, ...options })
  return webview
}

export type Key = string | number | symbol
export type Valueof<T> = T extends { [k in keyof T]: infer U } ? U : never

export type JsonKey = string | number
export type JsonPrimitive = string | number | boolean | null
export function isJsonPrimitive(val: unknown): val is JsonPrimitive {
  return (
    !(val as boolean) || ['string', 'number', 'boolean'].includes(typeof val)
  )
}
export type JsonArray = Json[]
export type JsonObject = { [x: JsonKey]: Json }

export type JsonNonPrimitive = JsonArray | JsonObject

export type Json = JsonNonPrimitive | JsonPrimitive
export function isJson(val: unknown): val is Json {
  if (
    val === null ||
    ['string', 'number', 'boolean'].includes(typeof val) ||
    val instanceof Object
  )
    return true
  return false
}

const _nonNullable = <T>(value: T): value is NonNullable<T> => value != null
declare global {
  var nonNullable: typeof _nonNullable
}
window.nonNullable = _nonNullable

export const _Object = {
  map: function <T extends object, U>(
    obj: T,
    func: (value: Valueof<T>, key: keyof T) => U
  ): { [k in keyof T]: U } {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, func(value, key)])
    )
    // function isKeyofT(key: unknown): key is keyof T {
    //   if (!((key as Key) in obj)) {
    //     return false
    //   }
    //   return true
    // }
    // const keys = Object.keys(obj)
    // const values = Object.values(obj)
    // type NewType = { [K in keyof T]: U }
    // const newObj: Partial<NewType> = {}
    // for (let i = 0; i < keys.length; i++) {
    //   const key = keys[i]
    //   const value = values[i]
    //   if (!isKeyofT(key) || value === undefined) {
    //     throw new Error()
    //   }
    //   newObj[key] = func(value, key)
    // }

    // function isNewType(obj: typeof newObj): obj is NewType {
    //   return keys.every((key: unknown) => {
    //     if (key && !((key as Key) in obj)) {
    //       return false
    //     }
    //   })
    // }
    // if (!isNewType(newObj)) {
    //   throw new Error()
    // }
    // return newObj
  },
  asyncMap: async function <T extends object, U>(
    obj: T,
    asyncFunc: (value: Valueof<T>, key: keyof T) => Promise<U>
  ): Promise<{ [k in keyof T]: U }> {
    type ReturnType = { [k in keyof T]: U }
    const promiseObj = _Object.map(obj, asyncFunc)
    const newObj: Partial<ReturnType> = {}
    const keys = Object.keys(promiseObj)
    for (const key of keys) {
      newObj[key] = await promiseObj[key]
    }
    return newObj as ReturnType
  },
}

declare global {
  interface Object {
    map: {
      <T extends object, V>(
        obj: T,
        func: (value: Valueof<T>, key: keyof T) => V
      ): {
        [k in keyof T]: V
      }
      <T extends object>(
        obj: T,
        func: (value: Valueof<T>, key: keyof T) => Valueof<T>
      ): T
    }
    asyncMap: typeof _Object.asyncMap
  }
  interface ObjectConstructor {
    keys<T extends object>(obj: T): (keyof T)[]
    entries<T extends object>(obj: T): [keyof T, Valueof<T>][]
    fromEntries<T extends Key, U>(entries: [T, U][]): { [k in T]: U }
  }
}

Object.map = _Object.map
Object.asyncMap = _Object.asyncMap
