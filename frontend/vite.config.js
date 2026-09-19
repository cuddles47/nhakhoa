import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 4004,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: false,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'X-Accel-Expires': '0'
      },
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err.message);
            });
          }
        }
      }
    },
    preview: {
      port: 4004,
      host: '0.0.0.0',
      allowedHosts: true,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'X-Accel-Expires': '0'
      },
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://backend:3000',
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000
        }
      }
    }
  }
})
