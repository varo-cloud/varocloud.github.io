<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NSpin } from 'naive-ui'
import { fetchModelDetail, fetchModels } from '@/api/models'
import { fetchModelInputSchema } from '@/api/modelSchema'
import ModelDetailHeader from '@/components/models/ModelDetailHeader.vue'
import ModelApiTab from '@/components/models/ModelApiTab.vue'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import { useUserStore } from '@/stores/user'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { assetUrl } from '@/utils/assetUrl'
import { createDefaultFormValues } from '@/utils/schema-form'
import { usePlaygroundQuote } from '@/composables/usePlaygroundQuote'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import type { GenerationStatus, Model, ModelDetail, PlaygroundGenerationResult } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { localePath, push } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()

const model = ref<ModelDetail | null>(null)
const modelOptions = ref<Model[]>([])
const inputSchema = ref<InputSchema | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'playground' | 'api'>('playground')
const outputUrls = ref<string[]>([])
const generationResults = ref<PlaygroundGenerationResult[]>([])
const batchSize = ref(1)
const formValues = ref<SchemaFormValues>({})
const generationStatus = ref<GenerationStatus>('idle')
const generationProgress = ref(0)
const estimatedSeconds = 40

const balanceUsd = computed(() => userStore.balanceUsd ?? 0)

const apiModelId = computed(() => {
  if (!model.value) return ''
  return model.value.apiModelId ?? model.value.modelPath.replace(/\//g, '-')
})

const fallbackUnitCostUsd = computed(() => {
  if (!model.value) return 0
  return model.value.perRunPriceUsd ?? model.value.startingPriceUsd ?? 0
})

const fallbackStandardUnitCostUsd = computed(() => {
  const current = model.value
  if (
    !current ||
    current.originalPriceUsd == null ||
    current.perRunPriceUsd == null ||
    !current.startingPriceUsd
  ) {
    return undefined
  }

  return (current.originalPriceUsd / current.startingPriceUsd) * current.perRunPriceUsd
})

const playgroundQuote = usePlaygroundQuote({
  modelId: computed(() => model.value?.id ?? ''),
  formValues,
  batchSize,
  fallbackUnitCostUsd,
  fallbackStandardUnitCostUsd,
  enabled: computed(
    () => userStore.isLoggedIn && Boolean(model.value?.id && inputSchema.value),
  ),
})

const quoteCostUsd = playgroundQuote.costUsd
const quoteStandardCostUsd = playgroundQuote.standardCostUsd
const quoteLoading = playgroundQuote.loading
const quoteUnitCostUsd = playgroundQuote.unitCostUsd

const isGenerating = computed(
  () => generationStatus.value === 'queued' || generationStatus.value === 'processing',
)

const displayTitle = computed(() => {
  if (!model.value) return ''
  return `${model.value.name} by ${model.value.provider}`
})

const modelSwitcherOptions = computed(() =>
  modelOptions.value.map((item) => ({
    id: item.id,
    label: item.displayName || item.name,
  })),
)

async function loadModelOptions() {
  try {
    const page = await fetchModels({ limit: 100 })
    modelOptions.value = page.items
  } catch {
    modelOptions.value = []
  }
}

function handleModelSelect(id: string) {
  if (id === model.value?.id) return
  void push({ name: 'model-detail', params: { id } })
}

let generationTimers: ReturnType<typeof setTimeout>[] = []
let progressInterval: ReturnType<typeof setInterval> | null = null

function clearGenerationTimers() {
  generationTimers.forEach(clearTimeout)
  generationTimers = []
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

function resetGeneration() {
  clearGenerationTimers()
  generationStatus.value = 'idle'
  generationProgress.value = 0
  outputUrls.value = []
  generationResults.value = []
}

function buildGenerationResult(url: string, index: number, unitCostUsd: number): PlaygroundGenerationResult {
  const currentModel = model.value
  return {
    id: `gen_${Date.now()}_${index}`,
    object: 'generation',
    status: 'completed',
    model: currentModel?.modelPath ?? '',
    created_at: Math.floor(Date.now() / 1000),
    output: {
      type: 'image',
      url,
    },
    usage: {
      cost_usd: unitCostUsd,
    },
  }
}

function simulateGeneration(count: number) {
  clearGenerationTimers()
  generationStatus.value = 'queued'
  generationProgress.value = 0
  outputUrls.value = []
  generationResults.value = []

  generationTimers.push(
    setTimeout(() => {
      generationStatus.value = 'processing'
      const durationMs = 3500
      const tickMs = 50
      const steps = durationMs / tickMs
      let step = 0

      progressInterval = setInterval(() => {
        step += 1
        generationProgress.value = Math.min(100, Math.round((step / steps) * 100))
        if (step >= steps && progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
      }, tickMs)

      generationTimers.push(
        setTimeout(() => {
          const url = assetUrl('/assets/model-detail/sample-output.jpg')
          const urls = Array.from({ length: count }, () => url)
          generationStatus.value = 'completed'
          generationProgress.value = 100
          outputUrls.value = urls
          generationResults.value = urls.map((item, index) =>
            buildGenerationResult(item, index, quoteUnitCostUsd.value),
          )

          if (model.value) {
            trackEvent(AnalyticsEvents.PLAYGROUND_RUN_SUCCESS, {
              source: 'model_detail',
              model_id: model.value.id,
              capability: model.value.capabilities[0],
              batch_size: count,
            })
          }
        }, durationMs),
      )
    }, 800),
  )
}

watch(inputSchema, (schema) => {
  formValues.value = createDefaultFormValues(schema ?? undefined)
})

async function loadModel(id: string) {
  loading.value = true
  error.value = null
  resetGeneration()
  inputSchema.value = null

  try {
    const [detail, schema] = await Promise.all([
      fetchModelDetail(id),
      fetchModelInputSchema(id).catch(() => null),
    ])
    model.value = detail
    inputSchema.value = schema
    if (userStore.isLoggedIn) {
      modelPrefs.recordVisit(detail.id)
    }
  } catch {
    error.value = t('pages.modelDetail.loadError')
    model.value = null
    inputSchema.value = null
  } finally {
    loading.value = false
  }
}

function handleRun(_values: SchemaFormValues, count: number) {
  simulateGeneration(count)
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === 'string') loadModel(id)
  },
  { immediate: true },
)

onMounted(() => {
  userStore.loadProfile()
  void loadModelOptions()
})

onUnmounted(() => {
  clearGenerationTimers()
})
</script>

<template>
  <div class="model-detail-page">
    <div v-if="loading" class="model-detail-page__state">
      <NSpin size="large" />
    </div>

    <div v-else-if="error || !model" class="model-detail-page__state">
      <p>{{ error || t('pages.modelDetail.notFound') }}</p>
      <RouterLink :to="localePath('/')" class="model-detail-page__back">
        {{ t('pages.modelDetail.backToModels') }}
      </RouterLink>
    </div>

    <template v-else>
      <div class="model-detail-page__inner">
        <ModelDetailHeader
          :title="displayTitle"
          :model-id="model.id"
          :model-path="model.modelPath"
          :description="model.description"
          :thumbnail-url="model.thumbnailUrl"
          :model-options="modelSwitcherOptions"
          @select="handleModelSelect"
        />
      </div>

      <div class="model-detail-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="model-detail-page__tab"
          :class="{ 'model-detail-page__tab--active': activeTab === 'playground' }"
          :aria-selected="activeTab === 'playground'"
          @click="activeTab = 'playground'"
        >
          {{ t('pages.modelDetail.tabs.playground') }}
        </button>
        <button
          type="button"
          role="tab"
          class="model-detail-page__tab"
          :class="{ 'model-detail-page__tab--active': activeTab === 'api' }"
          :aria-selected="activeTab === 'api'"
          @click="activeTab = 'api'"
        >
          {{ t('pages.modelDetail.tabs.api') }}
        </button>
      </div>

      <div v-if="activeTab === 'playground'" class="model-detail-page__playground">
        <PlaygroundInputPanel
          v-if="inputSchema"
          v-model:batch-size="batchSize"
          v-model:form-values="formValues"
          :schema="inputSchema"
          :model-id="model.id"
          :api-model-id="apiModelId"
          :cost-usd="quoteCostUsd"
          :standard-cost-usd="quoteStandardCostUsd"
          :quote-loading="quoteLoading"
          :balance-usd="balanceUsd"
          :generating="isGenerating"
          analytics-source="model_detail"
          :analytics-capability="model.capabilities[0]"
          @run="handleRun"
        />
        <div v-else class="model-detail-page__schema-empty">
          {{ t('pages.modelDetail.schemaUnavailable') }}
        </div>
        <PlaygroundOutputPanel
          :output-urls="outputUrls"
          :results="generationResults"
          :status="generationStatus"
          :progress="generationProgress"
          :estimated-seconds="estimatedSeconds"
          :example-url="inputSchema?.example_url"
        />
      </div>

      <ModelApiTab
        v-else-if="inputSchema"
        :schema="inputSchema"
        :api-model-id="apiModelId"
        :model-name="model.name"
        :form-values="formValues"
        :readme-md="model.readmeMd"
        :faq="model.faq"
      />

      <div v-else class="model-detail-page__api">
        <p class="model-detail-page__api-placeholder">
          {{ t('pages.modelDetail.schemaUnavailable') }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.model-detail-page {
  background: #0a0a0e;
  color: #ebf4fb;
  min-height: calc(100vh - 60px);
  padding: 101px 24px 48px;
}

.model-detail-page__inner {
  max-width: 1360px;
  margin: 0 auto 0;
}

.model-detail-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  color: #9b9dab;
}

.model-detail-page__back {
  color: #06b6d4;
  text-decoration: none;
}

.model-detail-page__tabs {
  display: flex;
  gap: 24px;
  margin: 24px auto 16px;
  max-width: 1360px;
}

.model-detail-page__tab {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #9b9dab;
  cursor: pointer;
}

.model-detail-page__tab--active {
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  font-weight: 500;
}

.model-detail-page__playground {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 16px;
  max-width: 1360px;
  margin: 0 auto;
  align-items: start;
}

.model-detail-page__schema-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  color: #9b9dab;
  font-size: 14px;
}

.model-detail-page__api {
  max-width: 1360px;
  margin: 0 auto;
}

.model-detail-page__api-placeholder {
  margin: 0;
  padding: 48px 24px;
  text-align: center;
  color: #9b9dab;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

@media (max-width: 1023px) {
  .model-detail-page {
    padding: 88px 16px 32px;
  }

  .model-detail-page__playground {
    grid-template-columns: 1fr;
  }
}
</style>
