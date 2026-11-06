import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/MikisBoqFrontend/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://mikisapi.runasp.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})