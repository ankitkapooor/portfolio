# Deployment — Cloudflare Pages

Four independent applications, four Pages projects, one domain. All four are
static: `next build` emits an `out/` directory and nothing runs on a server, so
the free tier covers this permanently and there are no functions to configure.

## Subdomain map

| Application | Root directory | Domain |
| --- | --- | --- |
| Portfolio | `apps/portfolio` | `ankitkapoor.me` and `www.ankitkapoor.me` |
| Disrupt This Business | `apps/disrupt-this-business` | `disrupt.ankitkapoor.me` |
| The Moat Test | `apps/the-moat-test` | `moat.ankitkapoor.me` |
| Priced In | `apps/priced-in` | `priced.ankitkapoor.me` |

These four hostnames are not arbitrary. The three demo hostnames are written
into `apps/portfolio/content/projects.ts` as `demoUrl`, and the portfolio
hostname is written into `apps/portfolio/content/site.ts` as the site origin,
where it drives canonical URLs, the sitemap, and robots.txt. Changing a
hostname here means changing it there.

## Deploy the three demos before the portfolio

The portfolio now renders a launch button for every project, pointing at the
subdomains above. Deploy it first and those buttons are dead links — the exact
failure the content rules were written to prevent.

Order: Disrupt, Moat, Priced In, confirm all three load over HTTPS, then the
portfolio.

## Settings for each Pages project

Identical for all four except the root directory.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | `apps/<application>` from the table above |

Node version comes from the `.node-version` file in each application directory
(24.20.0), so no environment variable is needed. Each application has its own
`package.json` and lockfile, so Cloudflare installs only that application's
dependencies.

Every project builds from the same repository and the same branch. A push to
`main` rebuilds all four; each one only publishes what its own root directory
produces.

## Custom domains

Add these under each Pages project, Custom domains. The domain is already on
Cloudflare, so DNS records are created automatically and certificates issue
without any manual step.

For the portfolio, add both `ankitkapoor.me` and `www.ankitkapoor.me`, then
redirect one to the other so a single canonical hostname serves the site. The
canonical tags point at the apex, so redirect `www` to the apex.

## Verify after the first deploy

- `curl -sI https://ankitkapoor.me/opengraph-image | grep -i content-type`
  returns `image/png`. Next.js exports the generated cards to extensionless
  paths, and Cloudflare infers type from the extension, so
  `apps/portfolio/public/_headers` sets it explicitly. Without that, every
  social preview fails silently.
- `curl -s https://ankitkapoor.me/robots.txt` returns `Allow: /` and the
  sitemap line.
- `curl -s https://ankitkapoor.me/sitemap.xml` lists six absolute URLs on the
  real origin and contains no `localhost`.
- Each of the three launch buttons on the portfolio reaches a working demo.
- A deep link loads directly rather than only via client navigation, for
  example `https://priced.ankitkapoor.me/workspace/expectations`.

## Running the built output locally

`next start` does not work with `output: "export"`. `npm run start` in any
application serves that application's `out/` directory through
`tools/serve-static.mjs`, which resolves paths the way Cloudflare Pages does.
Run `npm run build` first. The Playwright suites use this, so they test the
artifact that actually ships.
