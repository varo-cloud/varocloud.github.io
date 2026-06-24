import { http, unwrap } from './http'
import type {
  FetchModelsParams,
  Model,
  ModelDetail,
  ModelFaqItem,
  ModelsPage,
  PricingPriceUnit,
} from '@/types'

interface ApiModel {
  id: string
  name: string
  display_name?: string
  provider: string
  capabilities: string[]
  starting_price_usd: number
  standard_price_usd?: number | null
  price_unit: PricingPriceUnit
  price_detail?: string | null
  discount_percent?: number | null
  description: string
  thumbnail_url?: string | null
}

interface ApiModelDetail extends ApiModel {
  model_path: string
  api_model_id?: string | null
  is_hot?: boolean
  per_run_price_usd?: number | null
  runs_per_ten_usd?: number | null
  readme_md?: string | null
  faq?: ModelFaqItem[] | null
}

interface ApiModelsPage {
  items: ApiModel[]
  total: number
  offset: number
  limit: number
}

function mapModel(raw: ApiModel): Model {
  return {
    id: raw.id,
    name: raw.name,
    displayName: raw.display_name ?? undefined,
    provider: raw.provider,
    capabilities: raw.capabilities,
    startingPriceUsd: raw.starting_price_usd,
    originalPriceUsd: raw.standard_price_usd ?? undefined,
    priceUnit: raw.price_unit,
    priceDetail: raw.price_detail ?? undefined,
    discountPercent: raw.discount_percent ?? undefined,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url ?? undefined,
  }
}

function mapModelDetail(raw: ApiModelDetail): ModelDetail {
  return {
    ...mapModel(raw),
    modelPath: raw.model_path,
    apiModelId: raw.api_model_id ?? undefined,
    isHot: raw.is_hot,
    perRunPriceUsd: raw.per_run_price_usd ?? undefined,
    runsPerTenUsd: raw.runs_per_ten_usd ?? undefined,
    readmeMd: raw.readme_md ?? undefined,
    faq: raw.faq ?? undefined,
  }
}

function mapModelsPage(raw: ApiModelsPage): ModelsPage {
  return {
    items: raw.items.map(mapModel),
    total: raw.total,
    offset: raw.offset,
    limit: raw.limit,
  }
}

export function fetchModels(params?: FetchModelsParams) {
  return unwrap<ApiModelsPage>(http.get('/models', { params })).then(mapModelsPage)
}

export function fetchModelDetail(id: string) {
  return unwrap<ApiModelDetail>(http.get(`/models/${id}`)).then(mapModelDetail)
}

export function fetchModelsByIds(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([] as Model[])
  return unwrap<ApiModel[]>(http.get('/models/batch', { params: { ids: ids.join(',') } })).then(
    (items) => items.map(mapModel),
  )
}
