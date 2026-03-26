import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxy = env.VITE_DEV_API_PROXY
  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: apiProxy
      ? {
          proxy: {
            '/api': {
              target: apiProxy,
              changeOrigin: true,
            },
          },
        }
      : {},
  }
})
