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
window.nonNullable = _nonNullable

type Key = string | number | symbol
type Valueof<T> = T extends { [k in keyof T]: infer U } ? U : never

const _Object = {
  map: function <T extends object, U>(
    obj: T,
    func: (value: Valueof<T>, key: keyof T) => U
  ): { [k in keyof T]: U } {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        func(value, key as keyof T),
      ])
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
    map: typeof _Object.map
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
