import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Must run before the React plugin so route files are code split.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      quoteStyle: 'single',
      semicolons: false,
    }),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Dependencies reached only through dynamic imports (mock layer, dev tools).
    // Pre-bundling them up front avoids a full page reload on first discovery,
    // which would drop the one-shot ?mock-scenario / ?mock-reset switches.
    include: [
      'msw',
      'msw/browser',
      'zod/mini',
      'socket.io-client',
      '@mswjs/socket.io-binding',
      '@tanstack/react-router-devtools',
      '@tanstack/react-query-devtools',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // MSW → tough-cookie → tldts: drop the Public Suffix List (see the stub).
      tldts: fileURLToPath(
        new URL('./src/mocks/vendor/tldts-lite.ts', import.meta.url),
      ),
    },
  },
})
