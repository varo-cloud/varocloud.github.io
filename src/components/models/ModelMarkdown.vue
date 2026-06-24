<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content?: string
}>()

marked.setOptions({
  gfm: true,
  breaks: true,
})

const html = computed(() => {
  if (!props.content?.trim()) return ''
  return marked.parse(props.content) as string
})
</script>

<template>
  <div v-if="html" class="model-markdown" v-html="html" />
</template>

<style scoped>
.model-markdown {
  color: #c8d4de;
  font-size: 14px;
  line-height: 1.7;
}

.model-markdown :deep(h2) {
  margin: 28px 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #ebf4fb;
}

.model-markdown :deep(h2:first-child) {
  margin-top: 0;
}

.model-markdown :deep(h3) {
  margin: 20px 0 10px;
  font-size: 15px;
  font-weight: 600;
  color: #ebf4fb;
}

.model-markdown :deep(p) {
  margin: 0 0 12px;
}

.model-markdown :deep(ul) {
  margin: 0 0 12px;
  padding-left: 20px;
}

.model-markdown :deep(li) {
  margin-bottom: 6px;
}

.model-markdown :deep(strong) {
  color: #ebf4fb;
  font-weight: 600;
}

.model-markdown :deep(table) {
  width: 100%;
  margin: 12px 0 16px;
  border-collapse: collapse;
  font-size: 13px;
}

.model-markdown :deep(th),
.model-markdown :deep(td) {
  padding: 10px 12px;
  border: 0.5px solid #2d2d38;
  text-align: left;
}

.model-markdown :deep(th) {
  background: rgba(255, 255, 255, 0.04);
  color: #ebf4fb;
  font-weight: 600;
}

.model-markdown :deep(hr) {
  margin: 24px 0;
  border: none;
  border-top: 0.5px solid #2d2d38;
}
</style>
