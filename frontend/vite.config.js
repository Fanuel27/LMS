import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
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
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
              return 'recharts'
            }
            if (id.includes('lucide-react')) {
              return 'lucide'
            }
            if (
              id.includes('@radix-ui') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge') ||
              id.includes('class-variance-authority')
            ) {
              return 'ui-vendor'
            }
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor'
            }
            if (id.includes('react')) {
              return 'react-vendor'
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor'
            }
            return 'vendor'
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
