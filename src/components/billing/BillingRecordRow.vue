<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTimestamp } from '@/utils/time'
import type { BillingRecord } from '@/types'

const props = defineProps<{
  item: BillingRecord
}>()

const { t, locale } = useI18n()

const timeLabel = computed(() =>
  formatTimestamp(props.item.createdAt, locale.value, 'compactDatetime'),
)

const styleLabel = computed(() => t(`pages.billing.styles.${props.item.style}`))

const isPositive = computed(() => props.item.amountUsd > 0)

const valueLabel = computed(() => {
  const prefix = isPositive.value ? '+' : '-'
  return `${prefix}$${Math.abs(props.item.amountUsd).toFixed(2)}`
})

const apiKeyLabel = computed(() => props.item.apiKey || '—')
</script>

<template>
  <div class="billing-record-row" role="row">
    <span class="billing-record-row__time" role="cell">{{ timeLabel }}</span>
    <span class="billing-record-row__style" role="cell">
      <span
        class="billing-record-row__badge"
        :class="`billing-record-row__badge--${item.style}`"
      >
        {{ styleLabel }}
      </span>
    </span>
    <span class="billing-record-row__key" role="cell">{{ item.key }}</span>
    <span
      class="billing-record-row__api-key"
      :class="{ 'billing-record-row__api-key--empty': !item.apiKey }"
      role="cell"
    >
      {{ apiKeyLabel }}
    </span>
    <span
      class="billing-record-row__value"
      :class="{ 'billing-record-row__value--positive': isPositive }"
      role="cell"
    >
      {{ valueLabel }}
    </span>
  </div>
</template>

<style scoped>
.billing-record-row {
  display: grid;
  grid-template-columns:
    minmax(110px, 0.9fr)
    minmax(72px, 0.55fr)
    minmax(140px, 1.5fr)
    minmax(120px, 1fr)
    minmax(80px, 0.65fr);
  gap: 12px;
  align-items: center;
  min-height: 41px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}

.billing-record-row__time {
  color: var(--text-secondary);
}

.billing-record-row__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
}

.billing-record-row__badge--api {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
}

.billing-record-row__badge--web {
  background: rgba(6, 182, 212, 0.08);
  color: #06b6d4;
}

.billing-record-row__badge--topup,
.billing-record-row__badge--bonus {
  background: rgba(0, 216, 141, 0.06);
  color: #00bb83;
}

.billing-record-row__key {
  color: var(--text-primary);
}

.billing-record-row__api-key {
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.billing-record-row__api-key--empty {
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 14px;
}

.billing-record-row__value {
  text-align: right;
  color: var(--text-primary);
}

.billing-record-row__value--positive {
  color: #00bb83;
}

@media (max-width: 767px) {
  .billing-record-row {
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px;
  }

  .billing-record-row__key,
  .billing-record-row__api-key {
    grid-column: 1 / -1;
  }

  .billing-record-row__value {
    justify-self: end;
  }
}
</style>
