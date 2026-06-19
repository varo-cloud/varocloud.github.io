<script setup lang="ts">
import { ref, watch } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'

const model = defineModel<string>({ required: true })

const props = defineProps<{
  label: string
  required?: boolean
  description?: string
  hint?: string
  compact?: boolean
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

function openPicker() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  model.value = previewUrl.value
}

function clearImage() {
  if (previewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = null
  model.value = ''
}

function onUrlInput() {
  if (model.value.startsWith('http')) {
    previewUrl.value = model.value
  } else if (!model.value) {
    previewUrl.value = null
  }
}

watch(
  () => model.value,
  (val) => {
    if (val?.startsWith('http')) {
      previewUrl.value = val
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="image-field" :class="{ 'image-field--compact': compact }">
    <SchemaFieldLabel
      :label="label"
      :required="required"
      :description="description"
      :counter="model ? '1' : '0'"
    />

    <div class="image-field__box" :class="{ 'image-field__box--compact': compact }">
      <div class="image-field__url-row">
        <input
          v-model="model"
          type="text"
          class="image-field__url"
          placeholder="https://example.com/image.png"
          @input="onUrlInput"
        />
        <button type="button" class="image-field__upload-btn" @click="openPicker">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M4 14l3.5-3.5 2.5 2.5L14 9l2 2v3H4v-1.5zM14 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
              fill="currentColor"
            />
          </svg>
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      </div>

      <p class="image-field__drop-hint">Drag &amp; drop or click to upload</p>

      <div v-if="previewUrl || model" class="image-field__preview-wrap">
        <img
          v-if="previewUrl || model.startsWith('http')"
          :src="previewUrl || model"
          alt=""
          class="image-field__preview"
        />
        <button type="button" class="image-field__clear" aria-label="Remove image" @click="clearImage">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <p v-if="hint" class="image-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.image-field__box {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: #0a0a0e;
  padding: 8px;
}

.image-field__box--compact {
  min-height: 88px;
}

.image-field__url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0 8px;
  height: 40px;
}

.image-field--compact .image-field__url-row {
  background: #21212a;
}

.image-field__url {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12px;
  color: #ebf4fb;
  outline: none;
  min-width: 0;
}

.image-field__url::placeholder {
  opacity: 0.2;
  color: #fff;
}

.image-field__upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  color: #ebf4fb;
  cursor: pointer;
}

.image-field__drop-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 14px;
}

.image-field__preview-wrap {
  position: relative;
  margin-top: 8px;
  width: 100px;
  height: 65px;
}

.image-field__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.image-field__clear {
  position: absolute;
  top: 50%;
  right: -28px;
  transform: translateY(-50%);
  display: inline-flex;
  padding: 0;
  border: none;
  background: none;
  color: #9b9dab;
  cursor: pointer;
}

.image-field__hint {
  margin: 8px 0 0;
  font-size: 10px;
  color: #9b9dab;
  line-height: 14px;
}
</style>
