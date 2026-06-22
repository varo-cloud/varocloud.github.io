<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { InputSchema, SchemaFormValues } from '@/types/schema'
import { createDefaultFormValues } from '@/utils/schema-form'
import { useUserStore } from '@/stores/user'
import PlaygroundSchemaForm from './PlaygroundSchemaForm.vue'

const props = defineProps<{
  schema?: InputSchema
  priceUsd: number
  originalPriceUsd?: number
  creditsUsd: number
  generating?: boolean
}>()

const emit = defineEmits<{
  run: [values: SchemaFormValues]
}>()

const router = useRouter()
const { t } = useI18n()
const userStore = useUserStore()

const formValues = ref<SchemaFormValues>(createDefaultFormValues(props.schema))
const batchSize = ref(1)

const formattedPrice = computed(() => `$${props.priceUsd.toFixed(2)}`)
const formattedOriginal = computed(() =>
  props.originalPriceUsd ? `$${props.originalPriceUsd.toFixed(2)}` : null,
)

const runLabel = computed(() =>
  userStore.isLoggedIn ? t('pages.modelDetail.run') : t('pages.modelDetail.startForFree'),
)

function resetForm() {
  formValues.value = createDefaultFormValues(props.schema)
}

function handleRun() {
  if (props.generating) return
  if (!userStore.isLoggedIn) {
    router.push({ name: 'auth' })
    return
  }
  emit('run', { ...formValues.value })
}

function goTopUp() {
  router.push({ name: 'billing' })
}
</script>

<template>
  <aside class="input-panel">
    <div class="input-panel__header">
      <h2 class="input-panel__title">{{ t('pages.modelDetail.inputTitle') }}</h2>
      <button type="button" class="input-panel__from">
        {{ t('pages.modelDetail.from') }}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="input-panel__form">
      <PlaygroundSchemaForm v-model="formValues" :schema="schema" />
    </div>

    <div class="input-panel__actions">
      <button type="button" class="input-panel__reset" :aria-label="t('pages.modelDetail.reset')" @click="resetForm">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M7.4395 7.6435L3.727 11.356L7.6225 15.2515H8.5V15.25H9.379L12.2125 12.4165L7.4395 7.6435V7.6435ZM8.5 6.583L13.273 11.356L15.394 9.23425L10.621 4.46125L8.5 6.583ZM11.5 15.25H16.75V16.75H10L7.0015 16.7515L2.13625 11.8863C1.99565 11.7456 1.91666 11.5549 1.91666 11.356C1.91666 11.1571 1.99565 10.9664 2.13625 10.8258L10.09 2.8705C10.1597 2.80077 10.2424 2.74545 10.3334 2.70771C10.4245 2.66996 10.5221 2.65054 10.6206 2.65054C10.7192 2.65054 10.8168 2.66996 10.9078 2.70771C10.9989 2.74545 11.0816 2.80077 11.1512 2.8705L16.9847 8.704C17.1254 8.84465 17.2043 9.03538 17.2043 9.23425C17.2043 9.43312 17.1254 9.62385 16.9847 9.7645L11.5 15.25Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <button
        type="button"
        class="input-panel__run"
        :class="{ 'input-panel__run--cta': !userStore.isLoggedIn }"
        :disabled="generating"
        @click="handleRun"
      >
        <span class="input-panel__run-label">{{ runLabel }}</span>
        <template v-if="userStore.isLoggedIn">
          <span class="input-panel__run-price">
            {{ formattedPrice }}
            <span v-if="formattedOriginal" class="input-panel__run-original">{{ formattedOriginal }}</span>
          </span>
          <span class="input-panel__run-divider" aria-hidden="true" />
          <span class="input-panel__run-batch">{{ batchSize }}x</span>
        </template>
        <svg
          v-if="userStore.isLoggedIn"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="input-panel__credits">
      <span>{{ t('pages.modelDetail.credits') }}</span>
      <span class="input-panel__credits-value">${{ creditsUsd.toFixed(1) }}</span>
      <button type="button" class="input-panel__topup" @click="goTopUp">
        {{ t('pages.modelDetail.topUp') }}
      </button>
    </div>
  </aside>
</template>

<style scoped>
.input-panel {
  display: flex;
  flex-direction: column;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  padding: 24px;
}

.input-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.input-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
}

.input-panel__from {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
}

.input-panel__form {
  margin-bottom: 20px;
}

.input-panel__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.input-panel__reset {
  flex-shrink: 0;
  width: 60px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.input-panel__reset:hover {
  background: rgba(255, 255, 255, 0.16);
}

.input-panel__reset:active {
  background: rgba(255, 255, 255, 0.22);
}

.input-panel__run {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #06b6d4;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;
}

.input-panel__run:hover:not(:disabled) {
  background: #0891b2;
}

.input-panel__run:active:not(:disabled) {
  background: #0e7490;
}

.input-panel__run:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-panel__run--cta {
  justify-content: center;
}

.input-panel__run-label {
  font-size: 16px;
  font-weight: 500;
}

.input-panel__run-price {
  font-size: 16px;
  font-weight: 500;
}

.input-panel__run-original {
  margin-left: 4px;
  font-size: 12px;
  text-decoration: line-through;
  opacity: 0.5;
}

.input-panel__run-divider {
  width: 1px;
  height: 20px;
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
}

.input-panel__run-batch {
  font-size: 16px;
  font-weight: 500;
}

.input-panel__credits {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ebf4fb;
  flex-shrink: 0;
}

.input-panel__credits-value {
  margin-left: auto;
}

.input-panel__topup {
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  font-size: 12px;
  color: #06b6d4;
  cursor: pointer;
  font-family: inherit;
}
</style>
