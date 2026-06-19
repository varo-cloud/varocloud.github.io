import { http, unwrap } from './http'
import type { PricingItem } from '@/types'

export function fetchPricing() {
  return unwrap<PricingItem[]>(http.get('/pricing'))
}
