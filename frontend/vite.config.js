import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Local dev server settings (ignored by Vercel)
  server: {
    port: 5174,
    strictPort: false,
  },

  // Preview server (vite preview) settings
  preview: {
    port: 4173,
    strictPort: true,
  },

  build: {
    // Vercel supports modern browsers — no need for legacy polyfills
    target: 'es2020',
    // Output directory (matches vercel.json outputDirectory)
    outDir: 'dist',
    // Emit warnings for chunks >1MB, errors >2MB
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor libs into a separate chunk for better caching
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
