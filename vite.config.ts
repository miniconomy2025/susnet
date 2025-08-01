import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// See [https://vite.dev/config]
export default defineConfig({
  plugins: [deno(), react()],
  root: "./frontend",
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
    https: {
      cert: fs.readFileSync('/etc/letsencrypt/live/susnet.co.za/fullchain.pem'),
      key: fs.readFileSync('/etc/letsencrypt/live/susnet.co.za/privkey.pem')
    }
  }
})
