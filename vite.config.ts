import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { viteMockServe } from 'vite-plugin-mock'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // 本地开发用 '/'；GitHub Pages 项目站默认路径为 /varocloud.github.io/
    // 若使用组织根站 varo-cloud.github.io 或自定义域名，改为 '/'
    base: process.env.GITHUB_PAGES === 'true' ? '/varocloud.github.io/' : '/',
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
