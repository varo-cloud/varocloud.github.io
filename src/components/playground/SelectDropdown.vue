<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

export type SelectDropdownOption = {
  label: string
  value: string | number
}

const model = defineModel<string | number>({ required: true })

const props = defineProps<{
  options: SelectDropdownOption[]
  invalid?: boolean
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', left: '0px', width: '0px' })

const panelId = useId()

const selectedLabel = computed(() => {
  const found = props.options.find((item) => item.value === model.value)
  return found?.label ?? String(model.value ?? '')
})

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  }
}

function toggleOpen() {
  open.value = !open.value
}

function selectOption(value: string | number) {
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
  <div
    class="select-dropdown"
    :class="{ 'select-dropdown--open': open, 'select-dropdown--invalid': invalid }"
  >
    <button
      ref="triggerRef"
      type="button"
      class="select-dropdown__trigger"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click.stop="toggleOpen"
    >
      <span class="select-dropdown__value">{{ selectedLabel }}</span>
      <svg
        class="select-dropdown__chevron"
        :class="{ 'select-dropdown__chevron--open': open }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        :id="panelId"
        ref="panelRef"
        class="playground-select-panel"
        :style="panelStyle"
        role="listbox"
      >
        <button
          v-for="opt in options"
          :key="String(opt.value)"
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
.select-dropdown {
  position: relative;
}

.select-dropdown--open {
  z-index: 1;
}

.select-dropdown__trigger {
  position: relative;
  width: 100%;
  height: 40px;
  padding: 0 36px 0 12px;
  border: 0.5px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
  text-align: left;
  outline: none;
}

.select-dropdown__value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-dropdown__chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.select-dropdown__chevron--open {
  transform: translateY(-50%) rotate(180deg);
}

.select-dropdown--invalid .select-dropdown__trigger {
  border-color: #f87171;
}
</style>

<!-- Teleport 到 body 的面板使用全局样式，避免 scoped 失效 + 保证不透明背景 -->
<style>
.playground-select-panel {
  position: fixed;
  z-index: 9999;
  padding: 8px;
  border: 0.5px solid #2d2d38;
  border-radius: 8px;
  background: #13131c;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
}

.playground-select-panel__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: #ebf4fb;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;
}

.playground-select-panel__option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.playground-select-panel__option--selected {
  background: rgba(255, 255, 255, 0.06);
}

.playground-select-panel__option--selected:hover {
  background: rgba(255, 255, 255, 0.12);
}

.playground-select-panel__option-label {
  min-width: 0;
}

.playground-select-panel__check {
  flex-shrink: 0;
  color: #ebf4fb;
}
</style>
