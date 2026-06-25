<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { NEmpty, NSpin } from 'naive-ui'
import { fetchModels, fetchModelsByIds } from '@/api/models'
import ModelCard from '@/components/models/ModelCard.vue'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import type { Model } from '@/types'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

const route = useRoute()
const { push } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()

const models = ref<Model[]>([])
const total = ref(0)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'latest' | 'favourite' | 'recent'>('latest')
const searchQuery = ref('')

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

const tabOptions = computed(() => {
  const options = [{ key: 'latest' as const, label: t('pages.models.tabs.latest') }]
  if (!userStore.isLoggedIn) return options

  return [
    ...options,
    { key: 'favourite' as const, label: t('pages.models.tabs.favourite') },
    { key: 'recent' as const, label: t('pages.models.tabs.recent') },
  ]
})

const hasMore = computed(() => activeTab.value === 'latest' && models.value.length < total.value)

const emptyDescription = computed(() => {
  if (activeTab.value === 'favourite') return t('pages.models.emptyFavourite')
  if (activeTab.value === 'recent') return t('pages.models.emptyRecent')
  return t('pages.models.empty')
})

function sortByIdOrder(items: Model[], ids: string[]) {
  const order = new Map(ids.map((id, index) => [id, index]))
  return [...items].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

async function loadSavedModels(tab: 'favourite' | 'recent') {
  loading.value = true
  loadingMore.value = false
  error.value = null
  models.value = []
  total.value = 0

  const ids = tab === 'favourite' ? modelPrefs.favouriteIds : modelPrefs.recentIds
  if (ids.length === 0) {
    loading.value = false
    return
  }

  try {
    const items = await fetchModelsByIds(ids)
    models.value = sortByIdOrder(items, ids)
    total.value = models.value.length
  } catch {
    error.value = t('pages.models.loadError')
  } finally {
    loading.value = false
  }
}

async function loadModels(append = false) {
  if (activeTab.value !== 'latest') return

  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
    models.value = []
    total.value = 0
  }
  error.value = null

  try {
    const page = await fetchModels({
      offset: append ? models.value.length : 0,
      limit: PAGE_SIZE,
      q: searchQuery.value.trim() || undefined,
    })

    models.value = append ? [...models.value, ...page.items] : page.items
    total.value = page.total
  } catch {
    error.value = t('pages.models.loadError')
    if (!append) {
      models.value = []
      total.value = 0
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function switchTab(key: 'latest' | 'favourite' | 'recent') {
  activeTab.value = key

  if (key === 'favourite' || key === 'recent') {
    loadSavedModels(key)
    return
  }

  loadModels()
}

function loadMore() {
  if (!hasMore.value || loadingMore.value || loading.value) return
  loadModels(true)
}

function goToAuth() {
  push({ name: 'auth' })
}

function goToDocs() {
  push({ name: 'docs' })
}

watch(searchQuery, () => {
  if (activeTab.value !== 'latest') return

  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    loadModels()
  }, SEARCH_DEBOUNCE_MS)
})

watch(
  () => userStore.isLoggedIn,
  (loggedIn) => {
    if (!loggedIn && activeTab.value !== 'latest') {
      activeTab.value = 'latest'
      loadModels()
    }
  },
)

watch(
  () => [modelPrefs.favouriteIds, modelPrefs.recentIds],
  () => {
    if (activeTab.value === 'favourite') {
      loadSavedModels('favourite')
    } else if (activeTab.value === 'recent') {
      loadSavedModels('recent')
    }
  },
)

onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string' && q) {
    searchQuery.value = q
  }
  loadModels()
})
</script>

<template>
  <div class="models-page">
    <section class="models-hero" aria-labelledby="models-hero-title">
      <img
        class="models-hero__bg"
        :src="assetUrl('/assets/models/hero-bg.jpg')"
        alt=""
        aria-hidden="true"
      />

      <div class="models-hero__inner">
        <div class="models-hero__content">
          <h1 id="models-hero-title" class="models-hero__title">
            {{ t('common.slogan') }}
          </h1>
          <p class="models-hero__subtitle">
            {{ t('pages.models.heroSubtitle') }}
          </p>
          <div class="models-hero__actions">
            <button type="button" class="models-hero__btn models-hero__btn--primary" @click="goToAuth">
              {{ t('pages.models.heroCtaPrimary') }}
            </button>
            <button type="button" class="models-hero__btn models-hero__btn--secondary" @click="goToDocs">
              {{ t('pages.models.heroCtaSecondary') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="models-list">
      <div class="models-list__inner">
        <div class="models-toolbar">
          <div class="models-tabs" role="tablist" :aria-label="t('pages.models.filterLabel')">
            <button
              v-for="tab in tabOptions"
              :key="tab.key"
              type="button"
              role="tab"
              class="models-tab"
              :class="{ 'is-active': activeTab === tab.key }"
              :aria-selected="activeTab === tab.key"
              @click="switchTab(tab.key)"
            >
              {{ tab.label }}
              <span v-if="activeTab === tab.key" class="models-tab__indicator" />
            </button>
          </div>

          <label v-if="activeTab === 'latest'" class="models-search">
            <img :src="assetUrl('/assets/models/search.svg')" alt="" aria-hidden="true" />
            <input
              v-model="searchQuery"
              type="search"
              :placeholder="t('pages.models.searchPlaceholder')"
            />
          </label>
        </div>

        <div v-if="loading" class="models-state">
          <NSpin size="large" />
        </div>

        <div v-else-if="error" class="models-state">
          <NEmpty :description="error">
            <template #extra>
              <button type="button" class="models-retry" @click="loadModels()">
                {{ t('pages.models.retry') }}
              </button>
            </template>
          </NEmpty>
        </div>

        <div v-else-if="models.length === 0" class="models-state">
          <NEmpty :description="emptyDescription" />
        </div>

        <div v-else class="models-grid">
          <ModelCard
            v-for="model in models"
            :key="model.id"
            :model="model"
          />
        </div>

        <div v-if="hasMore && !loading" class="models-more">
          <button
            type="button"
            class="models-more__btn"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ t('pages.models.viewMore') }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.models-page {
  background: #fff;
}

.models-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 724px;
  padding: 0 16px 49px;
  overflow: hidden;
}

.models-hero__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.models-hero__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
}

.models-hero__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  max-width: 738px;
  text-align: left;
}

.models-hero__title {
  margin: 0;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  line-height: 1.14;
  color: #fff;
}

.models-hero__subtitle {
  margin: 0;
  max-width: 738px;
  font-size: clamp(16px, 2.5vw, 20px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
}

.models-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.models-hero__btn {
  height: 40px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.models-hero__btn--primary {
  background: #06b6d4;
  color: #fff;
}

.models-hero__btn--primary:hover {
  background: #0891b2;
}

.models-hero__btn--secondary {
  background: #fff;
  color: #222;
}

.models-hero__btn--secondary:hover {
  background: #f5f5f5;
}

.models-list {
  background: #fff;
}

.models-list__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 20px 16px 64px;
}

.models-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.models-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.models-tab {
  position: relative;
  padding: 10px 0 14px;
  border: none;
  background: transparent;
  color: #9b9dab;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  cursor: pointer;
}

.models-tab.is-active {
  color: #222;
}

.models-tab__indicator {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 3px;
  border-radius: 2px;
  background: #06b6d4;
}

.models-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: min(100%, 308px);
  height: 36px;
  padding: 0 16px;
  border-radius: 30px;
  background: #f5f5f5;
}

.models-search img {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.6;
}

.models-search input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: #222;
  font-size: 14px;
  line-height: 14px;
  outline: none;
}

.models-search input::placeholder {
  color: #9b9dab;
}

.models-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 24px;
}

.models-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

.models-retry {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  cursor: pointer;
}

.models-more {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.models-more__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 36px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
}

.models-more__btn:hover:not(:disabled) {
  background: #ebebeb;
}

.models-more__btn:disabled {
  cursor: wait;
  opacity: 0.7;
}

@media (min-width: 640px) {
  .models-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .models-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .models-list__inner {
    padding-inline: 24px;
  }

  .models-hero {
    padding-inline: 24px;
  }

  .models-hero__title {
    line-height: 64px;
  }

  .models-hero__subtitle {
    line-height: 24px;
  }
}

@media (min-width: 1280px) {
  .models-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .models-hero {
    align-items: flex-end;
    min-height: 520px;
    padding: 0 16px 40px;
  }

  .models-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .models-search {
    width: 100%;
  }
}
</style>
