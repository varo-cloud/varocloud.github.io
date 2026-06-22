<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin } from 'naive-ui'
import { fetchModelDetail } from '@/api/models'
import ModelDetailHeader from '@/components/models/ModelDetailHeader.vue'
import PlaygroundInputPanel from '@/components/playground/PlaygroundInputPanel.vue'
import PlaygroundOutputPanel from '@/components/playground/PlaygroundOutputPanel.vue'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import type { ModelDetail } from '@/types'
import type { SchemaFormValues } from '@/types/schema'

const route = useRoute()
const { t } = useI18n()
const userStore = useUserStore()

const model = ref<ModelDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const activeTab = ref<'playground' | 'api'>('playground')
const outputUrl = ref<string | null>(assetUrl('/assets/model-detail/sample-output.jpg'))

const creditsUsd = computed(() => userStore.balanceUsd ?? 1.0)

const displayTitle = computed(() => {
  if (!model.value) return ''
  return `${model.value.name} by ${model.value.provider}`
})

async function loadModel(id: string) {
  loading.value = true
  error.value = null

  try {
    model.value = await fetchModelDetail(id)
  } catch {
    error.value = t('pages.modelDetail.loadError')
    model.value = null
  } finally {
    loading.value = false
  }
}

function handleRun(_values: SchemaFormValues) {
  outputUrl.value = assetUrl('/assets/model-detail/sample-output.jpg')
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
</script>

<template>
  <div class="model-detail-page">
    <div v-if="loading" class="model-detail-page__state">
      <NSpin size="large" />
    </div>

    <div v-else-if="error || !model" class="model-detail-page__state">
      <p>{{ error || t('pages.modelDetail.notFound') }}</p>
      <RouterLink to="/" class="model-detail-page__back">
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
          :schema="model.inputSchema"
          :price-usd="model.startingPriceUsd"
          :original-price-usd="model.originalPriceUsd"
          :credits-usd="creditsUsd"
          @run="handleRun"
        />
        <PlaygroundOutputPanel
          :output-url="outputUrl"
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
