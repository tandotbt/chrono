import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Chrono Wallet",
  description: "Nine Chronicles Wallet for browser signing",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API', link: '/api' },
      { text: 'Examples', link: '/examples' }
    ],

    sidebar: {},

    socialLinks: [
      { icon: 'github', link: 'https://github.com/planetarium/chrono' }
    ]
  }
})
