import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["preact", "preact/hooks", "@scrolloop/core", "@scrolloop/shared"],
  esbuildOptions(options) {
    options.jsxImportSource = "preact";
    options.jsx = "automatic";
  },
});
