import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Dev only: forward /api/* to the Express backend.
      // In production, VITE_API_BASE points to your deployed server URL instead.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    // Warn if any chunk exceeds 500 KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor libs into a separate chunk for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})