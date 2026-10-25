import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { readFileSync } from 'node:fs'

// Caminho no GitHub Pages. A prévia é publicada com VITE_BASE=/humanity-tokens/preview/.
const BASE = process.env.VITE_BASE || '/humanity-tokens/'
const IS_PREVIEW = BASE.includes('/preview/')
const VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

export default defineConfig({
  base: BASE,
  define: {
    __APP_VERSION__: JSON.stringify(VERSION),
    // A prévia usa banco e chaves locais separados da versão oficial (mesmo domínio).
    'import.meta.env.VITE_STORAGE_PREFIX': JSON.stringify(IS_PREVIEW ? 'preview' : ''),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-32.png', 'apple-touch-icon.png', 'logo-login.jpg'],
      manifest: {
        id: BASE,
        name: IS_PREVIEW ? 'Humanity Tokens (Prévia)' : 'Humanity Tokens',
        short_name: IS_PREVIEW ? 'HT Prévia' : 'Humanity Tokens',
        description: 'Mais humano. Mais claro. Menos tokens.',
        lang: 'pt-BR',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,ico,webmanifest}'],
        // Vocabulário do tokenizador (~2 MB) também fica no cache para uso offline.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
        // O app oficial não deve capturar as páginas da prévia.
        navigateFallbackDenylist: IS_PREVIEW ? [] : [/\/preview\//],
      },
    }),
  ],
  test: { environment: 'node', setupFiles: ['tests/setup.ts'] },
} as any)
