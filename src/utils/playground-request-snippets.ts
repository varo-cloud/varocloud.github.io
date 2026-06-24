import type { SchemaFormValues } from '@/types/schema'

export type PlaygroundInputViewMode = 'form' | 'json' | 'http' | 'python' | 'javascript'
export type ApiCodeViewMode = Exclude<PlaygroundInputViewMode, 'form' | 'json'>

export const PLAYGROUND_INPUT_VIEW_MODES: PlaygroundInputViewMode[] = [
  'form',
  'json',
  'http',
  'python',
  'javascript',
]

export const API_CODE_VIEW_MODES: ApiCodeViewMode[] = ['http', 'python', 'javascript']

function pruneApiValues(values: SchemaFormValues): SchemaFormValues {
  const result: SchemaFormValues = {}

  for (const [key, value] of Object.entries(values)) {
    if (value === '' || value === null || value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    result[key] = value
  }

  return result
}

export function resolveV1BaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/v1`
  }

  return 'https://<your-host>/v1'
}

export function resolveCreateGenerationUrl(): string {
  return `${resolveV1BaseUrl()}/generations`
}

export function resolveGetGenerationUrl(taskId: string): string {
  return `${resolveV1BaseUrl()}/generations/${taskId}`
}

/** External API Key calls — flat body with `model` (api_model_id). */
export function buildExternalApiBody(apiModelId: string, values: SchemaFormValues) {
  return {
    model: apiModelId,
    ...pruneApiValues(values),
  }
}

/** Playground JWT run — wrapped body with `model_id` + `input`. */
export function buildPlaygroundRunBody(
  modelId: string,
  values: SchemaFormValues,
  batchSize = 1,
) {
  return {
    model_id: modelId,
    input: { ...values },
    batch_size: batchSize,
  }
}

export function parseJsonInputDraft(
  json: string,
): { values: SchemaFormValues; batchSize?: number } | null {
  try {
    const parsed = JSON.parse(json) as {
      input?: SchemaFormValues
      batch_size?: number
      batchSize?: number
    } & SchemaFormValues

    if (!parsed || typeof parsed !== 'object') return null

    const values =
      'input' in parsed && parsed.input && typeof parsed.input === 'object'
        ? parsed.input
        : (parsed as SchemaFormValues)

    if (!values || typeof values !== 'object' || Array.isArray(values)) return null

    const rawBatch = parsed.batch_size ?? parsed.batchSize
    const batchSize =
      typeof rawBatch === 'number' && Number.isFinite(rawBatch) && rawBatch >= 1
        ? Math.min(4, Math.floor(rawBatch))
        : undefined

    return { values: { ...values }, batchSize }
  } catch {
    return null
  }
}

export function buildPlaygroundJsonSnippet(
  modelId: string,
  values: SchemaFormValues,
  batchSize = 1,
): string {
  return JSON.stringify(buildPlaygroundRunBody(modelId, values, batchSize), null, 2)
}

export function buildHttpSnippet(apiModelId: string, values: SchemaFormValues): string {
  const url = resolveCreateGenerationUrl()
  const body = JSON.stringify(buildExternalApiBody(apiModelId, values), null, 2)

  return `POST ${url}
Authorization: Bearer sk_live_...
Content-Type: application/json

${body}`
}

function toPythonLiteral(value: unknown, indent = 0): string {
  const pad = '  '.repeat(indent)
  const childPad = '  '.repeat(indent + 1)

  if (value === null) return 'None'
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return JSON.stringify(value)

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((item) => `${childPad}${toPythonLiteral(item, indent + 1)}`)
    return `[\n${items.join(',\n')}\n${pad}]`
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const lines = entries.map(
      ([key, item]) => `${childPad}${JSON.stringify(key)}: ${toPythonLiteral(item, indent + 1)}`,
    )
    return `{\n${lines.join(',\n')}\n${pad}}`
  }

  return JSON.stringify(value)
}

export function buildPythonSnippet(apiModelId: string, values: SchemaFormValues): string {
  const baseUrl = resolveV1BaseUrl()
  const body = toPythonLiteral(buildExternalApiBody(apiModelId, values))

  return `import time
from openai import OpenAI

API_KEY = "sk_live_..."
client = OpenAI(api_key=API_KEY, base_url="${baseUrl}")

body = ${body}

generation = client.post("/generations", body=body, cast_to=dict)
task_id = generation["id"]

while True:
    status = client.get(f"/generations/{task_id}", cast_to=dict)
    if status["status"] in ("completed", "succeeded"):
        print(status.get("url") or status.get("output", {}).get("url"))
        break
    if status["status"] == "failed":
        raise RuntimeError(status.get("error", {}).get("message", "Generation failed"))
    time.sleep(5)`
}

export function buildJavaScriptSnippet(apiModelId: string, values: SchemaFormValues): string {
  const baseUrl = resolveV1BaseUrl()
  const body = JSON.stringify(buildExternalApiBody(apiModelId, values), null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `    ${line}`))
    .join('\n')

  return `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk_live_...",
  baseURL: "${baseUrl}",
});

const generation = await client.post("/generations", {
  body: ${body},
});

let status = generation;
while (status.status === "queued" || status.status === "processing" || status.status === "running") {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  status = await client.get(\`/generations/\${generation.id}\`);
}

if (status.status === "completed" || status.status === "succeeded") {
  console.log(status.url ?? status.output?.url);
}`
}

export function buildInputViewSnippet(
  mode: Exclude<PlaygroundInputViewMode, 'form'>,
  modelId: string,
  apiModelId: string,
  values: SchemaFormValues,
  batchSize = 1,
): string {
  switch (mode) {
    case 'json':
      return buildPlaygroundJsonSnippet(modelId, values, batchSize)
    case 'http':
      return buildHttpSnippet(apiModelId, values)
    case 'python':
      return buildPythonSnippet(apiModelId, values)
    case 'javascript':
      return buildJavaScriptSnippet(apiModelId, values)
  }
}

export function buildApiCodeSnippet(
  mode: ApiCodeViewMode,
  apiModelId: string,
  values: SchemaFormValues,
): string {
  return buildInputViewSnippet(mode, '', apiModelId, values)
}
