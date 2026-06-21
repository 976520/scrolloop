import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  platform: "neutral",
  treeshake: true,
  minify: true,
  sourcemap: false,
  fixedExtension: true,
  external: ["preact", "preact/hooks", "@scrolloop/core"],
});
