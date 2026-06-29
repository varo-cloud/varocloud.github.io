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
  <span class="varo-cloud-logo" :class="`varo-cloud-logo--${variant}`">
    <img
      class="varo-cloud-logo__mascot"
      :src="assetUrl('/assets/brand/logo.svg')"
      alt=""
      width="54"
      height="54"
    />
    <img
      class="varo-cloud-logo__wordmark"
      :src="assetUrl('/assets/brand/varo-wordmark.svg')"
      alt="Varo.cloud"
      width="141"
      height="20"
    />
  </span>
</template>

<style scoped>
.varo-cloud-logo {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.varo-cloud-logo__mascot {
  display: block;
  width: 54px;
  height: 54px;
  flex-shrink: 0;
}

.varo-cloud-logo__wordmark {
  display: block;
  width: 141px;
  height: 20px;
  flex-shrink: 0;
}

.varo-cloud-logo--light .varo-cloud-logo__mascot {
  filter: brightness(0.85);
}
</style>
