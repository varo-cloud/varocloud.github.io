<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/common/AppIcon.vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

export type ModelSelectorOption = {
  id: string
  label: string
  isHot?: boolean
}

const model = defineModel<string>({ required: true })

const props = defineProps<{
  options: ModelSelectorOption[]
  disabled?: boolean
}>()

const { t } = useI18n()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref({ top: '0px', left: '0px', width: '0px' })
const panelId = useId()

const selectedOption = computed(() => props.options.find((item) => item.id === model.value))

const selectedLabel = computed(() => selectedOption.value?.label ?? '')

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
  if (props.disabled) return
  open.value = !open.value
}

function selectOption(id: string) {
  model.value = id
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
  <div class="model-selector-field">
    <SchemaFieldLabel :label="t('pages.aiGenerator.model')" />
    <div class="model-selector" :class="{ 'model-selector--open': open }">
      <button
        ref="triggerRef"
        type="button"
        class="model-selector__trigger"
        :disabled="disabled"
        :aria-expanded="open"
        :aria-controls="panelId"
        @click.stop="toggleOpen"
      >
        <span class="model-selector__value">
          <span class="model-selector__name">{{ selectedLabel }}</span>
          <span v-if="selectedOption?.isHot" class="model-selector__hot">
            {{ t('pages.aiGenerator.hot') }}
          </span>
        </span>
        <AppIcon
          name="chevron-down"
          :size="16"
          :class="['model-selector__chevron', { 'model-selector__chevron--open': open }]"
        />
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
            :key="opt.id"
            type="button"
            class="playground-select-panel__option"
            :class="{ 'playground-select-panel__option--selected': opt.id === model }"
            role="option"
            :aria-selected="opt.id === model"
            @click.stop="selectOption(opt.id)"
          >
            <span class="model-selector__option-label">
              <span class="model-selector__option-name">{{ opt.label }}</span>
              <span v-if="opt.isHot" class="model-selector__hot">{{ t('pages.aiGenerator.hot') }}</span>
            </span>
            <svg
              v-if="opt.id === model"
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
  </div>
</template>

<style scoped>
.model-selector-field {
  margin-bottom: 20px;
}

.model-selector {
  position: relative;
}

.model-selector--open {
  z-index: 1;
}

.model-selector__trigger {
  position: relative;
  display: flex;
  align-items: center;
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

.model-selector__trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-selector__value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.model-selector__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-selector__hot {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 4px;
  background: #ff9800;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  color: #fff;
}

.model-selector__chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.model-selector__chevron--open {
  transform: translateY(-50%) rotate(180deg);
}

.model-selector__option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.model-selector__option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
