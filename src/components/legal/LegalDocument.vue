<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { marked } from 'marked'
import '@/styles/legal-document.css'

const props = defineProps<{
  content: string
  pageTitle?: string
}>()

const SITE_TITLE = 'Varo.cloud — The Port of AI Value'

const renderer = new marked.Renderer()

renderer.link = ({ href, title, text }) => {
  const safeHref = href ?? '#'
  const isExternal =
    safeHref.startsWith('http') ||
    safeHref.startsWith('mailto:') ||
    safeHref.startsWith('//')
  const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
  const titleAttr = title ? ` title="${title}"` : ''
  const classAttr = safeHref.startsWith('http') ? ' class="url"' : ''
  return `<a href="${safeHref}"${classAttr}${titleAttr}${target}>${text}</a>`
}

marked.setOptions({
  gfm: true,
  breaks: true,
  renderer,
})

const html = computed(() => {
  if (!props.content.trim()) return ''
  return marked.parse(props.content) as string
})

onMounted(() => {
  if (props.pageTitle) {
    document.title = props.pageTitle
  }
})

onUnmounted(() => {
  document.title = SITE_TITLE
})
</script>

<template>
  <article class="legal-document">
    <div v-if="html" class="legal-document__write" v-html="html" />
  </article>
</template>
