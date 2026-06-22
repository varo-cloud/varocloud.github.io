<script setup lang="ts">
import { computed, watch } from 'vue'
import type { InputSchema, SchemaFormValues } from '@/types/schema'
import {
  createDefaultFormValues,
  getSelectOptions,
  resolveSchemaFields,
} from '@/utils/schema-form'
import PromptField from './fields/PromptField.vue'
import ImageUploaderField from './fields/ImageUploaderField.vue'
import MultiImageUploaderField from './fields/MultiImageUploaderField.vue'
import MultiVideoUploaderField from './fields/MultiVideoUploaderField.vue'
import MultiAudioUploaderField from './fields/MultiAudioUploaderField.vue'
import SelectField from './fields/SelectField.vue'
import SliderField from './fields/SliderField.vue'
import SwitchField from './fields/SwitchField.vue'
import NumberField from './fields/NumberField.vue'
import SchemaFieldPlaceholder from './fields/SchemaFieldPlaceholder.vue'

const props = defineProps<{
  schema?: InputSchema
}>()

const model = defineModel<SchemaFormValues>({ required: true })

const fields = computed(() => resolveSchemaFields(props.schema))

watch(
  () => props.schema,
  (schema) => {
    model.value = createDefaultFormValues(schema)
  },
  { immediate: true },
)

function lastImageHint(key: string): string | undefined {
  if (key !== 'last_image' && key !== 'end_image') return undefined
  return 'Optional — animates the image into a video (switches to image-to-video)'
}
</script>

<template>
  <div class="schema-form">
    <div v-for="field in fields" :key="field.key" class="schema-form__field">
      <PromptField
        v-if="field.widget === 'textarea'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :rows="field.key === 'prompt' ? 10 : 4"
      />

      <ImageUploaderField
        v-else-if="field.widget === 'image-uploader'"
        v-model="model[field.key] as string"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :hint="lastImageHint(field.key)"
        :compact="field.key === 'last_image' || field.key === 'end_image'"
      />

      <MultiImageUploaderField
        v-else-if="field.widget === 'multi-image-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
      />

      <SelectField
        v-else-if="field.widget === 'select'"
        v-model="model[field.key] as string | number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :options="getSelectOptions(field.property)"
      />

      <SliderField
        v-else-if="field.widget === 'slider'"
        v-model="model[field.key] as number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :minimum="field.property.minimum"
        :maximum="field.property.maximum"
        :step="field.property.step"
      />

      <SwitchField
        v-else-if="field.widget === 'switch'"
        v-model="model[field.key] as boolean"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
      />

      <NumberField
        v-else-if="field.widget === 'number'"
        v-model="model[field.key] as number"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :minimum="field.property.minimum"
        :maximum="field.property.maximum"
        :step="field.property.step"
      />

      <MultiAudioUploaderField
        v-else-if="field.widget === 'multi-audio-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
      />

      <MultiVideoUploaderField
        v-else-if="field.widget === 'multi-video-uploader'"
        v-model="model[field.key] as string[]"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        :min-items="field.property.minItems"
        :max-items="field.property.maxItems"
      />

      <SchemaFieldPlaceholder
        v-else-if="field.widget === 'placeholder'"
        :label="field.key"
        :required="field.required"
        :description="field.property.description"
        widget-name="UnknownWidget"
        :hint="$t('pages.modelDetail.placeholder.unknownWidget')"
      />
    </div>
  </div>
</template>

<style scoped>
.schema-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.schema-form__field:last-child {
  margin-bottom: 0;
}
</style>
