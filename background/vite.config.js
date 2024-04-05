// vite.config.js

import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url))
      },
    ]
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    sourcemap: true,
  }
})
