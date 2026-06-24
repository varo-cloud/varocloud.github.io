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
  delete: '/assets/icons/delete.svg',
  edit: '/assets/icons/edit.svg',
  'code-box': '/assets/icons/code-box.svg',
  'file-paper': '/assets/icons/file-paper.svg',
  logout: '/assets/icons/logout.svg',
} as const

export type AppIconName = keyof typeof ICONS

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
  }>(),
  {
    size: 16,
  },
)

const iconUrl = computed(() => assetUrl(ICONS[props.name]))
</script>

<template>
  <span
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
</style>
