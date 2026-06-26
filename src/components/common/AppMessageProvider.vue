<script setup lang="ts">
import { provide } from 'vue'
import AppToast from '@/components/common/AppToast.vue'
import {
  appMessageApiKey,
  appMessageStateKey,
  useAppMessageState,
} from '@/composables/useAppMessage'

const { messages, api } = useAppMessageState()

provide(appMessageStateKey, messages)
provide(appMessageApiKey, api)
</script>

<template>
  <slot />

  <Teleport to="body">
    <div class="app-message-viewport" aria-live="polite" aria-relevant="additions">
      <TransitionGroup name="app-message" tag="div" class="app-message-viewport__list">
        <AppToast
          v-for="item in messages"
          :key="item.id"
          :type="item.type"
          :content="item.content"
          :closable="item.closable"
          @close="api.destroy(item.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.app-message-viewport {
  position: fixed;
  top: 88px;
  left: 50%;
  z-index: 10000;
  transform: translateX(-50%);
  pointer-events: none;
}

.app-message-viewport__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-message-viewport__list :deep(.app-toast) {
  pointer-events: auto;
}

.app-message-enter-active,
.app-message-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.app-message-enter-from,
.app-message-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.app-message-move {
  transition: transform 0.2s ease;
}

@media (max-width: 767px) {
  .app-message-viewport {
    top: 72px;
    left: 16px;
    right: 16px;
    transform: none;
  }
}
</style>
