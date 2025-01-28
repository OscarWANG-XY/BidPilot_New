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
    host: '0.0.0.0',  // 或者使用 true 允许外部访问
    //open: true,  // true 自动打开浏览器 
    proxy: {

      // 代理到 django 的 api
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
// 之前用在 upload-server 上，现在用 django, 就不用了     
//      '/api2': {
//        target: 'http://localhost:3001',
//        changeOrigin: true,
//        rewrite: (path) => path.replace(/^\/api2/, '')
//      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
