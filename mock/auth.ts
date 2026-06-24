import type { MockMethod } from 'vite-plugin-mock'
import type { UserProfile } from '@/types'
import { getAccountBalanceUsd } from './account-balance'
import { fail, success } from './_util'

const OTP_TTL_MS = 10 * 60 * 1000
const OTP_RATE_WINDOW_MS = 15 * 60 * 1000
const OTP_RATE_LIMIT = 3
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface OtpEntry {
  code: string
  expiresAt: number
  attempts: number
}

interface RefreshTokenEntry {
  userId: string
  expiresAt: number
}

interface OtpRateEntry {
  count: number
  windowStart: number
}

const users = new Map<string, UserProfile>()
const otpStore = new Map<string, OtpEntry>()
const otpRateStore = new Map<string, OtpRateEntry>()
const refreshTokens = new Map<string, RefreshTokenEntry>()

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateRefreshToken(): string {
  return `rt_${Date.now()}_${Math.random().toString(36).slice(2, 18)}`
}

function generateAccessToken(userId: string): string {
  return `mock_access_${userId}_${Date.now()}`
}

function parseAccessToken(token: string): string | null {
  const match = token.match(/^mock_access_(.+)_\d+$/)
  return match?.[1] ?? null
}

function getUserIdFromAuth(headers: Record<string, string>): string | null {
  const auth = headers.authorization || headers.Authorization
  if (!auth?.startsWith('Bearer ')) return null
  return parseAccessToken(auth.slice(7))
}

function getOrCreateUser(email: string): UserProfile {
  const normalized = normalizeEmail(email)
  const existing = users.get(normalized)
  if (existing) return existing

  const localPart = normalized.split('@')[0] ?? 'user'
  const user: UserProfile = {
    id: `user-${Date.now()}`,
    email: normalized,
    name: localPart,
    balanceUsd: 0,
  }
  users.set(normalized, user)
  return user
}

function issueTokenPair(userId: string) {
  const access_token = generateAccessToken(userId)
  const refresh_token = generateRefreshToken()
  refreshTokens.set(refresh_token, {
    userId,
    expiresAt: Date.now() + REFRESH_TTL_MS,
  })
  return {
    access_token,
    refresh_token,
    token_type: 'bearer' as const,
  }
}

function isValidTurnstileToken(token: string | undefined): boolean {
  return typeof token === 'string' && token.trim().length > 0
}

function checkOtpRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = otpRateStore.get(email)

  if (!entry || now - entry.windowStart >= OTP_RATE_WINDOW_MS) {
    otpRateStore.set(email, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= OTP_RATE_LIMIT) {
    return false
  }

  entry.count += 1
  return true
}

export default [
  {
    url: '/api/auth/request-otp',
    method: 'post',
    response: ({ body }: { body: { email?: string; turnstile_token?: string } }) => {
      const email = normalizeEmail(body.email ?? '')

      if (!isValidTurnstileToken(body.turnstile_token)) {
        return fail('Human verification failed. Please try again.', 400)
      }

      if (!isValidEmail(email)) {
        return fail('Invalid email address', 422)
      }

      if (!checkOtpRateLimit(email)) {
        return fail('Too many requests. Please try again later.', 429)
      }

      const code = generateOtp()
      otpStore.set(email, {
        code,
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
      })

      // Dev: log OTP like production server with EMAIL_DRIVER=log
      console.info(`[genflow] OTP for ${email}: ${code}`)

      return success({ sent: true })
    },
  },
  {
    url: '/api/auth/verify-otp',
    method: 'post',
    response: ({ body }: { body: { email?: string; code?: string; turnstile_token?: string } }) => {
      const email = normalizeEmail(body.email ?? '')
      const code = (body.code ?? '').trim()

      if (!isValidTurnstileToken(body.turnstile_token)) {
        return fail('Human verification failed. Please try again.', 400)
      }

      if (!isValidEmail(email)) {
        return fail('Invalid email address', 422)
      }

      // Mock: any 6-digit code is accepted for easier local development
      if (!/^\d{6}$/.test(code)) {
        return fail('Invalid or expired verification code', 400)
      }

      otpStore.delete(email)

      const user = getOrCreateUser(email)
      return success(issueTokenPair(user.id))
    },
  },
  {
    url: '/api/auth/refresh',
    method: 'post',
    response: ({ body }: { body: { refresh_token?: string } }) => {
      const token = body.refresh_token ?? ''
      const entry = refreshTokens.get(token)

      if (!entry || Date.now() > entry.expiresAt) {
        refreshTokens.delete(token)
        return fail('Invalid or expired refresh token', 401)
      }

      refreshTokens.delete(token)
      return success(issueTokenPair(entry.userId))
    },
  },
  {
    url: '/api/auth/logout',
    method: 'post',
    response: ({ body }: { body: { refresh_token?: string } }) => {
      const token = body.refresh_token ?? ''
      refreshTokens.delete(token)
      return success({ revoked: true })
    },
  },
  {
    url: '/api/user/profile',
    method: 'get',
    response: ({ headers }: { headers: Record<string, string> }) => {
      const userId = getUserIdFromAuth(headers)
      if (!userId) {
        return fail('Unauthorized', 401)
      }

      for (const user of users.values()) {
        if (user.id === userId) {
          return success({
            id: user.id,
            email: user.email,
            balance_usd: getAccountBalanceUsd(),
          })
        }
      }

      return fail('Unauthorized', 401)
    },
  },
] as MockMethod[]
