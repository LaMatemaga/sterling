import { defineConfig } from "tsup";

const shared = {
  format: ["cjs", "esm"] as const,
  sourcemap: true,
  target: "es2020",
  external: ["react", "react-dom"],
};

export default defineConfig([
  {
    ...shared,
    entry: ["src/index.ts"],
    dts: true,
    clean: true,
    outDir: "dist",
    // tsup strips directives found in non-entry modules. Keeping this banner
    // makes the public package root an explicit Next.js client boundary.
    banner: { js: '"use client";' },
  },
  {
    ...shared,
    entry: ["src/server.ts"],
    dts: true,
    clean: false,
    outDir: "dist",
  },
]);
