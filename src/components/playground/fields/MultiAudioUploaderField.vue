<script setup lang="ts">
import { computed } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import AudioUploaderField from './AudioUploaderField.vue'

const model = defineModel<string[]>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minItems?: number
  maxItems?: number
}>()

const maxCount = computed(() => props.maxItems ?? 3)

const filledCount = computed(() => model.value.filter(Boolean).length)

const counter = computed(() => `${filledCount.value}/${maxCount.value}`)

const slots = computed(() => {
  const result: string[] = []
  for (let i = 0; i < model.value.length; i += 1) {
    result.push(model.value[i] ?? '')
  }

  if (result.length === 0) {
    result.push('')
    return result
  }

  if (result.length < maxCount.value && result[result.length - 1]) {
    result.push('')
  }

  return result
})

function updateSlot(index: number, value: string) {
  const next = [...model.value]

  while (next.length <= index) {
    next.push('')
  }

  next[index] = value
  model.value = next.filter((item, i, arr) => item || arr.slice(i + 1).some(Boolean))
}
</script>

<template>
  <div class="multi-audio-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="counter"
    />

    <div class="multi-audio-field__list">
      <AudioUploaderField
        v-for="(item, index) in slots"
        :key="index"
        :model-value="item"
        :show-label="false"
        @update:model-value="updateSlot(index, $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.multi-audio-field__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
