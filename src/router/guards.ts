import type { Router } from 'vue-router'
import { getToken } from '@/api/http'
import i18n, { getStoredLocale, setStoredLocale } from '@/i18n'
import {
  DEFAULT_LOCALE,
  getCanonicalPath,
  localeFromRouteParam,
  localeToRouteParam,
  withLocalePrefix,
} from '@/i18n/locale-path'

export function setupGuards(router: Router) {
  router.beforeEach((to) => {
    const routeLocale = localeFromRouteParam(to.params.locale)
    const storedLocale = getStoredLocale()

    if (routeLocale !== i18n.global.locale.value) {
      i18n.global.locale.value = routeLocale
      setStoredLocale(routeLocale)
    }

    const canonicalPath = getCanonicalPath(to.path, routeLocale)
    if (to.path !== canonicalPath) {
      return {
        path: canonicalPath,
        query: to.query,
        hash: to.hash,
        replace: true,
      }
    }

    if (!to.params.locale && storedLocale !== DEFAULT_LOCALE && to.name) {
      return {
        path: withLocalePrefix(to.path, storedLocale),
        query: to.query,
        hash: to.hash,
        replace: true,
      }
    }

    if (to.meta.requiresAuth && !getToken()) {
      return {
        name: 'auth',
        params: { locale: localeToRouteParam(routeLocale) },
        query: { redirect: to.fullPath },
      }
    }

    return true
  })
}
