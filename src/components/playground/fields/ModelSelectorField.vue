<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NTooltip } from 'naive-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

export type ModelSelectorOption = {
  id: string
  label: string
  capability?: string
  description?: string
  isHot?: boolean
  isNew?: boolean
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
const PANEL_MAX_HEIGHT = 320
const VIEWPORT_PADDING = 8
const PANEL_GAP = 4

const panelStyle = ref<Record<string, string>>({
  top: '0px',
  left: '0px',
  width: '0px',
  maxHeight: `${PANEL_MAX_HEIGHT}px`,
})
const panelId = useId()

const selectedOption = computed(() => props.options.find((item) => item.id === model.value))

const selectedLabel = computed(() => selectedOption.value?.label ?? '')

// const featuredNewOption = computed(() =>
//   props.options.find((item) => item.isNew && item.id !== model.value),
// )

function capabilityLabel(capability?: string): string {
  if (!capability) return ''
  const key = `pages.models.capabilityBadge.${capability}`
  const translated = t(key)
  return translated === key ? capability : translated
}

function optionFullLabel(opt: ModelSelectorOption): string {
  const cap = capabilityLabel(opt.capability)
  return cap ? `${opt.label} · ${cap}` : opt.label
}

const selectedCapabilityLabel = computed(() => capabilityLabel(selectedOption.value?.capability))

// const featuredNewOptionLabel = computed(() =>
//   featuredNewOption.value ? optionFullLabel(featuredNewOption.value) : '',
// )

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const openBelow = spaceBelow >= spaceAbove
  const availableSpace = (openBelow ? spaceBelow : spaceAbove) - PANEL_GAP
  const maxHeight = Math.min(PANEL_MAX_HEIGHT, Math.max(availableSpace, 120))

  panelStyle.value = openBelow
    ? {
        top: `${rect.bottom + PANEL_GAP}px`,
        bottom: 'auto',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${maxHeight}px`,
      }
    : {
        top: 'auto',
        bottom: `${window.innerHeight - rect.top + PANEL_GAP}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: `${maxHeight}px`,
      }
}

function onViewportScroll(event: Event) {
  if (panelRef.value?.contains(event.target as Node)) return
  updatePanelPosition()
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
    window.removeEventListener('scroll', onViewportScroll, true)
    document.removeEventListener('pointerdown', onDocumentPointerDown)
    return
  }

  nextTick(updatePanelPosition)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', onViewportScroll, true)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', onViewportScroll, true)
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
          <span v-if="selectedCapabilityLabel" class="model-selector__capability">
            {{ selectedCapabilityLabel }}
          </span>
          <span v-if="selectedOption?.isHot" class="model-selector__hot">
            {{ t('pages.aiGenerator.hot') }}
          </span>
          <span v-else-if="selectedOption?.isNew" class="model-selector__new">
            {{ t('pages.aiGenerator.new') }}
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
          <NTooltip
            v-for="opt in options"
            :key="opt.id"
            trigger="hover"
            placement="right"
            :disabled="!opt.description"
          >
            <template #trigger>
              <button
                type="button"
                class="playground-select-panel__option"
                :class="{ 'playground-select-panel__option--selected': opt.id === model }"
                role="option"
                :aria-selected="opt.id === model"
                :aria-label="opt.description ? optionFullLabel(opt) : undefined"
                @click.stop="selectOption(opt.id)"
              >
                <span class="model-selector__option-label">
                  <span class="model-selector__option-name">{{ opt.label }}</span>
                  <span v-if="capabilityLabel(opt.capability)" class="model-selector__capability">
                    {{ capabilityLabel(opt.capability) }}
                  </span>
                  <span v-if="opt.isHot" class="model-selector__hot">{{ t('pages.aiGenerator.hot') }}</span>
                  <span v-else-if="opt.isNew" class="model-selector__new">{{ t('pages.aiGenerator.new') }}</span>
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
            </template>
            <span class="model-selector__tooltip">{{ opt.description }}</span>
          </NTooltip>
        </div>
      </Teleport>
    </div>

    <!--
    <button
      v-if="featuredNewOption"
      type="button"
      class="model-selector__new-hint"
      :disabled="disabled"
      @click="selectOption(featuredNewOption.id)"
    >
      <span class="model-selector__new">{{ t('pages.aiGenerator.new') }}</span>
      <span class="model-selector__new-hint-text">
        {{ t('pages.aiGenerator.newHint', { model: featuredNewOptionLabel }) }}
      </span>
    </button>
    -->
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

.model-selector__capability {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 10px;
  font-weight: 400;
  line-height: 14px;
  color: #9b9dab;
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

.model-selector__new {
  flex-shrink: 0;
  padding: 1px 4px;
  border-radius: 4px;
  background: #06b6d4;
  font-size: 10px;
  font-weight: 400;
  line-height: 12px;
  color: #fff;
}

/*
.model-selector__new-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.08);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.model-selector__new-hint:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.14);
}

.model-selector__new-hint:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-selector__new-hint-text {
  min-width: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #9b9dab;
}
*/

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

.model-selector__tooltip {
  display: block;
  max-width: 280px;
  font-size: 12px;
  line-height: 16px;
}
</style>
