export type SchemaFieldType = 'string' | 'integer' | 'number' | 'boolean' | 'array' | 'object'

export type SchemaWidget =
  | 'textarea'
  | 'text'
  | 'select'
  | 'slider'
  | 'switch'
  | 'number'
  | 'image-uploader'
  | 'multi-image-uploader'
  | 'multi-audio-uploader'
  | 'multi-video-uploader'
  | 'placeholder'

export interface SchemaUiComponentProps {
  accept?: string
}

export interface SchemaProperty {
  type: SchemaFieldType
  description?: string
  default?: unknown
  enum?: (string | number)[]
  minimum?: number
  maximum?: number
  step?: number
  minItems?: number
  maxItems?: number
  items?: SchemaProperty
  'x-ui-component'?: string
  'x-ui-component-props'?: SchemaUiComponentProps
}

export interface InputSchema {
  type: 'object'
  properties: Record<string, SchemaProperty>
  required?: string[]
  'x-order-properties'?: string[]
}

export interface ResolvedSchemaField {
  key: string
  property: SchemaProperty
  widget: SchemaWidget
  required: boolean
}

export type SchemaFormValues = Record<string, unknown>
