<script setup lang="ts">
import LegalDocument from '@/components/legal/LegalDocument.vue'
import privacyContent from '../../../隐私政策文件/Varo隐私政策.md?raw'
</script>

<template>
  <LegalDocument
    :content="privacyContent"
    page-title="Varo.cloud Privacy Policy"
  />
</template>
