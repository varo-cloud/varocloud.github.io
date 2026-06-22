import type { MockMethod } from 'vite-plugin-mock'
import { success } from './_util'

const usageHint =
  '250 Nano Banana Pro Images or 50 Seedance 2.0 Videos'

let summary = {
  balanceUsd: 12.4,
  spentThisMonthUsd: 96.28,
  spentChangePercent: -12,
  autoTopUp: {
    enabled: false,
    thresholdUsd: 5,
    topUpAmountUsd: 20,
  },
}

const transactions = [
  {
    id: 'tx-topup-1',
    type: 'topup' as const,
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T10:00:00Z'),
  },
  {
    id: 'tx-topup-2',
    type: 'topup' as const,
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:30:00Z'),
  },
  {
    id: 'tx-topup-3',
    type: 'topup' as const,
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:00:00Z'),
  },
  {
    id: 'tx-topup-4',
    type: 'topup' as const,
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T08:30:00Z'),
  },
  {
    id: 'tx-topup-5',
    type: 'topup' as const,
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T08:00:00Z'),
  },
  {
    id: 'tx-usage-1',
    type: 'usage' as const,
    amountUsd: -1.02,
    description: 'Seedance 2.0 T2V — 720p 5s',
    createdAt: Date.parse('2026-06-02T14:30:00Z'),
  },
  {
    id: 'tx-usage-2',
    type: 'usage' as const,
    amountUsd: -0.85,
    description: 'Kling T2V — 480p 4s',
    createdAt: Date.parse('2026-06-05T11:15:00Z'),
  },
]

const billingRecords = [
  {
    id: 'br-1',
    style: 'api' as const,
    key: 'seedance-2.0 · 720p · 8s',
    apiKey: '******BneyZM',
    amountUsd: -1.02,
    createdAt: Date.parse('2026-06-14T14:32:00Z'),
  },
  {
    id: 'br-2',
    style: 'topup' as const,
    key: 'Stripe · Visa ••4242',
    amountUsd: 20,
    createdAt: Date.parse('2026-06-14T14:32:00Z'),
  },
  {
    id: 'br-3',
    style: 'web' as const,
    key: 'Nano Banana Pro · 1024×1024',
    amountUsd: -0.48,
    createdAt: Date.parse('2026-06-14T13:18:00Z'),
  },
  {
    id: 'br-4',
    style: 'api' as const,
    key: 'seedance-2.0 · 720p · 8s',
    apiKey: '******xK9pQ2',
    amountUsd: -1.02,
    createdAt: Date.parse('2026-06-14T12:05:00Z'),
  },
  {
    id: 'br-5',
    style: 'web' as const,
    key: 'Kling T2V · 480p · 4s',
    amountUsd: -0.85,
    createdAt: Date.parse('2026-06-14T11:42:00Z'),
  },
  {
    id: 'br-6',
    style: 'bonus' as const,
    key: 'Top-up bonus · 10%',
    amountUsd: 2,
    createdAt: Date.parse('2026-06-14T10:20:00Z'),
  },
]

const topUpPresets = [
  { amountUsd: 5, bonusPercent: 10, usageHint },
  { amountUsd: 10, bonusPercent: 10, usageHint },
  { amountUsd: 50, bonusPercent: 10, usageHint },
  { amountUsd: 100, bonusPercent: 10, usageHint },
  { amountUsd: 200, usageHint },
]

export default [
  {
    url: '/api/billing/balance',
    method: 'get',
    response: () => success({ balanceUsd: summary.balanceUsd }),
  },
  {
    url: '/api/billing/summary',
    method: 'get',
    response: () => success(summary),
  },
  {
    url: '/api/billing/top-up-presets',
    method: 'get',
    response: () => success(topUpPresets),
  },
  {
    url: '/api/billing/transactions',
    method: 'get',
    response: () => success(transactions),
  },
  {
    url: '/api/billing/records',
    method: 'get',
    response: () => success(billingRecords),
  },
  {
    url: '/api/billing/top-up',
    method: 'post',
    response: ({ body }: { body: { amountUsd?: number; paymentMethod?: string } }) => {
      const amountUsd = Number(body?.amountUsd ?? 0)
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
        return { code: 400, message: 'Invalid amount', data: null }
      }

      summary = {
        ...summary,
        balanceUsd: Number((summary.balanceUsd + amountUsd).toFixed(2)),
      }

      const tx = {
        id: `tx-topup-${Date.now()}`,
        type: 'topup' as const,
        amountUsd,
        description: 'Top Up',
        createdAt: Date.now(),
      }
      transactions.unshift(tx)

      billingRecords.unshift({
        id: `br-topup-${Date.now()}`,
        style: 'topup' as const,
        key: `Stripe · ${body?.paymentMethod === 'stripe' ? 'Visa ••4242' : 'Payment'}`,
        amountUsd,
        createdAt: Date.now(),
      })

      return success(tx)
    },
  },
  {
    url: '/api/billing/auto-top-up',
    method: 'post',
    response: ({
      body,
    }: {
      body: {
        enabled?: boolean
        thresholdUsd?: number
        topUpAmountUsd?: number
      }
    }) => {
      summary = {
        ...summary,
        autoTopUp: {
          enabled: Boolean(body?.enabled),
          thresholdUsd: Number(body?.thresholdUsd ?? summary.autoTopUp.thresholdUsd),
          topUpAmountUsd: Number(body?.topUpAmountUsd ?? summary.autoTopUp.topUpAmountUsd),
        },
      }

      return success(summary.autoTopUp)
    },
  },
] as MockMethod[]
