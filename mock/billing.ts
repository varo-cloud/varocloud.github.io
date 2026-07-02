import type { MockMethod } from 'vite-plugin-mock'
import type { Transaction } from '../src/types'
import { addAccountBalanceUsd, getAccountBalanceUsd } from './account-balance'
import { fail, success } from './_util'

const creditPackages = [
  { id: 'starter' as const, price_usd: 10 },
  { id: 'pro' as const, price_usd: 25 },
  { id: 'business' as const, price_usd: 50 },
]

interface PendingCheckout {
  sessionId: string
  transactionId: string
  amountUsd: number
  provider: 'stripe' | 'nowpayments'
  paymentMethod?: Transaction['paymentMethod']
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
    amountUsd: 20.91,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T10:00:00Z'),
    status: 'completed',
    provider: 'stripe',
    paymentMethod: 'card',
    paymentDetail: 'Visa ••4242',
    completedAt: Date.parse('2026-05-12T10:01:00Z'),
    receiptUrl: 'https://pay.stripe.com/receipts/example',
    feeUsd: 0.88,
  },
  {
    id: 'tx-topup-2',
    type: 'topup',
    amountUsd: 25,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:30:00Z'),
    status: 'pending',
    provider: 'stripe',
    paymentMethod: null,
  },
  {
    id: 'tx-topup-3',
    type: 'topup',
    amountUsd: 10,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-12T09:00:00Z'),
    status: 'completed',
    provider: 'stripe',
    paymentMethod: 'card',
    paymentDetail: 'Mastercard ••5555',
    completedAt: Date.parse('2026-05-12T09:00:30Z'),
    feeUsd: 0.59,
  },
  {
    id: 'tx-topup-4',
    type: 'topup',
    amountUsd: 5,
    description: 'Top Up',
    createdAt: Date.parse('2026-05-11T18:00:00Z'),
    status: 'partial',
    provider: 'nowpayments',
    paymentMethod: 'usdttrc20',
    paymentDetail: 'TXyz1234567890abcdef',
    receiptUrl: 'https://nowpayments.io/payment/?iid=example',
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

function toApiTransaction(tx: Transaction) {
  return {
    id: tx.id,
    provider: tx.provider ?? 'stripe',
    amount_usd: tx.amountUsd,
    status: tx.status ?? 'completed',
    created_at: tx.createdAt,
    payment_method: tx.paymentMethod ?? null,
    payment_detail: tx.paymentDetail ?? null,
    completed_at: tx.completedAt ?? null,
    receipt_url: tx.receiptUrl ?? null,
    fee_usd: tx.feeUsd ?? null,
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
  const isCrypto = pending.provider === 'nowpayments'
  const stripeMethod = pending.paymentMethod ?? 'card'
  const completed: Transaction = {
    ...transactions[index],
    status: 'completed',
    paymentMethod: isCrypto ? 'usdttrc20' : stripeMethod,
    paymentDetail: isCrypto
      ? 'TXyz1234567890abcdef'
      : stripeMethod === 'alipay'
        ? 'Alipay'
        : 'Visa ••4242',
    completedAt: now,
    receiptUrl: isCrypto
      ? 'https://nowpayments.io/payment/?iid=example'
      : 'https://pay.stripe.com/receipts/example',
    feeUsd: isCrypto ? 0 : 0.88,
  }
  transactions[index] = completed

  addAccountBalanceUsd(pending.amountUsd)
  syncSummaryBalance()

  billingRecords.unshift({
    id: `br-topup-${now}`,
    style: 'topup',
    key: isCrypto
      ? 'Crypto · USDT-TRC20'
      : stripeMethod === 'alipay'
        ? 'Stripe · Alipay'
        : 'Stripe · Visa ••4242',
    amountUsd: pending.amountUsd,
    createdAt: now,
  })

  pendingCheckouts.delete(sessionId)
  return true
}

function createCheckoutResponse(
  body: { amount_usd?: number; preset_id?: string | null; payment_method?: string },
  provider: 'stripe' | 'nowpayments',
) {
  const amountUsd = Number(body.amount_usd)
  if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 10_000) {
    return fail('amount_usd must be between 1 and 10000', 400)
  }

  let paymentMethod: Transaction['paymentMethod'] = null
  if (provider === 'stripe') {
    const requested = body.payment_method ?? 'card'
    const allowedMethods = new Set(['card', 'alipay', 'wechat_pay'])
    if (!allowedMethods.has(requested)) {
      return fail('payment_method is invalid', 400)
    }
    paymentMethod = requested as Transaction['paymentMethod']
  }

  const roundedAmountUsd = Math.round(amountUsd * 100) / 100
  const sessionId = `cs_mock_${Date.now()}`
  const transactionId = `tx-topup-${Date.now()}`
  const createdAt = Date.now()

  transactions.unshift({
    id: transactionId,
    type: 'topup',
    amountUsd: roundedAmountUsd,
    description: 'Top Up',
    createdAt,
    status: 'pending',
    provider,
    paymentMethod: null,
  })

  pendingCheckouts.set(sessionId, {
    sessionId,
    transactionId,
    amountUsd: roundedAmountUsd,
    provider,
    paymentMethod,
  })

  const successBase = 'http://localhost:5173/en/billing'
  const checkoutParams = new URLSearchParams({
    stripe_checkout: provider === 'stripe' ? '1' : '0',
    session_id: sessionId,
    amount: String(roundedAmountUsd),
    ...(body.preset_id ? { package: body.preset_id } : {}),
  })

  const checkoutUrl = `${successBase}?${checkoutParams.toString()}`
  return success({ checkout_url: checkoutUrl })
}

export default [
  {
    url: '/api/billing/config',
    method: 'get',
    response: () =>
      success({
        publishable_key: 'pk_test_mock',
        crypto_enabled: true,
      }),
  },
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
    url: '/api/billing/stripe/checkout',
    method: 'post',
    response: ({ body }: { body: { amount_usd?: number; preset_id?: string | null; payment_method?: string } }) =>
      createCheckoutResponse(body, 'stripe'),
  },
  {
    url: '/api/billing/nowpayments/checkout',
    method: 'post',
    response: ({ body }: { body: { amount_usd?: number; preset_id?: string | null } }) =>
      createCheckoutResponse(body, 'nowpayments'),
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
  // Auto top-up mock — re-enable when feature ships
  // {
  //   url: '/api/billing/auto-top-up',
  //   method: 'post',
  //   response: ({
  //     body,
  //   }: {
  //     body: {
  //       enabled?: boolean
  //       threshold_usd?: number
  //       top_up_amount_usd?: number
  //       thresholdUsd?: number
  //       topUpAmountUsd?: number
  //     }
  //   }) => {
  //     summary = {
  //       ...summary,
  //       auto_top_up: {
  //         enabled: Boolean(body?.enabled),
  //         threshold_usd: Number(body?.threshold_usd ?? body?.thresholdUsd ?? summary.auto_top_up.threshold_usd),
  //         top_up_amount_usd: Number(
  //           body?.top_up_amount_usd ?? body?.topUpAmountUsd ?? summary.auto_top_up.top_up_amount_usd,
  //         ),
  //       },
  //     }
  //
  //     return success(summary.auto_top_up)
  //   },
  // },
] as MockMethod[]
