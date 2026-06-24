import { http, unwrap } from './http'
import type {
  BillingAutoTopUp,
  BillingRecord,
  BillingSummary,
  CheckoutSessionResult,
  CreateCheckoutPayload,
  CreditPackage,
  Transaction,
  UpdateAutoTopUpPayload,
} from '@/types'

interface ApiCreditPackage {
  id: string
  price_usd: number
  credits: number
}

interface ApiCheckoutResponse {
  checkout_url: string
}

interface ApiAutoTopUp {
  enabled: boolean
  threshold_usd?: number
  top_up_amount_usd?: number
}

interface ApiBillingSummary {
  balance?: number
  balance_usd?: number
  spent_this_month_credits?: number
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
  amount_credits?: number
  amount_usd?: number
  created_at?: string
  createdAt?: number
  apiKey?: string | null
  amountUsd?: number
}

interface ApiTransaction {
  id: string
  amount_usd?: number
  credits_granted?: number
  status?: string
  created_at?: string
  payment_method?: string
  payment_detail?: string | null
  package_id?: string | null
  completed_at?: string | null
  receipt_url?: string | null
  type?: string
  amountUsd?: number
  description?: string
  createdAt?: number
  creditsGranted?: number
  paymentMethod?: string
  paymentDetail?: string | null
  packageId?: string | null
  completedAt?: number | null
  receiptUrl?: string | null
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
    balance: raw.balance ?? raw.balance_usd ?? 0,
    spentThisMonthCredits: raw.spent_this_month_credits ?? raw.spent_this_month_usd ?? 0,
    spentChangePercent: raw.spent_change_percent ?? 0,
    autoTopUp: mapAutoTopUp(raw.auto_top_up ?? raw.autoTopUp ?? { enabled: false }),
  }
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
    amountUsd: raw.amount_credits ?? raw.amount_usd ?? 0,
    createdAt: parseTimestamp(raw.created_at),
  }
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
      creditsGranted: raw.creditsGranted,
      paymentMethod: raw.paymentMethod as Transaction['paymentMethod'],
      paymentDetail: raw.paymentDetail ?? null,
      packageId: raw.packageId ?? null,
      completedAt: raw.completedAt ?? null,
      receiptUrl: raw.receiptUrl ?? null,
    }
  }

  return {
    id: raw.id,
    type: 'topup',
    amountUsd: raw.amount_usd ?? 0,
    description: 'Top Up',
    createdAt: parseTimestamp(raw.created_at),
    status: raw.status as Transaction['status'],
    creditsGranted: raw.credits_granted,
    paymentMethod: (raw.payment_method as Transaction['paymentMethod']) ?? 'stripe',
    paymentDetail: raw.payment_detail ?? null,
    packageId: raw.package_id ?? null,
    completedAt: raw.completed_at ? parseTimestamp(raw.completed_at) : null,
    receiptUrl: raw.receipt_url ?? null,
  }
}

function mapCreditPackage(raw: ApiCreditPackage): CreditPackage {
  return {
    id: raw.id as CreditPackage['id'],
    priceUsd: raw.price_usd,
    credits: raw.credits,
  }
}

export function fetchBillingSummary() {
  return unwrap<ApiBillingSummary>(http.get('/billing/summary')).then(mapBillingSummary)
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

export function fetchBillingRecords() {
  return unwrap<ApiBillingRecord[]>(http.get('/billing/records')).then((items) =>
    items.map(mapBillingRecord),
  )
}

export function createCheckoutSession(payload: CreateCheckoutPayload) {
  return unwrap<ApiCheckoutResponse>(http.post('/billing/checkout', {
    package: payload.package,
    success_url: payload.successUrl,
    cancel_url: payload.cancelUrl,
  })).then(
    (data): CheckoutSessionResult => ({
      checkoutUrl: data.checkout_url,
    }),
  )
}

export function completeMockCheckout(sessionId: string) {
  return unwrap<{ completed: boolean }>(
    http.post('/billing/checkout/mock-complete', { session_id: sessionId }),
  )
}

export function updateAutoTopUp(payload: UpdateAutoTopUpPayload) {
  return unwrap<ApiAutoTopUp>(
    http.post('/billing/auto-top-up', {
      enabled: payload.enabled,
      threshold_usd: payload.thresholdUsd,
      top_up_amount_usd: payload.topUpAmountUsd,
    }),
  ).then(mapAutoTopUp)
}
