import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png', 'fonts/*'],
      manifest: {
        name: 'Rodriguez Run — Sara\'s Safestay Adventure',
        short_name: 'RodriguezRun',
        description: 'An endless runner through a futuristic European city. Dodge obstacles, collect coins, and chase high scores!',
        theme_color: '#00d4ff',
        background_color: '#0d1b2a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icons/icons8-spain-bubbles-16.png', sizes: '16x16', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-32.png', sizes: '32x32', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-57.png', sizes: '57x57', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-60.png', sizes: '60x60', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-70.png', sizes: '70x70', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-76.png', sizes: '76x76', type: 'image/png' },
          { src: 'icons/icons8-spain-bubbles-96.png', sizes: '96x96', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Disable SW in dev to avoid caching issues
      },
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
        },
      },
    },
    chunkSizeWarningLimit: 3000,
  },
  server: {
    host: true,
    port: 3000,
  },
});
