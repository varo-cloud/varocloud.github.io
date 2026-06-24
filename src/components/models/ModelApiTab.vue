<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { ModelFaqItem } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'
import {
  API_CODE_VIEW_MODES,
  buildApiCodeSnippet,
  resolveCreateGenerationUrl,
  resolveGetGenerationUrl,
  type ApiCodeViewMode,
} from '@/utils/playground-request-snippets'
import { buildSchemaParameterRows } from '@/utils/schema-api-docs'
import ModelMarkdown from './ModelMarkdown.vue'

const props = defineProps<{
  schema?: InputSchema
  apiModelId: string
  formValues: SchemaFormValues
  readmeMd?: string
  faq?: ModelFaqItem[]
}>()

const { t } = useI18n()
const message = useMessage()

const codeViewMode = ref<ApiCodeViewMode>('http')
const expandedFaq = ref<number | null>(0)

const parameterRows = computed(() => buildSchemaParameterRows(props.schema))

const codeSnippet = computed(() =>
  buildApiCodeSnippet(codeViewMode.value, props.apiModelId, props.formValues),
)

const hasReadme = computed(() => Boolean(props.readmeMd?.trim()))
const hasFaq = computed(() => (props.faq?.length ?? 0) > 0)
const pollUrl = computed(() => resolveGetGenerationUrl('{id}'))

const codeModeOptions = computed(() =>
  API_CODE_VIEW_MODES.map((mode) => ({
    value: mode,
    label: t(`pages.modelDetail.inputViewModes.${mode}`),
  })),
)

function toggleFaq(index: number) {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

async function copyCodeSnippet() {
  if (!codeSnippet.value) return

  try {
    await navigator.clipboard.writeText(codeSnippet.value)
    message.success(t('pages.modelDetail.codeCopied'))
  } catch {
    message.error(t('pages.modelDetail.copyFailed'))
  }
}
</script>

<template>
  <div class="model-api-tab">
    <section class="model-api-tab__section">
      <div class="model-api-tab__section-head">
        <div>
          <h2 class="model-api-tab__title">{{ t('pages.modelDetail.apiTab.quickStart') }}</h2>
          <p class="model-api-tab__desc">{{ t('pages.modelDetail.apiTab.quickStartDesc') }}</p>
        </div>
      </div>

      <div class="model-api-tab__code-toolbar">
        <div class="model-api-tab__code-tabs" role="tablist">
          <button
            v-for="opt in codeModeOptions"
            :key="opt.value"
            type="button"
            role="tab"
            class="model-api-tab__code-tab"
            :class="{ 'model-api-tab__code-tab--active': codeViewMode === opt.value }"
            :aria-selected="codeViewMode === opt.value"
            @click="codeViewMode = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
        <button type="button" class="model-api-tab__copy" @click="copyCodeSnippet">
          {{ t('pages.modelDetail.copyCode') }}
        </button>
      </div>

      <pre class="model-api-tab__code"><code>{{ codeSnippet }}</code></pre>

      <p class="model-api-tab__hint">
        {{ t('pages.modelDetail.apiTab.submitHint', { url: resolveCreateGenerationUrl() }) }}
      </p>
      <p class="model-api-tab__hint">
        {{ t('pages.modelDetail.apiTab.pollHint', { url: pollUrl }) }}
      </p>
      <p class="model-api-tab__hint model-api-tab__hint--sync">
        {{ t('pages.modelDetail.apiTab.syncHint') }}
      </p>
    </section>

    <section v-if="parameterRows.length" class="model-api-tab__section">
      <h2 class="model-api-tab__title">{{ t('pages.modelDetail.apiTab.parameters') }}</h2>
      <div class="model-api-tab__table-wrap">
        <table class="model-api-tab__table">
          <thead>
            <tr>
              <th>{{ t('pages.modelDetail.apiTab.colName') }}</th>
              <th>{{ t('pages.modelDetail.apiTab.colType') }}</th>
              <th>{{ t('pages.modelDetail.apiTab.colRequired') }}</th>
              <th>{{ t('pages.modelDetail.apiTab.colDefault') }}</th>
              <th>{{ t('pages.modelDetail.apiTab.colRange') }}</th>
              <th>{{ t('pages.modelDetail.apiTab.colDescription') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in parameterRows" :key="row.name">
              <td><code>{{ row.name }}</code></td>
              <td>{{ row.type }}</td>
              <td>{{ row.required ? t('pages.modelDetail.apiTab.yes') : t('pages.modelDetail.apiTab.no') }}</td>
              <td>{{ row.defaultValue }}</td>
              <td>{{ row.range }}</td>
              <td>{{ row.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="hasReadme" class="model-api-tab__section">
      <h2 class="model-api-tab__title">{{ t('pages.modelDetail.apiTab.readme') }}</h2>
      <ModelMarkdown :content="readmeMd" />
    </section>

    <section v-if="hasFaq" class="model-api-tab__section">
      <h2 class="model-api-tab__title">{{ t('pages.modelDetail.apiTab.faq') }}</h2>
      <div class="model-api-tab__faq">
        <div v-for="(item, index) in faq" :key="index" class="model-api-tab__faq-item">
          <button
            type="button"
            class="model-api-tab__faq-trigger"
            :aria-expanded="expandedFaq === index"
            @click="toggleFaq(index)"
          >
            <span>{{ item.question }}</span>
            <svg
              class="model-api-tab__faq-chevron"
              :class="{ 'model-api-tab__faq-chevron--open': expandedFaq === index }"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <p v-if="expandedFaq === index" class="model-api-tab__faq-answer">{{ item.answer }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.model-api-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1360px;
  margin: 0 auto;
}

.model-api-tab__section {
  padding: 24px;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
}

.model-api-tab__section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.model-api-tab__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #ebf4fb;
}

.model-api-tab__desc {
  margin: 0;
  font-size: 14px;
  color: #9b9dab;
  line-height: 1.6;
}

.model-api-tab__code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.model-api-tab__code-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-api-tab__code-tab {
  padding: 6px 12px;
  border: 0.5px solid #2d2d38;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #9b9dab;
  cursor: pointer;
}

.model-api-tab__code-tab--active {
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
}

.model-api-tab__copy {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 0.5px solid #2d2d38;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #ebf4fb;
  cursor: pointer;
}

.model-api-tab__code {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background: #0a0a0e;
  border: 0.5px solid #2d2d38;
  border-radius: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #c8d4de;
  white-space: pre-wrap;
  word-break: break-word;
}

.model-api-tab__hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #9b9dab;
  line-height: 1.6;
}

.model-api-tab__hint--sync {
  color: #06b6d4;
}

.model-api-tab__table-wrap {
  overflow-x: auto;
}

.model-api-tab__table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
}

.model-api-tab__table th,
.model-api-tab__table td {
  padding: 10px 12px;
  border: 0.5px solid #2d2d38;
  text-align: left;
  vertical-align: top;
}

.model-api-tab__table th {
  background: rgba(255, 255, 255, 0.04);
  color: #ebf4fb;
  font-weight: 600;
}

.model-api-tab__table td {
  color: #c8d4de;
}

.model-api-tab__table code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: #06b6d4;
}

.model-api-tab__faq {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-api-tab__faq-item {
  border: 0.5px solid #2d2d38;
  border-radius: 12px;
  overflow: hidden;
}

.model-api-tab__faq-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.02);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #ebf4fb;
  text-align: left;
  cursor: pointer;
}

.model-api-tab__faq-chevron {
  flex-shrink: 0;
  color: #9b9dab;
  transition: transform 0.15s ease;
}

.model-api-tab__faq-chevron--open {
  transform: rotate(180deg);
}

.model-api-tab__faq-answer {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 14px;
  line-height: 1.6;
  color: #9b9dab;
}
</style>
