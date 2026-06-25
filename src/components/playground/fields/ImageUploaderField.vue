<script setup lang="ts">
import { ref } from 'vue'
import SchemaFieldLabel from '../SchemaFieldLabel.vue'
import SchemaFieldError from '../SchemaFieldError.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useMediaUpload } from '@/composables/useMediaUpload'

const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  required?: boolean
  description?: string
  hint?: string
  compact?: boolean
  showLabel?: boolean
  invalid?: boolean
  errorMessage?: string
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const { previewUrl, uploading, uploadError, applyFile, clearMedia, onUrlInput } = useMediaUpload({
  model,
  kind: 'image',
  mimePrefix: 'image/',
})

function openPicker() {
  if (uploading.value) return
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  void applyFile(file)
  input.value = ''
}
</script>

<template>
  <div class="image-field" :class="{ 'image-field--compact': compact, 'image-field--invalid': invalid }">
    <SchemaFieldLabel
      v-if="showLabel !== false"
      :label="label"
      :required="required"
      :description="description"
      :counter="model ? '1' : '0'"
      :invalid="invalid"
    />

    <div
      class="image-field__box"
      :class="{
        'image-field__box--compact': compact,
        'image-field__box--uploading': uploading,
        'image-field__box--invalid': invalid,
      }"
    >
      <div class="image-field__url-row">
        <input
          v-model="model"
          type="text"
          class="image-field__url"
          placeholder="https://example.com/image.png"
          :disabled="uploading"
          @input="onUrlInput"
        />
        <button
          type="button"
          class="image-field__upload-btn"
          :disabled="uploading"
          @click="openPicker"
        >
          <AppIcon name="image-add-line" :size="20" />
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onFileChange" />
      </div>

      <p class="image-field__drop-hint">
        {{ uploading ? $t('pages.modelDetail.upload.uploading') : 'Drag & drop or click to upload' }}
      </p>

      <p v-if="uploadError" class="image-field__error">{{ uploadError }}</p>

      <div v-if="previewUrl || model" class="image-field__preview-row">
        <div class="image-field__preview-wrap">
          <img
            v-if="previewUrl || model.startsWith('http') || model.startsWith('/')"
            :src="previewUrl || model"
            alt=""
            class="image-field__preview"
          />
        </div>
        <button
          type="button"
          class="image-field__clear"
          aria-label="Remove image"
          :disabled="uploading"
          @click="clearMedia"
        >
          <AppIcon name="close" :size="20" />
        </button>
      </div>
    </div>

    <p v-if="hint" class="image-field__hint">{{ hint }}</p>
    <SchemaFieldError v-if="invalid && errorMessage" :message="errorMessage" />
  </div>
</template>

<style scoped>
.image-field__box {
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: #0a0a0e;
  padding: 8px;
  transition: border-color 0.15s ease;
}

.image-field__box--invalid {
  border: 1px solid #f87171;
}

.image-field__box--compact {
  min-height: 88px;
}

.image-field__box--uploading {
  opacity: 0.75;
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

.image-field__url:disabled {
  opacity: 0.6;
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

.image-field__upload-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.image-field__drop-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #9b9dab;
  line-height: 14px;
}

.image-field__error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #f87171;
  line-height: 14px;
}

.image-field__preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.image-field__preview-wrap {
  width: 100px;
  height: 65px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #21212a;
}

.image-field__preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-field__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  color: #ebf4fb;
  cursor: pointer;
  flex-shrink: 0;
}

.image-field__clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-field__hint {
  margin: 8px 0 0;
  font-size: 10px;
  color: #9b9dab;
  line-height: 14px;
}
</style>
