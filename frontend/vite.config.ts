import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // доступ извне контейнера
    port: 5173,
    allowedHosts: ['vps.oblepiha-vpn.online'],
    watch: {
      usePolling: true  // нужно для Docker на Windows (иначе hot-reload не работает)
    }
  }
})
