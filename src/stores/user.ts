import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearAuthTokens, getToken } from '@/api/http'
import { fetchUserProfile, logout as logoutApi, persistTokenPair } from '@/api/auth'
import { setAnalyticsUserId } from '@/analytics'
import { useRealAuthApi } from '@/utils/authApiBaseUrl'
import type { TokenPair, UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => Boolean(token.value))
  const balanceUsd = computed(() => profile.value?.balanceUsd ?? null)

  function establishSession(tokens: TokenPair) {
    token.value = tokens.access_token
    persistTokenPair(tokens)
  }

  async function loadProfile() {
    if (!token.value) {
      profile.value = null
      return
    }
    loading.value = true
    try {
      profile.value = await fetchUserProfile()
      if (profile.value?.id) {
        setAnalyticsUserId(profile.value.id)
      }
    } catch {
      profile.value = null
      if (!useRealAuthApi()) {
        token.value = null
        clearAuthTokens()
      }
    } finally {
      loading.value = false
    }
  }

  function setProfile(user: UserProfile) {
    profile.value = user
    if (user.id) {
      setAnalyticsUserId(user.id)
    }
  }

  async function logout() {
    await logoutApi()
    token.value = null
    profile.value = null
  }

  return {
    token,
    profile,
    loading,
    isLoggedIn,
    balanceUsd,
    establishSession,
    loadProfile,
    setProfile,
    logout,
  }
})
