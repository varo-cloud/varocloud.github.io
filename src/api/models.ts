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
  icon_url?: string | null
  is_hot?: boolean | null
  is_new?: boolean | null
}

interface ApiModelDetail extends ApiModel {
  model_path: string
  api_model_id?: string | null
  is_hot?: boolean
  is_new?: boolean
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

function mapModel(raw: Partial<ApiModel> & Pick<ApiModel, 'id'>): Model {
  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    displayName: raw.display_name ?? undefined,
    provider: raw.provider ?? '',
    capabilities: raw.capabilities ?? [],
    startingPriceUsd: raw.starting_price_usd ?? 0,
    originalPriceUsd: raw.standard_price_usd ?? undefined,
    priceUnit: raw.price_unit ?? 'per_second',
    priceDetail: raw.price_detail ?? undefined,
    discountPercent: raw.discount_percent ?? undefined,
    description: raw.description ?? '',
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    iconUrl: raw.icon_url ?? undefined,
    isHot: raw.is_hot ?? undefined,
    isNew: raw.is_new ?? undefined,
  }
}

function mapModelDetail(raw: ApiModelDetail): ModelDetail {
  return {
    ...mapModel(raw),
    modelPath: raw.model_path,
    apiModelId: raw.api_model_id ?? undefined,
    isHot: raw.is_hot,
    isNew: raw.is_new,
    perRunPriceUsd: raw.per_run_price_usd ?? undefined,
    runsPerTenUsd: raw.runs_per_ten_usd ?? undefined,
    readmeMd: raw.readme_md ?? undefined,
    faq: raw.faq ?? undefined,
  }
}

function mapModelsPage(raw: ApiModelsPage): ModelsPage {
  return {
    items: (raw.items ?? []).map(mapModel),
    total: raw.total ?? raw.items?.length ?? 0,
    offset: raw.offset ?? 0,
    limit: raw.limit ?? raw.items?.length ?? 0,
  }
}

function filterModelsByQuery(items: ApiModel[], query?: string): ApiModel[] {
  const q = query?.trim().toLowerCase()
  if (!q) return items

  return items.filter((model) => {
    const name = (model.display_name ?? model.name ?? model.id).toLowerCase()
    return (
      name.includes(q) ||
      (model.provider ?? '').toLowerCase().includes(q) ||
      (model.description ?? '').toLowerCase().includes(q)
    )
  })
}

/** 兼容后端返回 data 为数组，或 data 为 { items, total, ... } 两种形态 */
function normalizeModelsPage(
  raw: ApiModelsPage | ApiModel[],
  params?: FetchModelsParams,
): ModelsPage {
  if (Array.isArray(raw)) {
    const offset = Math.max(0, params?.offset ?? 0)
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20))
    const filtered = filterModelsByQuery(raw, params?.q)

    return {
      items: filtered.slice(offset, offset + limit).map(mapModel),
      total: filtered.length,
      offset,
      limit,
    }
  }

  return mapModelsPage(raw)
}

export function fetchModels(params?: FetchModelsParams) {
  return unwrap<ApiModelsPage | ApiModel[]>(http.get('/models', { params })).then((raw) =>
    normalizeModelsPage(raw, params),
  )
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
