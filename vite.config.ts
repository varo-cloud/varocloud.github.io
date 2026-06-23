import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // 正式: /  |  测试 (staging.github.io 仓库): /staging.github.io/
    base: env.VITE_BASE || '/',
    plugins: [
      vue(),
      UnoCSS(),
      viteMockServe({
        mockPath: 'mock',
        enable: command === 'serve' && env.VITE_USE_MOCK === 'true',
        ignore: (fileName) => fileName.includes('_util'),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }
})
