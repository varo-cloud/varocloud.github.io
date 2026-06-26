<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/utils/assetUrl'

const ICONS = {
  globe: '/assets/icons/globe.svg',
  wallet: '/assets/icons/wallet.svg',
  deposit: '/assets/icons/deposit.svg',
  'chevron-down': '/assets/icons/chevron-down.svg',
  search: '/assets/icons/search.svg',
  close: '/assets/icons/close.svg',
  key: '/assets/icons/key.svg',
  add: '/assets/icons/add.svg',
  'image-add-line': '/assets/icons/image-add-line.svg',
  microphone: '/assets/icons/microphone.svg',
  delete: '/assets/icons/delete.svg',
  edit: '/assets/icons/edit.svg',
  copy: '/assets/icons/copy.svg',
  'code-box': '/assets/icons/code-box.svg',
  'file-paper': '/assets/icons/file-paper.svg',
  logout: '/assets/icons/logout.svg',
  discord: '/assets/icons/discord.svg',
  email: '/assets/icons/email.svg',
  x: '/assets/icons/x.svg',
  youtube: '/assets/icons/youtube.svg',
  'check-circle': '/assets/icons/check-circle.svg',
  'toast-success': '/assets/icons/toast-success.svg',
  'toast-error': '/assets/icons/toast-error.svg',
  'toast-warning': '/assets/icons/toast-warning.svg',
  'toast-info': '/assets/icons/toast-info.svg',
  twitter: '/assets/footer/twitter.svg',
  telegram: '/assets/footer/telegram.svg',
} as const

export type AppIconName = keyof typeof ICONS

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
    /** 保留 SVG 原始配色（用于 Toast 等多色图标） */
    colored?: boolean
  }>(),
  {
    size: 16,
    colored: false,
  },
)

const iconUrl = computed(() => assetUrl(ICONS[props.name]))
</script>

<template>
  <img
    v-if="colored"
    class="app-icon app-icon--colored"
    :src="iconUrl"
    :width="size"
    :height="size"
    alt=""
    aria-hidden="true"
  />
  <span
    v-else
    class="app-icon"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
      WebkitMaskImage: `url(${iconUrl})`,
      maskImage: `url(${iconUrl})`,
    }"
    aria-hidden="true"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  background-color: currentColor;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}

.app-icon--colored {
  display: block;
  background-color: transparent;
}
</style>
