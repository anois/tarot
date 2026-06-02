import { defineConfig } from 'vitest/config'
import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, existsSync } from 'node:fs'

// GitHub Pages serves a project site under /<repo>/. CI sets BASE_PATH to
// "/<repo>/"; local dev/build default to "/".
const base = process.env.BASE_PATH || '/'

/** Emit dist/404.html (a copy of index.html) so GitHub Pages serves the SPA for
 *  deep links like /<repo>/settings (BrowserRouter then handles routing). */
function spaFallback(): PluginOption {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const dist = fileURLToPath(new URL('./dist', import.meta.url))
      const index = `${dist}/index.html`
      if (existsSync(index)) copyFileSync(index, `${dist}/404.html`)
    },
  }
}

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The `three` chunk is a large, intentionally lazy-loaded 3D bundle.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // 3D stack — only pulled in by the (lazy) reading route
          if (/[\\/](three|@react-three|@react-spring|maath|@use-gesture)[\\/]/.test(id)) {
            return 'three'
          }
          // shared React runtime (used by the app shell, eager)
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react'
          }
          // everything else (markdown, zod, dexie, i18n…) is left to Rollup so it
          // co-locates with the lazy route chunks that actually use it.
          return undefined
        },
      },
    },
  },
  test: {
    // Pure-logic tests run in node (fast, no DOM). React component tests opt into
    // jsdom per-file with a `// @vitest-environment jsdom` pragma at the top.
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
