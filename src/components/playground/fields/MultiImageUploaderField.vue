<script setup lang="ts">
import { computed } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<string[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
}>()

const counter = computed(() => `${model.value.length}/${props.maxItems ?? 4}`)

function addItem() {
  const max = props.maxItems ?? 4
  if (model.value.length >= max) return
  model.value = [...model.value, '']
}

function removeItem(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updateItem(index: number, value: string) {
  const next = [...model.value]
  next[index] = value
  model.value = next
}
</script>

<template>
  <div class="multi-image-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
    />

    <div v-for="(item, index) in model" :key="index" class="multi-image-field__item">
      <input
        :value="item"
        type="text"
        class="multi-image-field__input"
        placeholder="https://example.com/image.png"
        @input="updateItem(index, ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="multi-image-field__remove" @click="removeItem(index)">
        ×
      </button>
    </div>

    <button
      type="button"
      class="multi-image-field__add"
      :disabled="model.length >= (maxItems ?? 4)"
      @click="addItem"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      Add Item
    </button>
  </div>
</template>

<style scoped>
.multi-image-field__item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.multi-image-field__input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  outline: none;
}

.multi-image-field__remove {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #9b9dab;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.multi-image-field__add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 36px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  cursor: pointer;
}

.multi-image-field__add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
