import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/antrian': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/rujuk_ulang': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/pemeriksaan_laboratorium': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/pemeriksaan_ekg': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
