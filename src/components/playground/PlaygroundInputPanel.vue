<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NTooltip } from 'naive-ui'
import { useAppMessage } from '@/composables/useAppMessage'
import AppIcon from '@/components/common/AppIcon.vue'
import HighlightedCodeBlock from '@/components/common/HighlightedCodeBlock.vue'
import HighlightedCodeEditor from '@/components/common/HighlightedCodeEditor.vue'
import type { CodeHighlightLanguage } from '@/utils/code-highlight'
import type { InputSchema, SchemaFormValues } from '@/types/schema'
import { createDefaultFormValues, validateSchemaForm } from '@/utils/schema-form'
import {
  buildInputViewSnippet,
  buildPlaygroundJsonSnippet,
  parseJsonInputDraft,
  type PlaygroundInputViewMode,
} from '@/utils/playground-request-snippets'
import { useUserStore } from '@/stores/user'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import PlaygroundInputViewSelect from './PlaygroundInputViewSelect.vue'
import PlaygroundSchemaForm from './PlaygroundSchemaForm.vue'
import ModelSelectorField, {
  type ModelSelectorOption,
} from './fields/ModelSelectorField.vue'

const BATCH_SIZE_OPTIONS = [1, 2, 3, 4] as const

const props = defineProps<{
  schema?: InputSchema
  modelId: string
  apiModelId: string
  costUsd: number
  standardCostUsd?: number
  quoteLoading?: boolean
  balanceUsd: number
  generating?: boolean
  modelOptions?: ModelSelectorOption[]
  analyticsSource?: 'model_detail' | 'ai_generator'
  analyticsCapability?: string
}>()

const batchSize = defineModel<number>('batchSize', { default: 1 })
const formValues = defineModel<SchemaFormValues>('formValues', { required: true })
const selectedModelId = defineModel<string>('selectedModelId')

const emit = defineEmits<{
  run: [values: SchemaFormValues, batchSize: number]
}>()

const { push } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const message = useAppMessage()

const inputViewMode = ref<PlaygroundInputViewMode>('form')
const jsonDraft = ref(buildPlaygroundJsonSnippet(props.modelId, formValues.value, batchSize.value))
const jsonEditorRef = ref<InstanceType<typeof HighlightedCodeEditor> | null>(null)
const jsonDraftDirty = ref(false)
const validationError = ref<string | null>(null)
const invalidFields = ref<string[]>([])
const formPanelRef = ref<HTMLElement | null>(null)
const batchOpen = ref(false)
const batchTriggerRef = ref<HTMLElement | null>(null)
const batchPanelRef = ref<HTMLElement | null>(null)
const batchPanelStyle = ref({ top: '0px', left: '0px', width: '0px' })
const batchPanelId = useId()

const isCodeViewMode = computed(() =>
  inputViewMode.value === 'http' ||
  inputViewMode.value === 'python' ||
  inputViewMode.value === 'javascript',
)

const showResetButton = computed(() => inputViewMode.value === 'form')
const showRunActions = computed(() => !isCodeViewMode.value)

const formattedPrice = computed(() => `$${props.costUsd.toFixed(2)}`)
const formattedOriginal = computed(() =>
  props.standardCostUsd != null ? `$${props.standardCostUsd.toFixed(2)}` : null,
)

const runLabel = computed(() =>
  userStore.isLoggedIn ? t('pages.modelDetail.run') : t('pages.modelDetail.startForFree'),
)

const isInsufficientBalance = computed(
  () => userStore.isLoggedIn && props.balanceUsd < props.costUsd,
)

const isRunDisabled = computed(() => props.generating || isInsufficientBalance.value)

const codeSnippet = computed(() => {
  if (inputViewMode.value === 'form' || inputViewMode.value === 'json') return ''
  return buildInputViewSnippet(
    inputViewMode.value,
    props.modelId,
    props.apiModelId,
    formValues.value,
    batchSize.value,
  )
})

const codeLanguage = computed<CodeHighlightLanguage>(() => {
  const mode = inputViewMode.value
  if (mode === 'http' || mode === 'python' || mode === 'javascript') return mode
  return 'json'
})

function applyParsedJsonDraft() {
  const parsed = parseJsonInputDraft(jsonDraft.value)
  if (!parsed) return false

  formValues.value = parsed.values
  if (parsed.batchSize != null) {
    batchSize.value = parsed.batchSize
  }
  return true
}

watch(
  () => props.schema,
  (schema) => {
    formValues.value = createDefaultFormValues(schema)
    jsonDraftDirty.value = false
    jsonDraft.value = buildPlaygroundJsonSnippet(props.modelId, formValues.value, batchSize.value)
    validationError.value = null
    invalidFields.value = []
  },
)

watch(
  formValues,
  (values) => {
    if (inputViewMode.value === 'form' && !jsonDraftDirty.value) {
      jsonDraft.value = buildPlaygroundJsonSnippet(props.modelId, values, batchSize.value)
    }

    if (invalidFields.value.length > 0) {
      const stillMissing = new Set(validateSchemaForm(props.schema, values))
      invalidFields.value = invalidFields.value.filter((key) => stillMissing.has(key))
    }
  },
  { deep: true },
)

watch(batchSize, (size) => {
  if (inputViewMode.value === 'form' && !jsonDraftDirty.value) {
    jsonDraft.value = buildPlaygroundJsonSnippet(props.modelId, formValues.value, size)
  }
})

watch(
  () => props.modelId,
  (modelId) => {
    if (!jsonDraftDirty.value) {
      jsonDraft.value = buildPlaygroundJsonSnippet(modelId, formValues.value, batchSize.value)
    }
  },
)

watch(inputViewMode, (mode, previousMode) => {
  validationError.value = null
  invalidFields.value = []

  if (mode === 'json') {
    if (previousMode === 'form' || !jsonDraftDirty.value) {
      jsonDraft.value = buildPlaygroundJsonSnippet(
        props.modelId,
        formValues.value,
        batchSize.value,
      )
      jsonDraftDirty.value = false
    }
    nextTick(() => jsonEditorRef.value?.syncHeight())
    return
  }

  if (previousMode === 'json') {
    applyParsedJsonDraft()
  }
})

function syncFormValuesFromJsonDraft() {
  if (applyParsedJsonDraft()) {
    validationError.value = null
    invalidFields.value = []
    return true
  }

  return false
}

function onJsonDraftInput() {
  jsonDraftDirty.value = true
  validationError.value = null
  applyParsedJsonDraft()
}

function resetForm() {
  formValues.value = createDefaultFormValues(props.schema)
  jsonDraftDirty.value = false
  jsonDraft.value = buildPlaygroundJsonSnippet(props.modelId, formValues.value, batchSize.value)
  validationError.value = null
  invalidFields.value = []
}

async function scrollToFirstInvalidField() {
  await nextTick()
  const el = formPanelRef.value?.querySelector('[data-invalid-field]')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function handleRun() {
  if (isRunDisabled.value) return

  if (inputViewMode.value === 'json' && !syncFormValuesFromJsonDraft()) {
    validationError.value = t('pages.modelDetail.invalidJsonInput')
    invalidFields.value = []
    return
  }

  const missing = validateSchemaForm(props.schema, formValues.value)
  if (missing.length > 0) {
    if (inputViewMode.value === 'form') {
      invalidFields.value = missing
      validationError.value = null
      scrollToFirstInvalidField()
    } else {
      invalidFields.value = []
      validationError.value = t('pages.modelDetail.requiredFieldsMissing')
    }
    return
  }
  validationError.value = null
  invalidFields.value = []

  if (!userStore.isLoggedIn) {
    push({ name: 'auth' })
    return
  }

  if (props.analyticsSource) {
    trackEvent(AnalyticsEvents.PLAYGROUND_RUN, {
      source: props.analyticsSource,
      model_id: props.modelId,
      capability: props.analyticsCapability,
      input_mode: inputViewMode.value,
      batch_size: batchSize.value,
    })
  }

  emit('run', { ...formValues.value }, batchSize.value)
}

function goTopUp() {
  push({ name: 'billing' })
}

const copyableCodeContent = computed(() =>
  inputViewMode.value === 'json' ? jsonDraft.value : codeSnippet.value,
)

async function copyCodeContent() {
  const text = copyableCodeContent.value
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    message.success(t('pages.modelDetail.codeCopied'))
    trackEvent(AnalyticsEvents.API_CODE_COPY, {
      source: 'playground',
      code_type: inputViewMode.value,
      model_id: props.modelId,
    })
  } catch {
    message.error(t('pages.modelDetail.copyFailed'))
  }
}

function updateBatchPanelPosition() {
  const el = batchTriggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  batchPanelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 72)}px`,
  }
}

function toggleBatchOpen() {
  if (props.generating) return
  batchOpen.value = !batchOpen.value
}

function selectBatchSize(size: number) {
  batchSize.value = size
  batchOpen.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (batchTriggerRef.value?.contains(target) || batchPanelRef.value?.contains(target)) return
  batchOpen.value = false
}

watch(batchOpen, (isOpen) => {
  if (!isOpen) {
    window.removeEventListener('resize', updateBatchPanelPosition)
    window.removeEventListener('scroll', updateBatchPanelPosition, true)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    return
  }

  nextTick(updateBatchPanelPosition)
  window.addEventListener('resize', updateBatchPanelPosition)
  window.addEventListener('scroll', updateBatchPanelPosition, true)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateBatchPanelPosition)
  window.removeEventListener('scroll', updateBatchPanelPosition, true)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <aside class="input-panel">
    <div class="input-panel__header">
      <h2 class="input-panel__title">{{ t('pages.modelDetail.inputTitle') }}</h2>
      <PlaygroundInputViewSelect v-model="inputViewMode" />
    </div>

    <div ref="formPanelRef" class="input-panel__form">
      <ModelSelectorField
        v-if="modelOptions?.length && selectedModelId != null"
        v-model="selectedModelId"
        :options="modelOptions"
        :disabled="generating"
      />
      <PlaygroundSchemaForm
        v-if="inputViewMode === 'form'"
        v-model="formValues"
        :schema="schema"
        :invalid-fields="invalidFields"
      />
      <div v-else class="input-panel__code-wrap">
        <HighlightedCodeEditor
          v-if="inputViewMode === 'json'"
          ref="jsonEditorRef"
          v-model="jsonDraft"
          language="json"
          :invalid="Boolean(validationError)"
          @input="onJsonDraftInput"
        />
        <HighlightedCodeBlock
          v-else
          :code="codeSnippet"
          :language="codeLanguage"
        />
        <button
          type="button"
          class="input-panel__code-copy"
          :aria-label="t('pages.modelDetail.copyCode')"
          @click="copyCodeContent"
        >
          <AppIcon name="copy" :size="16" />
        </button>
      </div>
      <p v-if="validationError" class="input-panel__validation-error">{{ validationError }}</p>
    </div>

    <div v-if="showRunActions" class="input-panel__actions">
      <button
        v-if="showResetButton"
        type="button"
        class="input-panel__reset"
        :aria-label="t('pages.modelDetail.reset')"
        @click="resetForm"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M7.4395 7.6435L3.727 11.356L7.6225 15.2515H8.5V15.25H9.379L12.2125 12.4165L7.4395 7.6435V7.6435ZM8.5 6.583L13.273 11.356L15.394 9.23425L10.621 4.46125L8.5 6.583ZM11.5 15.25H16.75V16.75H10L7.0015 16.7515L2.13625 11.8863C1.99565 11.7456 1.91666 11.5549 1.91666 11.356C1.91666 11.1571 1.99565 10.9664 2.13625 10.8258L10.09 2.8705C10.1597 2.80077 10.2424 2.74545 10.3334 2.70771C10.4245 2.66996 10.5221 2.65054 10.6206 2.65054C10.7192 2.65054 10.8168 2.66996 10.9078 2.70771C10.9989 2.74545 11.0816 2.80077 11.1512 2.8705L16.9847 8.704C17.1254 8.84465 17.2043 9.03538 17.2043 9.23425C17.2043 9.43312 17.1254 9.62385 16.9847 9.7645L11.5 15.25Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <NTooltip trigger="hover" placement="top" :disabled="!isInsufficientBalance">
        <template #trigger>
          <span class="input-panel__run-wrap-trigger">
            <div
              class="input-panel__run-wrap"
              :class="{
                'input-panel__run-wrap--cta': !userStore.isLoggedIn,
                'input-panel__run-wrap--disabled': isRunDisabled,
              }"
            >
              <button
                type="button"
                class="input-panel__run"
                :class="{ 'input-panel__run--cta': !userStore.isLoggedIn }"
                :disabled="isRunDisabled"
                @click="handleRun"
              >
                <span class="input-panel__run-label">{{ runLabel }}</span>
                <span
                  v-if="userStore.isLoggedIn"
                  class="input-panel__run-price"
                  :class="{ 'input-panel__run-price--loading': quoteLoading }"
                >
                  {{ formattedPrice }}
                  <span v-if="formattedOriginal" class="input-panel__run-original">{{ formattedOriginal }}</span>
                </span>
              </button>

              <template v-if="userStore.isLoggedIn">
                <span class="input-panel__run-divider" aria-hidden="true" />
                <button
                  ref="batchTriggerRef"
                  type="button"
                  class="input-panel__run-batch"
                  :disabled="generating"
                  :aria-expanded="batchOpen"
                  :aria-controls="batchPanelId"
                  @click.stop="toggleBatchOpen"
                >
                  <span>{{ batchSize }}x</span>
                  <svg
                    class="input-panel__run-batch-chevron"
                    :class="{ 'input-panel__run-batch-chevron--open': batchOpen }"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
                  </svg>
                </button>
              </template>
            </div>
          </span>
        </template>
        {{ t('pages.modelDetail.insufficientBalance') }}
      </NTooltip>

      <Teleport to="body">
        <div
          v-if="batchOpen"
          :id="batchPanelId"
          ref="batchPanelRef"
          class="input-panel__batch-panel"
          :style="batchPanelStyle"
          role="listbox"
        >
          <button
            v-for="size in BATCH_SIZE_OPTIONS"
            :key="size"
            type="button"
            class="input-panel__batch-option"
            :class="{ 'input-panel__batch-option--selected': size === batchSize }"
            role="option"
            :aria-selected="size === batchSize"
            @click.stop="selectBatchSize(size)"
          >
            <span>{{ size }}x</span>
            <svg
              v-if="size === batchSize"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2.5 7l3 3 6-6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </Teleport>
    </div>

    <div v-if="userStore.isLoggedIn && showRunActions" class="input-panel__balance">
      <span>{{ t('pages.modelDetail.balance') }}</span>
      <span class="input-panel__balance-value">${{ balanceUsd.toFixed(2) }}</span>
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

.input-panel__form {
  margin-bottom: 20px;
}

.input-panel__code-wrap {
  position: relative;
}

.input-panel__code-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(19, 19, 28, 0.85);
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.input-panel__code-copy:hover {
  background: rgba(19, 19, 28, 0.95);
}

.input-panel__code-copy:active {
  background: rgba(45, 45, 56, 0.95);
}

.input-panel__validation-error {
  margin: 12px 0 0;
  font-size: 12px;
  color: #f87171;
}

.input-panel__actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.input-panel__run-wrap-trigger {
  flex: 1;
  display: flex;
  min-width: 0;
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

.input-panel__run-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: stretch;
  min-width: 0;
  height: 40px;
  border-radius: 8px;
  background: #06b6d4;
  transition: background 0.15s ease;
}

.input-panel__run-wrap:not(.input-panel__run-wrap--disabled):hover {
  background: #0891b2;
}

.input-panel__run-wrap:not(.input-panel__run-wrap--disabled):active {
  background: #0e7490;
}

.input-panel__run-wrap--disabled {
  opacity: 0.6;
}

.input-panel__run-wrap--cta .input-panel__run {
  border-radius: 8px;
  justify-content: center;
}

.input-panel__run {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 100%;
  padding: 0 12px;
  border: none;
  border-radius: 8px 0 0 8px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
}

.input-panel__run:disabled {
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

.input-panel__run-price--loading {
  opacity: 0.65;
}

.input-panel__run-original {
  margin-left: 4px;
  font-size: 12px;
  text-decoration: line-through;
  opacity: 0.5;
}

.input-panel__run-divider {
  flex-shrink: 0;
  width: 1px;
  align-self: center;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
}

.input-panel__run-batch {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 100%;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: 0 8px 8px 0;
  background: transparent;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
}

.input-panel__run-batch:disabled {
  cursor: not-allowed;
}

.input-panel__run-batch-chevron {
  transition: transform 0.15s ease;
}

.input-panel__run-batch-chevron--open {
  transform: rotate(180deg);
}

.input-panel__balance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #ebf4fb;
  flex-shrink: 0;
}

.input-panel__balance-value {
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

<style>
.input-panel__batch-panel {
  position: fixed;
  z-index: 9999;
  padding: 8px;
  border: 0.5px solid #2d2d38;
  border-radius: 8px;
  background: #13131c;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.input-panel__batch-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #ebf4fb;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.input-panel__batch-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.input-panel__batch-option--selected {
  background: rgba(255, 255, 255, 0.06);
  color: #06b6d4;
}

.input-panel__batch-option--selected:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
