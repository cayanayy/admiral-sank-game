import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  define: {
    'import.meta.env.VITE_WS_URL': JSON.stringify('wss://resolved-albacore-illegally.ngrok-free.app/ws')
  }
})
