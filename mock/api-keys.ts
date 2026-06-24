import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const MAY_12_2026 = '2026-05-12T10:00:00Z'
const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000).toISOString()

let apiKeys: Array<{
  id: string
  name: string
  prefix: string
  created_at: string
  is_active: boolean
  total_calls: number
  total_spend_usd: number
  last_used_at: string | null
}> = [
  {
    id: 'key-1',
    name: 'production',
    prefix: 'sk_live_1f78',
    created_at: MAY_12_2026,
    is_active: true,
    total_calls: 14208,
    total_spend_usd: 84.21,
    last_used_at: TWO_MINUTES_AGO,
  },
  {
    id: 'key-2',
    name: 'staging',
    prefix: 'sk_live_2a9b',
    created_at: MAY_12_2026,
    is_active: true,
    total_calls: 14208,
    total_spend_usd: 84.21,
    last_used_at: TWO_MINUTES_AGO,
  },
  {
    id: 'key-3',
    name: 'development',
    prefix: 'sk_live_3c4d',
    created_at: MAY_12_2026,
    is_active: false,
    total_calls: 14208,
    total_spend_usd: 84.21,
    last_used_at: TWO_MINUTES_AGO,
  },
]

export default [
  {
    url: '/api/api-keys',
    method: 'get',
    response: () => success(apiKeys),
  },
  {
    url: '/api/api-keys',
    method: 'post',
    response: ({ body }: { body: { name?: string } }) => {
      const createdAt = new Date().toISOString()
      const key = `sk_live_${Math.random().toString(36).slice(2, 18)}`
      const prefix = key.slice(0, 12)
      const name = body.name?.trim() || 'Untitled'

      apiKeys = [
        {
          id: `key-${Date.now()}`,
          name,
          prefix,
          created_at: createdAt,
          is_active: true,
          total_calls: 0,
          total_spend_usd: 0,
          last_used_at: null,
        },
        ...apiKeys,
      ]

      return success({
        id: apiKeys[0].id,
        key,
        prefix,
        created_at: createdAt,
      })
    },
  },
  {
    url: '/api/api-keys/:id',
    method: 'delete',
    response: ({ query }: { query: Record<string, string> }) => {
      apiKeys = apiKeys.filter((item) => item.id !== query.id)
      return success({ revoked: true })
    },
  },
] as MockMethod[]
