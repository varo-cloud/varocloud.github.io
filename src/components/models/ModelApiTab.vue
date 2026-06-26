<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { AnalyticsEvents, trackEvent } from '@/analytics'
import AppIcon from '@/components/common/AppIcon.vue'
import HighlightedCodeBlock from '@/components/common/HighlightedCodeBlock.vue'
import type { ModelFaqItem } from '@/types'
import type { InputSchema, SchemaFormValues } from '@/types/schema'
import type { CodeHighlightLanguage } from '@/utils/code-highlight'
import {
  API_CODE_VIEW_MODES,
  buildApiPollSnippet,
  buildApiSubmitSnippet,
  resolveCreateGenerationUrl,
  resolveGetGenerationUrl,
  type ApiCodeViewMode,
} from '@/utils/playground-request-snippets'
import { buildSchemaParameterRows } from '@/utils/schema-api-docs'
import ModelMarkdown from './ModelMarkdown.vue'

type ApiSectionId = 'quick-start' | 'query-result' | 'parameters' | 'readme' | 'faq'

const props = defineProps<{
  schema?: InputSchema
  apiModelId: string
  modelName: string
  formValues: SchemaFormValues
  readmeMd?: string
  faq?: ModelFaqItem[]
}>()

const { t } = useI18n()
const message = useMessage()

const codeViewMode = ref<ApiCodeViewMode>('http')
const expandedFaq = ref<number | null>(0)
const activeSection = ref<ApiSectionId>('quick-start')

const parameterRows = computed(() => buildSchemaParameterRows(props.schema))

const submitCodeSnippet = computed(() =>
  buildApiSubmitSnippet(codeViewMode.value, props.apiModelId, props.formValues),
)

const pollCodeSnippet = computed(() => buildApiPollSnippet(codeViewMode.value))

const codeLanguage = computed<CodeHighlightLanguage>(() => {
  if (codeViewMode.value === 'http') return 'http'
  if (codeViewMode.value === 'python') return 'python'
  return 'javascript'
})

const hasReadme = computed(() => Boolean(props.readmeMd?.trim()))
const hasFaq = computed(() => (props.faq?.length ?? 0) > 0)
const pollUrl = computed(() => resolveGetGenerationUrl('{id}'))

const codeModeOptions = computed(() =>
  API_CODE_VIEW_MODES.map((mode) => ({
    value: mode,
    label: t(`pages.modelDetail.inputViewModes.${mode}`),
  })),
)

const navSections = computed(() => {
  const sections: Array<{
    id: ApiSectionId
    label: string
    children?: Array<{ id: ApiSectionId; label: string }>
  }> = [
    {
      id: 'quick-start',
      label: t('pages.modelDetail.apiTab.quickStart'),
      children: [
        { id: 'quick-start', label: t('pages.modelDetail.apiTab.submitRequest') },
        { id: 'query-result', label: t('pages.modelDetail.apiTab.queryResult') },
      ],
    },
  ]

  if (parameterRows.value.length) {
    sections.push({ id: 'parameters', label: t('pages.modelDetail.apiTab.parameters') })
  }
  if (hasReadme.value) {
    sections.push({ id: 'readme', label: t('pages.modelDetail.apiTab.readme') })
  }
  if (hasFaq.value) {
    sections.push({ id: 'faq', label: t('pages.modelDetail.apiTab.faq') })
  }

  return sections
})

let sectionObserver: IntersectionObserver | null = null

function scrollToSection(id: ApiSectionId) {
  activeSection.value = id
  document.getElementById(`api-section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function toggleFaq(index: number) {
  expandedFaq.value = expandedFaq.value === index ? null : index
}

async function copyText(text: string, copyTarget: 'submit' | 'poll') {
  if (!text) return

  try {
    await navigator.clipboard.writeText(text)
    message.success(t('pages.modelDetail.codeCopied'))
    trackEvent(AnalyticsEvents.API_CODE_COPY, {
      source: 'model_api_tab',
      code_type: codeViewMode.value,
      copy_target: copyTarget,
      model_name: props.modelName,
    })
  } catch {
    message.error(t('pages.modelDetail.copyFailed'))
  }
}

onMounted(() => {
  nextTick(() => {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        const topEntry = visible[0]
        if (!topEntry) return

        const id = topEntry.target.id.replace('api-section-', '') as ApiSectionId
        activeSection.value = id
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 },
    )

    for (const section of navSections.value) {
      const targets = [section, ...(section.children ?? [])]
      for (const target of targets) {
        const el = document.getElementById(`api-section-${target.id}`)
        if (el) sectionObserver.observe(el)
      }
    }
  })
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  sectionObserver = null
})
</script>

<template>
  <div class="model-api-tab">
    <aside class="model-api-tab__sidebar">
      <p class="model-api-tab__sidebar-title">{{ modelName }}</p>

      <nav class="model-api-tab__nav" aria-label="API documentation">
        <div v-for="(section, index) in navSections" :key="section.id" class="model-api-tab__nav-group">
          <button
            type="button"
            class="model-api-tab__nav-item"
            :class="{
              'model-api-tab__nav-item--active':
                activeSection === section.id ||
                section.children?.some((child) => child.id === activeSection),
            }"
            @click="scrollToSection(section.id)"
          >
            {{ index + 1 }}. {{ section.label }}
          </button>
          <div v-if="section.children?.length" class="model-api-tab__nav-subitems">
            <button
              v-for="child in section.children"
              :key="`${section.id}-${child.id}`"
              type="button"
              class="model-api-tab__nav-subitem"
              :class="{ 'model-api-tab__nav-subitem--active': activeSection === child.id }"
              @click="scrollToSection(child.id)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </nav>
    </aside>

    <div class="model-api-tab__main">
      <div class="model-api-tab__code-header">
        <p class="model-api-tab__code-label">{{ t('pages.modelDetail.apiTab.codeExample') }}</p>
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
      </div>

      <h1 class="model-api-tab__hero-title">{{ modelName }}</h1>
      <p class="model-api-tab__hero-desc">{{ t('pages.modelDetail.apiTab.quickStartDesc') }}</p>

      <div class="model-api-tab__divider" aria-hidden="true" />

      <section class="model-api-tab__section">
        <h2 class="model-api-tab__section-title">
          1. {{ t('pages.modelDetail.apiTab.quickStart') }}
        </h2>
        <div :id="`api-section-quick-start`" class="model-api-tab__subsection">
          <h3 class="model-api-tab__subsection-title">{{ t('pages.modelDetail.apiTab.submitRequest') }}</h3>
          <p class="model-api-tab__text">
            {{ t('pages.modelDetail.apiTab.submitHint', { url: resolveCreateGenerationUrl() }) }}
          </p>

          <div class="model-api-tab__code-wrap">
            <HighlightedCodeBlock :code="submitCodeSnippet" :language="codeLanguage" />
            <button
              type="button"
              class="model-api-tab__code-copy"
              :aria-label="t('pages.modelDetail.copyCode')"
              @click="copyText(submitCodeSnippet, 'submit')"
            >
              <AppIcon name="copy" :size="16" />
            </button>
          </div>
        </div>

        <div :id="`api-section-query-result`" class="model-api-tab__subsection">
          <h3 class="model-api-tab__subsection-title">{{ t('pages.modelDetail.apiTab.queryResult') }}</h3>
          <p class="model-api-tab__text">
            {{ t('pages.modelDetail.apiTab.pollHint', { url: pollUrl }) }}
          </p>

          <div class="model-api-tab__code-wrap">
            <HighlightedCodeBlock :code="pollCodeSnippet" :language="codeLanguage" />
            <button
              type="button"
              class="model-api-tab__code-copy"
              :aria-label="t('pages.modelDetail.copyCode')"
              @click="copyText(pollCodeSnippet, 'poll')"
            >
              <AppIcon name="copy" :size="16" />
            </button>
          </div>
        </div>

        <p class="model-api-tab__text model-api-tab__text--accent">
          {{ t('pages.modelDetail.apiTab.syncHint') }}
        </p>
      </section>

      <template v-if="parameterRows.length">
        <div class="model-api-tab__divider" aria-hidden="true" />

        <section :id="`api-section-parameters`" class="model-api-tab__section">
          <h2 class="model-api-tab__section-title">
            {{ navSections.findIndex((s) => s.id === 'parameters') + 1 }}.
            {{ t('pages.modelDetail.apiTab.parameters') }}
          </h2>
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
      </template>

      <template v-if="hasReadme">
        <div class="model-api-tab__divider" aria-hidden="true" />

        <section :id="`api-section-readme`" class="model-api-tab__section">
          <h2 class="model-api-tab__section-title">
            {{ navSections.findIndex((s) => s.id === 'readme') + 1 }}.
            {{ t('pages.modelDetail.apiTab.readme') }}
          </h2>
          <ModelMarkdown :content="readmeMd" />
        </section>
      </template>

      <template v-if="hasFaq">
        <div class="model-api-tab__divider" aria-hidden="true" />

        <section :id="`api-section-faq`" class="model-api-tab__section">
          <h2 class="model-api-tab__section-title">
            {{ navSections.findIndex((s) => s.id === 'faq') + 1 }}.
            {{ t('pages.modelDetail.apiTab.faq') }}
          </h2>
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
      </template>
    </div>
  </div>
</template>

<style scoped>
.model-api-tab {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  max-width: 1360px;
  margin: 0 auto;
}

.model-api-tab__sidebar {
  flex: 0 0 328px;
  width: 328px;
  position: sticky;
  top: 101px;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid #2d2d38;
  border-radius: 16px;
}

.model-api-tab__sidebar-title {
  margin: 0 0 24px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
}

.model-api-tab__nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.model-api-tab__nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-api-tab__nav-subitems {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
}

.model-api-tab__nav-item,
.model-api-tab__nav-subitem {
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease;
}

.model-api-tab__nav-item {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #9b9dab;
}

.model-api-tab__nav-item--active {
  color: #06b6d4;
}

.model-api-tab__nav-item:hover:not(.model-api-tab__nav-item--active) {
  color: #ebf4fb;
}

.model-api-tab__nav-item--active:hover {
  color: #22d3ee;
}

.model-api-tab__nav-subitem {
  padding: 2px 0;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: #9b9dab;
}

.model-api-tab__nav-group:has(.model-api-tab__nav-item--active) .model-api-tab__nav-subitem:not(.model-api-tab__nav-subitem--active) {
  color: #c4c8d4;
}

.model-api-tab__nav-subitem--active {
  color: #ebf4fb;
}

.model-api-tab__nav-subitem:hover:not(.model-api-tab__nav-subitem--active) {
  color: #d8dce6;
}

.model-api-tab__nav-subitem--active:hover {
  color: #ebf4fb;
}

.model-api-tab__main {
  flex: 1;
  min-width: 0;
  padding: 24px;
  background: #13131c;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.model-api-tab__code-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

.model-api-tab__code-label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: #ebf4fb;
}

.model-api-tab__code-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.model-api-tab__code-tab {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 16px;
  color: #9b9dab;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.model-api-tab__code-tab--active {
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
}

.model-api-tab__hero-title {
  margin: 0 0 12px;
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
  color: #ebf4fb;
}

.model-api-tab__hero-desc {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
}

.model-api-tab__divider {
  height: 1px;
  margin: 32px 0;
  background: rgba(255, 255, 255, 0.1);
}

.model-api-tab__section-title {
  margin: 0 0 16px;
  font-size: 24px;
  font-weight: 600;
  line-height: 24px;
  color: #ebf4fb;
}

.model-api-tab__subsection-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
  color: #ebf4fb;
}

.model-api-tab__subsection {
  margin-bottom: 24px;
}

.model-api-tab__subsection:last-of-type {
  margin-bottom: 16px;
}

.model-api-tab__text {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: #ebf4fb;
}

.model-api-tab__text--accent {
  color: #06b6d4;
}

.model-api-tab__code-wrap {
  position: relative;
  margin: 16px 0;
}

.model-api-tab__code-wrap :deep(.highlighted-code-block) {
  min-height: 80px;
  max-height: none;
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: #0a0a0e;
}

.model-api-tab__code-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: #ebf4fb;
  cursor: pointer;
  transition: background 0.15s ease;
}

.model-api-tab__code-copy:hover {
  background: rgba(255, 255, 255, 0.12);
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

@media (max-width: 960px) {
  .model-api-tab {
    flex-direction: column;
  }

  .model-api-tab__sidebar {
    position: static;
    flex: none;
    width: 100%;
  }
}
</style>
