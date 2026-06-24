<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CreditPackage } from '@/types'

const props = defineProps<{
  sessionId: string
  pkg: CreditPackage | null
  paying: boolean
}>()

const emit = defineEmits<{
  pay: []
  cancel: []
}>()

const { t } = useI18n()

const amountLabel = computed(() => {
  if (!props.pkg) return '—'
  return `$${props.pkg.priceUsd.toFixed(2)}`
})
</script>

<template>
  <Teleport to="body">
    <div class="stripe-mock-backdrop">
      <div class="stripe-mock" role="dialog" aria-modal="true" :aria-label="t('pages.billing.stripeMock.title')">
        <p class="stripe-mock__badge">{{ t('pages.billing.stripeMock.badge') }}</p>
        <h3 class="stripe-mock__title">{{ t('pages.billing.stripeMock.title') }}</h3>
        <p class="stripe-mock__desc">{{ t('pages.billing.stripeMock.description') }}</p>

        <div v-if="pkg" class="stripe-mock__summary">
          <div class="stripe-mock__row">
            <span>{{ t('pages.billing.stripeMock.package') }}</span>
            <strong>{{ t(`pages.billing.topUpDetail.packages.${pkg.id}`) }}</strong>
          </div>
          <div class="stripe-mock__row">
            <span>{{ t('pages.billing.stripeMock.amount') }}</span>
            <strong>{{ amountLabel }}</strong>
          </div>
        </div>

        <p class="stripe-mock__hint">{{ t('pages.billing.stripeMock.testCard') }}</p>

        <div class="stripe-mock__actions">
          <button type="button" class="stripe-mock__cancel" :disabled="paying" @click="emit('cancel')">
            {{ t('pages.billing.stripeMock.cancel') }}
          </button>
          <button type="button" class="stripe-mock__pay" :disabled="paying || !pkg" @click="emit('pay')">
            {{ paying ? t('pages.billing.stripeMock.paying') : t('pages.billing.stripeMock.pay') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.stripe-mock-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.72);
}

.stripe-mock {
  width: min(100%, 420px);
  padding: 24px;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: #13131c;
}

.stripe-mock__badge {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ff9800;
}

.stripe-mock__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
}

.stripe-mock__desc {
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.stripe-mock__summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}

.stripe-mock__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stripe-mock__row strong {
  color: var(--text-primary);
  font-weight: 500;
}

.stripe-mock__hint {
  margin: 0 0 20px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
}

.stripe-mock__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.stripe-mock__cancel,
.stripe-mock__pay {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.stripe-mock__cancel {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--text-primary);
}

.stripe-mock__pay {
  border: 0;
  background: var(--text-accent);
  color: #ebf4fb;
  font-weight: 500;
}

.stripe-mock__pay:hover:not(:disabled) {
  opacity: 0.9;
}

.stripe-mock__pay:disabled,
.stripe-mock__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
