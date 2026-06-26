import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import { useAppMessage } from '@/composables/useAppMessage'
import { uploadFile } from '@/api/upload'
import { useUserStore } from '@/stores/user'
import type { UploadKind } from '@/types'

interface UseMediaUploadOptions {
  model: Ref<string>
  kind: UploadKind
  mimePrefix?: string
}

export function useMediaUpload({ model, kind, mimePrefix }: UseMediaUploadOptions) {
  const { t } = useI18n()
  const { push } = useLocaleRouter()
  const message = useAppMessage()
  const userStore = useUserStore()

  const previewUrl = ref<string | null>(null)
  const uploading = ref(false)
  const uploadError = ref<string | null>(null)
  let localPreviewUrl: string | null = null

  function revokeLocalPreview() {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      localPreviewUrl = null
    }
  }

  function setPreviewFromValue(val: string) {
    if (!val) {
      if (!uploading.value) {
        previewUrl.value = null
      }
      return
    }

    if (val.startsWith('http') || val.startsWith('/') || val.startsWith('blob:')) {
      previewUrl.value = val
    }
  }

  async function applyFile(file: File) {
    if (mimePrefix && !file.type.startsWith(mimePrefix)) {
      uploadError.value = t('pages.modelDetail.upload.invalidType')
      return
    }

    if (!userStore.isLoggedIn) {
      push({ name: 'auth' })
      return
    }

    revokeLocalPreview()
    localPreviewUrl = URL.createObjectURL(file)
    previewUrl.value = localPreviewUrl
    uploading.value = true
    uploadError.value = null

    try {
      const result = await uploadFile(file, kind)
      model.value = result.url
      revokeLocalPreview()
      previewUrl.value = result.url
    } catch (error) {
      uploadError.value =
        error instanceof Error ? error.message : t('pages.modelDetail.upload.failed')
      message.error(uploadError.value)
      revokeLocalPreview()
      previewUrl.value = null
      model.value = ''
    } finally {
      uploading.value = false
    }
  }

  function clearMedia() {
    revokeLocalPreview()
    previewUrl.value = null
    model.value = ''
    uploadError.value = null
  }

  function onUrlInput() {
    uploadError.value = null
    revokeLocalPreview()
    setPreviewFromValue(model.value)
  }

  watch(
    () => model.value,
    (val) => {
      if (uploading.value) return
      setPreviewFromValue(val)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    revokeLocalPreview()
  })

  return {
    previewUrl,
    uploading,
    uploadError,
    applyFile,
    clearMedia,
    onUrlInput,
  }
}
