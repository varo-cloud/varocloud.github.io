import type { MockMethod } from 'vite-plugin-mock'
import type { InputSchema } from '../src/types/schema'
import type { PricingPriceUnit } from '../src/types'
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
  input_schema: InputSchema
}

const seedance20T2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt'],
  'x-order-properties': [
    'prompt',
    'reference_images',
    'reference_videos',
    'reference_audios',
    'aspect_ratio',
    'resolution',
    'duration',
    'enable_web_search',
    'generate_audio',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'Describe the scene, action, camera movement, and mood for the video.',
    },
    reference_images: {
      type: 'array',
      description: 'Reference image URLs to guide visual style, characters, or scene composition.',
      items: { type: 'string' },
      maxItems: 9,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'image/*' },
    },
    reference_videos: {
      type: 'array',
      description: 'Reference video URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'video/*' },
    },
    reference_audios: {
      type: 'array',
      description: 'Reference audio URLs (total length must not exceed 15 seconds).',
      items: { type: 'string' },
      maxItems: 3,
      'x-ui-component': 'uploaders',
      'x-ui-component-props': { accept: 'audio/*' },
    },
    aspect_ratio: {
      type: 'string',
      description: 'The aspect ratio of the generated video.',
      enum: ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    resolution: {
      type: 'string',
      description: 'The output video resolution.',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
      'x-ui-component': 'select',
    },
    duration: {
      type: 'integer',
      description: 'The duration of the generated video in seconds (4-15s).',
      minimum: 4,
      maximum: 15,
      step: 1,
      default: 5,
      'x-ui-component': 'slider',
    },
    enable_web_search: {
      type: 'boolean',
      description: 'Enable web search for real-time information.',
      default: false,
    },
    generate_audio: {
      type: 'boolean',
      description: 'Whether to generate native audio synchronized with the output video. Defaults to true.',
      default: true,
    },
  },
}

const seedanceI2vSchema: InputSchema = {
  type: 'object',
  required: ['image', 'prompt'],
  'x-order-properties': [
    'prompt',
    'image',
    'last_image',
    'reference_images',
    'aspect_ratio',
    'duration',
    'resolution',
    'generate_audio',
    'camera_fixed',
    'seed',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'The positive prompt for the generation.',
      default:
        'Healing-style hand-drawn poster featuring three puppies playing with a ball on lush green grass, adorned with decorative elements such as birds and stars.',
    },
    image: {
      type: 'string',
      description: 'The starting image for image-to-video generation.',
      default: 'https://static.wavespeed.ai/examples/567920',
    },
    last_image: {
      type: 'string',
      description: 'Optional tail frame image.',
      'x-ui-component': 'uploader',
    },
    reference_images: {
      type: 'array',
      description: 'Reference images for style guidance.',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string' },
      'x-ui-component': 'uploaders',
    },
    aspect_ratio: {
      type: 'string',
      description: 'The aspect ratio of the generated media.',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
      'x-ui-component': 'select',
    },
    duration: {
      type: 'integer',
      description: 'The duration of the generated media in seconds.',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
    },
    resolution: {
      type: 'string',
      description: 'Video resolution.',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
    },
    generate_audio: {
      type: 'boolean',
      description: 'Whether to generate audio.',
      default: false,
    },
    camera_fixed: {
      type: 'boolean',
      description: 'Whether to fix the camera position.',
      default: false,
    },
    seed: {
      type: 'integer',
      description: 'The random seed to use for the generation. -1 means random.',
      default: -1,
    },
  },
}

const seedanceT2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt'],
  'x-order-properties': [
    'prompt',
    'aspect_ratio',
    'duration',
    'resolution',
    'generate_audio',
    'camera_fixed',
    'seed',
  ],
  properties: {
    prompt: {
      type: 'string',
      description: 'The positive prompt for the generation.',
    },
    aspect_ratio: {
      type: 'string',
      enum: ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
      default: '16:9',
    },
    duration: {
      type: 'integer',
      minimum: 4,
      maximum: 12,
      step: 1,
      default: 5,
    },
    resolution: {
      type: 'string',
      enum: ['480p', '720p', '1080p'],
      default: '720p',
    },
    generate_audio: {
      type: 'boolean',
      default: true,
      description: 'Whether to generate audio.',
    },
    camera_fixed: {
      type: 'boolean',
      default: false,
      description: 'Whether to fix the camera position.',
    },
    seed: {
      type: 'integer',
      default: -1,
    },
  },
}

const klingI2vSchema: InputSchema = {
  type: 'object',
  required: ['prompt', 'image'],
  'x-order-properties': ['prompt', 'image', 'duration', 'aspect_ratio', 'seed'],
  properties: {
    prompt: { type: 'string', description: 'Text prompt for generation.' },
    image: { type: 'string', description: 'Reference image URL.' },
    duration: {
      type: 'integer',
      enum: [5, 10],
      default: 5,
      description: 'Video duration in seconds.',
    },
    aspect_ratio: {
      type: 'string',
      enum: ['16:9', '9:16', '1:1'],
      default: '16:9',
    },
    seed: { type: 'integer', default: -1 },
  },
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
    input_schema: seedanceI2vSchema,
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
    input_schema: seedance20T2vSchema,
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
    input_schema: seedanceT2vSchema,
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
    input_schema: klingI2vSchema,
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
    schema: seedance20T2vSchema,
  },
  {
    capability: 'image-to-video' as const,
    suffix: 'Image-to-Video',
    schema: seedanceI2vSchema,
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
      input_schema: template.schema,
    })
    index += 1
  }

  return catalog
}

function toListItem(model: ModelCatalogEntry) {
  const {
    model_path: _modelPath,
    input_schema: _inputSchema,
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
      return success(model)
    },
  },
] as MockMethod[]
