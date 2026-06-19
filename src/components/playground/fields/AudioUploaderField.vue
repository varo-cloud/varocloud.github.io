<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<string>({ required: true })

defineProps<{
  label?: string
  required?: boolean
  description?: string
  showLabel?: boolean
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const audioEl = ref<HTMLAudioElement | null>(null)
const previewUrl = ref<string | null>(null)
const isDragging = ref(false)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const hasAudio = computed(() => Boolean(previewUrl.value || model.value))

const progressPercent = computed(() => {
  if (!duration.value) return 0
  return Math.min(100, (currentTime.value / duration.value) * 100)
})

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function openPicker() {
  fileInput.value?.click()
}

function setPreviewFromValue(val: string) {
  if (val.startsWith('http') || val.startsWith('blob:')) {
    previewUrl.value = val
  } else if (!val) {
    previewUrl.value = null
  }
}

function resetPlayback() {
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
}

function applyFile(file: File) {
  if (!file.type.startsWith('audio/')) return

  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  resetPlayback()
  previewUrl.value = URL.createObjectURL(file)
  model.value = previewUrl.value
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  applyFile(file)
}

function onDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  applyFile(file)
}

function clearAudio() {
  if (audioEl.value) {
    audioEl.value.pause()
  }
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  model.value = ''
  resetPlayback()
  if (fileInput.value) fileInput.value.value = ''
}

function onUrlInput() {
  resetPlayback()
  setPreviewFromValue(model.value)
}

function onLoadedMetadata() {
  duration.value = audioEl.value?.duration ?? 0
}

function onTimeUpdate() {
  currentTime.value = audioEl.value?.currentTime ?? 0
}

async function togglePlay() {
  if (!audioEl.value) return
  if (isPlaying.value) {
    audioEl.value.pause()
    isPlaying.value = false
    return
  }
  try {
    await audioEl.value.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
}

function toggleMute() {
  if (!audioEl.value) return
  isMuted.value = !isMuted.value
  audioEl.value.muted = isMuted.value
}

function onProgressClick(event: MouseEvent) {
  if (!audioEl.value || !duration.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  audioEl.value.currentTime = ratio * duration.value
  currentTime.value = audioEl.value.currentTime
}

watch(
  () => model.value,
  (val) => {
    resetPlayback()
    setPreviewFromValue(val)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
})
</script>

<template>
  <div class="audio-field">
    <SchemaFieldLabel
      v-if="showLabel !== false && label"
      :label="label"
      :required="required"
      :description="description"
      :counter="model ? '1' : '0'"
    />

    <div
      class="audio-field__box"
      :class="{ 'audio-field__box--dragging': isDragging }"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click.self="openPicker"
    >
      <div class="audio-field__url-row">
        <input
          v-model="model"
          type="text"
          class="audio-field__url"
          placeholder="https://static.wavespeed.ai/examples/5679"
          @input="onUrlInput"
          @click.stop
        />
        <button type="button" class="audio-field__icon-btn" aria-label="Upload audio" @click.stop="openPicker">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 14l3.5-3.5 2.5 2.5L14 9l2 2v3H4v-1.5zM14 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button type="button" class="audio-field__icon-btn" aria-label="Record audio" @click.stop>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 12.5a2.5 2.5 0 0 0 2.5-2.5V6a2.5 2.5 0 1 0-5 0v4a2.5 2.5 0 0 0 2.5 2.5z"
              fill="currentColor"
            />
            <path
              d="M6.5 10.5a3.5 3.5 0 0 0 7 0M10 14v2.5M7.5 16.5h5"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <input ref="fileInput" type="file" accept="audio/*" hidden @change="onFileChange" />
      </div>

      <p class="audio-field__drop-hint">Drag &amp; drop or click to upload</p>

      <div v-if="hasAudio" class="audio-field__player-row">
        <div class="audio-field__player">
          <audio
            ref="audioEl"
            :src="previewUrl || model"
            preload="metadata"
            @loadedmetadata="onLoadedMetadata"
            @timeupdate="onTimeUpdate"
            @ended="isPlaying = false"
          />

          <button type="button" class="audio-field__play" aria-label="Play audio" @click.stop="togglePlay">
            <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 3.5v9l8-4.5-8-4.5z" fill="currentColor" />
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M5 3h2v10H5V3zm4 0h2v10H9V3z" fill="currentColor" />
            </svg>
          </button>

          <span class="audio-field__time">
            {{ formatTime(currentTime) }}/{{ formatTime(duration) }}
          </span>

          <div class="audio-field__progress" @click.stop="onProgressClick">
            <div class="audio-field__progress-fill" :style="{ width: `${progressPercent}%` }" />
          </div>

          <button
            type="button"
            class="audio-field__icon-btn audio-field__icon-btn--player"
            :aria-label="isMuted ? 'Unmute' : 'Mute'"
            @click.stop="toggleMute"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 6.5h2l2.5-2v9l-2.5-2H3v-5zm6.5 1a2.5 2.5 0 0 1 0 3M11 4.5a5 5 0 0 1 0 7"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          <button type="button" class="audio-field__icon-btn audio-field__icon-btn--player" aria-label="More options" @click.stop>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="4" r="1.2" fill="currentColor" />
              <circle cx="8" cy="8" r="1.2" fill="currentColor" />
              <circle cx="8" cy="12" r="1.2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <button type="button" class="audio-field__clear" aria-label="Remove audio" @click.stop="clearAudio">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.audio-field__box {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: #0a0a0e;
  padding: 8px;
  cursor: pointer;
}

.audio-field__box--dragging {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.04);
}

.audio-field__url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #21212a;
  border-radius: 8px;
  padding: 0 8px;
  height: 40px;
}

.audio-field__url {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  outline: none;
  min-width: 0;
  line-height: 14px;
}

.audio-field__url::placeholder {
  opacity: 0.2;
  color: #fff;
}

.audio-field__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #ebf4fb;
  cursor: pointer;
  flex-shrink: 0;
}

.audio-field__drop-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 14px;
}

.audio-field__player-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.audio-field__player {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.2);
}

.audio-field__play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.audio-field__time {
  font-size: 14px;
  line-height: 14px;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
}

.audio-field__progress {
  flex: 1;
  height: 4px;
  min-width: 40px;
  border-radius: 4px;
  background: rgba(217, 217, 217, 0.2);
  cursor: pointer;
  overflow: hidden;
}

.audio-field__progress-fill {
  height: 100%;
  border-radius: 4px;
  background: #fff;
  transition: width 0.1s linear;
}

.audio-field__icon-btn--player {
  color: #fff;
}

.audio-field__clear {
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: #9b9dab;
  cursor: pointer;
  flex-shrink: 0;
}
</style>
