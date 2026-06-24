import { http, unwrap } from './http'
import type { ApiKey, CreateApiKeyResult } from '@/types'

interface ApiApiKey {
  id: string
  prefix: string
  created_at: string
  is_active: boolean
  /** Mock / future backend extension */
  name?: string
  total_calls?: number
  total_spend_usd?: number
  total_spend_credits?: number
  last_used_at?: string | null
}

interface ApiCreateApiKeyResult {
  id: string
  key: string
  prefix: string
  created_at: string
}

interface ApiDeleteApiKeyResult {
  revoked: boolean
}

function parseTimestamp(value: string | number | undefined | null): number | null {
  if (value == null) return null
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatKeyMasked(prefix: string): string {
  return `${prefix}******`
}

function mapApiKey(raw: ApiApiKey): ApiKey {
  return {
    id: raw.id,
    name: raw.name ?? raw.prefix,
    keyMasked: formatKeyMasked(raw.prefix),
    createdAt: parseTimestamp(raw.created_at) ?? Date.now(),
    status: raw.is_active ? 'active' : 'revoked',
    totalCalls: raw.total_calls ?? 0,
    totalSpendUsd: raw.total_spend_usd ?? 0,
    lastUsedAt: parseTimestamp(raw.last_used_at),
  }
}

function mapCreateApiKeyResult(raw: ApiCreateApiKeyResult, name: string): CreateApiKeyResult {
  return {
    id: raw.id,
    name,
    key: raw.key,
    createdAt: parseTimestamp(raw.created_at) ?? Date.now(),
  }
}

export function fetchApiKeys() {
  return unwrap<ApiApiKey[]>(http.get('/api-keys')).then((items) => items.map(mapApiKey))
}

export function createApiKey(name: string) {
  return unwrap<ApiCreateApiKeyResult>(http.post('/api-keys', { name })).then((raw) =>
    mapCreateApiKeyResult(raw, name.trim()),
  )
}

export function deleteApiKey(id: string) {
  return unwrap<ApiDeleteApiKeyResult>(http.delete(`/api-keys/${id}`)).then(() => null)
}
