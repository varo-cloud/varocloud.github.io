<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTimestamp } from '@/utils/time'
import type { Transaction } from '@/types'

const props = defineProps<{
  item: Transaction
}>()

const { t, locale } = useI18n()

const dateLabel = computed(() =>
  formatTimestamp(props.item.createdAt, locale.value, 'compactDatetime'),
)

const amountLabel = computed(() => {
  const prefix = props.item.amountUsd >= 0 ? '' : '-'
  return `${prefix}$${Math.abs(props.item.amountUsd).toFixed(2)}`
})
</script>

<template>
  <div class="billing-tx-row" role="row">
    <span class="billing-tx-row__desc" role="cell">{{ item.description }}</span>
    <span class="billing-tx-row__date" role="cell">{{ dateLabel }}</span>
    <span class="billing-tx-row__amount" role="cell">{{ amountLabel }}</span>
    <span class="billing-tx-row__action" role="cell">
      <button type="button" class="billing-tx-row__view-btn">
        {{ t('pages.billing.view') }}
      </button>
    </span>
  </div>
</template>

<style scoped>
.billing-tx-row {
  display: grid;
  grid-template-columns: minmax(100px, 1.4fr) minmax(100px, 1fr) minmax(80px, 0.8fr) 72px;
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
    grid-template-columns: 1fr 1fr;
    padding: 12px 16px;
  }

  .billing-tx-row__action {
    grid-column: 2;
    justify-self: end;
  }
}
</style>
