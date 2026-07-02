<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PLAYGROUND_INPUT_VIEW_MODES,
  type PlaygroundInputViewMode,
} from '@/utils/playground-request-snippets'
import AppIcon from '@/components/common/AppIcon.vue'

const model = defineModel<PlaygroundInputViewMode>({ required: true })

const { t } = useI18n()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', left: '0px', minWidth: '0px' })
const panelId = useId()

const options = computed(() =>
  PLAYGROUND_INPUT_VIEW_MODES.map((mode) => ({
    value: mode,
    label: t(`pages.modelDetail.inputViewModes.${mode}`),
  })),
)

const selectedLabel = computed(() => {
  const found = options.value.find((item) => item.value === model.value)
  return found?.label ?? model.value
})

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 140)}px`,
  }
}

function toggleOpen() {
  open.value = !open.value
}

function selectOption(value: PlaygroundInputViewMode) {
  model.value = value
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
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})
</script>

<template>
  <div class="input-view-select" :class="{ 'input-view-select--open': open }">
    <button
      ref="triggerRef"
      type="button"
      class="input-view-select__trigger"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click.stop="toggleOpen"
    >
      <span class="input-view-select__value">{{ selectedLabel }}</span>
      <AppIcon
        name="chevron-down"
        :size="16"
        :class="['input-view-select__chevron', { 'input-view-select__chevron--open': open }]"
      />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        :id="panelId"
        ref="panelRef"
        class="playground-select-panel scrollbar-subtle"
        :style="panelStyle"
        role="listbox"
      >
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="playground-select-panel__option"
          :class="{ 'playground-select-panel__option--selected': opt.value === model }"
          role="option"
          :aria-selected="opt.value === model"
          @click.stop="selectOption(opt.value)"
        >
          <span class="playground-select-panel__option-label">{{ opt.label }}</span>
          <svg
            v-if="opt.value === model"
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
  </div>
</template>

<style scoped>
.input-view-select {
  position: relative;
}

.input-view-select--open {
  z-index: 1;
}

.input-view-select__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  /* min-width: 68px; */
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 14px;
  color: #ebf4fb;
  cursor: pointer;
}

.input-view-select__value {
  white-space: nowrap;
}

.input-view-select__chevron {
  flex-shrink: 0;
  color: #ebf4fb;
  transition: transform 0.15s ease;
}

.input-view-select__chevron--open {
  transform: rotate(180deg);
}
</style>
