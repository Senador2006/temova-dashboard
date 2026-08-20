import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/field-app': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/field-app/, ''),
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && 'writeHead' in res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/plain' })
              res.end('app offline')
            }
          })
        },
      },
    },
  },
})
