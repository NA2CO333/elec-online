import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
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
  }
}) 