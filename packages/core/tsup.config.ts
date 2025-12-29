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
      passes: 3,
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ["console.log", "console.debug"],
      unsafe: false,
      unsafe_arrows: false,
      unsafe_methods: true,
      booleans_as_integers: false,
      ecma: 2020,
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
