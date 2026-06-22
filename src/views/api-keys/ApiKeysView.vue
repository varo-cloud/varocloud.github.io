<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NSpin, useDialog, useMessage } from 'naive-ui'
import AppIcon from '@/components/common/AppIcon.vue'
import ApiKeyTableRow from '@/components/api-keys/ApiKeyTableRow.vue'
import { assetUrl } from '@/utils/assetUrl'
import { createApiKey, deleteApiKey, fetchApiKeys } from '@/api/api-keys'
import type { ApiKey } from '@/types'

const router = useRouter()
const { t } = useI18n()
const message = useMessage()
const dialog = useDialog()

const keys = ref<ApiKey[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const creating = ref(false)
const deletingId = ref<string | null>(null)
const showCreateDialog = ref(false)
const keyName = ref('')
const revealedKey = ref('')

async function loadKeys() {
  loading.value = true
  error.value = null

  try {
    keys.value = await fetchApiKeys()
  } catch {
    error.value = t('pages.apiKeys.loadError')
    keys.value = []
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  keyName.value = ''
  showCreateDialog.value = true
}

function closeCreateDialog() {
  if (creating.value) return
  showCreateDialog.value = false
}

async function handleCreateKey() {
  const name = keyName.value.trim()
  if (!name || creating.value) return

  creating.value = true

  try {
    const result = await createApiKey(name)
    showCreateDialog.value = false
    revealedKey.value = result.key
    await loadKeys()
  } catch {
    message.error(t('pages.apiKeys.createError'))
  } finally {
    creating.value = false
  }
}

async function copyRevealedKey() {
  if (!revealedKey.value) return

  try {
    await navigator.clipboard.writeText(revealedKey.value)
    message.success(t('pages.apiKeys.keyRevealCopy'))
  } catch {
    message.error(t('pages.apiKeys.createError'))
  }
}

function dismissRevealBanner() {
  revealedKey.value = ''
}

function handleDeleteKey(id: string) {
  if (deletingId.value) return

  const key = keys.value.find((item) => item.id === id)
  if (!key) return

  dialog.warning({
    title: t('pages.apiKeys.deleteConfirmTitle'),
    content: t('pages.apiKeys.deleteConfirmContent', { name: key.name }),
    positiveText: t('pages.apiKeys.deleteConfirmSubmit'),
    negativeText: t('pages.apiKeys.deleteConfirmCancel'),
    onPositiveClick: async () => {
      deletingId.value = id

      try {
        await deleteApiKey(id)
        message.success(t('pages.apiKeys.deleteSuccess'))
        await loadKeys()
      } catch {
        message.error(t('pages.apiKeys.deleteError'))
        return false
      } finally {
        deletingId.value = null
      }
    },
  })
}

function goToDocs() {
  router.push({ name: 'docs' })
}

onMounted(loadKeys)
</script>

<template>
  <div class="api-keys-page">
    <div class="api-keys-page__inner">
      <header class="api-keys-page__header">
        <div class="api-keys-page__header-main">
          <h1 class="api-keys-page__title">{{ t('pages.apiKeys.title') }}</h1>
          <p class="api-keys-page__description">
            <span>{{ t('pages.apiKeys.description') }}</span>
            <button type="button" class="api-keys-page__help-link" @click="goToDocs">
              {{ t('pages.apiKeys.howToUse') }}
            </button>
          </p>
        </div>
        <button
          v-if="!loading && !error && keys.length > 0"
          type="button"
          class="api-keys-page__create-btn"
          @click="openCreateDialog"
        >
          <AppIcon name="add" :size="16" />
          {{ t('pages.apiKeys.createKey') }}
        </button>
      </header>

      <div v-if="loading" class="api-keys-page__state">
        <NSpin size="large" />
      </div>

      <div v-else-if="error" class="api-keys-page__state">
        <p class="api-keys-page__error">{{ error }}</p>
        <button type="button" class="api-keys-page__retry" @click="loadKeys">
          {{ t('pages.apiKeys.retry') }}
        </button>
      </div>

      <section v-else-if="keys.length === 0" class="api-keys-empty" aria-label="API keys empty state">
        <div class="api-keys-empty__icon-wrap">
          <AppIcon name="key" :size="64" />
        </div>
        <h2 class="api-keys-empty__title">{{ t('pages.apiKeys.emptyTitle') }}</h2>
        <p class="api-keys-empty__description">{{ t('pages.apiKeys.emptyDescription') }}</p>
        <button type="button" class="api-keys-empty__cta" @click="openCreateDialog">
          <AppIcon name="add" :size="16" />
          {{ t('pages.apiKeys.createKey') }}
        </button>
      </section>

      <template v-else>
        <section
          v-if="revealedKey"
          class="api-keys-reveal"
          aria-label="New API key reveal"
        >
          <div class="api-keys-reveal__top">
            <div class="api-keys-reveal__title-wrap">
              <img
                class="api-keys-reveal__icon"
                :src="assetUrl('/assets/icons/check-circle.svg')"
                alt=""
                width="24"
                height="24"
              />
              <p class="api-keys-reveal__title">{{ t('pages.apiKeys.keyCreatedBanner') }}</p>
            </div>
            <p class="api-keys-reveal__warning">⚠ {{ t('pages.apiKeys.shownOnlyOnce') }}</p>
          </div>
          <div class="api-keys-reveal__key-row">
            <code class="api-keys-reveal__key">{{ revealedKey }}</code>
            <div class="api-keys-reveal__actions">
              <button type="button" class="api-keys-reveal__copy" @click="copyRevealedKey">
                {{ t('pages.apiKeys.keyRevealCopy') }}
              </button>
              <button type="button" class="api-keys-reveal__done" @click="dismissRevealBanner">
                {{ t('pages.apiKeys.keyRevealDone') }}
              </button>
            </div>
          </div>
        </section>

        <section class="api-keys-table-section" aria-label="API keys list">
          <h2 class="api-keys-table-section__title">{{ t('pages.apiKeys.keysSectionTitle') }}</h2>
          <div class="api-keys-table" role="table">
            <div class="api-keys-table__header" role="row">
              <span role="columnheader">{{ t('pages.apiKeys.columns.name') }}</span>
              <span role="columnheader">{{ t('pages.apiKeys.columns.key') }}</span>
              <span role="columnheader">{{ t('pages.apiKeys.columns.created') }}</span>
              <span role="columnheader">{{ t('pages.apiKeys.columns.status') }}</span>
              <span role="columnheader">{{ t('pages.apiKeys.columns.usage') }}</span>
              <span role="columnheader">{{ t('pages.apiKeys.columns.lastUsed') }}</span>
              <span class="api-keys-table__header-action" role="columnheader" aria-hidden="true" />
            </div>
            <div class="api-keys-table__body" role="rowgroup">
              <ApiKeyTableRow
                v-for="item in keys"
                :key="item.id"
                :item="item"
                @delete="handleDeleteKey"
              />
            </div>
          </div>
        </section>
      </template>
    </div>

    <Teleport to="body">
      <div
        v-if="showCreateDialog"
        class="api-keys-dialog-backdrop"
        @click.self="closeCreateDialog"
      >
        <div
          class="api-keys-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('pages.apiKeys.createDialogTitle')"
        >
          <h3 class="api-keys-dialog__title">{{ t('pages.apiKeys.createDialogTitle') }}</h3>
          <label class="api-keys-dialog__field">
            <span>{{ t('pages.apiKeys.createDialogNameLabel') }}</span>
            <input
              v-model="keyName"
              type="text"
              :placeholder="t('pages.apiKeys.createDialogNamePlaceholder')"
              @keydown.enter.prevent="handleCreateKey"
            />
          </label>
          <div class="api-keys-dialog__actions">
            <button
              type="button"
              class="api-keys-dialog__cancel"
              :disabled="creating"
              @click="closeCreateDialog"
            >
              {{ t('pages.apiKeys.createDialogCancel') }}
            </button>
            <button
              type="button"
              class="api-keys-empty__cta"
              :disabled="creating || !keyName.trim()"
              @click="handleCreateKey"
            >
              {{ t('pages.apiKeys.createDialogSubmit') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.api-keys-page {
  min-height: calc(100vh - 140px);
}

.api-keys-page__inner {
  max-width: 1360px;
  margin: 0 auto;
  /* fullBleed pulls main under the 80px header — offset to match Figma y≈101 */
  padding: 105px 24px 48px;
}

.api-keys-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.api-keys-page__header-main {
  min-width: 0;
}

.api-keys-page__title {
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 500;
  line-height: 24px;
  color: var(--text-primary);
}

.api-keys-page__description {
  margin: 0;
  max-width: 513px;
  font-size: 14px;
  font-weight: 400;
  line-height: 14px;
  color: var(--text-secondary);
}

.api-keys-page__description span {
  margin-right: 4px;
}

.api-keys-page__help-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-accent);
  font: inherit;
  cursor: pointer;
}

.api-keys-page__help-link:hover {
  text-decoration: underline;
}

.api-keys-page__create-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 126px;
  height: 36px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  background: var(--text-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  cursor: pointer;
}

.api-keys-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 426px;
}

.api-keys-page__error {
  margin: 0;
  color: var(--text-secondary);
}

.api-keys-page__retry {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.api-keys-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 426px;
  padding: 48px 24px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  background: var(--bg-card);
  text-align: center;
}

.api-keys-empty__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  margin-bottom: 20px;
  border-radius: 16px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.api-keys-empty__title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  color: #fff;
}

.api-keys-empty__description {
  margin: 0 0 32px;
  max-width: 392px;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: var(--text-secondary);
}

.api-keys-empty__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 200px;
  height: 40px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  background: var(--text-accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  cursor: pointer;
}

.api-keys-empty__cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.api-keys-reveal {
  margin-bottom: 30px;
  padding: 32px;
  border-radius: 16px;
  background: linear-gradient(173deg, rgba(124, 92, 255, 0.1) 0%, rgba(45, 107, 255, 0.1) 100%);
}

.api-keys-reveal__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.api-keys-reveal__title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.api-keys-reveal__icon {
  flex-shrink: 0;
}

.api-keys-reveal__title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  color: var(--text-primary);
}

.api-keys-reveal__warning {
  flex-shrink: 0;
  margin: 0;
  font-size: 12px;
  line-height: 14px;
  color: #ff9c39;
}

.api-keys-reveal__key-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 0 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.api-keys-reveal__key {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-keys-reveal__actions {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
}

.api-keys-reveal__copy,
.api-keys-reveal__done {
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  line-height: 16px;
  cursor: pointer;
}

.api-keys-reveal__copy {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.api-keys-reveal__done {
  background: #fff;
  color: #222;
}

.api-keys-table-section__title {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-primary);
}

.api-keys-table {
  overflow: hidden;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
  background: var(--bg-card);
}

.api-keys-table__header {
  display: grid;
  grid-template-columns: minmax(90px, 1.1fr) minmax(120px, 2fr) minmax(100px, 1fr) minmax(72px, 0.8fr) minmax(120px, 1.2fr) minmax(90px, 1fr) 32px;
  gap: 12px;
  align-items: center;
  min-height: 50px;
  padding: 0 32px;
  border-bottom: 0.5px solid #2d2d38;
  background: #1b1b28;
  opacity: 0.6;
  font-size: 14px;
  font-weight: 500;
  line-height: 14px;
  color: var(--text-secondary);
}

.api-keys-table__header-action {
  width: 32px;
}

.api-keys-table__body :deep(.api-key-row:last-child) {
  border-bottom: 0;
}

.api-keys-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.6);
}

.api-keys-dialog {
  width: min(100%, 440px);
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-card);
}

.api-keys-dialog__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
}

.api-keys-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.api-keys-dialog__field input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 14px;
}

.api-keys-dialog__field input:focus {
  outline: none;
  border-color: var(--text-accent);
}

.api-keys-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.api-keys-dialog__cancel {
  height: 40px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.api-keys-dialog__cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1023px) {
  .api-keys-table__header {
    display: none;
  }
}

@media (max-width: 767px) {
  .api-keys-page__inner {
    padding: 96px 12px 32px;
  }

  .api-keys-page__header {
    flex-direction: column;
    align-items: stretch;
  }

  .api-keys-page__create-btn {
    width: 100%;
  }

  .api-keys-empty {
    min-height: 360px;
    padding: 32px 16px;
  }

  .api-keys-reveal {
    padding: 20px 16px;
  }

  .api-keys-reveal__top {
    flex-direction: column;
    align-items: flex-start;
  }

  .api-keys-reveal__key-row {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }

  .api-keys-reveal__key {
    white-space: normal;
    word-break: break-all;
  }

  .api-keys-reveal__actions {
    justify-content: flex-end;
  }
}
</style>
