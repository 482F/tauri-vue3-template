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