import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import './style.css'  // 你可以用一般 CSS

const app = createApp(App)
app.use(router)
app.mount('#app')