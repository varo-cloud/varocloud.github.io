import type { Router } from 'vue-router'
import { loadGtag } from './gtag'

export { AnalyticsEvents } from './events'
export type { AnalyticsSource } from './events'

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? ''
const enabled = Boolean(measurementId) && import.meta.env.PROD

export function isAnalyticsEnabled(): boolean {
  return enabled
}

export async function initAnalytics(): Promise<void> {
  if (!enabled) return

  try {
    await loadGtag(measurementId)
  } catch (error) {
    console.warn('[analytics] Google Analytics failed to load', error)
  }
}

export function trackPageView(path: string, title?: string): void {
  if (!enabled || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: `${window.location.origin}${path}`,
  })
}

export function trackEvent(eventName: string, params?: AnalyticsEventParams): void {
  if (!enabled || !window.gtag) return

  window.gtag('event', eventName, params)
}

export function setAnalyticsUserId(userId: string): void {
  if (!enabled || !window.gtag) return

  window.gtag('set', { user_id: userId })
}

export function setupAnalytics(router: Router): void {
  router.afterEach((to) => {
    trackPageView(to.fullPath)
  })
}
