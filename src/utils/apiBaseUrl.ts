/**
 * Resolve API base path for subpath deployments (e.g. GitHub Pages).
 *
 * VITE_API_BASE_URL=/api is relative to the app base, not the domain root.
 * Local / GitHub Pages root site: /api
 */
export function apiBaseUrl(): string {
  const apiPath = (import.meta.env.VITE_API_BASE_URL || 'api').replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${apiPath}`
}

/** Map mock route like `/api/models/:id` to the deployed API prefix. */
export function toProdMockUrl(mockUrl: string): string {
  const base = apiBaseUrl()

  if (mockUrl.startsWith('/api')) {
    return mockUrl.replace(/^\/api/, base)
  }

  const normalized = mockUrl.startsWith('/') ? mockUrl : `/${mockUrl}`
  return `${base}${normalized}`
}
