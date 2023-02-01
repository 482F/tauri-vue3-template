import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { commonPlugin } from './plugins/common'

const app = createApp(App)
app.use(vuetify)
app.use(commonPlugin)
app.mount('#app')

const _nonNullable = <T>(value: T): value is NonNullable<T> => value != null
declare global {
  var nonNullable: typeof _nonNullable
}
var nonNullable = _nonNullable

const originalObjectKeys = Object.keys
type Key = string | number | symbol

const _Object = {
  keys: function <T extends object>(obj: T): (keyof T)[] {
    return originalObjectKeys(obj) as (keyof T)[]
  },
  map: function <T extends object, U>(
    obj: T,
    func: (
      value: T extends { [k: Key]: infer V } ? V : never,
      key: keyof T
    ) => U
  ): { [k in keyof T]: U } {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        func(value, key as keyof T),
      ])
    ) as { [k in keyof T]: U }
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
    asyncFunc: (
      value: T extends { [k: Key]: infer V } ? V : never,
      key: keyof T
    ) => Promise<U>
  ): Promise<{ [k in keyof T]: U }> {
    type ReturnType = { [k in keyof T]: U }
    const promiseObj = _Object.map(obj, asyncFunc)
    const newObj: Partial<ReturnType> = {}
    const keys = _Object.keys(promiseObj)
    for (const key of keys) {
      newObj[key] = await promiseObj[key]
    }
    return newObj as ReturnType
  },
}

declare global {
  interface Object {
    _keys: typeof _Object.keys
    map: typeof _Object.map
    asyncMap: typeof _Object.asyncMap
  }
}

Object._keys = _Object.keys
Object.map = _Object.map
Object.asyncMap = _Object.asyncMap
