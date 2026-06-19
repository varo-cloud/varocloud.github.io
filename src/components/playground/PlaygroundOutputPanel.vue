<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  outputUrl?: string | null
  perRunPriceUsd?: number
  runsPerTenUsd?: number
}>()

const { t } = useI18n()
</script>

<template>
  <section class="output-panel">
    <div class="output-panel__header">
      <h2 class="output-panel__title">{{ t('pages.modelDetail.myGenerations') }}</h2>
      <div class="output-panel__tools">
        <button type="button" class="output-panel__tool">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 4l6 4-6 4V4z" stroke="currentColor" stroke-width="1.2" />
            <path d="M11 3h2v10h-2" stroke="currentColor" stroke-width="1.2" />
          </svg>
          {{ t('pages.modelDetail.code') }}
        </button>
        <button type="button" class="output-panel__tool">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.2" />
            <path
              d="M8 2v1M8 13v1M2 8h1M13 8h1M4.2 4.2l.7.7M11.1 11.1l.7.7M4.2 11.8l.7-.7M11.1 4.9l.7-.7"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
          {{ t('pages.modelDetail.settings') }}
        </button>
      </div>
    </div>

    <div class="output-panel__body">
      <img
        v-if="outputUrl"
        :src="outputUrl"
        alt=""
        class="output-panel__preview"
      />
      <div v-else class="output-panel__empty">
        {{ t('pages.modelDetail.noGenerations') }}
      </div>
    </div>

    <p v-if="perRunPriceUsd != null" class="output-panel__meta">
      <span>${{ perRunPriceUsd.toFixed(2) }}</span>
      <span class="output-panel__meta-muted">{{ t('pages.modelDetail.perRun') }}</span>
      <template v-if="runsPerTenUsd != null">
        <span class="output-panel__meta-muted">·</span>
        <span class="output-panel__meta-muted">~{{ runsPerTenUsd }} / $10</span>
      </template>
    </p>
  </section>
</template>
<style scoped>
.output-panel {
  display: flex;
  flex-direction: column;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  min-height: 600px;
}

.output-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.output-panel__title {
  margin: 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.output-panel__tools {
  display: flex;
  gap: 16px;
}

.output-panel__tool {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  font-size: 12px;
  color: #ebf4fb;
  cursor: pointer;
  font-family: inherit;
}

.output-panel__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.output-panel__preview {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
}

.output-panel__empty {
  font-size: 14px;
  color: #9b9dab;
  text-align: center;
}

.output-panel__meta {
  margin: 16px 0 0;
  font-size: 14px;
  color: #ebf4fb;
}

.output-panel__meta-muted {
  color: #9b9dab;
}
</style>
