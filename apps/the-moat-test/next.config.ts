import type { NextConfig } from "next";

/**
 * Static export. Archived run records are read at build time and the lab runs
 * the baseline in the browser, so there is nothing left to render on a server
 * and `next build` emits a plain `out/` directory.
 *
 * Consequence: `next start` no longer works. Serve `out/` instead.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
