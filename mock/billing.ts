import type { MockMethod } from 'vite-plugin-mock'
import type { CreditPackageId, Transaction } from '../src/types'
import { addAccountBalanceUsd, getAccountBalanceUsd } from './account-balance'
import { fail, success } from './_util'

const creditPackages = [
  { id: 'starter' as const, price_usd: 10 },
  { id: 'pro' as const, price_usd: 25 },
  { id: 'business' as const, price_usd: 50 },
]

interface PendingCheckout {
  sessionId: string
  packageId: CreditPackageId | 'custom' | null
  transactionId: string
  amountUsd: number
}

const pendingCheckouts = new Map<string, PendingCheckout>()

let summary = {
  balance_usd: getAccountBalanceUsd(),
  spent_this_month_usd: 96.28,
  spent_change_percent: -12,
  auto_top_up: {
    enabled: false,
    threshold_usd: 5,
    top_up_amount_usd: 20,
  },
}

const transactions: Transaction[] = [
  {
    id: 'tx-topup-1',
    type: 'topup',
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T10:00:00Z'),
    status: 'completed',
    paymentMethod: 'stripe',
    paymentDetail: 'Visa ••4242',
    packageId: 'starter',
    completedAt: Date.parse('2026-05-12T10:01:00Z'),
    receiptUrl: 'https://pay.stripe.com/receipts/example',
  },
  {
    id: 'tx-topup-2',
    type: 'topup',
    amountUsd: 25,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:30:00Z'),
    status: 'pending',
    paymentMethod: 'stripe',
    packageId: 'pro',
  },
  {
    id: 'tx-topup-3',
    type: 'topup',
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:00:00Z'),
    status: 'completed',
    paymentMethod: 'stripe',
    paymentDetail: 'Mastercard ••5555',
    packageId: 'starter',
    completedAt: Date.parse('2026-05-12T09:00:30Z'),
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
]

function getPackage(packageId: string) {
  return creditPackages.find((item) => item.id === packageId)
}

function toApiTransaction(tx: Transaction) {
  return {
    id: tx.id,
    amount_usd: tx.amountUsd,
    status: tx.status ?? 'completed',
    created_at: tx.createdAt,
    payment_method: tx.paymentMethod ?? 'stripe',
    payment_detail: tx.paymentDetail ?? null,
    package_id: tx.packageId ?? null,
    completed_at: tx.completedAt ?? null,
    receipt_url: tx.receiptUrl ?? null,
  }
}

function syncSummaryBalance() {
  summary = {
    ...summary,
    balance_usd: getAccountBalanceUsd(),
  }
}

function completeCheckout(sessionId: string) {
  const pending = pendingCheckouts.get(sessionId)
  if (!pending) return false

  const index = transactions.findIndex((item) => item.id === pending.transactionId)
  if (index === -1) return false

  const now = Date.now()
  const completed: Transaction = {
    ...transactions[index],
    status: 'completed',
    paymentDetail: 'Visa ••4242',
    completedAt: now,
    receiptUrl: 'https://pay.stripe.com/receipts/example',
  }
  transactions[index] = completed

  addAccountBalanceUsd(pending.amountUsd)
  syncSummaryBalance()

  billingRecords.unshift({
    id: `br-topup-${now}`,
    style: 'topup',
    key: 'Stripe · Visa ••4242',
    amountUsd: pending.amountUsd,
    createdAt: now,
  })

  pendingCheckouts.delete(sessionId)
  return true
}

export default [
  {
    url: '/api/billing/packages',
    method: 'get',
    response: () => success(creditPackages),
  },
  {
    url: '/api/billing/balance',
    method: 'get',
    response: () => success({ balance_usd: getAccountBalanceUsd() }),
  },
  {
    url: '/api/billing/summary',
    method: 'get',
    response: () => {
      syncSummaryBalance()
      return success(summary)
    },
  },
  {
    url: '/api/billing/transactions',
    method: 'get',
    response: () =>
      success(
        transactions
          .filter((item) => item.type === 'topup')
          .map(toApiTransaction),
      ),
  },
  {
    url: '/api/billing/records',
    method: 'get',
    response: () => success(billingRecords),
  },
  {
    url: '/api/billing/checkout',
    method: 'post',
    response: ({
      body,
    }: {
      body: {
        package?: string
        amount_usd?: number
        success_url?: string
        cancel_url?: string
      }
    }) => {
      const customAmountUsd = Number(body.amount_usd)
      const hasCustomAmount =
        Number.isFinite(customAmountUsd) && customAmountUsd > 0 && !body.package

      let amountUsd: number
      let packageId: CreditPackageId | 'custom' | null

      if (hasCustomAmount) {
        amountUsd = Math.round(customAmountUsd * 100) / 100
        packageId = 'custom'
      } else {
        const pkg = getPackage(body.package ?? '')
        if (!pkg) {
          return fail('Invalid package or amount', 400)
        }
        amountUsd = pkg.price_usd
        packageId = pkg.id
      }

      const sessionId = `cs_mock_${Date.now()}`
      const transactionId = `tx-topup-${Date.now()}`
      const createdAt = Date.now()

      transactions.unshift({
        id: transactionId,
        type: 'topup',
        amountUsd,
        description: 'Top Up',
        createdAt,
        status: 'pending',
        paymentMethod: 'stripe',
        packageId,
      })

      pendingCheckouts.set(sessionId, {
        sessionId,
        packageId,
        transactionId,
        amountUsd,
      })

      const successBase = body.success_url?.split('?')[0] ?? 'http://localhost:5173/en/billing'
      const checkoutParams = new URLSearchParams({
        stripe_checkout: '1',
        session_id: sessionId,
      })

      if (packageId === 'custom') {
        checkoutParams.set('amount', String(amountUsd))
      } else if (packageId) {
        checkoutParams.set('package', packageId)
      }

      const checkoutUrl = `${successBase}?${checkoutParams.toString()}`

      return success({ checkout_url: checkoutUrl })
    },
  },
  {
    url: '/api/billing/checkout/mock-complete',
    method: 'post',
    response: ({ body }: { body: { session_id?: string } }) => {
      const sessionId = body.session_id ?? ''
      if (!sessionId || !completeCheckout(sessionId)) {
        return fail('Checkout session not found', 404)
      }
      return success({ completed: true })
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
        threshold_usd?: number
        top_up_amount_usd?: number
        thresholdUsd?: number
        topUpAmountUsd?: number
      }
    }) => {
      summary = {
        ...summary,
        auto_top_up: {
          enabled: Boolean(body?.enabled),
          threshold_usd: Number(body?.threshold_usd ?? body?.thresholdUsd ?? summary.auto_top_up.threshold_usd),
          top_up_amount_usd: Number(
            body?.top_up_amount_usd ?? body?.topUpAmountUsd ?? summary.auto_top_up.top_up_amount_usd,
          ),
        },
      }

      return success(summary.auto_top_up)
    },
  },
] as MockMethod[]
