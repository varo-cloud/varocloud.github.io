import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      children: [
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
          path: 'pricing',
          name: 'pricing',
          meta: { fullBleed: true, transparentHeader: true },
          component: () => import('@/views/pricing/PricingView.vue'),
        },
        {
          path: 'api-keys',
          name: 'api-keys',
          meta: { requiresAuth: true },
          component: () => import('@/views/api-keys/ApiKeysView.vue'),
        },
        {
          path: 'billing',
          name: 'billing',
          meta: { requiresAuth: true },
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
          component: () => import('@/views/legal/TermsView.vue'),
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: () => import('@/views/legal/PrivacyView.vue'),
        },
      ],
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/auth/AuthView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

setupGuards(router)

export default router
