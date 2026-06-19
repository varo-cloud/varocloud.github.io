<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PricingItem } from '@/types'

const props = defineProps<{
  item: PricingItem
}>()

const emit = defineEmits<{
  view: [id: string]
}>()

const { t } = useI18n()

function formatPrice(value: number) {
  const fixed = value.toFixed(3)
  return `$${fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')}`
}

function handleView() {
  emit('view', props.item.modelId ?? props.item.id)
}
</script>

<template>
  <div class="pricing-row">
    <div class="pricing-row__cell pricing-row__cell--model">
      {{ item.name }}
    </div>
    <div class="pricing-row__cell pricing-row__cell--standard">
      {{ formatPrice(item.standardPriceUsd) }}
    </div>
    <div class="pricing-row__cell pricing-row__cell--price">
      <span class="pricing-row__price-label">{{ t('pages.pricing.startFrom') }}</span>
      <span class="pricing-row__price-value">
        <strong>{{ formatPrice(item.startingPriceUsd) }}</strong>{{ item.priceUnit }}
      </span>
    </div>
    <div class="pricing-row__cell pricing-row__cell--discount">
      <span
        v-if="item.discountPercent"
        class="pricing-row__badge"
      >
        -{{ item.discountPercent }}%
      </span>
      <span v-else class="pricing-row__no-discount">--</span>
    </div>
    <div class="pricing-row__cell pricing-row__cell--action">
      <button type="button" class="pricing-row__view-btn" @click="handleView">
        {{ t('pages.pricing.view') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.pricing-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1.1fr) minmax(0, 0.7fr) 71px;
  align-items: center;
  min-height: 80px;
  padding: 0 24px;
  border-bottom: 1px solid #eee;
}

.pricing-row__cell {
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #222;
}

.pricing-row__cell--model {
  padding-right: 16px;
  word-break: break-word;
}

.pricing-row__cell--standard {
  white-space: nowrap;
}

.pricing-row__cell--price {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pricing-row__price-label {
  font-size: 14px;
  line-height: 20px;
  color: #9b9dab;
}

.pricing-row__price-value {
  font-size: 14px;
  line-height: 20px;
  color: #9b9dab;
}

.pricing-row__price-value :deep(strong) {
  font-weight: 500;
  color: #06b6d4;
}

.pricing-row__cell--discount {
  display: flex;
  align-items: center;
}

.pricing-row__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 30px;
  background: #ff9800;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  line-height: 14px;
  white-space: nowrap;
}

.pricing-row__no-discount {
  font-size: 16px;
  font-weight: 500;
  color: #222;
}

.pricing-row__cell--action {
  display: flex;
  justify-content: flex-end;
}

.pricing-row__view-btn {
  height: 36px;
  min-width: 71px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #f6f6f6;
  color: #06b6d4;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.pricing-row__view-btn:hover {
  background: #efefef;
}

@media (max-width: 1023px) {
  .pricing-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 16px 24px;
  }

  .pricing-row__cell--action {
    justify-content: flex-start;
  }
}
</style>
