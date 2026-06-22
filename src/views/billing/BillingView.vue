<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSpin, useMessage } from 'naive-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import NumberStepperInput from '@/components/common/NumberStepperInput.vue'
import BillingTransactionRow from '@/components/billing/BillingTransactionRow.vue'
import BillingRecordRow from '@/components/billing/BillingRecordRow.vue'
import {
  createTopUp,
  fetchBillingRecords,
  fetchBillingSummary,
  fetchTopUpPresets,
  fetchTransactions,
  updateAutoTopUp,
} from '@/api/billing'
import { useUserStore } from '@/stores/user'
import { downloadCsv } from '@/utils/csv'
import { assetUrl } from '@/utils/assetUrl'
import { formatTimestamp } from '@/utils/time'
import type { BillingRecord, BillingSummary, PaymentMethodId, TopUpPreset, Transaction } from '@/types'

type AmountSelection = number | 'custom'
type HistoryTab = 'topup' | 'billing'

const PAYMENT_METHODS: Array<{ id: PaymentMethodId; logo: string; alt: string }> = [
  { id: 'stripe', logo: assetUrl('/assets/billing/stripe.svg'), alt: 'Stripe' },
  { id: 'paypal', logo: assetUrl('/assets/billing/paypal.svg'), alt: 'PayPal' },
  { id: 'npay', logo: assetUrl('/assets/billing/npay.svg'), alt: 'N pay' },
  { id: 'alipay', logo: assetUrl('/assets/billing/alipay-wechat.svg'), alt: 'Alipay / WeChat Pay' },
]

const { t, locale } = useI18n()
const message = useMessage()
const userStore = useUserStore()

const loading = ref(true)
const error = ref<string | null>(null)
const summary = ref<BillingSummary | null>(null)
const presets = ref<TopUpPreset[]>([])
const transactions = ref<Transaction[]>([])
const billingRecords = ref<BillingRecord[]>([])

const selectedAmount = ref<AmountSelection>(5)
const customAmount = ref('')
const selectedPayment = ref<PaymentMethodId>('stripe')
const purchasing = ref(false)

const autoTopUpEnabled = ref(false)
const autoTopUpThresholdNumber = ref(5)
const autoTopUpAmountNumber = ref(20)
const savingAutoTopUp = ref(false)

const activeTab = ref<HistoryTab>('topup')
const rechargeSectionRef = ref<HTMLElement | null>(null)

const purchaseAmount = computed(() => {
  if (selectedAmount.value === 'custom') {
    const value = Number(customAmount.value)
    return Number.isFinite(value) && value > 0 ? value : 0
  }
  return selectedAmount.value
})

const buyButtonLabel = computed(() =>
  t('pages.billing.buyAmount', { amount: formatUsd(purchaseAmount.value) }),
)

const spentTrendLabel = computed(() => {
  const percent = summary.value?.spentChangePercent ?? 0
  const arrow = percent <= 0 ? '↓' : '↑'
  return t('pages.billing.spentTrend', {
    arrow,
    percent: Math.abs(percent),
  })
})

const autoTopUpSummaryLabel = computed(() =>
  t('pages.billing.autoTopUpSummary', {
    amount: formatUsd(autoTopUpAmountNumber.value),
    threshold: formatUsd(autoTopUpThresholdNumber.value),
  }),
)

const topUpTransactions = computed(() =>
  transactions.value.filter((item) => item.type === 'topup'),
)

const historyEmpty = computed(() =>
  activeTab.value === 'topup'
    ? topUpTransactions.value.length === 0
    : billingRecords.value.length === 0,
)

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

async function loadBilling() {
  loading.value = true
  error.value = null

  try {
    const [summaryData, presetData, transactionData, recordData] = await Promise.all([
      fetchBillingSummary(),
      fetchTopUpPresets(),
      fetchTransactions(),
      fetchBillingRecords(),
    ])

    summary.value = summaryData
    presets.value = presetData
    transactions.value = transactionData
    billingRecords.value = recordData

    if (presetData.length > 0) {
      selectedAmount.value = presetData[0].amountUsd
    }

    autoTopUpEnabled.value = summaryData.autoTopUp.enabled
    autoTopUpThresholdNumber.value = summaryData.autoTopUp.thresholdUsd
    autoTopUpAmountNumber.value = summaryData.autoTopUp.topUpAmountUsd
  } catch {
    error.value = t('pages.billing.loadError')
    summary.value = null
    presets.value = []
    transactions.value = []
    billingRecords.value = []
  } finally {
    loading.value = false
  }
}

function scrollToRecharge() {
  rechargeSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function handleBuy() {
  if (purchasing.value || purchaseAmount.value <= 0) return

  purchasing.value = true

  try {
    await createTopUp({
      amountUsd: purchaseAmount.value,
      paymentMethod: selectedPayment.value,
    })
    message.success(t('pages.billing.topUpSuccess'))
    await loadBilling()
    await userStore.loadProfile()
    activeTab.value = 'topup'
  } catch {
    message.error(t('pages.billing.topUpError'))
  } finally {
    purchasing.value = false
  }
}

async function handleEnableAutoTopUp() {
  if (savingAutoTopUp.value) return

  const thresholdUsd = autoTopUpThresholdNumber.value
  const topUpAmountUsd = autoTopUpAmountNumber.value

  if (!Number.isFinite(thresholdUsd) || thresholdUsd <= 0) return
  if (!Number.isFinite(topUpAmountUsd) || topUpAmountUsd <= 0) return

  savingAutoTopUp.value = true

  try {
    const result = await updateAutoTopUp({
      enabled: autoTopUpEnabled.value,
      thresholdUsd,
      topUpAmountUsd,
    })

    if (summary.value) {
      summary.value = {
        ...summary.value,
        autoTopUp: result,
      }
    }

    message.success(t('pages.billing.autoTopUpSaved'))
  } catch {
    message.error(t('pages.billing.autoTopUpError'))
  } finally {
    savingAutoTopUp.value = false
  }
}

function handleAddBillingAddress() {
  message.info(t('pages.billing.addBillingAddressSoon'))
}

function handleExportCsv() {
  if (billingRecords.value.length === 0) {
    message.warning(t('pages.billing.exportCsvEmpty'))
    return
  }

  const headers = [
    t('pages.billing.billingColumns.time'),
    t('pages.billing.billingColumns.style'),
    t('pages.billing.billingColumns.key'),
    t('pages.billing.billingColumns.value'),
  ]

  const rows = billingRecords.value.map((record) => {
    const prefix = record.amountUsd > 0 ? '+' : '-'
    return [
      formatTimestamp(record.createdAt, locale.value, 'compactDatetime'),
      t(`pages.billing.styles.${record.style}`),
      record.key,
      `${prefix}$${Math.abs(record.amountUsd).toFixed(2)}`,
    ]
  })

  const date = new Date().toISOString().slice(0, 10)
  downloadCsv(`billing-${date}.csv`, headers, rows)
  message.success(t('pages.billing.exportCsvSuccess'))
}

function handleAddCard() {
  message.info(t('pages.billing.addCardSoon'))
}

onMounted(loadBilling)
</script>

<template>
  <div class="billing-page">
    <div class="billing-page__inner">
      <header class="billing-page__header">
        <h1 class="billing-page__title">{{ t('pages.billing.title') }}</h1>
        <p class="billing-page__description">{{ t('pages.billing.description') }}</p>
      </header>

      <div v-if="loading" class="billing-page__state">
        <NSpin size="large" />
      </div>

      <div v-else-if="error" class="billing-page__state">
        <p class="billing-page__error">{{ error }}</p>
        <button type="button" class="billing-page__retry" @click="loadBilling">
          {{ t('pages.billing.retry') }}
        </button>
      </div>

      <template v-else-if="summary">
        <section class="billing-summary" aria-label="Billing summary">
          <article class="billing-summary__card billing-summary__card--balance">
            <p class="billing-summary__label">{{ t('pages.billing.cashBalance') }}</p>
            <div class="billing-summary__balance-row">
              <p class="billing-summary__value">{{ formatUsd(summary.balanceUsd) }}</p>
              <button type="button" class="billing-summary__topup-btn" @click="scrollToRecharge">
                {{ t('pages.billing.topUp') }}
              </button>
            </div>
          </article>

          <article class="billing-summary__card">
            <p class="billing-summary__label">{{ t('pages.billing.spentThisMonth') }}</p>
            <div class="billing-summary__spent-row">
              <p class="billing-summary__value">{{ formatUsd(summary.spentThisMonthUsd) }}</p>
              <p
                class="billing-summary__trend"
                :class="{
                  'billing-summary__trend--down': summary.spentChangePercent <= 0,
                  'billing-summary__trend--up': summary.spentChangePercent > 0,
                }"
              >
                {{ spentTrendLabel }}
              </p>
            </div>
          </article>

          <article class="billing-summary__card">
            <div class="billing-summary__auto-header">
              <p class="billing-summary__label">{{ t('pages.billing.autoTopUp') }}</p>
              <span
                class="billing-toggle billing-toggle--readonly"
                :class="{ 'billing-toggle--on': summary.autoTopUp.enabled }"
                aria-hidden="true"
              >
                <span class="billing-toggle__thumb" />
              </span>
            </div>
            <p class="billing-summary__value">
              {{ summary.autoTopUp.enabled ? t('pages.billing.on') : t('pages.billing.off') }}
            </p>
          </article>
        </section>

        <section ref="rechargeSectionRef" class="billing-recharge" aria-label="Account recharge">
          <h2 class="billing-section-title">{{ t('pages.billing.accountRecharge') }}</h2>

          <div class="billing-recharge__grid">
            <div class="billing-panel">
              <p class="billing-panel__subtitle">{{ t('pages.billing.chooseAmount') }}</p>

              <div class="billing-amount-list" role="radiogroup" :aria-label="t('pages.billing.chooseAmount')">
                <label
                  v-for="preset in presets"
                  :key="preset.amountUsd"
                  class="billing-amount-option"
                  :class="{ 'billing-amount-option--selected': selectedAmount === preset.amountUsd }"
                >
                  <input
                    v-model="selectedAmount"
                    class="billing-amount-option__input"
                    type="radio"
                    name="top-up-amount"
                    :value="preset.amountUsd"
                  />
                  <img
                    class="billing-amount-option__radio"
                    :src="
                      assetUrl(
                        selectedAmount === preset.amountUsd
                          ? '/assets/icons/radio-checked.svg'
                          : '/assets/icons/radio-unchecked.svg',
                      )
                    "
                    alt=""
                    width="16"
                    height="16"
                  />
                  <span class="billing-amount-option__amount">{{ formatUsd(preset.amountUsd) }}</span>
                  <span v-if="preset.bonusPercent" class="billing-amount-option__bonus">
                    {{ t('pages.billing.bonus', { percent: preset.bonusPercent }) }}
                  </span>
                  <span class="billing-amount-option__hint">{{ preset.usageHint }}</span>
                </label>

                <label
                  class="billing-amount-option"
                  :class="{ 'billing-amount-option--selected': selectedAmount === 'custom' }"
                >
                  <input
                    v-model="selectedAmount"
                    class="billing-amount-option__input"
                    type="radio"
                    name="top-up-amount"
                    value="custom"
                  />
                  <img
                    class="billing-amount-option__radio"
                    :src="
                      assetUrl(
                        selectedAmount === 'custom'
                          ? '/assets/icons/radio-checked.svg'
                          : '/assets/icons/radio-unchecked.svg',
                      )
                    "
                    alt=""
                    width="16"
                    height="16"
                  />
                  <span class="billing-amount-option__amount">{{ t('pages.billing.custom') }}</span>
                  <input
                    v-if="selectedAmount === 'custom'"
                    v-model="customAmount"
                    class="billing-amount-option__custom-input"
                    type="number"
                    min="1"
                    step="1"
                    :placeholder="t('pages.billing.customPlaceholder')"
                    @click.stop
                  />
                </label>
              </div>

              <p class="billing-panel__subtitle billing-panel__subtitle--payment">
                {{ t('pages.billing.paymentMethod') }}
              </p>

              <div class="billing-payment-methods" role="radiogroup" :aria-label="t('pages.billing.paymentMethod')">
                <label
                  v-for="method in PAYMENT_METHODS"
                  :key="method.id"
                  class="billing-payment-method"
                  :class="{ 'billing-payment-method--selected': selectedPayment === method.id }"
                >
                  <input
                    v-model="selectedPayment"
                    class="billing-amount-option__input"
                    type="radio"
                    name="payment-method"
                    :value="method.id"
                  />
                  <img :src="method.logo" :alt="method.alt" />
                </label>
              </div>

              <button
                type="button"
                class="billing-buy-btn"
                :disabled="purchasing || purchaseAmount <= 0"
                @click="handleBuy"
              >
                {{ buyButtonLabel }}
              </button>
            </div>

            <div class="billing-panel billing-panel--auto">
              <div class="billing-panel__auto-header">
                <p class="billing-panel__subtitle billing-panel__subtitle--inline">
                  {{ t('pages.billing.autoTopUp') }}
                </p>
                <button
                  type="button"
                  class="billing-toggle"
                  :class="{ 'billing-toggle--on': autoTopUpEnabled }"
                  :aria-pressed="autoTopUpEnabled"
                  :aria-label="t('pages.billing.autoTopUp')"
                  @click="autoTopUpEnabled = !autoTopUpEnabled"
                >
                  <span class="billing-toggle__thumb" />
                </button>
              </div>

              <div v-if="autoTopUpEnabled" class="billing-auto-alert">
                {{ t('pages.billing.autoTopUpAlert') }}
              </div>

              <label class="billing-field">
                <span>{{ t('pages.billing.whenBalanceBelow') }}</span>
                <NumberStepperInput v-model="autoTopUpThresholdNumber" :min="1" :step="1" />
              </label>

              <label class="billing-field">
                <span>{{ t('pages.billing.autoTopUpCredits') }}</span>
                <NumberStepperInput v-model="autoTopUpAmountNumber" :min="1" :step="1" />
                <span class="billing-field__hint">{{ autoTopUpSummaryLabel }}</span>
              </label>

              <p class="billing-panel__note">{{ t('pages.billing.autoTopUpStripeOnly') }}</p>

              <button type="button" class="billing-add-card" @click="handleAddCard">
                <img :src="assetUrl('/assets/icons/bank-card.svg')" alt="" width="16" height="16" />
                <span>{{ t('pages.billing.addCard') }}</span>
                <AppIcon name="add" :size="20" />
              </button>

              <button
                type="button"
                class="billing-enable-btn"
                :disabled="savingAutoTopUp"
                @click="handleEnableAutoTopUp"
              >
                {{ t('pages.billing.enableAutoTopUp') }}
              </button>
            </div>
          </div>
        </section>

        <section class="billing-history" aria-label="Billing history">
          <div class="billing-history__toolbar">
            <div class="billing-history__tabs" role="tablist">
              <button
                type="button"
                class="billing-history__tab"
                :class="{ 'billing-history__tab--active': activeTab === 'topup' }"
                role="tab"
                :aria-selected="activeTab === 'topup'"
                @click="activeTab = 'topup'"
              >
                {{ t('pages.billing.topUp') }}
              </button>
              <button
                type="button"
                class="billing-history__tab"
                :class="{ 'billing-history__tab--active': activeTab === 'billing' }"
                role="tab"
                :aria-selected="activeTab === 'billing'"
                @click="activeTab = 'billing'"
              >
                {{ t('pages.billing.billingTab') }}
              </button>
            </div>

            <button
              type="button"
              class="billing-history__address-btn"
              @click="activeTab === 'billing' ? handleExportCsv() : handleAddBillingAddress()"
            >
              {{
                activeTab === 'billing'
                  ? t('pages.billing.exportToCsv')
                  : t('pages.billing.addBillingAddress')
              }}
            </button>
          </div>

          <div
            class="billing-table"
            :class="{ 'billing-table--records': activeTab === 'billing' }"
            role="table"
          >
            <div
              v-if="activeTab === 'topup'"
              class="billing-table__header"
              role="row"
            >
              <span role="columnheader">{{ t('pages.billing.columns.description') }}</span>
              <span role="columnheader">{{ t('pages.billing.columns.date') }}</span>
              <span role="columnheader">{{ t('pages.billing.columns.amount') }}</span>
              <span role="columnheader">{{ t('pages.billing.columns.action') }}</span>
            </div>

            <div
              v-else
              class="billing-table__header billing-table__header--records"
              role="row"
            >
              <span role="columnheader">{{ t('pages.billing.billingColumns.time') }}</span>
              <span role="columnheader">{{ t('pages.billing.billingColumns.style') }}</span>
              <span role="columnheader">{{ t('pages.billing.billingColumns.key') }}</span>
              <span role="columnheader">{{ t('pages.billing.billingColumns.value') }}</span>
            </div>

            <div v-if="historyEmpty" class="billing-table__empty">
              {{ t('pages.billing.emptyHistory') }}
            </div>

            <div v-else-if="activeTab === 'topup'" class="billing-table__body" role="rowgroup">
              <BillingTransactionRow
                v-for="item in topUpTransactions"
                :key="item.id"
                :item="item"
              />
            </div>

            <div v-else class="billing-table__body" role="rowgroup">
              <BillingRecordRow
                v-for="item in billingRecords"
                :key="item.id"
                :item="item"
              />
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.billing-page {
  min-height: calc(100vh - 140px);
}

.billing-page__inner {
  max-width: 1360px;
  margin: 0 auto;
  padding: 105px 24px 48px;
}

.billing-page__header {
  margin-bottom: 42px;
}

.billing-page__title {
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-primary);
}

.billing-page__description {
  margin: 0;
  max-width: 513px;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  color: var(--text-secondary);
}

.billing-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 320px;
}

.billing-page__error {
  margin: 0;
  color: var(--text-secondary);
}

.billing-page__retry {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.billing-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.billing-summary__card {
  min-height: 120px;
  padding: 24px;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: var(--bg-card);
}

.billing-summary__card--balance {
  border: 0;
  background: linear-gradient(168deg, rgba(124, 92, 255, 0.1) 0%, rgba(45, 107, 255, 0.1) 100%);
}

.billing-summary__label {
  margin: 0 0 18px;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: var(--text-secondary);
}

.billing-summary__value {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-primary);
}

.billing-summary__balance-row,
.billing-summary__spent-row,
.billing-summary__auto-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.billing-summary__topup-btn {
  min-width: 116px;
  height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--text-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  cursor: pointer;
}

.billing-summary__trend {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 12px;
}

.billing-summary__trend--down {
  color: #00bb83;
}

.billing-summary__trend--up {
  color: #ff9800;
}

.billing-section-title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-primary);
}

.billing-recharge {
  margin-bottom: 40px;
}

.billing-recharge__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.billing-panel {
  padding: 24px;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: var(--bg-card);
}

.billing-panel__subtitle {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-secondary);
}

.billing-panel__subtitle--payment {
  margin-top: 28px;
}

.billing-panel__subtitle--inline {
  margin: 0;
}

.billing-panel__auto-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.billing-panel__note {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 12px;
  color: var(--text-secondary);
}

.billing-amount-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.billing-amount-option {
  display: grid;
  grid-template-columns: 16px auto auto 1fr;
  gap: 8px 16px;
  align-items: center;
  cursor: pointer;
}

.billing-amount-option__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.billing-amount-option__radio {
  grid-column: 1;
}

.billing-amount-option__amount {
  grid-column: 2;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  color: var(--text-primary);
}

.billing-amount-option__bonus {
  grid-column: 3;
  font-size: 12px;
  line-height: 14px;
  color: #ff9800;
}

.billing-amount-option__hint {
  grid-column: 4;
  justify-self: end;
  max-width: 336px;
  font-size: 12px;
  line-height: 14px;
  color: var(--text-secondary);
  text-align: right;
}

.billing-amount-option__custom-input {
  grid-column: 3 / -1;
  justify-self: end;
  width: 120px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 14px;
}

.billing-payment-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.billing-payment-method {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 44px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.billing-payment-method img {
  max-width: 84px;
  max-height: 24px;
}

.billing-payment-method--selected {
  opacity: 1;
}

.billing-buy-btn,
.billing-enable-btn {
  width: 100%;
  height: 48px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
}

.billing-buy-btn {
  background: var(--text-accent);
  color: var(--text-primary);
}

.billing-buy-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.billing-enable-btn {
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.billing-enable-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.billing-auto-alert {
  margin-bottom: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 152, 0, 0.1);
  font-size: 12px;
  line-height: 16px;
  color: #ff9800;
}

.billing-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 12px;
  line-height: 12px;
  color: var(--text-secondary);
}

.billing-field :deep(.number-stepper) {
  width: 100%;
}

.billing-field__hint {
  color: var(--text-secondary);
}

.billing-field__hint :deep(strong),
.billing-field__hint {
  font-size: 12px;
  line-height: 12px;
}

.billing-add-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 40px;
  margin-bottom: 16px;
  padding: 0 12px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.billing-add-card span:first-of-type {
  flex: 1;
  text-align: left;
}

.billing-toggle {
  position: relative;
  width: 36px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.billing-toggle--readonly {
  pointer-events: none;
}

.billing-toggle--on {
  background: var(--text-accent);
}

.billing-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.billing-toggle--on .billing-toggle__thumb {
  transform: translateX(16px);
}

.billing-history__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.billing-history__tabs {
  display: flex;
  gap: 24px;
}

.billing-history__tab {
  padding: 0;
  border: 0;
  background: none;
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  color: var(--text-secondary);
  cursor: pointer;
}

.billing-history__tab--active {
  color: var(--text-primary);
}

.billing-history__address-btn {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
}

.billing-table {
  overflow: hidden;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: var(--bg-card);
}

.billing-table__header {
  display: grid;
  grid-template-columns: minmax(100px, 1.4fr) minmax(100px, 1fr) minmax(80px, 0.8fr) 72px;
  gap: 12px;
  align-items: center;
  min-height: 50px;
  padding: 0 32px;
  border-bottom: 0.5px solid #2d2d38;
  background: #1b1b28;
  opacity: 0.6;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: var(--text-secondary);
}

.billing-table__empty {
  padding: 32px;
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.billing-table__header--records {
  grid-template-columns: minmax(110px, 0.9fr) minmax(72px, 0.55fr) minmax(180px, 2.2fr) minmax(80px, 0.65fr);
}

.billing-table__header--records span:last-child {
  text-align: right;
}

.billing-table__body :deep(.billing-tx-row:last-child),
.billing-table__body :deep(.billing-record-row:last-child) {
  border-bottom: 0;
}

@media (max-width: 1023px) {
  .billing-summary,
  .billing-recharge__grid {
    grid-template-columns: 1fr;
  }

  .billing-amount-option {
    grid-template-columns: 16px 1fr;
  }

  .billing-amount-option__bonus,
  .billing-amount-option__hint,
  .billing-amount-option__custom-input {
    grid-column: 2;
    justify-self: start;
    max-width: none;
    text-align: left;
  }

  .billing-table__header {
    display: none;
  }
}

@media (max-width: 767px) {
  .billing-page__inner {
    padding: 96px 12px 32px;
  }

  .billing-history__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .billing-history__address-btn {
    width: 100%;
  }
}
</style>
