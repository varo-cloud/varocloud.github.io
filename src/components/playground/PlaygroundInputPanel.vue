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
            d="M5 14h8a3 3 0 1 0 0-6H9M5 14l2-2M5 14l2 2M5 6l2-2M5 6l2 2"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        class="input-panel__run"
        :class="{ 'input-panel__run--cta': !userStore.isLoggedIn }"
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
  min-height: 600px;
}

.input-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 20px;
}

.input-panel__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-panel__reset {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ebf4fb;
  cursor: pointer;
}

.input-panel__run {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #06b6d4;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
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
