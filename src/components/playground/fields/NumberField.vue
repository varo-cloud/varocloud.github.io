<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<number>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  minimum?: number
  maximum?: number
}>()
</script>

<template>
  <div class="number-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
    />
    <input
      v-model.number="model"
      type="number"
      class="number-field__input"
      :min="minimum"
      :max="maximum"
    />
  </div>
</template>

<style scoped>
.number-field__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
  outline: none;
}
</style>
