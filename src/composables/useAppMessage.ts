import { inject, ref, type InjectionKey, type Ref } from 'vue'

export type AppMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface AppMessageItem {
  id: number
  type: AppMessageType
  content: string
  duration: number
  closable: boolean
}

export interface AppMessageOptions {
  duration?: number
  closable?: boolean
}

export interface AppMessageApi {
  success: (content: string, options?: AppMessageOptions) => number
  error: (content: string, options?: AppMessageOptions) => number
  warning: (content: string, options?: AppMessageOptions) => number
  info: (content: string, options?: AppMessageOptions) => number
  loading: (content: string, options?: AppMessageOptions) => number
  destroy: (id: number) => void
  destroyAll: () => void
}

const DEFAULT_DURATION: Record<AppMessageType, number> = {
  success: 3000,
  error: 4000,
  warning: 4000,
  info: 3000,
  loading: 0,
}

export const appMessageStateKey: InjectionKey<Ref<AppMessageItem[]>> = Symbol('appMessageState')
export const appMessageApiKey: InjectionKey<AppMessageApi> = Symbol('appMessageApi')

let nextMessageId = 1
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function normalizeContent(content: string): string {
  return content.trim() || ' '
}

export function createAppMessageController(messages: Ref<AppMessageItem[]>): AppMessageApi {
  function destroy(id: number) {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }

    messages.value = messages.value.filter((item) => item.id !== id)
  }

  function destroyAll() {
    timers.forEach((timer) => clearTimeout(timer))
    timers.clear()
    messages.value = []
  }

  function show(type: AppMessageType, content: string, options: AppMessageOptions = {}) {
    const id = nextMessageId++
    const duration = options.duration ?? DEFAULT_DURATION[type]
    const closable = options.closable ?? true

    messages.value = [
      ...messages.value,
      {
        id,
        type,
        content: normalizeContent(content),
        duration,
        closable,
      },
    ]

    if (duration > 0) {
      const timer = setTimeout(() => destroy(id), duration)
      timers.set(id, timer)
    }

    return id
  }

  return {
    success: (content, options) => show('success', content, options),
    error: (content, options) => show('error', content, options),
    warning: (content, options) => show('warning', content, options),
    info: (content, options) => show('info', content, options),
    loading: (content, options) => show('loading', content, options),
    destroy,
    destroyAll,
  }
}

export function useAppMessage(): AppMessageApi {
  const api = inject(appMessageApiKey)

  if (!api) {
    throw new Error('useAppMessage() must be used within AppMessageProvider')
  }

  return api
}

export function useAppMessageState() {
  const messages = ref<AppMessageItem[]>([])
  const api = createAppMessageController(messages)

  return {
    messages,
    api,
  }
}
