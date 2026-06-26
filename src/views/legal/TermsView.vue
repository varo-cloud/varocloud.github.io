<script setup lang="ts">
import LegalDocument from '@/components/legal/LegalDocument.vue'
import termsContent from '../../../隐私政策文件/Varo-Terms-of-Service.md?raw'
</script>

<template>
  <LegalDocument
    :content="termsContent"
    page-title="Varo.cloud Terms of Service"
  />
</template>
