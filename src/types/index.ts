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
  /** Maps from API field `display_name` */
  displayName?: string
  provider: string
  capabilities: string[]
  /** Maps from API field `starting_price_usd` — unit rate in USD */
  startingPriceUsd: number
  /** Maps from API field `standard_price_usd` — strikethrough reference price */
  originalPriceUsd?: number
  /** Maps from API field `price_unit` */
  priceUnit: PricingPriceUnit
  /** Maps from API field `price_detail` — optional run context, e.g. "5s · 720p" */
  priceDetail?: string
  /** Maps from API field `discount_percent` */
  discountPercent?: number
  description: string
  /** Maps from API field `thumbnail_url` */
  thumbnailUrl?: string
}

export interface ModelDetail extends Model {
  /** Maps from API field `model_path` */
  modelPath: string
  /** Maps from API field `input_schema` */
  inputSchema: InputSchema
  /** Maps from API field `is_hot` */
  isHot?: boolean
  /** Maps from API field `per_run_price_usd` — total USD for default run config */
  perRunPriceUsd?: number
  /** Maps from API field `runs_per_ten_usd` */
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
  /** USD balance — maps from API field `balance_usd` */
  balanceUsd: number
}

export interface OtpRequestPayload {
  email: string
  /** Cloudflare Turnstile token from widget — backend field `turnstile_token` */
  turnstile_token: string
}

export interface OtpRequestResult {
  sent: boolean
}

export interface OtpVerifyPayload {
  email: string
  code: string
  /** Cloudflare Turnstile token from widget — backend field `turnstile_token` */
  turnstile_token: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

export interface RefreshTokenPayload {
  refresh_token: string
}

export interface LogoutPayload {
  refresh_token: string
}

export interface LogoutResult {
  revoked: boolean
}

export type ApiKeyStatus = 'active' | 'revoked'

export interface ApiKey {
  id: string
  /** User-defined label; maps from API `name` when present, else falls back to `prefix` */
  name: string
  /** Masked key for display; `{prefix}******` from API `prefix` */
  keyMasked: string
  /** Unix ms; maps from API `created_at` */
  createdAt: number
  /** Maps from API `is_active` */
  status: ApiKeyStatus
  /** Per-key call count; backend field TBD — defaults to 0 */
  totalCalls: number
  /** Per-key spend; backend field TBD — defaults to 0 */
  totalSpendUsd: number
  /** Unix ms; maps from API `last_used_at` — defaults to null */
  lastUsedAt: number | null
}

export interface CreateApiKeyResult {
  id: string
  /** Client-side name; backend create response does not include `name` yet */
  name: string
  /** Full key; maps from API `key` — shown only once */
  key: string
  /** Unix ms; maps from API `created_at` */
  createdAt: number
}

export type TransactionType = 'topup' | 'usage'

export type TopUpTransactionStatus = 'pending' | 'completed' | 'failed' | 'expired'

export interface Transaction {
  id: string
  type: TransactionType
  amountUsd: number
  description: string
  createdAt: number
  status?: TopUpTransactionStatus
  paymentMethod?: PaymentMethodId
  paymentDetail?: string | null
  packageId?: string | null
  completedAt?: number | null
  receiptUrl?: string | null
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

export type CreditPackageId = 'starter' | 'pro' | 'business'

export interface CreditPackage {
  id: CreditPackageId
  priceUsd: number
}

export interface CreateCheckoutPayload {
  package: CreditPackageId
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResult {
  checkoutUrl: string
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

/** Maps from API field `price_unit` */
export type PricingPriceUnit = 'per_second' | 'per_image' | 'per_million_tokens' | 'per_hour'

export interface PricingItem {
  id: string
  /** Maps from API field `model_id` */
  modelId?: string
  name: string
  /** Maps from API field `standard_price_usd` */
  standardPriceUsd: number
  /** Maps from API field `starting_price_usd` */
  startingPriceUsd: number
  priceUnit: PricingPriceUnit
  /** Maps from API field `discount_percent` */
  discountPercent?: number
  /** Maps from API field `category` — optional, not used for UI filtering */
  category?: PricingCategory
  /** Maps from API field `media_type` — optional, not used for UI filtering */
  mediaType?: PricingMediaType
}

export type UploadKind = 'image' | 'video' | 'audio'

export interface UploadResult {
  url: string
  filename: string
  mimeType: string
  size: number
}

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed'

export interface PlaygroundGenerationResult {
  id: string
  object: 'generation'
  status: 'completed' | 'failed'
  model: string
  created_at: number
  output: {
    type: 'image' | 'video'
    url: string
  }
  usage?: {
    cost_usd: number
  }
}
