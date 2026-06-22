import type { MockMethod } from 'vite-plugin-mock'
import { match as matchPath, pathToRegexp } from 'path-to-regexp'
import apiKeysMock from '../../mock/api-keys'
import authMock from '../../mock/auth'
import billingMock from '../../mock/billing'
import modelsMock from '../../mock/models'
import pricingMock from '../../mock/pricing'

const mockModules: MockMethod[] = [
  ...authMock,
  ...apiKeysMock,
  ...modelsMock,
  ...billingMock,
  ...pricingMock,
]

type MockRuntime = {
  XHR: {
    prototype: {
      send: (...args: unknown[]) => void
      open: (...args: unknown[]) => void
      __send?: (...args: unknown[]) => void
      proxy_open?: (...args: unknown[]) => void
      custom: {
        xhr?: XMLHttpRequest
        requestHeaders?: Record<string, string>
        options?: { headers?: Record<string, string> }
      }
      withCredentials: boolean
      responseType: XMLHttpRequestResponseType
    }
  }
  mock: (rurl: RegExp, rtype: string, template: unknown) => void
  setup: (config: { timeout?: number }) => void
}

function queryFromUrl(url: string): Record<string, string> {
  const search = url.split('?')[1]
  if (!search) return {}

  return JSON.parse(
    `{"${decodeURIComponent(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"').replace(/\+/g, ' ')}"}`,
  )
}

function createRequestHandler(mockUrl: string, handle: MockMethod['response']) {
  return function requestHandler(options: {
    body: string
    type: string
    url: string
    headers: Record<string, string>
  }) {
    if (typeof handle !== 'function') {
      return handle
    }

    const { body, type, url, headers } = options
    let parsedBody: unknown = body

    try {
      parsedBody = JSON.parse(body)
    } catch {
      // keep raw body for non-JSON payloads
    }

    const pathname = url.split('?')[0] ?? url
    const query = queryFromUrl(url)
    const urlMatcher = matchPath(mockUrl, { decode: decodeURIComponent })
    const matched = urlMatcher(pathname)

    if (matched !== false) {
      Object.assign(query, matched.params)
    }

    return handle({
      method: type,
      body: parsedBody as Record<string, unknown>,
      query,
      headers,
      url,
    })
  }
}

export async function setupProdMockServer(): Promise<void> {
  const Mock = (await import('mockjs')).default as unknown as MockRuntime
  const xhrProto = Mock.XHR.prototype

  xhrProto.__send = xhrProto.send
  xhrProto.send = function send(this: MockRuntime['XHR']['prototype']) {
    if (this.custom.xhr) {
      this.custom.xhr.withCredentials = this.withCredentials || false
      if (this.responseType) {
        this.custom.xhr.responseType = this.responseType
      }
    }

    if (this.custom.requestHeaders) {
      const headers: Record<string, string> = {}
      for (const key in this.custom.requestHeaders) {
        headers[key.toLowerCase()] = this.custom.requestHeaders[key]
      }
      this.custom.options = { ...this.custom.options, headers }
    }

    xhrProto.__send?.apply(this, arguments as unknown as Parameters<typeof xhrProto.send>)
  }

  xhrProto.proxy_open = xhrProto.open
  xhrProto.open = function open(this: MockRuntime['XHR']['prototype'], ...args: unknown[]) {
    const responseType = this.responseType
    xhrProto.proxy_open?.apply(this, args)
    if (this.custom.xhr && responseType) {
      this.custom.xhr.responseType = responseType
    }
  }

  for (const { url, method, response, timeout } of mockModules) {
    if (timeout) {
      Mock.setup({ timeout })
    }

    Mock.mock(
      pathToRegexp(url, undefined, { end: false }),
      method || 'get',
      createRequestHandler(url, response),
    )
  }
}
