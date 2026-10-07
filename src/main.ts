import { createApp } from 'vue'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/fredoka/600.css'
import '@fontsource/fredoka/700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/composants.css'
import './styles/print.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')
