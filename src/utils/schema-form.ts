import type {
  InputSchema,
  ResolvedSchemaField,
  SchemaFormValues,
  SchemaProperty,
  SchemaWidget,
} from '@/types/schema'

const IMAGE_FIELD_KEYS = new Set([
  'image',
  'last_image',
  'end_image',
])

const TEXTAREA_FIELD_KEYS = new Set([
  'prompt',
  'negative_prompt',
  'text',
  'sound_effect_prompt',
  'bgm_prompt',
])

const SWITCH_FIELD_KEYS = new Set([
  'generate_audio',
  'enable_web_search',
  'camera_fixed',
  'sound',
  'keep_original_sound',
])

function uploaderAccept(property: SchemaProperty): string {
  return property['x-ui-component-props']?.accept ?? ''
}

function isImageUploaderField(key: string, property: SchemaProperty): boolean {
  if (property.type === 'array') return false
  if (property['x-ui-component'] === 'uploader') return true
  return property.type === 'string' && IMAGE_FIELD_KEYS.has(key)
}

function resolveMultiUploaderWidget(key: string, property: SchemaProperty): SchemaWidget | null {
  if (property.type !== 'array') return null

  const isUploaders = property['x-ui-component'] === 'uploaders'
  const isKnownMultiKey =
    key === 'reference_images' || key === 'reference_audios' || key === 'reference_videos' || key === 'images'

  if (!isUploaders && !isKnownMultiKey) return null

  const accept = uploaderAccept(property)
  if (accept.startsWith('audio/') || key === 'reference_audios') return 'multi-audio-uploader'
  if (accept.startsWith('video/') || key === 'reference_videos') return 'multi-video-uploader'
  if (accept.startsWith('image/') || key === 'reference_images' || key === 'images') {
    return 'multi-image-uploader'
  }

  return isUploaders ? 'placeholder' : null
}

export function resolveWidget(key: string, property: SchemaProperty): SchemaWidget {
  const multiUploader = resolveMultiUploaderWidget(key, property)
  if (multiUploader) return multiUploader
  if (isImageUploaderField(key, property)) return 'image-uploader'
  if (property.type === 'boolean' || SWITCH_FIELD_KEYS.has(key)) return 'switch'
  if (TEXTAREA_FIELD_KEYS.has(key)) return 'textarea'

  if (property.type === 'integer' || property.type === 'number') {
    if (key === 'seed') return 'number'
    if (property.enum?.length) return 'select'
    if (
      property.minimum !== undefined &&
      property.maximum !== undefined &&
      key === 'duration'
    ) {
      return 'slider'
    }
    if (property.enum?.length || key === 'duration') return 'select'
    return 'number'
  }

  if (property.type === 'string' && property.enum?.length) return 'select'
  if (property.type === 'string') return 'textarea'

  return 'text'
}

export function resolveSchemaFields(schema: InputSchema): ResolvedSchemaField[] {
  const requiredSet = new Set(schema.required ?? [])
  const order = schema['x-order-properties'] ?? Object.keys(schema.properties)
  const seen = new Set<string>()

  const fields: ResolvedSchemaField[] = []

  for (const key of order) {
    const property = schema.properties[key]
    if (!property || seen.has(key)) continue
    seen.add(key)
    fields.push({
      key,
      property,
      widget: resolveWidget(key, property),
      required: requiredSet.has(key),
    })
  }

  for (const [key, property] of Object.entries(schema.properties)) {
    if (seen.has(key)) continue
    fields.push({
      key,
      property,
      widget: resolveWidget(key, property),
      required: requiredSet.has(key),
    })
  }

  return fields
}

function defaultForProperty(key: string, property: SchemaProperty, widget: SchemaWidget): unknown {
  if (property.default !== undefined) return property.default

  switch (widget) {
    case 'textarea':
    case 'text':
      return ''
    case 'switch':
      return false
    case 'number':
      return key === 'seed' ? -1 : 0
    case 'slider':
      return property.minimum ?? 0
    case 'select':
      return property.enum?.[0] ?? ''
    case 'image-uploader':
      return ''
    case 'multi-image-uploader':
    case 'multi-audio-uploader':
    case 'multi-video-uploader':
      return []
    case 'placeholder':
      return null
    default:
      return ''
  }
}

export function createDefaultFormValues(schema: InputSchema): SchemaFormValues {
  const values: SchemaFormValues = {}

  for (const field of resolveSchemaFields(schema)) {
    values[field.key] = defaultForProperty(field.key, field.property, field.widget)
  }

  return values
}

export function getSelectOptions(property: SchemaProperty): { label: string; value: string | number }[] {
  return (property.enum ?? []).map((value) => ({
    label: String(value),
    value,
  }))
}
