import type { InputSchema } from './schema'

export type {
  InputSchema,
  SchemaFormValues,
  SchemaProperty,
  ResolvedSchemaField,
  SchemaWidget,
} from './schema'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface Model {
  id: string
  name: string
  displayName?: string
  provider: string
  capabilities: string[]
  startingPriceUsd: number
  originalPriceUsd?: number
  priceDetail?: string
  discountPercent?: number
  description: string
  thumbnailUrl?: string
}

export interface ModelDetail extends Model {
  modelPath: string
  inputSchema: InputSchema
  isHot?: boolean
  perRunPriceUsd?: number
  runsPerTenUsd?: number
}

export interface ModelsPage {
  items: Model[]
  total: number
  offset: number
  limit: number
}

export interface FetchModelsParams {
  offset?: number
  limit?: number
  q?: string
}

export interface ModelRecentEntry {
  id: string
  visitedAt: number
}

export interface ModelPreferences {
  favourites: string[]
  recent: ModelRecentEntry[]
}

export interface UserProfile {
  id: string
  email: string
  name: string
  balanceUsd: number
}

export interface AuthResult {
  token: string
  user: UserProfile
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
}

export type ApiKeyStatus = 'active' | 'revoked'

export interface ApiKey {
  id: string
  name: string
  keyMasked: string
  createdAt: number
  status: ApiKeyStatus
  totalCalls: number
  totalSpendUsd: number
  lastUsedAt: number | null
}

export interface CreateApiKeyResult {
  id: string
  name: string
  key: string
  createdAt: number
}

export type TransactionType = 'topup' | 'usage'

export interface Transaction {
  id: string
  type: TransactionType
  amountUsd: number
  description: string
  createdAt: number
}

export interface BalanceInfo {
  balanceUsd: number
}

export interface BillingAutoTopUp {
  enabled: boolean
  thresholdUsd: number
  topUpAmountUsd: number
}

export interface BillingSummary {
  balanceUsd: number
  spentThisMonthUsd: number
  spentChangePercent: number
  autoTopUp: BillingAutoTopUp
}

export interface TopUpPreset {
  amountUsd: number
  bonusPercent?: number
  usageHint: string
}

export type PaymentMethodId = 'stripe' | 'paypal' | 'npay' | 'alipay'

export interface CreateTopUpPayload {
  amountUsd: number
  paymentMethod: PaymentMethodId
}

export interface UpdateAutoTopUpPayload {
  enabled: boolean
  thresholdUsd: number
  topUpAmountUsd: number
}

export type BillingRecordStyle = 'api' | 'web' | 'topup' | 'bonus'

export interface BillingRecord {
  id: string
  style: BillingRecordStyle
  /** Usage or payment detail, e.g. model · resolution · duration */
  key: string
  /** Masked API key when style is `api`; empty for web and other types */
  apiKey?: string | null
  amountUsd: number
  createdAt: number
}

export type PricingCategory = 'image-video' | 'language' | 'serverless'

export type PricingMediaType = 'video' | 'image' | 'llm'

export interface PricingItem {
  id: string
  modelId?: string
  name: string
  standardPriceUsd: number
  startingPriceUsd: number
  priceUnit: string
  discountPercent?: number
  category: PricingCategory
  mediaType: PricingMediaType
}
