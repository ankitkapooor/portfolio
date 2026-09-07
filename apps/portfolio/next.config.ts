import type { NextConfig } from "next";

/**
 * Static export. Every route in this app is prerendered and there are no route
 * handlers, no middleware, and no dynamic server rendering, so `next build`
 * emits a plain `out/` directory that any static host can serve.
 *
 * Consequence: `next start` no longer works. Serve `out/` instead.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
