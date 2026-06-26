<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppMessage } from '@/composables/useAppMessage'
import { downloadMediaFile, guessDownloadFilename } from '@/utils/downloadMedia'
import { resolveMediaPreviewKind } from '@/utils/mediaPreview'

const props = defineProps<{
  urls: string[]
  initialIndex?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const message = useAppMessage()

const activeIndex = ref(props.initialIndex ?? 0)
const downloading = ref(false)

const activeUrl = computed(() => props.urls[activeIndex.value] ?? '')
const mediaKind = computed(() => resolveMediaPreviewKind(activeUrl.value))
const hasMultiple = computed(() => props.urls.length > 1)
const canGoPrev = computed(() => activeIndex.value > 0)
const canGoNext = computed(() => activeIndex.value < props.urls.length - 1)

watch(
  () => props.initialIndex,
  (index) => {
    if (index != null) activeIndex.value = index
  },
)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close')
    return
  }
  if (event.key === 'ArrowLeft' && canGoPrev.value) {
    activeIndex.value -= 1
  }
  if (event.key === 'ArrowRight' && canGoNext.value) {
    activeIndex.value += 1
  }
}

async function handleDownload() {
  if (!activeUrl.value || downloading.value) return

  downloading.value = true
  try {
    await downloadMediaFile(activeUrl.value, guessDownloadFilename(activeUrl.value, activeIndex.value))
  } catch {
    message.error(t('pages.modelDetail.downloadFailed'))
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="generation-lightbox-backdrop" @click.self="emit('close')">
      <div
        class="generation-lightbox"
        role="dialog"
        aria-modal="true"
        :aria-label="t('pages.modelDetail.viewFullscreen')"
      >
        <div class="generation-lightbox__toolbar">
          <span v-if="hasMultiple" class="generation-lightbox__counter">
            {{ activeIndex + 1 }} / {{ urls.length }}
          </span>
          <div class="generation-lightbox__actions">
            <button
              type="button"
              class="generation-lightbox__action"
              :disabled="downloading"
              @click="handleDownload"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M8 2.5v7M5.5 7 8 9.5 10.5 7M3 12.5h10"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ t('pages.modelDetail.download') }}
            </button>
            <button
              type="button"
              class="generation-lightbox__close"
              :aria-label="t('common.close')"
              @click="emit('close')"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div class="generation-lightbox__stage">
          <button
            v-if="hasMultiple"
            type="button"
            class="generation-lightbox__nav generation-lightbox__nav--prev"
            :disabled="!canGoPrev"
            :aria-label="t('pages.modelDetail.previousResult')"
            @click="activeIndex -= 1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <video
            v-if="mediaKind === 'video'"
            :key="activeUrl"
            :src="activeUrl"
            class="generation-lightbox__media generation-lightbox__media--video"
            controls
            playsinline
            autoplay
          />
          <audio
            v-else-if="mediaKind === 'audio'"
            :key="activeUrl"
            :src="activeUrl"
            class="generation-lightbox__media generation-lightbox__media--audio"
            controls
            autoplay
          />
          <img
            v-else
            :key="activeUrl"
            :src="activeUrl"
            alt=""
            class="generation-lightbox__media"
          />

          <button
            v-if="hasMultiple"
            type="button"
            class="generation-lightbox__nav generation-lightbox__nav--next"
            :disabled="!canGoNext"
            :aria-label="t('pages.modelDetail.nextResult')"
            @click="activeIndex += 1"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M8 4l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.generation-lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.82);
}

.generation-lightbox {
  display: flex;
  flex-direction: column;
  width: min(1120px, 100%);
  max-height: calc(100vh - 48px);
  gap: 16px;
}

.generation-lightbox__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.generation-lightbox__counter {
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
}

.generation-lightbox__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.generation-lightbox__action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.generation-lightbox__action:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.16);
}

.generation-lightbox__action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generation-lightbox__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.generation-lightbox__close:hover {
  background: rgba(255, 255, 255, 0.16);
}

.generation-lightbox__stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  flex: 1;
}

.generation-lightbox__media {
  max-width: 100%;
  max-height: calc(100vh - 140px);
  object-fit: contain;
  border-radius: 8px;
}

.generation-lightbox__media--video {
  width: 100%;
  background: #000;
}

.generation-lightbox__media--audio {
  width: min(640px, 100%);
}

.generation-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.generation-lightbox__nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.generation-lightbox__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.generation-lightbox__nav--prev {
  left: -12px;
}

.generation-lightbox__nav--next {
  right: -12px;
}

@media (max-width: 768px) {
  .generation-lightbox-backdrop {
    padding: 16px;
  }

  .generation-lightbox__nav--prev {
    left: 0;
  }

  .generation-lightbox__nav--next {
    right: 0;
  }
}
</style>
