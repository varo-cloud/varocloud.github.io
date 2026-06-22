import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'virtual:uno.css'
import '@/styles/global.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

async function bootstrap() {
  if (import.meta.env.PROD && import.meta.env.VITE_USE_MOCK === 'true') {
    const { setupProdMockServer } = await import('@/mock/setupProdMockServer')
    await setupProdMockServer()
  }

  const app = createApp(App)

  app.use(createPinia())
  app.use(router)
  app.use(i18n)

  app.mount('#app')
}

bootstrap()
