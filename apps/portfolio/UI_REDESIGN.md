# Portfolio visual overhaul — September 2026

The owner's references are [Sunny Patel's portfolio](https://www.sunnypatel.net/)
and this [Color Hunt palette](https://colorhunt.co/palette/02152603346e6eacdae2e2b6).
The design borrows the reference's spacious dark layout, strong opening
statement, small numbered navigation, and prominent project previews. The
Decision Atlas is an original interactive graphic tied to Ankit's five
strategic questions.

## Visual system

- Deep navy `#021526` page, blue `#03346E` panels, sky `#6EACDA` accents,
  cream `#E2E2B6` primary text. Secondary text and dividers use subdued shades.
- Manrope leads the hierarchy; Instrument Serif is used for questions and
  occasional emphasis. Existing font setup and fallback families are retained.
- Thin dividers, generous spacing, and alternating project layouts carry the
  composition. Project previews remain clearly identified as schematics.
- Motion is limited to entry transitions and hover responses. Reduced-motion
  preferences disable the entry animations and smooth scrolling.

## Scope and preserved behavior

The homepage, all five `/work/[slug]` cases, About, Method, shared navigation,
footer, favicon, and social sharing cards share the new identity. All original
case evidence, sources, disclosures, statuses, demo destinations, routing,
metadata configuration, and static export behavior are retained. The separate
project applications and their data/model logic are outside this change.

The atlas changes its question and case link when a visitor selects a domain.
It supports native keyboard controls and announces the updated question.
The header stays navigable without JavaScript; cases remain server-rendered.
The evidence figures retain their expandable text alternatives and horizontal
panning on narrow screens.

## Verification

From `apps/portfolio`, run `npm test`, `npm run lint`,
`node --import tsx scripts/validate-content.ts`, and `npm run build`.
The build needs access to Google Fonts, as before.

From the repository root, serve the production export:

```sh
node tools/serve-static.mjs apps/portfolio/out 3100
```

Then run the browser regression check (uses the existing Playwright package and
an installed Google Chrome):

```sh
node tools/portfolio-ui-check.mjs
```

This checks all eight content routes at 320, 390, 768, 1024, and 1440px, local
anchor targets, original demo links and new-tab protections, figure disclosures,
mobile menu behavior, keyboard project selection, reduced motion, navigation
without JavaScript, 404 handling, and browser errors. Screenshots go to
`/tmp/portfolio-ui-review`; override with `PORTFOLIO_SCREENSHOTS` if needed.
`PORTFOLIO_URL` selects a different preview origin.
