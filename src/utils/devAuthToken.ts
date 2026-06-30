const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function readEnvToken(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

/** 本地 .env 中的 access token（兼容旧名 VITE_DEV_BEARER_TOKEN） */
export function getDevAuthTokenFromEnv(): string | null {
  return (
    readEnvToken(import.meta.env.VITE_DEV_AUTH_TOKEN) ??
    readEnvToken(import.meta.env.VITE_DEV_BEARER_TOKEN)
  )
}

/** 本地 .env 中的 refresh token */
export function getDevRefreshTokenFromEnv(): string | null {
  return readEnvToken(import.meta.env.VITE_DEV_REFRESH_TOKEN)
}

export function hasDevAuthEnv(): boolean {
  return import.meta.env.DEV && Boolean(getDevAuthTokenFromEnv())
}

/**
 * 开发环境：将 .env 中的 token 写入 localStorage，使 UI 与 refresh 流程与正常登录一致。
 * 仅在配置了 VITE_DEV_AUTH_TOKEN 时生效；每次启动都会同步，便于更新 .env 后直接重启 dev server。
 */
export function initDevAuthFromEnv(): boolean {
  if (!import.meta.env.DEV) return false

  const accessToken = getDevAuthTokenFromEnv()
  if (!accessToken) return false

  localStorage.setItem(TOKEN_KEY, accessToken)

  const refreshToken = getDevRefreshTokenFromEnv()
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }

  return true
}

/**
 * 解析请求用 access token：
 * 1. 优先 localStorage（OTP 登录 + refresh 续期）
 * 2. 未登录时 dev 环境 fallback 到 .env
 */
export function resolveRequestBearerToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (stored) return stored

  if (import.meta.env.DEV) {
    return getDevAuthTokenFromEnv()
  }

  return null
}

/**
 * 解析 refresh token：localStorage 优先，dev 环境 fallback 到 .env
 */
export function resolveRefreshToken(): string | null {
  const stored = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (stored) return stored

  if (import.meta.env.DEV) {
    return getDevRefreshTokenFromEnv()
  }

  return null
}
