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
  external: ["react", "react-native"],
  noExternal: ["@scrolloop/core"],
});
