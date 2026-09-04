import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  // Production is mounted below the blockMedicine secondary path.
  base: mode === 'production' ? '/blockMedicine/' : '/',
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'https://smadev.simmed.cn',
        changeOrigin: true,
        secure: true,
      },
    },
  },
}))
