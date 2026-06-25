<script setup lang="ts">
import { computed } from 'vue'
import { assetUrl } from '@/utils/assetUrl'

const props = defineProps<{
  title: string
  modelPath: string
  description: string
  thumbnailUrl?: string
}>()

const thumbnailSrc = computed(() =>
  assetUrl(props.thumbnailUrl || '/assets/model-detail/model-thumb.jpg'),
)
</script>

<template>
  <header class="model-header">
    <img
      class="model-header__thumb"
      :src="thumbnailSrc"
      alt=""
    />
    <div class="model-header__content">
      <h1 class="model-header__title">{{ title }}</h1>
      <div class="model-header__path">
        <code class="model-header__path-text">{{ modelPath }}</code>
      </div>
      <p class="model-header__desc">{{ description }}</p>
    </div>
  </header>
</template>

<style scoped>
.model-header {
  display: flex;
  gap: 12px;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.model-header__thumb {
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  border-radius: 8px;
  object-fit: cover;
}

.model-header__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #ebf4fb;
  line-height: 1.2;
}

.model-header__path {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  max-width: 100%;
  height: 24px;
  padding: 0 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
}

.model-header__path-text {
  font-family: inherit;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-header__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #9b9dab;
}
</style>
