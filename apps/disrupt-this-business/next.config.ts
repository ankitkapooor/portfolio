import type { NextConfig } from "next";

/**
 * Static export. The economic engine, the decision state, and persistence all
 * run in the browser, so there is nothing left to render on a server and
 * `next build` emits a plain `out/` directory.
 *
 * Consequence: `next start` no longer works. Serve `out/` instead.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
