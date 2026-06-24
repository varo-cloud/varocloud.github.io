import { resolveMediaPreviewKind } from '@/utils/mediaPreview'

export function guessDownloadFilename(url: string, index = 0): string {
  const path = url.split('#')[0]?.split('?')[0] ?? ''
  const basename = path.split('/').pop()
  if (basename && /\.\w{2,5}$/i.test(basename)) return basename

  const kind = resolveMediaPreviewKind(url)
  if (kind === 'video') return `generation-${index + 1}.mp4`
  if (kind === 'audio') return `generation-${index + 1}.mp3`
  return `generation-${index + 1}.png`
}

export async function downloadMediaFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('fetch failed')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.click()
    URL.revokeObjectURL(objectUrl)
    return
  } catch {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
  }
}
