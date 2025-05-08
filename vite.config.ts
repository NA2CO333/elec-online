import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VueDevTools(), // 启用 Vue DevTools
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    // 允许的主机列表
    allowedHosts: [
      // 添加生产环境域名
      'hisuetlqwcfo.sealosgzg.site',
      // 通配符允许所有子域名
      '.sealosgzg.site',
      // 本地开发
      'localhost'
    ]
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 启用 sourcemap，方便在 DevTools 中跳转到源代码
  build: {
    sourcemap: true
  }
}) 