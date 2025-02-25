import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import createHtmlPlugin from 'vite-plugin-mpa'

export default defineConfig({
  plugins: [react(),
  createHtmlPlugin({
    pages: { index: "index.html" }
  })],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
})
