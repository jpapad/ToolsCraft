import type { NextConfig } from "next";

/** Node built-ins that Emscripten glue (e.g. qpdf-wasm) imports in a Node-only branch. */
const nodeOnly = ["fs", "path", "crypto"];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    resolveAlias: Object.fromEntries(nodeOnly.map((m) => [m, { browser: "./lib/shims/empty.ts" }])),
  },
};

export default nextConfig;
