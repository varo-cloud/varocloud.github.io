<script setup lang="ts">
import { assetUrl } from '@/utils/assetUrl'

withDefaults(
  defineProps<{
    variant?: 'light' | 'dark'
  }>(),
  {
    variant: 'dark',
  },
)
</script>

<template>
  <img
    class="varo-cloud-logo"
    :class="`varo-cloud-logo--${variant}`"
    :src="assetUrl('/assets/brand/logo.svg')"
    alt=""
    width="54"
    height="54"
  />
</template>

<style scoped>
.varo-cloud-logo {
  display: block;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.varo-cloud-logo--light {
  filter: brightness(0.85);
}
</style>
