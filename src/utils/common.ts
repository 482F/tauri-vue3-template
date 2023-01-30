import { WebviewWindow, WindowOptions } from '@tauri-apps/api/window'

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

export function ObjectMap<T, U>(
  obj: { [K: string]: T },
  func: (entry: [string, T], index: number) => [string, U]
) {
  return Object.fromEntries(Object.entries(obj).map(func))
}

export function createWindow(
  label: string,
  hash?: string,
  title?: string,
  options: WindowOptions = {}
) {
  const url = location.href.replace(/#.+$/, '') + (hash ? '#' + hash : '')
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
