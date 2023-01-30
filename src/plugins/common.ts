import { App, Plugin } from 'vue'

export const CommonPlugin: Plugin = {
  install: (app: App) => {
    const gp = app.config.globalProperties
    gp.$console = console
  },
}
