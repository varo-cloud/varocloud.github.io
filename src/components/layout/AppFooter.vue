<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { assetUrl } from '@/utils/assetUrl'

const { t } = useI18n()
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <nav class="app-footer__links" :aria-label="t('footer.navLabel')">
        <RouterLink to="/terms">{{ t('footer.terms') }}</RouterLink>
        <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
      </nav>

      <div class="app-footer__social">
        <a
          class="app-footer__social-link"
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('footer.twitter')"
        >
          <img :src="assetUrl('/assets/footer/twitter.svg')" alt="" aria-hidden="true" />
        </a>
        <a
          class="app-footer__social-link"
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('footer.telegram')"
        >
          <img :src="assetUrl('/assets/footer/telegram.svg')" alt="" aria-hidden="true" />
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  background: #0d0913;
}

.app-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1360px;
  height: 60px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-footer__links {
  display: flex;
  align-items: center;
  gap: 24px;
}

.app-footer__links a {
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #808080;
  text-decoration: none;
  transition: color 0.15s ease;
}

.app-footer__links a:hover,
.app-footer__links a.router-link-active {
  color: #e0e0e0;
}

.app-footer__social {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-footer__social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  opacity: 0.9;
  transition: opacity 0.15s ease;
}

.app-footer__social-link:hover {
  opacity: 1;
}

.app-footer__social-link img {
  display: block;
  width: 100%;
  height: 100%;
}

@media (max-width: 767px) {
  .app-footer__inner {
    height: auto;
    min-height: 60px;
    padding: 16px;
    flex-wrap: wrap;
  }

  .app-footer__links {
    gap: 16px;
  }
}
</style>
