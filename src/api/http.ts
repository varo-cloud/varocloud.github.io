import axios from 'axios'
import type { ApiResponse } from '@/types'
import { getCurrentLocale } from '@/i18n'
import { apiBaseUrl } from '@/utils/apiBaseUrl'

const TOKEN_KEY = 'auth_token'

export const http = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const locale = getCurrentLocale()
  config.headers.set('Accept-Language', locale)
  config.headers.set('X-Locale', locale)

  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>
    if (payload.code !== 0) {
      return Promise.reject(new Error(payload.message || 'Request failed'))
    }
    return response
  },
  (error) => Promise.reject(error),
)

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise
  return data.data
}
