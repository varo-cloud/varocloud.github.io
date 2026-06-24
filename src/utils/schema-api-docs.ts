import type { InputSchema, SchemaProperty } from '@/types/schema'
import { resolveSchemaFields } from '@/utils/schema-form'

export interface SchemaApiParameterRow {
  name: string
  type: string
  required: boolean
  defaultValue: string
  range: string
  description: string
}

function formatDefault(property: SchemaProperty): string {
  if (property.default === undefined) return '—'
  if (typeof property.default === 'string') return property.default
  if (typeof property.default === 'boolean') return property.default ? 'true' : 'false'
  return String(property.default)
}

function formatRange(property: SchemaProperty): string {
  const parts: string[] = []

  if (property.enum?.length) {
    parts.push(property.enum.join(', '))
  }

  if (property.minimum !== undefined || property.maximum !== undefined) {
    const min = property.minimum ?? '—'
    const max = property.maximum ?? '—'
    parts.push(`${min} ~ ${max}`)
  }

  if (property.minItems !== undefined || property.maxItems !== undefined) {
    const min = property.minItems ?? 0
    const max = property.maxItems ?? '∞'
    parts.push(`items ${min}–${max}`)
  }

  return parts.length > 0 ? parts.join(' · ') : '—'
}

function formatType(property: SchemaProperty): string {
  if (property.type === 'array') {
    const itemType = property.items?.type ?? 'string'
    return `array<${itemType}>`
  }

  return property.type
}

export function buildSchemaParameterRows(schema: InputSchema | undefined): SchemaApiParameterRow[] {
  if (!schema) return []

  return resolveSchemaFields(schema).map((field) => ({
    name: field.key,
    type: formatType(field.property),
    required: field.required,
    defaultValue: formatDefault(field.property),
    range: formatRange(field.property),
    description: field.property.description ?? '—',
  }))
}
