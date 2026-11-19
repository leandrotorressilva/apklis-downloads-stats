import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const proxy = {
  '/apklis': {
    target: 'https://api.apklis.cu',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/apklis/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The Apklis API does not allow cross-origin requests, so it is reached through a proxy.
  server: { proxy },
  preview: { proxy },
})
