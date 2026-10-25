import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Nome do repositório no GitHub Pages. Troque se o repositório tiver outro nome.
const BASE = '/humanity-tokens/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-32.png', 'apple-touch-icon.png', 'logo-login.jpg'],
      manifest: {
        id: BASE,
        name: 'Humanity Tokens',
        short_name: 'Humanity Tokens',
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
        navigateFallback: `${BASE}index.html`,
      },
    }),
  ],
  test: { environment: 'node', setupFiles: ['tests/setup.ts'] },
} as any)
