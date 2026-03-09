import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import path from 'path'

const apiPort = process.env.E2E_API_PORT || process.env.VITE_API_PORT || "3001";
const apiTarget = process.env.VITE_API_PROXY_TARGET || `http://localhost:${apiPort}`;


export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
