<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NEmpty, NSpin } from 'naive-ui'
import { fetchPricing } from '@/api/pricing'
import PricingTableRow from '@/components/pricing/PricingTableRow.vue'
import { assetUrl } from '@/utils/assetUrl'
import type { PricingCategory, PricingItem, PricingMediaType } from '@/types'

const router = useRouter()
const { t } = useI18n()

const items = ref<PricingItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const activeCategory = ref<PricingCategory>('image-video')
const activeMediaType = ref<PricingMediaType>('video')

const categoryTabs = computed(() => [
  { key: 'image-video' as const, label: t('pages.pricing.categories.imageVideo') },
  { key: 'language' as const, label: t('pages.pricing.categories.language') },
  { key: 'serverless' as const, label: t('pages.pricing.categories.serverless') },
])

const mediaTypeOptions = computed(() => [
  { key: 'video' as const, label: t('pages.pricing.mediaTypes.video') },
  { key: 'image' as const, label: t('pages.pricing.mediaTypes.image') },
  { key: 'llm' as const, label: t('pages.pricing.mediaTypes.llm') },
])

const showMediaToggle = computed(() => activeCategory.value === 'image-video')

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    if (item.category !== activeCategory.value) return false
    if (activeCategory.value === 'image-video') {
      return item.mediaType === activeMediaType.value
    }
    return true
  })
})

async function loadPricing() {
  loading.value = true
  error.value = null

  try {
    items.value = await fetchPricing()
  } catch {
    error.value = t('pages.pricing.loadError')
  } finally {
    loading.value = false
  }
}

function switchCategory(key: PricingCategory) {
  activeCategory.value = key
  if (key === 'language') {
    activeMediaType.value = 'llm'
  } else if (key === 'image-video') {
    activeMediaType.value = 'video'
  }
}

function switchMediaType(key: PricingMediaType) {
  activeMediaType.value = key
}

function goToModel(id: string) {
  router.push({ name: 'model-detail', params: { id } })
}

onMounted(() => {
  loadPricing()
})
</script>

<template>
  <div class="pricing-page">
    <section class="pricing-hero" aria-labelledby="pricing-hero-title">
      <img
        class="pricing-hero__bg"
        :src="assetUrl('/assets/pricing/hero-bg.jpg')"
        alt=""
        aria-hidden="true"
      />
      <div class="pricing-hero__overlay" aria-hidden="true" />

      <div class="pricing-hero__content">
        <h1 id="pricing-hero-title" class="pricing-hero__title">
          {{ t('pages.pricing.heroTitle') }}
        </h1>
        <p class="pricing-hero__subtitle">
          {{ t('pages.pricing.heroSubtitle') }}
        </p>
      </div>
    </section>

    <section class="pricing-content">
      <div class="pricing-content__inner">
        <div class="pricing-toolbar">
          <div class="pricing-tabs" role="tablist" :aria-label="t('pages.pricing.categoryLabel')">
            <button
              v-for="tab in categoryTabs"
              :key="tab.key"
              type="button"
              role="tab"
              class="pricing-tab"
              :class="{ 'is-active': activeCategory === tab.key }"
              :aria-selected="activeCategory === tab.key"
              @click="switchCategory(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div
            v-if="showMediaToggle"
            class="pricing-media-toggle"
            role="group"
            :aria-label="t('pages.pricing.mediaTypeLabel')"
          >
            <button
              v-for="option in mediaTypeOptions"
              :key="option.key"
              type="button"
              class="pricing-media-toggle__btn"
              :class="{ 'is-active': activeMediaType === option.key }"
              @click="switchMediaType(option.key)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="pricing-table">
          <div class="pricing-table__header">
            <span>{{ t('pages.pricing.columns.model') }}</span>
            <span>{{ t('pages.pricing.columns.standardPrice') }}</span>
            <span>{{ t('pages.pricing.columns.price') }}</span>
            <span>{{ t('pages.pricing.columns.discount') }}</span>
            <span class="pricing-table__header-action" aria-hidden="true" />
          </div>

          <div v-if="loading" class="pricing-state">
            <NSpin size="large" />
          </div>

          <div v-else-if="error" class="pricing-state">
            <NEmpty :description="error">
              <template #extra>
                <button type="button" class="pricing-retry" @click="loadPricing">
                  {{ t('pages.pricing.retry') }}
                </button>
              </template>
            </NEmpty>
          </div>

          <div v-else-if="filteredItems.length === 0" class="pricing-state">
            <NEmpty :description="t('pages.pricing.empty')" />
          </div>

          <div v-else class="pricing-table__body">
            <PricingTableRow
              v-for="item in filteredItems"
              :key="item.id"
              :item="item"
              @view="goToModel"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pricing-page {
  background: #fff;
}

.pricing-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  overflow: hidden;
}

.pricing-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.pricing-hero__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

.pricing-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  max-width: 738px;
  padding: 120px 24px 64px;
  text-align: center;
}

.pricing-hero__title {
  margin: 0;
  font-size: clamp(32px, 4.5vw, 50px);
  font-weight: 800;
  line-height: 1.16;
  color: #fff;
}

.pricing-hero__subtitle {
  margin: 0;
  max-width: 640px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.pricing-content {
  background: #fff;
}

.pricing-content__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 16px 64px;
}

.pricing-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.pricing-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.pricing-tab {
  padding: 0;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}

.pricing-tab.is-active {
  color: #222;
}

.pricing-media-toggle {
  display: inline-flex;
  align-items: stretch;
  height: 36px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.pricing-media-toggle__btn {
  min-width: 80px;
  padding: 0 16px;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
}

.pricing-media-toggle__btn.is-active {
  background: #06b6d4;
  color: #fff;
}

.pricing-table {
  border: 1px solid #d7d7d7;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  background: #fff;
}

.pricing-table__header {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.7fr) 71px;
  align-items: center;
  min-height: 50px;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
  background: #fff;
  color: #9b9dab;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
}

.pricing-table__header-action {
  visibility: hidden;
}

.pricing-table__body {
  background: #fff;
}

.pricing-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.pricing-retry {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  cursor: pointer;
}

@media (min-width: 1024px) {
  .pricing-content__inner {
    padding-inline: 24px;
  }
}

@media (max-width: 1023px) {
  .pricing-table__header {
    display: none;
  }

  .pricing-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .pricing-media-toggle {
    align-self: flex-start;
  }
}

@media (max-width: 767px) {
  .pricing-hero {
    min-height: 360px;
  }

  .pricing-hero__content {
    gap: 20px;
    padding-top: 96px;
    padding-bottom: 48px;
  }

  .pricing-media-toggle__btn {
    min-width: 72px;
    padding-inline: 12px;
  }
}
</style>
