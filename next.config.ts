import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvas: "./empty-module.ts",
    },
  },
  webpack: (config) => {
    // pdfjs-dist tries to require 'canvas' for server-side rendering — we
    // don't need it in the browser, so alias it to false to prevent errors.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
