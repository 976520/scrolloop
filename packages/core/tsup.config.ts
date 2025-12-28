import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: process.env.NODE_ENV === "development",
  treeshake: true,
  minify: "terser",
  terserOptions: {
    compress: {
      passes: 2,
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ["console.log", "console.debug"],
    },
    mangle: {
      safari10: false,
    },
    format: {
      comments: false,
    },
  },
  target: "es2022",
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
  esbuildOptions(options) {
    options.legalComments = "none";
  },
});
