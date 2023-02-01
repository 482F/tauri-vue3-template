import { appWindow, WebviewWindow } from '@tauri-apps/api/window'

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

export function createWindow(label: string, hash = '', title = '') {
  const url = location.href.replace(/#.+$/, '') + (hash ? '#' + hash : '')
  title ||= document.title
  const webview = new WebviewWindow(label, {
    url,
    title,
    fullscreen: false,
    height: 600,
    width: 800,
    resizable: true,
    decorations: false,
  })
  return webview
}
