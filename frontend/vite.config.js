import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 4004,
      host: '0.0.0.0', // Allow external connections
      allowedHosts: [
        'bunbohue.systemcrafts.net',
        '100.85.22.67'
      ],
      hmr: false,
      proxy: {
        '/api': {
          target: 'http://100.85.22.67:3000', 
          changeOrigin: true,
          timeout: 300000, // 5 minutes for large file uploads
          proxyTimeout: 300000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying:', req.method, req.url);
            });
          }
        }
      }
    },
    preview: {
      port: 4004,
      host: '0.0.0.0',
      allowedHosts: [
        'bunbohue.systemcrafts.net',
        '100.85.22.67'
      ],
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      },
      proxy: {
        '/api': {
          target: 'http://100.85.22.67:3000', 
          changeOrigin: true,
          timeout: 300000,
          proxyTimeout: 300000,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('Proxying:', req.method, req.url);
            });
          }
        }
      }
    }
  }
})
