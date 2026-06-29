<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { assetUrl } from '@/utils/assetUrl'

const SLIDE_DURATION_MS = 5000

const slides = [
  {
    poster: assetUrl('/assets/cover/2.jpg'),
    video: assetUrl('/assets/cover/2.mp4'),
  },
  {
    poster: assetUrl('/assets/cover/3.jpg'),
    video: assetUrl('/assets/cover/3.mp4'),
  },
  {
    poster: assetUrl('/assets/cover/4.jpg'),
    video: assetUrl('/assets/cover/4.mp4'),
  },
] as const

const activeIndex = defineModel<number>('activeIndex', { default: 0 })
const progressKey = ref(0)
const videoRef = ref<HTMLVideoElement | null>(null)

let timer: ReturnType<typeof setInterval> | undefined

function clearTimer() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

function startTimer() {
  clearTimer()
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % slides.length
  }, SLIDE_DURATION_MS)
}

function resetProgress() {
  progressKey.value += 1
}

async function playActiveVideo() {
  await nextTick()
  const video = videoRef.value
  if (!video) return

  video.load()
  try {
    await video.play()
  } catch {
    // 浏览器可能拦截自动播放，忽略即可
  }
}

function goToSlide(index: number) {
  if (index === activeIndex.value) {
    resetProgress()
    startTimer()
    void playActiveVideo()
    return
  }

  activeIndex.value = index
}

watch(activeIndex, () => {
  resetProgress()
  startTimer()
  void playActiveVideo()
})

onMounted(() => {
  startTimer()
  void playActiveVideo()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div class="hero-carousel" aria-hidden="true">
    <video
      ref="videoRef"
      class="hero-carousel__video"
      :src="slides[activeIndex].video"
      :poster="slides[activeIndex].poster"
      muted
      loop
      playsinline
      preload="auto"
    />
  </div>

  <div class="hero-carousel__nav-wrap">
    <div class="hero-carousel__nav" role="tablist" aria-label="Hero carousel">
      <button
        v-for="(slide, index) in slides"
        :key="slide.poster"
        type="button"
        role="tab"
        class="hero-carousel__thumb"
        :class="{ 'is-active': index === activeIndex }"
        :aria-selected="index === activeIndex"
        :aria-label="`Slide ${index + 1}`"
        @click="goToSlide(index)"
      >
        <span class="hero-carousel__thumb-image">
          <img :src="slide.poster" alt="" />
        </span>
        <span v-if="index === activeIndex" class="hero-carousel__progress">
          <span
            :key="progressKey"
            class="hero-carousel__progress-fill"
            :style="{ animationDuration: `${SLIDE_DURATION_MS}ms` }"
          />
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hero-carousel {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.hero-carousel::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.hero-carousel__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.hero-carousel__nav-wrap {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 16px 49px;
  pointer-events: none;
}

.hero-carousel__nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  pointer-events: auto;
}

.hero-carousel__thumb {
  position: relative;
  flex-shrink: 0;
  width: 66px;
  height: 42px;
  padding: 1px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.2s ease;
}

.hero-carousel__thumb.is-active {
  opacity: 1;
}

.hero-carousel__thumb-image {
  display: block;
  width: 64px;
  height: 40px;
  overflow: hidden;
}

.hero-carousel__thumb-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.hero-carousel__progress {
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 0;
  height: 2px;
  background: rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.hero-carousel__progress-fill {
  display: block;
  width: 0;
  height: 100%;
  background: #fff;
  animation: hero-carousel-progress linear forwards;
}

@keyframes hero-carousel-progress {
  from {
    width: 0;
  }

  to {
    width: 100%;
  }
}

@media (min-width: 1024px) {
  .hero-carousel__nav-wrap {
    padding-inline: 24px;
  }
}

@media (max-width: 767px) {
  .hero-carousel__video {
    object-position: center 35%;
  }

  .hero-carousel__nav-wrap {
    padding: 0 16px 16px;
  }

  .hero-carousel__nav {
    justify-content: center;
    gap: 8px;
  }

  .hero-carousel__thumb {
    width: 56px;
    height: 36px;
  }

  .hero-carousel__thumb-image {
    width: 54px;
    height: 34px;
  }
}
</style>
