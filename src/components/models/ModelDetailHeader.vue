<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { assetUrl } from '@/utils/assetUrl'

export type ModelSwitcherOption = {
  id: string
  label: string
}

const props = defineProps<{
  title: string
  modelId: string
  modelPath: string
  description: string
  thumbnailUrl?: string
  modelOptions?: ModelSwitcherOption[]
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', left: '0px', width: '0px' })
const panelId = useId()

let closeTimer: ReturnType<typeof setTimeout> | null = null

const thumbnailSrc = computed(() =>
  assetUrl(props.thumbnailUrl || '/assets/model-detail/model-thumb.jpg'),
)

const switcherOptions = computed(() => props.modelOptions ?? [])

const hasSwitcher = computed(() => switcherOptions.value.length > 1)

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 280)}px`,
  }
}

function clearCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function openDropdown() {
  if (!hasSwitcher.value) return
  clearCloseTimer()
  open.value = true
}

function scheduleClose() {
  clearCloseTimer()
  closeTimer = setTimeout(() => {
    open.value = false
  }, 120)
}

function selectOption(id: string) {
  if (id !== props.modelId) {
    emit('select', id)
  }
  open.value = false
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  open.value = false
}

watch(open, (isOpen) => {
  if (!isOpen) {
    window.removeEventListener('resize', updatePanelPosition)
    window.removeEventListener('scroll', updatePanelPosition, true)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    return
  }

  nextTick(updatePanelPosition)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  clearCloseTimer()
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
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
      <div
        ref="triggerRef"
        class="model-header__path"
        :class="{
          'model-header__path--interactive': hasSwitcher,
          'model-header__path--open': open,
        }"
        :aria-expanded="hasSwitcher ? open : undefined"
        :aria-controls="hasSwitcher ? panelId : undefined"
        @mouseenter="openDropdown"
        @mouseleave="scheduleClose"
      >
        <code class="model-header__path-text">{{ modelPath }}</code>
        <AppIcon
          v-if="hasSwitcher"
          name="chevron-down"
          :size="12"
          :class="['model-header__chevron', { 'model-header__chevron--open': open }]"
        />
      </div>
      <p class="model-header__desc">{{ description }}</p>
    </div>

    <Teleport to="body">
      <div
        v-if="open && hasSwitcher"
        :id="panelId"
        ref="panelRef"
        class="playground-select-panel model-header__panel scrollbar-subtle"
        :style="panelStyle"
        role="listbox"
        @mouseenter="openDropdown"
        @mouseleave="scheduleClose"
      >
        <button
          v-for="opt in switcherOptions"
          :key="opt.id"
          type="button"
          class="playground-select-panel__option"
          :class="{ 'playground-select-panel__option--selected': opt.id === modelId }"
          role="option"
          :aria-selected="opt.id === modelId"
          @click.stop="selectOption(opt.id)"
        >
          <span class="playground-select-panel__option-label">{{ opt.label }}</span>
          <svg
            v-if="opt.id === modelId"
            class="playground-select-panel__check"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 7l3 3 6-6"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </Teleport>
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

.model-header__path--interactive {
  cursor: pointer;
  transition: background 0.15s ease;
}

.model-header__path--interactive:hover,
.model-header__path--open {
  background: rgba(255, 255, 255, 0.1);
}

.model-header__path-text {
  font-family: inherit;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-header__chevron {
  flex-shrink: 0;
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.model-header__chevron--open {
  transform: rotate(180deg);
}

.model-header__panel {
  max-height: min(320px, calc(100vh - 120px));
  overflow-y: auto;
}

.model-header__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #9b9dab;
}
</style>
