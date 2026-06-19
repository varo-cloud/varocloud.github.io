<script setup lang="ts">
import { computed } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<number>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  minimum?: number
  maximum?: number
  step?: number
}>()

const min = computed(() => props.minimum ?? 0)
const max = computed(() => props.maximum ?? 100)
const step = computed(() => props.step ?? 1)

const percent = computed(() => {
  const range = max.value - min.value
  if (range <= 0) return 0
  return ((model.value - min.value) / range) * 100
})
</script>

<template>
  <div class="slider-field">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
    />

    <div class="slider-field__control">
      <div class="slider-field__track">
        <div class="slider-field__fill" :style="{ width: `${percent}%` }" />
        <input
          v-model.number="model"
          type="range"
          class="slider-field__input"
          :min="min"
          :max="max"
          :step="step"
        />
      </div>
      <div class="slider-field__value">{{ model }}</div>
    </div>
  </div>
</template>

<style scoped>
.slider-field__control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-field__track {
  position: relative;
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
}

.slider-field__track::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.slider-field__fill {
  position: absolute;
  left: 0;
  height: 6px;
  border-radius: 20px;
  background: #fff;
  pointer-events: none;
}

.slider-field__input {
  position: relative;
  width: 100%;
  height: 24px;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.slider-field__input::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.slider-field__input::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 50%;
  background: #fff;
}

.slider-field__value {
  min-width: 48px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
}
</style>
