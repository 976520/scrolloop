// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import vue from "eslint-plugin-vue";
import svelte from "eslint-plugin-svelte";
import oxlint from "eslint-plugin-oxlint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/*.timestamp-*.mjs",
      "**/node_modules/**",
      "docs/.vitepress/cache/**",
      "docs/.vitepress/dist/**",
    ],
  },

  // Base JS + TS for all package source
  {
    files: ["packages/**/*.{js,mjs,cjs,ts,tsx,vue,svelte}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // React / React Native / Preact adapters → rules-of-hooks + exhaustive-deps
  // (eslint-plugin-react itself is omitted: 7.37 is incompatible with ESLint 10
  // and its prop-types/stylistic rules add little for a TS codebase.)
  {
    files: ["packages/{react,react-native,preact}/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
    rules: {
      // Advisory React-Compiler readiness rule; keep rules-of-hooks + exhaustive-deps.
      "react-hooks/refs": "off",
    },
  },

  // Vue SFCs (vue-eslint-parser owns .vue; TS parser for <script lang="ts">)
  {
    files: ["packages/vue/**/*.vue"],
    extends: [...vue.configs["flat/recommended"]],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      // Optional props without defaults are intentional in this TS API.
      "vue/require-default-prop": "off",
    },
  },

  // Svelte SFCs
  {
    files: ["packages/svelte/**/*.svelte"],
    extends: [...svelte.configs.recommended],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      // Svelte 5 runes: `let { ... } = $props()` must use `let`; generics/snippets
      // referenced only in markup aren't seen as used by the TS rules.
      "prefer-const": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // Tests: relax a few rules
  {
    files: ["**/*.{test,spec}.{ts,tsx}", "**/__tests__/**", "**/__test__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Turn OFF rules oxlint already runs (avoids double-reporting)
  ...oxlint.configs["flat/recommended"],

  // Disable formatting rules — Prettier owns formatting (must be last)
  prettier
);
