<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'
import type { Model } from '@/types'

const props = defineProps<{
  model: Model
}>()

const router = useRouter()
const { t } = useI18n()
const isFavourite = ref(false)

const displayName = computed(() => props.model.displayName ?? props.model.name)

const thumbnailSrc = computed(() =>
  assetUrl(props.model.thumbnailUrl ?? '/assets/models/card-thumb.jpg'),
)

const capabilityBadge = computed(() => {
  const cap = props.model.capabilities[0]
  if (!cap) return ''
  const key = `pages.models.capabilityBadge.${cap}`
  const translated = t(key)
  return translated === key ? cap : translated
})

const originalPriceLabel = computed(() => {
  if (props.model.originalPriceUsd == null) return null
  return `$${props.model.originalPriceUsd.toFixed(3)}/Pic`
})

function goToDetail() {
  router.push({ name: 'model-detail', params: { id: props.model.id } })
}

function toggleFavourite(event: Event) {
  event.stopPropagation()
  isFavourite.value = !isFavourite.value
}
</script>

<template>
  <article class="model-card" @click="goToDetail">
    <div class="model-card__media">
      <img
        class="model-card__thumb"
        :src="thumbnailSrc"
        :alt="displayName"
        loading="lazy"
      />

      <button
        type="button"
        class="model-card__fav"
        :class="{ 'is-active': isFavourite }"
        :aria-label="t('pages.models.favourite')"
        @click="toggleFavourite"
      >
        <img :src="assetUrl('/assets/models/heart.svg')" alt="" aria-hidden="true" />
      </button>

      <div v-if="capabilityBadge" class="model-card__badge">
        <span>{{ capabilityBadge }}</span>
      </div>
    </div>

    <div class="model-card__body">
      <div class="model-card__title-row">
        <h3 class="model-card__title">{{ displayName }}</h3>
        <img
          class="model-card__chart"
          :src="assetUrl('/assets/models/chart-dot.svg')"
          alt=""
          aria-hidden="true"
        />
      </div>

      <p class="model-card__desc">{{ model.description }}</p>
    </div>

    <div class="model-card__footer">
      <div class="model-card__pricing">
        <p v-if="originalPriceLabel" class="model-card__from">
          {{ t('pages.models.from') }}
          <span class="model-card__strike">{{ originalPriceLabel }}</span>
        </p>
        <p class="model-card__price">
          <strong>${{ model.startingPriceUsd.toFixed(2) }}</strong>
          <template v-if="model.priceDetail"> / {{ model.priceDetail }}</template>
        </p>
        <span
          v-if="model.discountPercent"
          class="model-card__discount"
        >
          -{{ model.discountPercent }}%
        </span>
      </div>

      <button type="button" class="model-card__cta" @click.stop="goToDetail">
        {{ t('pages.models.tryModel') }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.model-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.model-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.model-card__media {
  position: relative;
  aspect-ratio: 322 / 168;
  overflow: hidden;
}

.model-card__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-card__fav {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.model-card__fav img {
  width: 20px;
  height: 20px;
}

.model-card__fav.is-active {
  background: rgba(0, 0, 0, 0.55);
}

.model-card__badge {
  position: absolute;
  left: 16px;
  bottom: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 12px;
  line-height: 12px;
  white-space: nowrap;
}

.model-card__body {
  padding: 12px 16px 0;
}

.model-card__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.model-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  color: #222;
}

.model-card__chart {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.model-card__desc {
  margin: 8px 0 0;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 12px;
  line-height: 16px;
  color: #9b9dab;
}

.model-card__footer {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding: 12px 16px 16px;
}

.model-card__footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: #eee;
}

.model-card__pricing {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.model-card__from {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: #9b9dab;
}

.model-card__strike {
  text-decoration: line-through;
}

.model-card__price {
  margin: 0;
  font-size: 12px;
  line-height: 16px;
  color: #9b9dab;
}

.model-card__price :deep(strong) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.model-card__discount {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 8px;
  border-radius: 30px;
  background: #00bb83;
  color: #fff;
  font-size: 12px;
  line-height: 12px;
}

.model-card__cta {
  flex-shrink: 0;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #222;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.model-card__cta:hover {
  background: #333;
}
</style>
