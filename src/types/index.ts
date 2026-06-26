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
  /** Maps from API field `price_detail` — optional run context; for per_second, resolution only e.g. "720p" */
  priceDetail?: string
  /** Maps from API field `discount_percent` */
  discountPercent?: number
  description: string
  /** Maps from API field `thumbnail_url` */
  thumbnailUrl?: string
  /** Maps from API field `icon_url` — brand icon beside card title */
  iconUrl?: string
  /** Maps from API field `is_hot` */
  isHot?: boolean
  /** Maps from API field `is_new` */
  isNew?: boolean
}

export interface ModelDetail extends Model {
  /** Maps from API field `model_path` */
  modelPath: string
  /** Maps from API field `api_model_id` — used in external /v1/generations examples */
  apiModelId?: string
  /** Maps from API field `is_hot` */
  isHot?: boolean
  /** Maps from API field `is_new` */
  isNew?: boolean
  /** Maps from API field `per_run_price_usd` — total USD for default run config */
  perRunPriceUsd?: number
  /** Maps from API field `runs_per_ten_usd` */
  runsPerTenUsd?: number
  /** Maps from API field `readme_md` — model README rendered in API tab */
  readmeMd?: string
  /** Maps from API field `faq` */
  faq?: ModelFaqItem[]
}

export interface ModelFaqItem {
  question: string
  answer: string
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

export type TopUpSelectionId = CreditPackageId | 'custom'

export interface CreditPackage {
  id: CreditPackageId
  priceUsd: number
}

export interface CreateCheckoutPayload {
  package?: CreditPackageId
  amountUsd?: number
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

export type PlaygroundBillingMode =
  | 'output_duration'
  | 'input_plus_output_duration'
  | 'per_image'
  | 'per_request'

export interface PlaygroundQuoteBreakdown {
  billing_mode: PlaygroundBillingMode
  billed_seconds?: number
  resolution?: string
  rate_per_second_usd?: number
  has_reference_videos?: boolean
}

export interface PlaygroundQuote {
  cost_usd: number
  standard_cost_usd?: number
  discount_percent?: number
  unit_cost_usd?: number
  batch_size: number
  runs_per_ten_usd?: number
  breakdown?: PlaygroundQuoteBreakdown
}

export interface PlaygroundQuotePayload {
  input: Record<string, unknown>
  batch_size?: number
}
