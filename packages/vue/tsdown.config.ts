import { defineConfig } from "tsdown";
import Vue from "unplugin-vue/rolldown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: { vue: true },
  platform: "neutral",
  treeshake: true,
  minify: true,
  sourcemap: false,
  fixedExtension: true,
  external: ["vue", "scrolloop"],
  plugins: [Vue({ isProduction: true })],
});
