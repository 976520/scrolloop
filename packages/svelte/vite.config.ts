import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [svelte(), dts({ include: ["src/**/*.ts"] })],
  build: {
    lib: {
      entry: "src/index.ts",
      // Svelte 5 is ESM-first; CJS consumption is effectively nonexistent.
      formats: ["es"],
      fileName: () => "index.mjs",
    },
    rollupOptions: {
      external: [/^svelte($|\/)/, "@scrolloop/core"],
    },
  },
});
