import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173,                // your dev-server port
    proxy: {
      // REST
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // socket.io WS upgrade
      '/socket.io': {
        target: 'ws://localhost:4000',
        ws: true,
        changeOrigin: true,
      },
    }
  }
})
