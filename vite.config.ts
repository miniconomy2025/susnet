import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'
import react from '@vitejs/plugin-react'

// See [https://vite.dev/config]
export default defineConfig({
  plugins: [deno(), react()],
  root: "./frontend",
  server: {
    host: 'susnet.co.za',
    port: 5173
  }
})
