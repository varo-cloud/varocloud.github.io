import axios from 'axios'
import type { ApiResponse } from '@/types'
import { getCurrentLocale } from '@/i18n'
import { authApiBaseUrl } from '@/utils/authApiBaseUrl'

function parseApiErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return 'Request failed'

  const payload = data as Record<string, unknown>
  if (typeof payload.message === 'string' && payload.message) return payload.message

  const detail = payload.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: unknown }).msg ?? '')
        }
        return String(item)
      })
      .filter(Boolean)
    if (messages.length > 0) return messages.join('; ')
  }

  return 'Request failed'
}

function isWrappedApiResponse(payload: unknown): payload is ApiResponse<unknown> {
  return Boolean(payload && typeof payload === 'object' && 'code' in payload && 'data' in payload)
}

export const authHttp = axios.create({
  baseURL: authApiBaseUrl(),
  timeout: 15000,
})

authHttp.interceptors.request.use((config) => {
  const locale = getCurrentLocale()
  config.headers.set('Accept-Language', locale)
  config.headers.set('X-Locale', locale)

  if (import.meta.env.DEV) {
    console.info('[auth]', config.method?.toUpperCase(), authHttp.getUri(config))
  }

  return config
})

authHttp.interceptors.response.use(
  (response) => {
    const payload = response.data

    if (isWrappedApiResponse(payload)) {
      if (payload.code !== 0) {
        return Promise.reject(new Error(payload.message || 'Request failed'))
      }
      return response
    }

    // Real backend returns payload directly (e.g. { sent: true }).
    response.data = { code: 0, message: 'ok', data: payload }
    return response
  },
  (error) => {
    if (import.meta.env.DEV && error.response?.status === 502) {
      return Promise.reject(
        new Error('无法连接 staging 认证服务，请重启 npm run dev 后重试'),
      )
    }

    const payload = error.response?.data
    if (isWrappedApiResponse(payload) && payload.code !== 0) {
      return Promise.reject(new Error(payload.message || 'Request failed'))
    }
    return Promise.reject(new Error(parseApiErrorMessage(payload)))
  },
)
