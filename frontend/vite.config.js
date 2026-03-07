import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/stock': {
        target: 'https://military-jobye-haiqstudios-14f59639.koyeb.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
