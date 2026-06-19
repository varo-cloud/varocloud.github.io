<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SelectDropdown from '../SelectDropdown.vue'

const model = defineModel<string | number>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  options: { label: string; value: string | number }[]
}>()
</script>

<template>
  <div class="select-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
    />
    <SelectDropdown v-model="model" :options="options" />
  </div>
</template>
