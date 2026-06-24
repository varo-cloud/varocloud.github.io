export interface ModelDocContent {
  api_model_id: string
  readme_md: string
  faq: Array<{ question: string; answer: string }>
}

const seedanceT2vReadme = `## Seedance 2.0 Text-to-Video

**Seedance 2.0** generates production-grade cinematic videos from text prompts with native audio-visual synchronization and director-level camera control.

## Key Features

- **Unified multimodal architecture** — accepts text, image, audio, and video references
- **Native audio-visual sync** — synchronized audio in a single pass
- **Director-level control** — camera movement, lighting, and mood via natural language
- **Production-grade quality** — Hollywood-grade visual fidelity and smooth motion

## Pricing

Billed per second of output duration, anchored at **$0.60 per 5 seconds at 480p**.

| Resolution | 5 s | 10 s | 15 s |
| --- | --- | --- | --- |
| 480p | $0.60 | $1.20 | $1.80 |
| 720p | $1.20 | $2.40 | $3.60 |
| 1080p | $3.00 | $6.00 | $9.00 |
| 4k | $6.00 | $12.00 | $18.00 |

## Best Use Cases

- Film & production previews
- Commercials and ads
- Music videos with native audio sync
- Premium social short-form content

## Pro Tips

- Write prompts like a film director — include lighting, camera angles, and mood
- Use 16:9 for cinematic widescreen; 9:16 for vertical content
- Start with 4–5 s to iterate, then extend up to 15 s
`

const seedanceT2vFaq = [
  {
    question: 'What is the Seedance 2.0 Text-to-Video API?',
    answer:
      'A REST API that generates cinematic videos from text prompts with native audio sync. Call POST /v1/generations with your API key and poll GET /v1/generations/{id} until completed.',
  },
  {
    question: 'How do I call the API?',
    answer:
      'POST your input parameters to POST /v1/generations with Authorization: Bearer sk_live_.... The response includes a task id; poll GET /v1/generations/{id} until status is completed, then read the output URL.',
  },
  {
    question: 'How much does each run cost?',
    answer:
      'Pricing scales with resolution and duration. The Playground shows the exact cost before you run. Base rate is $0.60 per 5 seconds at 480p without reference videos.',
  },
  {
    question: 'What inputs does the API accept?',
    answer:
      'Key inputs: prompt, aspect_ratio, resolution, duration, reference_images, reference_videos, reference_audios, enable_web_search, generate_audio. See the Parameters table in this API tab for the full schema.',
  },
]

const modelDocs: Record<string, ModelDocContent> = {
  'seedance-t2v': {
    api_model_id: 'dreamina-seedance-2-0-260128',
    readme_md: seedanceT2vReadme,
    faq: seedanceT2vFaq,
  },
  'seedance-i2v': {
    api_model_id: 'seedance-1-5-pro-251215',
    readme_md: `## Seedance Image-to-Video

Animate a starting frame with natural-language motion prompts. Supports optional end frame, reference images, and native audio generation.

## Pricing

Billed per second of output duration. See the Playground for live cost estimates based on resolution and duration.`,
    faq: [
      {
        question: 'What is required to run image-to-video?',
        answer: 'Both `image` (starting frame URL) and `prompt` are required. Optional fields include last_image, aspect_ratio, duration, and resolution.',
      },
    ],
  },
  'kling-t2v': {
    api_model_id: 'kling-v2-6-pro-t2v',
    readme_md: `## Kling Text-to-Video

High-quality text-to-video generation with cinematic motion control powered by Kuaishou Kling.`,
    faq: [
      {
        question: 'How do I authenticate API requests?',
        answer: 'Include Authorization: Bearer sk_live_... in every request to /v1/generations.',
      },
    ],
  },
  'kling-i2v': {
    api_model_id: 'kling-v2-6-pro-i2v',
    readme_md: `## Kling Image-to-Video

Transform reference images into smooth video clips with Kling image-to-video.`,
    faq: [],
  },
}

const defaultDoc: ModelDocContent = {
  api_model_id: 'model-placeholder',
  readme_md: '',
  faq: [],
}

export function resolveModelDoc(modelId: string): ModelDocContent {
  return modelDocs[modelId] ?? defaultDoc
}

export function resolveApiModelId(modelId: string, modelPath: string): string {
  const doc = modelDocs[modelId]
  if (doc?.api_model_id && doc.api_model_id !== 'model-placeholder') {
    return doc.api_model_id
  }

  return modelPath.replace(/\//g, '-')
}
