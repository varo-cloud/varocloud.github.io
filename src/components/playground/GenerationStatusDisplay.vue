<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'
import type { GenerationStatus } from '@/types'

const props = defineProps<{
  status: Exclude<GenerationStatus, 'idle'>
  progress?: number
  estimatedSeconds?: number
}>()

const { t } = useI18n()

const RING_RADIUS = 44
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const statusIconSrc = computed(() => {
  const icons: Partial<Record<GenerationStatus, string>> = {
    queued: '/assets/playground/status-queued.svg',
    completed: '/assets/playground/status-completed.svg',
    failed: '/assets/playground/status-failed.svg',
  }
  const path = icons[props.status]
  return path ? assetUrl(path) : null
})

const statusTitle = computed(() => t(`pages.modelDetail.generation.${props.status}`))

const progressPercent = computed(() => Math.min(100, Math.max(0, props.progress ?? 0)))

const progressOffset = computed(
  () => RING_CIRCUMFERENCE * (1 - progressPercent.value / 100),
)

const progressLabel = computed(() => `${Math.round(progressPercent.value)}%`)

type TimelineStep = 'queued' | 'processing' | 'completed'

function isTimelineActive(step: TimelineStep): boolean {
  if (props.status === 'failed') return step === 'completed'
  if (props.status === 'completed') return step === 'completed'
  if (props.status === 'processing') return step === 'processing'
  return step === 'queued'
}
</script>

<template>
  <div class="generation-status">
    <div class="generation-status__visual">
      <div v-if="status === 'processing'" class="generation-status__ring" aria-hidden="true">
        <svg viewBox="0 0 96 96" width="96" height="96" fill="none">
          <circle
            cx="48"
            cy="48"
            :r="RING_RADIUS"
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width="4"
          />
          <circle
            cx="48"
            cy="48"
            :r="RING_RADIUS"
            stroke="#2d6bff"
            stroke-width="4"
            stroke-linecap="round"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="progressOffset"
            transform="rotate(-90 48 48)"
          />
        </svg>
        <span class="generation-status__ring-label">{{ progressLabel }}</span>
      </div>

      <img
        v-else-if="statusIconSrc"
        :src="statusIconSrc"
        alt=""
        class="generation-status__icon"
      />
    </div>

    <p class="generation-status__title">{{ statusTitle }}</p>

    <p class="generation-status__timeline">
      <span :class="{ 'generation-status__timeline-step--active': isTimelineActive('queued') }">
        {{ t('pages.modelDetail.generation.queued') }}
      </span>
      <span class="generation-status__timeline-sep"> → </span>
      <span :class="{ 'generation-status__timeline-step--active': isTimelineActive('processing') }">
        {{ t('pages.modelDetail.generation.processingStep') }}
      </span>
      <span class="generation-status__timeline-sep"> → </span>
      <span :class="{ 'generation-status__timeline-step--active': isTimelineActive('completed') }">
        {{ t('pages.modelDetail.generation.completed') }}
      </span>
      <template v-if="estimatedSeconds != null">
        <span class="generation-status__timeline-sep"> · </span>
        <span class="generation-status__timeline-sep">~{{ estimatedSeconds }}s</span>
      </template>
    </p>
  </div>
</template>

<style scoped>
.generation-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.generation-status__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
}

.generation-status__ring {
  position: relative;
  width: 96px;
  height: 96px;
}

.generation-status__ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
}

.generation-status__icon {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

.generation-status__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  color: #ebf4fb;
}

.generation-status__timeline {
  margin: 0;
  font-size: 12px;
  line-height: 12px;
  color: #9b9dab;
  white-space: nowrap;
}

.generation-status__timeline-step--active {
  color: #ebf4fb;
}

.generation-status__timeline-sep {
  color: #9b9dab;
}
</style>
