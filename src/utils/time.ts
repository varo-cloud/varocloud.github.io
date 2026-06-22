const SECOND_MS = 1000

/** Convert API timestamp (seconds or milliseconds) to milliseconds. */
export function toMillis(timestamp: number): number {
  if (!Number.isFinite(timestamp)) return Number.NaN
  return timestamp < 1e12 ? timestamp * SECOND_MS : timestamp
}

export type TimestampFormatStyle = 'date' | 'datetime' | 'compactDatetime' | 'time'

const FORMAT_PRESETS: Record<Exclude<TimestampFormatStyle, 'compactDatetime'>, Intl.DateTimeFormatOptions> = {
  date: { month: 'short', day: 'numeric', year: 'numeric' },
  datetime: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  time: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
}

/** e.g. 2026/6/13 16:51:37 */
function formatCompactDatetime(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}/${month}/${day} ${hour}:${minute}:${second}`
}

export function formatTimestamp(
  timestamp: number,
  locale: string,
  style: TimestampFormatStyle = 'date',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(toMillis(timestamp))
  if (Number.isNaN(date.getTime())) return ''

  if (style === 'compactDatetime') {
    return formatCompactDatetime(date)
  }

  return new Intl.DateTimeFormat(locale, { ...FORMAT_PRESETS[style], ...options }).format(date)
}

export function formatRelativeTimestamp(timestamp: number, locale: string): string {
  const diffSec = Math.round((toMillis(timestamp) - Date.now()) / SECOND_MS)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diffSec)

  if (abs < 60) return rtf.format(diffSec, 'second')

  const diffMin = Math.round(diffSec / 60)
  if (abs < 3600) return rtf.format(diffMin, 'minute')

  const diffHour = Math.round(diffSec / 3600)
  if (abs < 86400) return rtf.format(diffHour, 'hour')

  return rtf.format(Math.round(diffSec / 86400), 'day')
}
