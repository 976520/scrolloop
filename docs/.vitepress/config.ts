import { defineConfig } from "vitepress";

export default defineConfig({
  title: "scrolloop",
  description:
    "The ultimate virtual scrolling component for React and React Native.",
  appearance: false,

  head: [
    ["link", { rel: "icon", href: "/favicon.ico" }],
    ["meta", { name: "theme-color", content: "#7c3aed" }],
  ],

  markdown: {
    theme: "one-dark-pro",
  },

  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "가이드", link: "/guide/introduction" },
      { text: "컴포넌트", link: "/guide/virtual-list" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "introduction", link: "/guide/introduction" },
            { text: "quick-start", link: "/guide/quick-start" },
            { text: "concepts", link: "/guide/concepts" },
          ],
        },
        {
          text: "Components",
          items: [
            { text: "VirtualList", link: "/guide/virtual-list" },
            { text: "InfiniteList", link: "/guide/infinite-list" },
          ],
        },
        {
          text: "Advanced",
          items: [{ text: "SSR Guide", link: "/guide/ssr" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/976520/scrolloop" },
    ],

    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "search...",
                buttonAriaLabel: "search",
              },
              modal: {
                noResultsText: "no results.",
                resetButtonTitle: "reset",
                footer: {
                  selectText: "select",
                  navigateText: "navigate",
                  closeText: "close",
                },
              },
            },
          },
        },
      },
    },
  },
});
