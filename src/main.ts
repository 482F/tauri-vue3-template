import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { commonPlugin } from './plugins/common'

const app = createApp(App)
app.use(vuetify)
app.use(commonPlugin)
app.mount('#app')
