import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ship-it/', // أو اسم مستودعك الخاص إذا تغير
})
