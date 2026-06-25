<script setup lang="ts">
import SchemaFieldError from '../SchemaFieldError.vue'

const model = defineModel<boolean>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  invalid?: boolean
  errorMessage?: string
}>()
</script>

<template>
  <div class="switch-field" :class="{ 'switch-field--invalid': invalid }">
    <div class="switch-field__content">
      <div class="switch-field__text">
        <span class="switch-field__label">{{ label }}</span>
        <p v-if="description" class="switch-field__desc">{{ description }}</p>
      </div>
      <button
        type="button"
        class="switch-field__toggle"
        :class="{ 'switch-field__toggle--on': model }"
        role="switch"
        :aria-checked="model"
        @click="model = !model"
      >
        <span class="switch-field__knob" />
      </button>
    </div>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.switch-field__content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 36px;
  padding: 8px 0;
  border: 0.5px solid transparent;
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.switch-field--invalid .switch-field__content {
  border-color: #f87171;
}

.switch-field__label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
  line-height: 14px;
}

.switch-field--invalid .switch-field__label {
  color: #f87171;
}

.switch-field__desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 12px;
}

.switch-field__toggle {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: background 0.2s;
}

.switch-field__toggle--on {
  background: #06b6d4;
}

.switch-field__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
}

.switch-field__toggle--on .switch-field__knob {
  transform: translateX(18px);
}
</style>
