import { getCurrentLocale } from '@/i18n'
import { localeToRouteParam } from '@/i18n/locale-path'
import { hasDevAuthEnv, initDevAuthFromEnv } from '@/utils/devAuthToken'

let redirecting = false

/** 401 且 refresh 失败后：清 session 并跳转登录页 */
export async function handleUnauthorizedSession(): Promise<void> {
  if (redirecting || typeof window === 'undefined') return

  redirecting = true
  try {
    const [{ default: router }, { clearAuthTokens }, { useUserStore }] = await Promise.all([
      import('@/router'),
      import('@/api/http'),
      import('@/stores/user'),
    ])

    clearAuthTokens()

    const userStore = useUserStore()

    // 本地开发：token 过期后从 .env 恢复，避免反复手动登录
    if (import.meta.env.DEV && hasDevAuthEnv() && initDevAuthFromEnv()) {
      userStore.restoreSessionFromStorage()
      await userStore.loadProfile()
      return
    }

    userStore.clearSession()

    if (router.currentRoute.value.name === 'auth') return

    const redirect = router.currentRoute.value.fullPath
    await router.push({
      name: 'auth',
      params: { locale: localeToRouteParam(getCurrentLocale()) },
      query: { redirect },
    })
  } finally {
    redirecting = false
  }
}
