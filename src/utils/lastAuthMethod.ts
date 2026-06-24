export type AuthLoginMethod = 'email' | 'google' | 'github'

const STORAGE_KEY = 'varo:last-auth-method'

const VALID_METHODS = new Set<AuthLoginMethod>(['email', 'google', 'github'])

export function getLastAuthMethod(): AuthLoginMethod | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value && VALID_METHODS.has(value as AuthLoginMethod)) {
      return value as AuthLoginMethod
    }
  } catch {
    // ignore storage errors
  }
  return null
}

export function setLastAuthMethod(method: AuthLoginMethod): void {
  try {
    localStorage.setItem(STORAGE_KEY, method)
  } catch {
    // ignore storage errors
  }
}
