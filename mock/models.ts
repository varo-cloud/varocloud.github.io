import type { MockMethod } from 'vite-plugin-mock'
import type { PricingPriceUnit } from '../src/types'
import { resolveApiModelId, resolveModelDoc } from './model-docs'
import { success } from './_util'

interface ModelCatalogEntry {
  id: string
  name: string
  display_name?: string
  provider: string
  model_path: string
  capabilities: string[]
  starting_price_usd: number
  standard_price_usd?: number
  price_unit: PricingPriceUnit
  per_run_price_usd?: number
  runs_per_ten_usd?: number
  price_detail?: string
  discount_percent?: number
  is_hot?: boolean
  description: string
  thumbnail_url?: string
}

const baseModels: ModelCatalogEntry[] = [
  {
    id: 'seedance-i2v',
    name: 'Seedance 2.0 Image-to-Video',
    display_name: 'Seedance 2.0',
    provider: 'ByteDance',
    model_path: 'bytedance/seedance-v1.5-pro/image-to-video',
    capabilities: ['image-to-video'],
    starting_price_usd: 0.084,
    standard_price_usd: 0.1,
    price_unit: 'per_second',
    per_run_price_usd: 0.42,
    runs_per_ten_usd: 23,
    price_detail: '5s · 720p',
    discount_percent: 16,
    is_hot: true,
    description:
      'Hollywood-grade cinematic image-to-video generation with native audio sync at 480p or 720p. Animates a starting frame with natural-language motion prompts.',
    thumbnail_url: '/assets/model-detail/model-thumb.jpg',
  },
  {
    id: 'seedance-t2v',
    name: 'Seedance 2.0 Text-to-Video',
    display_name: 'Seedance 2.0',
    provider: 'ByteDance',
    model_path: 'bytedance/seedance-2.0/text-to-video',
    capabilities: ['text-to-video'],
    starting_price_usd: 0.072,
    standard_price_usd: 0.09,
    price_unit: 'per_second',
    per_run_price_usd: 0.36,
    runs_per_ten_usd: 27,
    price_detail: '5s · 480p',
    discount_percent: 20,
    description:
      'Hollywood-grade cinematic text-to-video generation with native audio sync. Supports reference images, videos, and audios for style and motion guidance.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
  },
  {
    id: 'kling-t2v',
    name: 'Kling Text-to-Video',
    display_name: 'Kling 2.6',
    provider: 'Kuaishou',
    model_path: 'kwaivgi/kling-v2.6-pro/text-to-video',
    capabilities: ['text-to-video'],
    starting_price_usd: 0.066,
    standard_price_usd: 0.08,
    price_unit: 'per_second',
    per_run_price_usd: 0.33,
    runs_per_ten_usd: 30,
    price_detail: '5s · 720p',
    discount_percent: 18,
    description:
      'High-quality text-to-video generation powered by Kling with cinematic motion control.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
  },
  {
    id: 'kling-i2v',
    name: 'Kling Image-to-Video',
    display_name: 'Kling 2.6',
    provider: 'Kuaishou',
    model_path: 'kwaivgi/kling-v2.6-pro/image-to-video',
    capabilities: ['image-to-video'],
    starting_price_usd: 0.066,
    standard_price_usd: 0.08,
    price_unit: 'per_second',
    per_run_price_usd: 0.33,
    runs_per_ten_usd: 30,
    price_detail: '5s · 720p',
    discount_percent: 18,
    description:
      'Transform reference images into smooth video clips with Kling image-to-video.',
    thumbnail_url: '/assets/models/card-thumb.jpg',
  },
]

const VARIANT_PROVIDERS = [
  'ByteDance',
  'Kuaishou',
  'OpenAI',
  'Google',
  'Luma',
  'Runway',
  'Minimax',
  'Hunyuan',
]

const VARIANT_FAMILIES = [
  'Seedance 2.0',
  'Kling 2.6',
  'Veo 2',
  'Sora',
  'Gen-3',
  'Dream Machine',
  'Hailuo',
  'Wan 2.1',
  'Pika 2.0',
  'Stable Video',
]

const VARIANT_TEMPLATES = [
  {
    capability: 'text-to-video' as const,
    suffix: 'Text-to-Video',
  },
  {
    capability: 'image-to-video' as const,
    suffix: 'Image-to-Video',
  },
]

function buildModelCatalog(): ModelCatalogEntry[] {
  const catalog: ModelCatalogEntry[] = [...baseModels]
  let index = 0

  while (catalog.length < 48) {
    const provider = VARIANT_PROVIDERS[index % VARIANT_PROVIDERS.length]
    const family = VARIANT_FAMILIES[index % VARIANT_FAMILIES.length]
    const template = VARIANT_TEMPLATES[index % VARIANT_TEMPLATES.length]
    const variant = Math.floor(index / VARIANT_TEMPLATES.length) % 3
    const pricePerSecond = Number((0.04 + (index % 12) * 0.004).toFixed(3))
    const standardPerSecond = Number((pricePerSecond * 1.2).toFixed(3))
    const duration = 4 + (index % 8)
    const perRun = Number((pricePerSecond * duration).toFixed(2))
    const slug = family.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')

    catalog.push({
      id: `model-${index + 1}`,
      name: `${family} ${template.suffix}${variant > 0 ? ` v${variant + 1}` : ''}`,
      display_name: family,
      provider,
      model_path: `${provider.toLowerCase()}/${slug}/${template.capability}`,
      capabilities: [template.capability],
      starting_price_usd: pricePerSecond,
      standard_price_usd: standardPerSecond,
      price_unit: 'per_second',
      per_run_price_usd: perRun,
      runs_per_ten_usd: Math.max(1, Math.floor(10 / perRun)),
      price_detail: `${duration}s · ${['480p', '720p', '1080p'][index % 3]}`,
      ...(index % 4 !== 0 ? { discount_percent: [20, 25, 30][index % 3] } : {}),
      is_hot: index % 7 === 0,
      description: `${family} ${template.capability.replace(/-/g, ' ')} generation powered by ${provider}.`,
      thumbnail_url:
        index % 3 === 0 ? '/assets/model-detail/model-thumb.jpg' : '/assets/models/card-thumb.jpg',
    })
    index += 1
  }

  return catalog
}

function toListItem(model: ModelCatalogEntry) {
  const {
    model_path: _modelPath,
    is_hot: _isHot,
    per_run_price_usd: _perRun,
    runs_per_ten_usd: _runs,
    ...item
  } = model
  return item
}

const models = buildModelCatalog()

function filterModels(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return models

  return models.filter((model) => {
    const name = (model.display_name ?? model.name).toLowerCase()
    return (
      name.includes(q) ||
      model.provider.toLowerCase().includes(q) ||
      model.description.toLowerCase().includes(q)
    )
  })
}

export default [
  {
    url: '/api/models',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const offset = Math.max(0, Number(query.offset) || 0)
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20))
      const filtered = filterModels(query.q ?? '')

      return success({
        items: filtered.slice(offset, offset + limit).map(toListItem),
        total: filtered.length,
        offset,
        limit,
      })
    },
  },
  {
    url: '/api/models/batch',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const ids = (query.ids ?? '').split(',').filter(Boolean)
      const items = ids
        .map((id) => models.find((item) => item.id === id))
        .filter((item): item is ModelCatalogEntry => Boolean(item))
        .map(toListItem)

      return success(items)
    },
  },
  {
    url: '/api/models/:id',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const model = models.find((item) => item.id === query.id)
      if (!model) {
        return { code: 404, message: 'Model not found', data: null }
      }

      const doc = resolveModelDoc(model.id)
      return success({
        ...model,
        api_model_id: resolveApiModelId(model.id, model.model_path),
        readme_md: doc.readme_md || null,
        faq: doc.faq.length > 0 ? doc.faq : null,
      })
    },
  },
] as MockMethod[]
