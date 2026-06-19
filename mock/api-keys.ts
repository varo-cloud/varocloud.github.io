import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

let apiKeys = [
  {
    id: 'key-1',
    name: 'Production',
    keyMasked: '******BneyZM',
    createdAt: '2026-05-01T10:00:00Z',
    status: 'active' as const,
    totalCalls: 1284,
    totalSpendUsd: 42.5,
    lastUsedAt: '2026-06-15T18:30:00Z',
  },
  {
    id: 'key-2',
    name: 'Development',
    keyMasked: '******xK9pQ2',
    createdAt: '2026-05-20T08:00:00Z',
    status: 'active' as const,
    totalCalls: 56,
    totalSpendUsd: 3.2,
    lastUsedAt: '2026-06-10T12:00:00Z',
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
    response: ({ body }: { body: { name: string } }) => {
      const newKey = {
        id: `key-${Date.now()}`,
        name: body.name || 'Untitled',
        key: `wsk_live_${Math.random().toString(36).slice(2, 18)}`,
        createdAt: new Date().toISOString(),
      }
      apiKeys = [
        {
          id: newKey.id,
          name: newKey.name,
          keyMasked: `******${newKey.key.slice(-6)}`,
          createdAt: newKey.createdAt,
          status: 'active' as const,
          totalCalls: 0,
          totalSpendUsd: 0,
          lastUsedAt: null,
        },
        ...apiKeys,
      ]
      return success(newKey)
    },
  },
  {
    url: '/api/api-keys/:id',
    method: 'delete',
    response: ({ query }: { query: Record<string, string> }) => {
      apiKeys = apiKeys.filter((item) => item.id !== query.id)
      return success(null)
    },
  },
] as MockMethod[]
