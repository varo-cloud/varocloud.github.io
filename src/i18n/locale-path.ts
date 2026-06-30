import type { LocaleType } from './index'

export const DEFAULT_LOCALE: LocaleType = 'en-US'
export const LOCALE_PATH_PREFIX = 'zh-CN'

/**
 * External systems (e.g. Stripe success_url) may use BCP-47 or short locale
 * segments in paths. Map them to app locales; longest segments first when parsing.
 */
export const LOCALE_PATH_ALIASES: Record<string, LocaleType> = {
  'zh-CN': 'zh-CN',
  zh: 'zh-CN',
  'en-US': 'en-US',
  en: 'en-US',
}

/** Longest-first so `zh-CN` matches before `zh`. */
export const LOCALE_PATH_SEGMENTS = ['zh-CN', 'en-US', 'zh', 'en'] as const

/** vue-router optional `:locale` param — accepts canonical + external aliases. */
export const LOCALE_ROUTE_PARAM = LOCALE_PATH_SEGMENTS.join('|')

export function isLocaleType(value: string): value is LocaleType {
  return value === 'en-US' || value === 'zh-CN'
}

export function localeFromRouteParam(param: unknown): LocaleType {
  if (typeof param !== 'string' || !param) return DEFAULT_LOCALE
  return LOCALE_PATH_ALIASES[param] ?? DEFAULT_LOCALE
}

export function localeToRouteParam(locale: LocaleType): string | undefined {
  return locale === 'zh-CN' ? LOCALE_PATH_PREFIX : undefined
}

export function parseLocalePathPrefix(path: string): { locale: LocaleType; path: string } {
  const normalized = path.startsWith('/') ? path : `/${path}`

  for (const segment of LOCALE_PATH_SEGMENTS) {
    if (normalized === `/${segment}`) {
      return { locale: LOCALE_PATH_ALIASES[segment], path: '/' }
    }
    if (normalized.startsWith(`/${segment}/`)) {
      const rest = normalized.slice(`/${segment}`.length) || '/'
      return { locale: LOCALE_PATH_ALIASES[segment], path: rest }
    }
  }

  return { locale: DEFAULT_LOCALE, path: normalized }
}

export function stripLocalePrefix(path: string): string {
  return parseLocalePathPrefix(path).path
}

export function withLocalePrefix(path: string, locale: LocaleType): string {
  const bare = stripLocalePrefix(path)
  if (locale === DEFAULT_LOCALE) return bare
  if (bare === '/') return `/${LOCALE_PATH_PREFIX}`
  return `/${LOCALE_PATH_PREFIX}${bare}`
}

/** Canonical in-app path for a locale (English omits prefix). */
export function getCanonicalPath(path: string, locale?: LocaleType): string {
  const parsed = parseLocalePathPrefix(path)
  return withLocalePrefix(parsed.path, locale ?? parsed.locale)
}

export function switchPathLocale(path: string, locale: LocaleType): string {
  return withLocalePrefix(stripLocalePrefix(path), locale)
}
