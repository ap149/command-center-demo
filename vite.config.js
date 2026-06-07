import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Tailwind v4 Vite plugin — replaces the old postcss.config.js approach.
    // No tailwind.config.js needed; content detection is automatic.
    tailwindcss(),

    // Vue 3 SFC support
    vue(),
  ],
})
