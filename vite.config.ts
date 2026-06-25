import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { viteMockServe } from 'vite-plugin-mock'

function resolveAuthProxyTarget(env: Record<string, string>): string | null {
  const configured = env.VITE_AUTH_API_BASE_URL?.trim()
  if (!configured || !/^https?:\/\//i.test(configured)) return null

  try {
    return new URL(configured).origin
  } catch {
    return null
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authProxyTarget = resolveAuthProxyTarget(env)
  const useRealAuthApi = Boolean(env.VITE_AUTH_API_BASE_URL?.trim())

  return {
    // 正式: /  |  测试 (staging.github.io 仓库): /staging.github.io/
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      UnoCSS(),
      viteMockServe({
        mockPath: 'mock',
        enable: command === 'serve' && env.VITE_USE_MOCK === 'true',
        ignore: (fileName) =>
          fileName.includes('_util') || (useRealAuthApi && fileName.includes('auth')),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: authProxyTarget
      ? {
          proxy: {
            '/api/auth': {
              target: authProxyTarget,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  }
})
