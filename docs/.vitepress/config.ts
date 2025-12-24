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
      { text: "API 레퍼런스", link: "/api/reference" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Scrolloop 소개", link: "/guide/introduction" },
            { text: "Quick start", link: "/guide/quick-start" },
            { text: "핵심 개념", link: "/guide/core-concepts" },
          ],
        },
        {
          text: "가이드",
          items: [
            { text: "React에서 사용하기", link: "/guide/react" },
            { text: "무한 스크롤", link: "/guide/infinite-scroll" },
            { text: "React Native 지원", link: "/guide/react-native" },
            { text: "SSR 지원", link: "/guide/ssr" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [{ text: "기본 참조", link: "/api/reference" }],
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
                buttonText: "검색",
                buttonAriaLabel: "검색",
              },
              modal: {
                noResultsText: "결과가 없습니다.",
                resetButtonTitle: "재설정",
                footer: {
                  selectText: "선택",
                  navigateText: "이동",
                  closeText: "닫기",
                },
              },
            },
          },
        },
      },
    },
  },
});
