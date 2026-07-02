<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTimestamp } from '@/utils/time'
import type { TopUpTransactionStatus, Transaction } from '@/types'

const props = defineProps<{
  item: Transaction
}>()

const emit = defineEmits<{
  view: [item: Transaction]
}>()

const { t, locale } = useI18n()

const status = computed<TopUpTransactionStatus>(() => props.item.status ?? 'completed')

const statusLabel = computed(() => t(`pages.billing.topUpDetail.statuses.${status.value}`))

const initiatedLabel = computed(() =>
  formatTimestamp(props.item.createdAt, locale.value, 'compactDatetime'),
)

const completedLabel = computed(() => {
  if (!props.item.completedAt) return '—'
  return formatTimestamp(props.item.completedAt, locale.value, 'compactDatetime')
})

const amountLabel = computed(() => {
  const prefix = props.item.amountUsd >= 0 ? '' : '-'
  return `${prefix}$${Math.abs(props.item.amountUsd).toFixed(2)}`
})

const paymentMethodLabel = computed(() => {
  if (!props.item.paymentMethod) return '—'
  const key = `pages.billing.paymentMethods.${props.item.paymentMethod}`
  const translated = t(key)
  return translated === key ? props.item.paymentMethod : translated
})
</script>

<template>
  <div class="billing-tx-row" role="row">
    <span class="billing-tx-row__desc" role="cell">{{ item.description }}</span>
    <span class="billing-tx-row__status" role="cell">
      <span
        class="billing-tx-row__status-badge"
        :class="`billing-tx-row__status-badge--${status}`"
      >
        {{ statusLabel }}
      </span>
    </span>
    <span class="billing-tx-row__payment" role="cell">{{ paymentMethodLabel }}</span>
    <span class="billing-tx-row__time" role="cell">{{ initiatedLabel }}</span>
    <span class="billing-tx-row__time" role="cell">{{ completedLabel }}</span>
    <span class="billing-tx-row__amount" role="cell">{{ amountLabel }}</span>
    <span class="billing-tx-row__action" role="cell">
      <button type="button" class="billing-tx-row__view-btn" @click="emit('view', item)">
        {{ t('pages.billing.view') }}
      </button>
    </span>
  </div>
</template>

<style scoped>
.billing-tx-row {
  display: grid;
  grid-template-columns:
    minmax(90px, 1fr)
    minmax(88px, 0.75fr)
    minmax(88px, 0.75fr)
    minmax(110px, 0.95fr)
    minmax(110px, 0.95fr)
    minmax(72px, 0.6fr)
    72px;
  gap: 12px;
  align-items: center;
  min-height: 41px;
  padding: 0 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-primary);
}

.billing-tx-row__time,
.billing-tx-row__payment {
  color: var(--text-secondary);
  font-weight: 400;
}

.billing-tx-row__status-badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  white-space: nowrap;
}

.billing-tx-row__status-badge--completed {
  background: rgba(0, 187, 131, 0.12);
  color: #00bb83;
}

.billing-tx-row__status-badge--pending {
  background: rgba(255, 152, 0, 0.12);
  color: #ff9800;
}

.billing-tx-row__status-badge--failed,
.billing-tx-row__status-badge--expired {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}

.billing-tx-row__view-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 8px;
  border: 0;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  cursor: pointer;
}

.billing-tx-row__view-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 767px) {
  .billing-tx-row {
    padding: 12px 16px;
  }
}
</style>
