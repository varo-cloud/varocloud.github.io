<script setup lang="ts">
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  placeholder?: string
  rows?: number
}>()
</script>

<template>
  <div class="prompt-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
    />
    <div class="prompt-field__wrap">
      <textarea
        v-model="model"
        class="prompt-field__input"
        :rows="rows ?? 8"
        :placeholder="placeholder"
      />
    </div>
  </div>
</template>

<style scoped>
.prompt-field__wrap {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 12px;
}

.prompt-field__input {
  width: 100%;
  min-height: 120px;
  border: none;
  background: transparent;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  color: #ebf4fb;
  outline: none;
}

.prompt-field__input::placeholder {
  color: rgba(235, 244, 251, 0.35);
}
</style>
