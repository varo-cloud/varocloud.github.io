<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useModelPreferencesStore } from '@/stores/modelPreferences'
import { useUserStore } from '@/stores/user'
import { assetUrl } from '@/utils/assetUrl'
import { formatPricingUsd, pricingUnitI18nKey } from '@/utils/pricing'
import type { Model } from '@/types'

const props = defineProps<{
  model: Model
}>()

const { push } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()
const modelPrefs = useModelPreferencesStore()

const isFavourite = computed(() => modelPrefs.isFavourite(props.model.id))

const displayName = computed(() => props.model.displayName ?? props.model.name)

const thumbnailSrc = computed(() =>
  assetUrl(props.model.thumbnailUrl ?? '/assets/models/card-thumb.jpg'),
)

const iconSrc = computed(() =>
  assetUrl(props.model.iconUrl ?? '/assets/models/seedance.svg'),
)

const capabilityBadge = computed(() => {
  const cap = props.model.capabilities[0]
  if (!cap) return ''
  const key = `pages.models.capabilityBadge.${cap}`
  const translated = t(key)
  return translated === key ? cap : translated
})

const unitLabel = computed(() => t(pricingUnitI18nKey(props.model.priceUnit)))

const startingPriceLabel = computed(() =>
  formatPricingUsd(props.model.startingPriceUsd, props.model.priceUnit),
)

const originalPriceLabel = computed(() => {
  if (props.model.originalPriceUsd == null) return null
  return formatPricingUsd(props.model.originalPriceUsd, props.model.priceUnit)
})

function goToDetail() {
  if (userStore.isLoggedIn) {
    modelPrefs.recordVisit(props.model.id)
  }
  push({ name: 'model-detail', params: { id: props.model.id } })
}

async function toggleFavourite(event: Event) {
  event.stopPropagation()
  if (!userStore.isLoggedIn) {
    push({ name: 'auth' })
    return
  }
  try {
    await modelPrefs.toggleFavourite(props.model.id)
  } catch {
    // keep optimistic UI rolled back in store
  }
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
        :aria-pressed="isFavourite"
        @click="toggleFavourite"
      >
        <svg
          class="model-card__heart"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            v-if="isFavourite"
            d="M10 17.1138L16.359 10.7448C17.937 8.97775 17.8787 6.26875 16.1822 4.56775C14.485 2.8675 11.7625 2.815 10 4.39675C8.23375 2.81275 5.5165 2.86975 3.81775 4.56775C2.122 6.26425 2.06275 8.97775 3.64075 10.7448L10 17.1138Z"
            fill="currentColor"
          />
          <path
            v-else
            d="M10.0007 4.39675C11.7625 2.815 14.485 2.8675 16.1822 4.56775C17.8787 6.26875 17.9372 8.97775 16.3592 10.7448L9.99925 17.1138L3.64075 10.7448C2.06275 8.97775 2.122 6.26425 3.81775 4.56775C5.5165 2.86975 8.23375 2.81275 10.0007 4.39675V4.39675ZM15.1202 5.6275C13.9952 4.501 12.1802 4.45525 11.0027 5.51275L10.0015 6.41125L8.9995 5.5135C7.81825 4.4545 6.007 4.501 4.879 5.629C3.7615 6.7465 3.70525 8.53525 4.735 9.71725L10 14.9905L15.265 9.718C16.2955 8.53525 16.2392 6.74875 15.1202 5.6275V5.6275Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <div v-if="capabilityBadge" class="model-card__badge">
        <span>{{ capabilityBadge }}</span>
      </div>
    </div>

    <div class="model-card__body">
      <div class="model-card__title-row">
        <h3 class="model-card__title">{{ displayName }}</h3>
        <img
          class="model-card__icon"
          :src="iconSrc"
          alt=""
          aria-hidden="true"
        />
      </div>

      <p class="model-card__desc">{{ model.description }}</p>
    </div>

    <div class="model-card__footer">
      <div class="model-card__pricing">
        <p class="model-card__from">
          <template v-if="originalPriceLabel">
            {{ t('pages.models.from') }}
            <span class="model-card__strike">{{ originalPriceLabel }}<span class="model-card__unit">{{ unitLabel }}</span></span>
          </template>
        </p>
        <p class="model-card__price">
          <strong>{{ startingPriceLabel }}</strong><span class="model-card__unit">{{ unitLabel }}</span>
          <template v-if="model.priceDetail">
            <span class="model-card__detail"> · {{ model.priceDetail }}</span>
          </template>
          <span
            v-if="model.discountPercent"
            class="model-card__discount"
          >
            -{{ model.discountPercent }}%
          </span>
        </p>
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
  height: 100%;
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

.model-card__heart {
  display: block;
  color: #fff;
}

.model-card__fav.is-active {
  background: rgba(0, 0, 0, 0.55);
}

.model-card__fav.is-active .model-card__heart {
  color: #ef4444;
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
  flex: 1;
  padding: 12px 16px 16px;
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

.model-card__icon {
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
  min-height: 48px;
  font-size: 12px;
  line-height: 16px;
  color: #9b9dab;
}

.model-card__footer {
  position: relative;
  display: flex;
  align-items: center;
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
  min-height: 16px;
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
  line-height: 20px;
  color: #9b9dab;
}

.model-card__price :deep(strong) {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.model-card__unit {
  margin-left: 1px;
  color: #9b9dab;
  font-weight: 400;
}

.model-card__detail {
  color: #9b9dab;
}

.model-card__discount {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 6px;
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
