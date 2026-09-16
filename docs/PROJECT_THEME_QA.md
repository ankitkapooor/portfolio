# Project theme rollout — 16 September 2026

The five applications now share the portfolio's navy, cream and sky palette,
Manrope typography, editorial headings and a return link to the portfolio.
Chart scales, status labels and control states retain distinct meanings.
Changes are confined to presentation; API contracts, scoring, simulation,
financial calculations and storage formats are unchanged.

The portfolio launches War Room at `https://warroom.ankitkapoor.me/ui/` and
Narrative at `https://narrative.ankitkapoor.me`. These custom domains use the
existing Railway services. They are separate repositories from the three
Cloudflare Pages applications in this monorepo.

## Validation

- Portfolio: 107 tests; Disrupt: 64; Moat: 103; Priced In: 99.
- War Room: 110 offline Python tests; Narrative: 116 offline Python tests.
- Lint and production builds passed for all four Next applications. War Room's
  TypeScript/Vite production build passed. Narrative serves static HTML/CSS/JS.
- Disrupt's 16 existing browser journeys and Moat's 14 browser journeys passed,
  including keyboard use, exports, reloads and comparison states. Disrupt's
  keyboard tests were rerun after restoring the skip link as the first tab stop.
- `tools/project-theme-check.mjs`: 153 checks at 390, 768 and 1440 pixels across
  all routes and populated states. Includes Disrupt decisions/resolution/results;
  Moat comparison/reveal; Priced In map, solver, table, export and saved thesis;
  War Room parsing, rankings, pinned comparisons, simulation and mobile detail;
  Narrative progress, report, sorting, detail, reset and error states.
- `tools/portfolio-ui-check.mjs`: all eight portfolio routes at 320, 390, 768,
  1024 and 1440 pixels, including both corrected launch destinations.

The browser checks use installed Chrome and production exports served by
`tools/serve-static.mjs` on ports 3001–3003 (portfolio: 3100). War Room runs on
8001 with a temporary SQLite database, development seed data, no API keys and
the heuristic parser. Narrative's static UI runs on 8002 with API responses
intercepted using an offline `run_analysis` result generated from its existing
integration-test fixtures. Set `NARRATIVE_UI_FIXTURE` to that JSON file when
running the cross-project check. Test data is never written to production.

Visual review caught and corrected a Priced In grid column that allowed wide
tables to extend beneath the assumptions panel. Wide tables remain horizontally
scrollable inside their own containers. War Room's detail panel remains
available on tablet and mobile rather than disappearing at smaller widths.
