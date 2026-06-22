import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US'
import zhCN from './locales/zh-CN'

export type LocaleType = 'en-US' | 'zh-CN'

const LOCALE_KEY = 'locale'

export function getStoredLocale(): LocaleType {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'zh-CN' || stored === 'en-US') {
    return stored
  }
  return 'en-US'
}

export function setStoredLocale(locale: LocaleType): void {
  localStorage.setItem(LOCALE_KEY, locale)
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
  },
})

export function getCurrentLocale(): LocaleType {
  const current = i18n.global.locale.value
  if (current === 'zh-CN' || current === 'en-US') {
    return current
  }
  return getStoredLocale()
}

export default i18n
