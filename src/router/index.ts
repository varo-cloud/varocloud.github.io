import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards'

const appLayoutChildren: RouteRecordRaw[] = [
  {
    path: '',
    name: 'models',
    meta: { fullBleed: true, transparentHeader: true },
    component: () => import('@/views/models/ModelsView.vue'),
  },
  {
    path: 'models/:id',
    name: 'model-detail',
    meta: { fullBleed: true, transparentHeader: true },
    component: () => import('@/views/models/ModelDetailView.vue'),
  },
  {
    path: 'ai-generator',
    name: 'ai-generator',
    meta: { fullBleed: true, transparentHeader: true },
    component: () => import('@/views/ai-generator/AiGeneratorView.vue'),
  },
  {
    path: 'pricing',
    name: 'pricing',
    meta: { fullBleed: true, transparentHeader: true },
    component: () => import('@/views/pricing/PricingView.vue'),
  },
  {
    path: 'api-keys',
    name: 'api-keys',
    meta: { requiresAuth: true, fullBleed: true },
    component: () => import('@/views/api-keys/ApiKeysView.vue'),
  },
  {
    path: 'billing',
    name: 'billing',
    meta: { requiresAuth: true, fullBleed: true },
    component: () => import('@/views/billing/BillingView.vue'),
  },
  {
    path: 'docs',
    name: 'docs',
    component: () => import('@/views/docs/DocsView.vue'),
  },
  {
    path: 'terms',
    name: 'terms',
    meta: { lightPage: true },
    component: () => import('@/views/legal/TermsView.vue'),
  },
  {
    path: 'privacy',
    name: 'privacy',
    meta: { lightPage: true },
    component: () => import('@/views/legal/PrivacyView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:locale(zh-CN)?',
      children: [
        {
          path: '',
          component: () => import('@/components/layout/AppLayout.vue'),
          children: appLayoutChildren,
        },
        {
          path: 'auth',
          name: 'auth',
          component: () => import('@/views/auth/AuthView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

setupGuards(router)

export default router
