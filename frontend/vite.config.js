import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 4005,
      host: '0.0.0.0', // Allow external connections
      hmr: {
        port: 4005,
        host: '100.93.48.110'  // Use the external IP for HMR WebSocket
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL, 
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
    }
  }
})
