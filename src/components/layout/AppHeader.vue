<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NDropdown } from 'naive-ui'
import { useUserStore } from '@/stores/user'
import VaroCloudLogo from '@/components/common/VaroCloudLogo.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import { useLocaleRouter } from '@/composables/useLocaleRouter'
import type { LocaleType } from '@/i18n'

const route = useRoute()
const { push, localePath, switchLocale } = useLocaleRouter()
const { t } = useI18n()
const userStore = useUserStore()

const headerSearch = ref('')
const isScrolled = ref(false)
const userMenuOpen = ref(false)

let userMenuCloseTimer: ReturnType<typeof setTimeout> | null = null

const usesTransparentHeader = computed(() => route.meta.transparentHeader === true)
const isHeaderSolid = computed(() => !usesTransparentHeader.value || isScrolled.value)

function updateScrollState() {
  isScrolled.value = window.scrollY > 0
}

const navItems = computed(() => [
  { label: t('nav.models'), name: 'models' },
  { label: t('nav.pricing'), name: 'pricing' },
  ...(userStore.isLoggedIn
    ? [
        { label: t('nav.apiKeys'), name: 'api-keys' },
        { label: t('nav.billing'), name: 'billing' },
      ]
    : []),
  { label: t('nav.docs'), name: 'docs' },
])

const userMenuOptions = computed(() => [
  { label: t('common.deposit'), key: 'deposit', icon: 'deposit' as const },
  { label: t('nav.apiKeys'), key: 'api-keys', icon: 'code-box' as const },
  { label: t('header.myBilling'), key: 'billing', icon: 'file-paper' as const },
  { label: t('header.signOut'), key: 'logout', icon: 'logout' as const },
])

const languageMenuOptions = computed(() => [
  { label: 'English', key: 'en-US' },
  { label: '简体中文', key: 'zh-CN' },
])

const balanceLabel = computed(() => {
  if (!userStore.isLoggedIn) return null
  const value = userStore.balance
  if (value === null) return '—'
  return value.toLocaleString()
})

const userInitial = computed(() => {
  const name = userStore.profile?.name ?? userStore.profile?.email ?? ''
  return name.charAt(0).toUpperCase() || '?'
})

const displayEmail = computed(() => {
  const email = userStore.profile?.email ?? ''
  const at = email.indexOf('@')
  if (at <= 0) return email
  const local = email.slice(0, at)
  const domain = email.slice(at)
  if (local.length <= 5) return email
  return `${local.slice(0, 3)}...${local.slice(-2)}${domain}`
})

const displayUserId = computed(() => userStore.profile?.id ?? '—')

function openUserMenu() {
  if (userMenuCloseTimer) {
    clearTimeout(userMenuCloseTimer)
    userMenuCloseTimer = null
  }
  userMenuOpen.value = true
}

function scheduleCloseUserMenu() {
  if (userMenuCloseTimer) clearTimeout(userMenuCloseTimer)
  userMenuCloseTimer = setTimeout(() => {
    userMenuOpen.value = false
    userMenuCloseTimer = null
  }, 120)
}

function cancelCloseUserMenu() {
  if (userMenuCloseTimer) {
    clearTimeout(userMenuCloseTimer)
    userMenuCloseTimer = null
  }
}

function isActive(name: string) {
  if (name === 'models') {
    return route.name === 'models' || route.name === 'model-detail'
  }
  return route.name === name
}

function goTo(name: string) {
  push({ name })
}

function handleUserMenuSelect(key: string) {
  userMenuOpen.value = false

  if (key === 'logout') {
    void userStore.logout().then(() => {
      push({ name: 'models' })
    })
    return
  }

  if (key === 'deposit' || key === 'billing' || key === 'api-keys') {
    goTo(key === 'deposit' ? 'billing' : key)
  }
}

function handleLanguageSelect(key: string) {
  switchLocale(key as LocaleType)
}

function submitHeaderSearch() {
  const q = headerSearch.value.trim()
  push({
    name: 'models',
    query: q ? { q } : {},
  })
}

watch(
  () => route.query.q,
  (q) => {
    headerSearch.value = typeof q === 'string' ? q : ''
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    updateScrollState()
  },
)

onMounted(() => {
  userStore.loadProfile()
  updateScrollState()
  window.addEventListener('scroll', updateScrollState, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScrollState)
  if (userMenuCloseTimer) clearTimeout(userMenuCloseTimer)
})
</script>

<template>
  <header
    class="app-header"
    :class="{ 'app-header--solid': isHeaderSolid, 'app-header--transparent': !isHeaderSolid }"
  >
    <div class="app-header__inner">
      <div class="app-header__left">
        <RouterLink :to="localePath('/')" class="app-header__logo" :aria-label="t('common.appName')">
          <VaroCloudLogo variant="dark" />
        </RouterLink>
        <nav class="app-header__nav hidden md:flex">
          <button
            v-for="item in navItems"
            :key="item.name"
            type="button"
            class="app-header__nav-item"
            :class="{ 'is-active': isActive(item.name) }"
            @click="goTo(item.name)"
          >
            {{ item.label }}
          </button>
        </nav>
      </div>

      <div
        v-if="userStore.isLoggedIn"
        class="app-header__center hidden lg:block"
      >
        <label class="app-header__search">
          <AppIcon name="search" class="app-header__search-icon" />
          <input
            v-model="headerSearch"
            type="search"
            class="app-header__search-input"
            :placeholder="t('header.searchModels')"
            @keydown.enter.prevent="submitHeaderSearch"
          />
        </label>
      </div>

      <div class="app-header__right">
        <NDropdown
          trigger="click"
          :options="languageMenuOptions"
          @select="handleLanguageSelect"
        >
          <button
            type="button"
            class="app-header__icon-btn"
            :aria-label="t('common.language')"
          >
            <AppIcon name="globe" />
          </button>
        </NDropdown>

        <template v-if="userStore.isLoggedIn">
          <div class="app-header__wallet-group">
            <div class="app-header__wallet-balance" :title="t('common.balance')">
              <AppIcon name="wallet" />
              <span>{{ balanceLabel }}</span>
            </div>
            <button
              type="button"
              class="app-header__wallet-deposit"
              @click="goTo('billing')"
            >
              <AppIcon name="deposit" />
              <span>{{ t('common.deposit') }}</span>
            </button>
          </div>

          <div
            class="app-header__user-menu"
            @mouseenter="openUserMenu"
            @mouseleave="scheduleCloseUserMenu"
          >
            <button
              type="button"
              class="app-header__user-trigger"
              :aria-expanded="userMenuOpen"
              aria-haspopup="menu"
            >
              <span class="app-header__avatar">{{ userInitial }}</span>
              <AppIcon name="chevron-down" />
            </button>

            <div
              v-show="userMenuOpen"
              class="app-header__user-dropdown"
              @mouseenter="cancelCloseUserMenu"
              @mouseleave="scheduleCloseUserMenu"
            >
              <div class="app-header__user-dropdown-header">
                <div class="app-header__user-email">
                  <span :title="userStore.profile?.email">{{ displayEmail }}</span>
                </div>
                <p class="app-header__user-id">
                  {{ t('header.userId', { id: displayUserId }) }}
                </p>
              </div>

              <div class="app-header__user-dropdown-items" role="menu">
                <button
                  v-for="item in userMenuOptions"
                  :key="item.key"
                  type="button"
                  class="app-header__user-dropdown-item"
                  role="menuitem"
                  @click="handleUserMenuSelect(item.key)"
                >
                  <AppIcon :name="item.icon" />
                  <span>{{ item.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <button
          v-else
          type="button"
          class="app-header__login-btn"
          @click="push({ name: 'auth' })"
        >
          {{ t('common.login') }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 80px;
  color: #ebf4fb;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.app-header--solid {
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-page);
}

.app-header--transparent {
  border-bottom: 1px solid transparent;
  background: transparent;
}

.app-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 0 16px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex-shrink: 0;
}

.app-header__center {
  flex: 1;
  min-width: 0;
  max-width: 360px;
  margin: 0 24px;
}

.app-header__logo {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
  line-height: 0;
}

.app-header__nav {
  gap: 24px;
  margin-left: 8px;
}

.app-header__nav-item {
  padding: 6px 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #9b9dab;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.app-header__nav-item.is-active {
  color: #ebf4fb;
}

.app-header__nav-item:hover {
  color: #ebf4fb;
  background: transparent;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.app-header__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  background: #13131c;
  cursor: text;
}

.app-header__search-icon {
  flex-shrink: 0;
  opacity: 0.6;
}

.app-header__search-input {
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  color: #ebf4fb;
  font-size: 14px;
  line-height: 1;
  outline: none;
}

.app-header__search-input::placeholder {
  color: #fff;
  opacity: 0.2;
}

.app-header__icon-btn,
.app-header__user-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border: none;
  border-radius: 8px;
  background: #13131c;
  color: #ebf4fb;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.app-header__icon-btn {
  width: 36px;
  padding: 0;
}

.app-header__icon-btn:hover,
.app-header__user-trigger:hover,
.app-header__wallet-deposit:hover {
  opacity: 0.85;
}

.app-header__user-menu {
  position: relative;
}

.app-header__user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
  width: 280px;
  padding: 20px;
  border-radius: 8px;
  background: #1c1c20;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
}

.app-header__user-dropdown-header {
  margin-bottom: 18px;
}

.app-header__user-email {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ebf4fb;
  font-size: 16px;
  font-weight: 500;
  line-height: 16px;
}

.app-header__user-id {
  margin: 8px 0 0;
  color: #9b9dab;
  font-size: 14px;
  line-height: 14px;
}

.app-header__user-dropdown-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.app-header__user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  margin: 0 -20px;
  width: calc(100% + 40px);
  border: none;
  border-radius: 0;
  background: transparent;
  color: #e0e0e0;
  font-size: 14px;
  line-height: 1;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.app-header__user-dropdown-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.app-header__wallet-group {
  display: flex;
  gap: 1px;
}

.app-header__wallet-balance,
.app-header__wallet-deposit {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 8px;
  border: none;
  background: #13131c;
  color: #ebf4fb;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
}

.app-header__wallet-balance {
  border-radius: 8px 0 0 8px;
}

.app-header__wallet-deposit {
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.app-header__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #ff9c39;
  color: #13131c;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.app-header__login-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 116px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  background: #fff;
  color: #222;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;
}

.app-header__login-btn:hover {
  background: #e8e8ec;
}

.app-header__login-btn:active {
  background: #d8d8dc;
}

@media (max-width: 767px) {
  .app-header__inner {
    padding: 0 12px;
  }

  .app-header__logo {
    transform: scale(0.9);
    transform-origin: left center;
  }

  .app-header__wallet-deposit span {
    display: none;
  }

  .app-header__wallet-deposit {
    padding: 0 8px;
  }
}
</style>
