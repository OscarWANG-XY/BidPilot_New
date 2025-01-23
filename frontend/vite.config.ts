import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.mjs']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfWorker: ['pdfjs-dist/build/pdf.worker.min.mjs']
        }
      }
    }
  },

  plugins: [
    react(),
    TanStackRouterVite(
      {
        routesDirectory: path.resolve(__dirname, './src/routes'),
        generatedRouteTree: path.resolve(__dirname, './src/routeTree.gen.ts'),
      }
    ),
  ],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api2': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api2/, '')
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
