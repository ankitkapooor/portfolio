import type { NextConfig } from "next";

/**
 * Static export. The FCFF model and the expectations grid run in the browser
 * (the grid on a worker thread), so there is nothing left to render on a
 * server and `next build` emits a plain `out/` directory.
 *
 * Consequence: `next start` no longer works. Serve `out/` instead.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
