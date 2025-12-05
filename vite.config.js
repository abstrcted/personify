import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow network access
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/login': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/callback': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/me': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/refresh': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/top-tracks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/top-artists': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/artist-top-tracks': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/store-tracks-data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
