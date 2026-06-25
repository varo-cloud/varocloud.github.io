import { apiBaseUrl } from './apiBaseUrl'

/** Auth API host; login endpoints only — other APIs may still use mock. */
export function authApiBaseUrl(): string {
  const configured = import.meta.env.VITE_AUTH_API_BASE_URL?.trim()
  if (!configured) return apiBaseUrl()

  // Dev: same-origin /api + Vite proxy → staging, avoids CORS during local development.
  if (import.meta.env.DEV && /^https?:\/\//i.test(configured)) {
    return apiBaseUrl().replace(/\/$/, '')
  }

  return configured.replace(/\/$/, '')
}

export function useRealAuthApi(): boolean {
  return Boolean(import.meta.env.VITE_AUTH_API_BASE_URL?.trim())
}
