import { http, unwrap } from './http'
import type {
  BillingAutoTopUp,
  BillingConfig,
  BillingRecord,
  BillingSummary,
  CheckoutSessionResult,
  CreateCheckoutPayload,
  CreditPackage,
  Transaction,
  TransactionProvider,
  // UpdateAutoTopUpPayload,
} from '@/types'

interface ApiBillingBalance {
  balance_usd?: number
}

interface ApiUsageRecord {
  task_id: string
  model: string
  duration?: number
  cost_usd: number
  status: string
  created_at?: string | number
}

interface ApiCheckoutResponse {
  checkout_url: string
}

interface ApiAutoTopUp {
  enabled: boolean
  threshold_usd?: number
  top_up_amount_usd?: number
  package_id?: string
}

interface ApiBillingSummary {
  balance_usd?: number
  spent_this_month_usd?: number
  spent_change_percent?: number
  auto_top_up?: ApiAutoTopUp
  autoTopUp?: BillingAutoTopUp
}

interface ApiBillingRecord {
  id: string
  style: string
  key: string
  api_key?: string | null
  amount_usd?: number
  created_at?: string | number
  createdAt?: number
  apiKey?: string | null
  amountUsd?: number
}

interface ApiBillingConfig {
  publishable_key?: string
  crypto_enabled?: boolean
}

interface ApiTransaction {
  id: string
  provider?: string
  amount_usd?: number
  status?: string
  created_at?: string | number
  payment_method?: string | null
  payment_detail?: string | null
  completed_at?: string | number | null
  receipt_url?: string | null
  fee_usd?: number | null
  type?: string
  amountUsd?: number
  description?: string
  createdAt?: number
  paymentMethod?: string | null
  paymentDetail?: string | null
  completedAt?: number | null
  receiptUrl?: string | null
  feeUsd?: number | null
  providerCamel?: TransactionProvider
}

function parseTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (!value) return Date.now()
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Date.now()
}

function mapAutoTopUp(raw: ApiAutoTopUp | BillingAutoTopUp): BillingAutoTopUp {
  if ('thresholdUsd' in raw) return raw

  return {
    enabled: raw.enabled,
    thresholdUsd: raw.threshold_usd ?? 5,
    topUpAmountUsd: raw.top_up_amount_usd ?? 20,
  }
}

function mapBillingSummary(raw: ApiBillingSummary): BillingSummary {
  return {
    balanceUsd: raw.balance_usd ?? 0,
    spentThisMonthUsd: raw.spent_this_month_usd ?? 0,
    spentChangePercent: raw.spent_change_percent ?? 0,
    autoTopUp: mapAutoTopUp(raw.auto_top_up ?? raw.autoTopUp ?? { enabled: false }),
  }
}

function mapUsageToBillingRecord(raw: ApiUsageRecord): BillingRecord {
  const durationPart = raw.duration != null ? ` · ${raw.duration}s` : ''
  return {
    id: raw.task_id,
    style: 'api',
    key: `${raw.model}${durationPart}`,
    apiKey: null,
    amountUsd: -Math.abs(raw.cost_usd),
    createdAt: parseTimestamp(raw.created_at),
  }
}

interface ApiCreditPackage {
  id: string
  label: string
  price_usd: number
}

function mapBillingRecord(raw: ApiBillingRecord): BillingRecord {
  if (raw.amountUsd != null) {
    return {
      id: raw.id,
      style: raw.style as BillingRecord['style'],
      key: raw.key,
      apiKey: raw.apiKey ?? null,
      amountUsd: raw.amountUsd,
      createdAt: raw.createdAt ?? Date.now(),
    }
  }

  return {
    id: raw.id,
    style: raw.style as BillingRecord['style'],
    key: raw.key,
    apiKey: raw.api_key ?? null,
    amountUsd: raw.amount_usd ?? 0,
    createdAt: parseTimestamp(raw.created_at),
  }
}

function mapTransactionProvider(value: string | undefined): TransactionProvider | undefined {
  if (value === 'stripe' || value === 'nowpayments') return value
  return undefined
}

function mapTransaction(raw: ApiTransaction): Transaction {
  if (raw.amountUsd != null) {
    return {
      id: raw.id,
      type: (raw.type as Transaction['type']) ?? 'topup',
      amountUsd: raw.amountUsd,
      description: raw.description ?? 'Top Up',
      createdAt: raw.createdAt ?? Date.now(),
      status: raw.status as Transaction['status'],
      provider: raw.providerCamel ?? mapTransactionProvider(raw.provider),
      paymentMethod: raw.paymentMethod ?? null,
      paymentDetail: raw.paymentDetail ?? null,
      completedAt: raw.completedAt ?? null,
      receiptUrl: raw.receiptUrl ?? null,
      feeUsd: raw.feeUsd ?? null,
    }
  }

  return {
    id: raw.id,
    type: 'topup',
    amountUsd: raw.amount_usd ?? 0,
    description: 'Top Up',
    createdAt: parseTimestamp(raw.created_at),
    status: raw.status as Transaction['status'],
    provider: mapTransactionProvider(raw.provider),
    paymentMethod: raw.payment_method ?? null,
    paymentDetail: raw.payment_detail ?? null,
    completedAt: raw.completed_at != null ? parseTimestamp(raw.completed_at) : null,
    receiptUrl: raw.receipt_url ?? null,
    feeUsd: raw.fee_usd ?? null,
  }
}

function mapCreditPackage(raw: ApiCreditPackage): CreditPackage {
  return {
    id: raw.id as CreditPackage['id'],
    label: raw.label,
    priceUsd: raw.price_usd,
  }
}

export function fetchBillingConfig() {
  return unwrap<ApiBillingConfig>(http.get('/billing/config')).then(
    (raw): BillingConfig => ({
      publishableKey: raw.publishable_key ?? '',
      cryptoEnabled: raw.crypto_enabled ?? false,
    }),
  )
}

export async function fetchBillingSummary(): Promise<BillingSummary> {
  try {
    const raw = await unwrap<ApiBillingSummary>(http.get('/billing/summary'))
    return mapBillingSummary(raw)
  } catch {
    const balance = await unwrap<ApiBillingBalance>(http.get('/billing/balance'))
    return {
      balanceUsd: balance.balance_usd ?? 0,
      spentThisMonthUsd: 0,
      spentChangePercent: 0,
      autoTopUp: { enabled: false, thresholdUsd: 5, topUpAmountUsd: 20 },
    }
  }
}

export function fetchCreditPackages() {
  return unwrap<ApiCreditPackage[]>(http.get('/billing/packages')).then((items) =>
    items.map(mapCreditPackage),
  )
}

export function fetchTransactions() {
  return unwrap<ApiTransaction[]>(http.get('/billing/transactions')).then((items) =>
    items.map(mapTransaction),
  )
}

export async function fetchBillingRecords(): Promise<BillingRecord[]> {
  try {
    const items = await unwrap<ApiBillingRecord[]>(http.get('/billing/records'))
    return items.map(mapBillingRecord)
  } catch {
    try {
      const usage = await unwrap<ApiUsageRecord[]>(http.get('/usage'))
      return usage.map(mapUsageToBillingRecord)
    } catch {
      return []
    }
  }
}

function buildStripeCheckoutBody(payload: CreateCheckoutPayload) {
  return {
    amount_usd: payload.amountUsd,
    ...(payload.presetId ? { preset_id: payload.presetId } : {}),
    ...(payload.paymentMethod ? { payment_method: payload.paymentMethod } : {}),
  }
}

function buildCryptoCheckoutBody(payload: CreateCheckoutPayload) {
  return {
    amount_usd: payload.amountUsd,
    ...(payload.presetId ? { preset_id: payload.presetId } : {}),
  }
}

export function createStripeCheckoutSession(payload: CreateCheckoutPayload) {
  return unwrap<ApiCheckoutResponse>(
    http.post('/billing/stripe/checkout', buildStripeCheckoutBody(payload)),
  ).then(
    (data): CheckoutSessionResult => ({
      checkoutUrl: data.checkout_url,
    }),
  )
}

export function createCryptoCheckoutSession(payload: CreateCheckoutPayload) {
  return unwrap<ApiCheckoutResponse>(
    http.post('/billing/nowpayments/checkout', buildCryptoCheckoutBody(payload)),
  ).then(
    (data): CheckoutSessionResult => ({
      checkoutUrl: data.checkout_url,
    }),
  )
}

/** @deprecated Use createStripeCheckoutSession or createCryptoCheckoutSession */
export function createCheckoutSession(payload: CreateCheckoutPayload) {
  return createStripeCheckoutSession(payload)
}

export function completeMockCheckout(sessionId: string) {
  return unwrap<{ completed: boolean }>(
    http.post('/billing/checkout/mock-complete', { session_id: sessionId }),
  )
}

// export function updateAutoTopUp(payload: UpdateAutoTopUpPayload) {
//   return unwrap<ApiAutoTopUp>(
//     http.post('/billing/auto-top-up', {
//       enabled: payload.enabled,
//       threshold_usd: payload.thresholdUsd,
//       top_up_amount_usd: payload.topUpAmountUsd,
//     }),
//   ).then(mapAutoTopUp)
// }
