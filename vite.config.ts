/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { contentPlugin } from './scripts/vite-plugin-content'

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue(),
    contentPlugin(),
    ...(process.env.VITEST
      ? []
      : [
          VitePWA({
            registerType: 'prompt',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'Cyber Réflexes',
              short_name: 'Cyber Réflexes',
              description: 'Jeu gratuit de sensibilisation aux risques numériques, de la 6e à la Terminale.',
              lang: 'fr',
              theme_color: '#3b2fc9',
              background_color: '#f7f7fb',
              display: 'standalone',
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'] },
          }),
        ]),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    alias: {
      'virtual:pwa-register/vue': fileURLToPath(new URL('./tests/unit/pwa-register-stub.ts', import.meta.url)),
    },
  },
})
