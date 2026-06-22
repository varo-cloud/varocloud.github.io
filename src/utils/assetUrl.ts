/**
 * Resolve public/ asset paths for subpath deployments (e.g. GitHub Pages).
 */
export function assetUrl(path: string): string {
  if (!path) return import.meta.env.BASE_URL

  if (/^https?:\/\//i.test(path)) return path

  const base = import.meta.env.BASE_URL
  if (path.startsWith(base)) return path

  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}${normalized}`
}
