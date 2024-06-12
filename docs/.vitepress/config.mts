import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Chrono Wallet",
  description: "Nine Chronicles Wallet for browser signing",
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API', link: 'https://jsr.io/@planetarium/chrono-sdk/doc' },
      { text: 'Examples', link: '/developer/examples' }
    ],

    sidebar: [
      {
        text: 'User',
        items: [
          {
            text: 'Install',
            link: '/user/install',
          },
          {
            text: 'Initialize',
            link: '/user/initialize',
          },
          {
            text: 'Account',
            link: '/user/account',
          },
          {
            text: 'Network',
            link: '/user/network',
          },
        ],
      },
      {
        text: 'Developer',
        items: [
          {
            text: 'API',
            link: 'https://jsr.io/@planetarium/chrono-sdk/doc',
          },
          {
            text: 'Examples',
            link: '/developer/examples',
          },
        ],
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/planetarium/chrono' }
    ]
  }
})
