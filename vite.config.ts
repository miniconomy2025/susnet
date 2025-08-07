import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// See [https://vite.dev/config]
export default defineConfig({
  plugins: [react()],
  root: "./frontend",
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 8000,
  }
})
