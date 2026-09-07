/**
 * Static file server for an exported Next.js `out/` directory.
 *
 * `output: "export"` makes `next start` unusable, but the e2e suites and the
 * screenshot tooling still need something to serve. Serving `out/` rather than
 * running a dev server means those tests exercise the exact artifact that gets
 * uploaded to Cloudflare Pages, so an export-only regression is caught here.
 *
 * Resolution mirrors Cloudflare Pages: a request for `/about` is served by
 * `out/about.html`, and an unmatched path gets `out/404.html` with a 404.
 *
 * Usage: node tools/serve-static.mjs <directory> <port>
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, normalize, extname } from "node:path";

const [dir, port] = process.argv.slice(2);
if (!dir || !port) {
  console.error("usage: node tools/serve-static.mjs <directory> <port>");
  process.exit(1);
}

// Without this, a missing build would serve 404s that look like broken routes.
if (!existsSync(dir)) {
  console.error(`${dir} does not exist. Run \`npm run build\` first.`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
};

/** Read the first match, or null if none of the candidates exist. */
async function readFirst(candidates) {
  for (const candidate of candidates) {
    try {
      return { body: await readFile(candidate), path: candidate };
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function contentType(path, body) {
  const type = TYPES[extname(path)];
  if (type) return type;
  // Extensionless generated Open Graph cards. Production sets this through
  // public/_headers; sniffing the PNG magic bytes keeps the two in agreement.
  if (body.length > 4 && body[0] === 0x89 && body[1] === 0x50) return "image/png";
  return "application/octet-stream";
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  const decoded = decodeURIComponent(pathname);

  // Reject traversal outright rather than normalising it into something served.
  if (decoded.includes("\0") || normalize(decoded).startsWith("..")) {
    res.writeHead(400).end("Bad request");
    return;
  }

  const rel = decoded.replace(/^\/+/, "");
  const found = await readFirst([
    ...(rel === "" ? [] : [join(dir, rel), join(dir, `${rel}.html`)]),
    join(dir, rel, "index.html"),
  ]);

  if (found) {
    res.writeHead(200, { "Content-Type": contentType(found.path, found.body) });
    res.end(found.body);
    return;
  }

  const notFound = await readFirst([join(dir, "404.html")]);
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  res.end(notFound ? notFound.body : "Not found");
}).listen(Number(port), "127.0.0.1", () => {
  console.log(`Serving ${dir} on http://127.0.0.1:${port}`);
});
