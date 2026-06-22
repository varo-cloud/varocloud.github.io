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
  <span
    class="varo-cloud-logo"
    :class="`varo-cloud-logo--${variant}`"
    aria-hidden="true"
  >
    <img
      class="varo-cloud-logo__mascot"
      :src="assetUrl('/assets/brand/varo-mascot.svg')"
      alt=""
      width="46"
      height="40"
    />
    <img
      class="varo-cloud-logo__wordmark"
      :src="assetUrl('/assets/brand/varo-wordmark.svg')"
      alt=""
      width="141"
      height="20"
    />
  </span>
</template>

<style scoped>
.varo-cloud-logo {
  display: inline-flex;
  align-items: center;
  gap: 14.75px;
  flex-shrink: 0;
  line-height: 0;
}

.varo-cloud-logo__mascot {
  display: block;
  width: 46.25px;
  height: 40px;
  flex-shrink: 0;
}

.varo-cloud-logo__wordmark {
  display: block;
  width: 141.08px;
  height: 20px;
  flex-shrink: 0;
}

.varo-cloud-logo--light .varo-cloud-logo__wordmark {
  filter: brightness(0.2);
}
</style>
