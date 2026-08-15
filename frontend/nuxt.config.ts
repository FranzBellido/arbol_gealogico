// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt'
  ],

  // Enable Nuxt 4 directory structure (srcDir: "app", etc.)
  future: {
    compatibilityVersion: 4,
  },

  // Color mode configuration for Nuxt UI
  colorMode: {
    preference: 'dark'
  },

  // Dev server configuration
  devServer: {
    port: 3000
  },

  // Nitro server preset for Railway / Docker deployment
  nitro: {
    preset: 'node-server',
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  },

  compatibilityDate: '2026-08-11'
})

