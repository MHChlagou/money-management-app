import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Set BASE_PATH when deploying under a sub-folder (e.g. GitHub Pages: "/money-management-app/").
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      // Bump the -vN in icon file names whenever the artwork changes: installed apps and browser caches
      // key on the file name, so a new name is what makes them fetch the new picture.
      includeAssets: ['apple-touch-icon-v2.png', 'favicon-v2.svg'],
      manifest: {
        name: 'Reserve',
        short_name: 'Reserve',
        description: 'Track salary, subscriptions, credits and expenses month by month.',
        theme_color: '#050a12',
        background_color: '#050a12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-v2-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-v2-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
})
