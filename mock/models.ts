import type { MockMethod } from 'vite-plugin-mock'
import type { InputSchema } from '../src/types/schema'
import { success } from './_util'

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

const models = [
  {
    id: 'seedance-i2v',
    name: 'Seedance 2.0 Image-to-Video',
    displayName: 'Seedance 2.0',
    provider: 'ByteDance',
    modelPath: 'bytedance/seedance-v1.5-pro/image-to-video',
    capabilities: ['image-to-video'],
    startingPriceUsd: 0.76,
    originalPriceUsd: 0.89,
    perRunPriceUsd: 0.15,
    runsPerTenUsd: 66,
    priceDetail: '5s · 720p',
    discountPercent: 30,
    isHot: true,
    description:
      'Hollywood-grade cinematic image-to-video generation with native audio sync at 480p or 720p. Animates a starting frame with natural-language motion prompts.',
    thumbnailUrl: '/assets/model-detail/model-thumb.jpg',
    inputSchema: seedanceI2vSchema,
  },
  {
    id: 'seedance-t2v',
    name: 'Seedance 2.0 Text-to-Video',
    displayName: 'Seedance 2.0',
    provider: 'ByteDance',
    modelPath: 'bytedance/seedance-2.0/text-to-video',
    capabilities: ['text-to-video'],
    startingPriceUsd: 0.6,
    originalPriceUsd: 0.075,
    perRunPriceUsd: 0.12,
    runsPerTenUsd: 83,
    priceDetail: '5s · 480p',
    discountPercent: 30,
    description:
      'Hollywood-grade cinematic text-to-video generation with native audio sync. Supports reference images, videos, and audios for style and motion guidance.',
    thumbnailUrl: '/assets/models/card-thumb.jpg',
    inputSchema: seedance20T2vSchema,
  },
  {
    id: 'kling-t2v',
    name: 'Kling Text-to-Video',
    displayName: 'Kling 2.6',
    provider: 'Kuaishou',
    modelPath: 'kwaivgi/kling-v2.6-pro/text-to-video',
    capabilities: ['text-to-video'],
    startingPriceUsd: 0.55,
    originalPriceUsd: 0.07,
    perRunPriceUsd: 0.11,
    runsPerTenUsd: 90,
    priceDetail: '5s · 720p',
    discountPercent: 30,
    description:
      'High-quality text-to-video generation powered by Kling with cinematic motion control.',
    thumbnailUrl: '/assets/models/card-thumb.jpg',
    inputSchema: seedanceT2vSchema,
  },
  {
    id: 'kling-i2v',
    name: 'Kling Image-to-Video',
    displayName: 'Kling 2.6',
    provider: 'Kuaishou',
    modelPath: 'kwaivgi/kling-v2.6-pro/image-to-video',
    capabilities: ['image-to-video'],
    startingPriceUsd: 0.55,
    originalPriceUsd: 0.07,
    perRunPriceUsd: 0.11,
    runsPerTenUsd: 90,
    priceDetail: '5s · 720p',
    discountPercent: 30,
    description:
      'Transform reference images into smooth video clips with Kling image-to-video.',
    thumbnailUrl: '/assets/models/card-thumb.jpg',
    inputSchema: klingI2vSchema,
  },
]

export default [
  {
    url: '/api/models',
    method: 'get',
    response: () => success(models),
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
