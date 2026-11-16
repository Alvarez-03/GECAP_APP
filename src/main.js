import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

import Vue3Toastify from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.use(Vue3Toastify, {
    autoClose: 2300, 
    position: 'top-right', 
    clearOnUrlChange: false
  })

app.mount('#app')
