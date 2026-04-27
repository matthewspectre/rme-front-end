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
      '/diagnosis': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/lokalis_bedah': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/pemeriksaan_fungsi_organ': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/lokalis-bedah': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/catatan_diagnosis': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/icd10': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
