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

import MainComponent from '../components/MainComponent.vue'
import ConfigSetting from '../components/ConfigSetting.vue'

const windows = {
  Config: { component: ConfigSetting, titlebar: false },
  Default: { component: MainComponent, titlebar: true },
} as const
type Hash = keyof typeof windows
function isHash(value: unknown): value is Hash {
  if (!Object.keys(windows).includes(value as string)) {
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
