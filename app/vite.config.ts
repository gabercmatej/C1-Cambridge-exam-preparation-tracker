import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The plan and resources are read straight from the planning documents one folder up.
  server: { fs: { allow: ['..'] } },
})
