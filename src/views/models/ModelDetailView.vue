<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NSpin } from 'naive-ui'
import { fetchModelDetail } from '@/api/models'
import ModelDetailHeader from '@/components/models/ModelDetailHeader.vue'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import { useUserStore } from '@/stores/user'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { assetUrl } from '@/utils/assetUrl'
import type { GenerationStatus, ModelDetail, PlaygroundGenerationResult } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { localePath } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()

const model = ref<ModelDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'playground' | 'api'>('playground')
const outputUrls = ref<string[]>([])
const generationResults = ref<PlaygroundGenerationResult[]>([])
const batchSize = ref(1)
const generationStatus = ref<GenerationStatus>('idle')
const generationProgress = ref(0)
const estimatedSeconds = 40

const balanceUsd = computed(() => userStore.balanceUsd ?? 0)

const isGenerating = computed(
  () => generationStatus.value === 'queued' || generationStatus.value === 'processing',
)

const displayTitle = computed(() => {
  if (!model.value) return ''
  return `${model.value.name} by ${model.value.provider}`
})

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

function buildGenerationResult(url: string, index: number): PlaygroundGenerationResult {
  const currentModel = model.value
  const unitPrice = currentModel?.perRunPriceUsd ?? currentModel?.startingPriceUsd ?? 0
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
      cost_usd: unitPrice,
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
          generationResults.value = urls.map((item, index) => buildGenerationResult(item, index))
        }, durationMs),
      )
    }, 800),
  )
}

async function loadModel(id: string) {
  loading.value = true
  error.value = null
  resetGeneration()

  try {
    model.value = await fetchModelDetail(id)
    if (model.value && userStore.isLoggedIn) {
      modelPrefs.recordVisit(model.value.id)
    }
  } catch {
    error.value = t('pages.modelDetail.loadError')
    model.value = null
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
          :model-path="model.modelPath"
          :description="model.description"
          :thumbnail-url="model.thumbnailUrl"
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
          v-if="model.inputSchema"
          v-model:batch-size="batchSize"
          :schema="model.inputSchema"
          :price-usd="model.startingPriceUsd"
          :original-price-usd="model.originalPriceUsd"
          :balance-usd="balanceUsd"
          :generating="isGenerating"
          @run="handleRun"
        />
        <PlaygroundOutputPanel
          :output-urls="outputUrls"
          :results="generationResults"
          :status="generationStatus"
          :progress="generationProgress"
          :estimated-seconds="estimatedSeconds"
          :per-run-price-usd="model.perRunPriceUsd ?? model.startingPriceUsd"
          :runs-per-ten-usd="model.runsPerTenUsd"
        />
      </div>

      <div v-else class="model-detail-page__api">
        <p class="model-detail-page__api-placeholder">
          {{ t('pages.modelDetail.apiPlaceholder') }}
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

.model-detail-page__api {
  max-width: 1360px;
  margin: 0 auto;
  padding: 48px 24px;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.model-detail-page__api-placeholder {
  margin: 0;
  text-align: center;
  color: #9b9dab;
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
