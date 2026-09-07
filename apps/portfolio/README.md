# Ankit Kapoor — AI strategy portfolio

An editorial personal publication built around three independent projects:
**Disrupt This Business**, **The Moat Test**, and **Priced In**.

Next.js 16 App Router, React 19, TypeScript, plain CSS (CSS Modules plus a
central token file). No Tailwind, no CMS, no database, no API keys. Every page
is statically prerendered and all case content is readable with JavaScript
disabled.

The authoritative specification is `docs/04_Portfolio_Website_BRD.md` in the
repository root. Design decisions and the reference notes are in
`DESIGN_NOTES.md`. Asset licences are in `ASSET_LICENCES.md`. The
pre-launch checklist is in `HANDOVER.md`.

> **Status: not deployed.** No hosting, domain, or analytics is configured, and
> `robots.txt` currently disallows all crawling until a real site origin is
> set. See "Configuring the site origin".

---

## Getting started

Node 24 is expected. If Node is installed through nvm and is not on your PATH:

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
```

```bash
npm install
npm run dev          # http://localhost:3000
```

## The checks

| Command | What it does |
| --- | --- |
| `npm run build` | Production build. Fails on any TypeScript error and on invalid content. |
| `npm run lint` | ESLint with `eslint-config-next` core-web-vitals plus TypeScript rules. |
| `npm test` | Vitest. Content integrity, navigation, statuses, links, hero line breaks, and computed colour contrast. |
| `npm run validate:content` | Content validator: schemas, duplicate slugs, dangling source IDs, missing assets, malformed demo URLs, date sanity, honesty guards. |

Run all four before handing the site to anyone. `npm run build` also runs the
content validator implicitly, because `content/projects.ts` asserts its own
integrity at import time — bad content breaks the build rather than shipping a
broken page.

---

## Where things live

```
app/                     routes, metadata routes, generated OG images
  page.tsx               homepage
  work/[slug]/           case-study template (one file for all three cases)
  about/  method/        biography and methodology
  not-found.tsx          404
  robots.ts  sitemap.ts  metadata routes, driven by the configured origin
  opengraph-image.tsx    site OG card (original text and graphics)
components/
  layout/                header (the only client island) and footer
  schematics/            the three original SVG concept previews
  project-feature.tsx    homepage feature, alternating 5/7 and 7/5
  evidence-figure.tsx    figure chrome: label, caption, data alternative
  project-meta.tsx       status labels and launch actions
content/
  profile.ts             biography, education, verified links, assets
  projects.ts            the project register
  assets.ts              asset provenance, alt text, captions
  approach.ts            the three-step method
  site.ts                site origin, navigation, route list
lib/
  content-validation.ts  zod schemas and cross-record integrity rules
  hero-headline.ts       the authored hero line breaks
scripts/
  validate-content.ts    the runnable validator
styles/tokens.css        every design token, in one place
```

There is no `src/` directory. The import alias `@/*` resolves from the app root.

---

## Editing the biography

Everything a visitor reads about Ankit lives in `content/profile.ts`.

- `shortBio` is the hero background line.
- `longBio` is an array of paragraphs. The first paragraph is also used as the
  standfirst on `/about` and as the About preview on the homepage, so keep it
  self-contained.
- `education` is a list of `{ institution, credential }`.
- `locationOptional` renders in the footer when set, and is omitted when null.

**Honesty rules enforced by the test suite.** `npm test` scans all content
strings and fails if it finds an email address, a phone number, a LinkedIn or
GitHub URL, a percentage, a currency figure, the phrase "AI strategist", or a
claim that the site is deployed. If you need to add any of those legitimately,
change the content *and* the assertion in `lib/site-content.test.ts` in the same
edit, so the change is deliberate and reviewable.

Employers, job titles, dates, awards, and impact numbers are absent on purpose.
Add them only once the owner has confirmed them.

## Adding verified links

`profile.verifiedLinks` starts empty, and the contact section says
"Contact details will be added before launch." while it is.

```ts
verifiedLinks: [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/<real-slug>" },
],
```

Add an entry only for a destination you have opened and confirmed. Links must
be absolute `https` URLs; the validator rejects anything else. Once one entry
exists, the homepage contact section and the `/about` sidebar switch from the
placeholder to the real list automatically, and the footer lists them too.

The content validator reports an empty `verifiedLinks` as a **warning**, not an
error, so it stays visible on the launch checklist without blocking builds.

## Adding a resume

There is no resume link until a real file exists.

1. Put the file in `public/`, e.g. `public/docs/ankit-kapoor-resume.pdf`.
2. Add an asset record in `content/assets.ts` with `kind: "file"`, the `file`
   path relative to `public/`, real alt text, and a provenance note.
3. Set `profile.resumeAsset` to that asset's `id`.
4. Run `npm run validate:content` — it checks the file is actually on disk.

Display the real file type and size in the link text when you surface it.

---

## Updating project status

This is the edit that matters most, so it is deliberately small.

Every project in `content/projects.ts` currently reads:

```ts
status: "prototype",
demoUrl: null,
demoTarget: "internal",
demoLabel: "Play the scenario",
```

All three demos genuinely run, and none of them is hosted anywhere, so there is
no URL a visitor could reach.

**`status` and `demoUrl` are separate facts.** `status` says how mature the
software is; `demoUrl` says whether the public can reach it — the same
separation the BRD keeps between `status` and `evidenceStatus`. The validator
does not require a URL for a non-concept project, because a demo can genuinely
run and still not be deployed.

Launch actions are derived from `status` and `demoUrl` together, by
`hasLaunchAction()` in `lib/content-validation.ts`, and **both** are required.
No component knows about any specific project. So once a demo is actually
hosted:

```ts
demoUrl: "/demos/disrupt-this-business",   // or an absolute https URL
```

That is the whole change. The launch button appears on the homepage feature and
at the top of the case page, using the existing `demoLabel`. Until then, no
button is rendered and the case page says the demo is not publicly hosted.

**What the labels are allowed to mean** (also published on `/method`):

| `status` | Requirement |
| --- | --- |
| `concept` | Designed and specified. `demoUrl` must be `null` — there is nothing to link to. |
| `prototype` | The demo actually runs. `demoUrl` is optional, and is only for a demo the public can reach. |
| `published` | An authored case exists alongside a running demo. |

| `evidenceStatus` | Requirement |
| --- | --- |
| `illustrative` | Hand-authored or specified. No performance claim. |
| `measured-partial` | Real archived output with run metadata. |
| `reviewed` | Measured evidence a person has actually reviewed. |

The two fields are separate claims and must be moved separately. **A successful
build is never a reason to promote either one, and a demo that runs is never a
reason to move `evidenceStatus`.** The validator enforces the mechanical parts
of this:

- `concept` with a `demoUrl` is an error.
- `concept` with a non-null `recommendation` is an error.
- `concept` whose `brief.position` does not begin "Investigation in progress"
  is an error.
- Evidence items claiming a stronger status than the project is an error.
- A project with `reviewed` evidence and no `recommendation` is a **warning**,
  not an error. Nothing trips it today, because no project has reviewed
  evidence. The rule keys off `evidenceStatus` rather than `status` on
  purpose: a conclusion follows evidence, not a demo that happens to run.

Writing software is not reaching a finding, and the site keeps those apart.

### Setting `demoTarget`

`internal` requires a root-relative path and opens in the same tab.
`external` requires an absolute `https` URL, opens in a new tab with
`rel="noopener noreferrer"`, and adds a visible "Opens in a new tab" note.

---

## Replacing a concept preview with a real screenshot

The three previews are original SVGs in `components/schematics/`, each labelled
"Concept preview". Once an app exists and you have a real screenshot:

1. Add the image to `public/`, cropped to the meaningful interaction, with
   readable labels and no browser or device frame. Export a 1x and a 2x size.
2. Add an asset record to `content/assets.ts`:

   ```ts
   {
     id: "shot-disrupt-this-business-decision",
     kind: "file",
     label: "Screenshot",
     alt: "…what a sighted visitor would learn from the image…",
     caption: "…what it shows, and any labelling the reader needs…",
     dataAlternative: ["…the same information as text…"],
     source: "Screenshot of the running application, captured <date>.",
     file: "shots/disrupt-decision@1x.png",
   }
   ```

3. Point the project's `coverAsset` at the new ID.
4. Extend `EvidenceFigure` to render `kind: "file"` assets with `next/image`,
   including explicit `width` and `height` so nothing shifts. It currently
   throws a clear error for file assets rather than guessing.
5. Delete the schematic component and its entry in
   `components/schematics/ids.ts` if it is no longer used.
6. Run `npm run validate:content` and `npm test`.

Keep `label` accurate: a schematic is a "Concept preview", a screenshot is not.

### Editing a schematic

Each schematic is plain JSX inside a `720 × 500` viewBox using the shared
classes in `components/schematics/schematics.module.css`. Colours come from
CSS custom properties, so a schematic picks up its project accent
automatically. Text sized under about 12 user units uses the `.fine` class,
which is hidden below 720px — the alt text and the data alternative carry that
detail instead.

**No schematic may show a benchmark score, a return, a user count, or any
other fabricated result.** Structure only.

---

## Adding a new case

1. Append a record to `content/projects.ts`. TypeScript and zod will tell you
   what is missing; the required shape is in `lib/content-validation.ts`.
2. Give it the next `number` (`"04"`), a kebab-case `slug`, a distinct
   `question`, and an `accentVar` (add a new `--project-accent-04` token to
   `styles/tokens.css` if you want a fourth colour, and check its contrast in
   `lib/design-tokens.test.ts`).
3. Write a `summary` of **50–80 words** — the validator counts them.
4. Add every `sourceRefs` entry the evidence cites. Dangling citations fail.
5. Add a cover asset and register a schematic, or point at a real screenshot.
6. Run `npm run validate:content`, then `npm test`, then `npm run build`.

The route, the sitemap entry, the OG image, the index of questions, the 404
directory, and the "other cases" links all come from the register. There is no
layout work: `app/work/[slug]/page.tsx` renders any valid project.

Add the new slug to `REQUIRED_SLUGS` in `lib/site-content.test.ts`.

---

## Configuring the site origin

Canonical URLs, absolute Open Graph URLs, and the robots policy are all driven
by one value, and it is deliberately unset:

```bash
NEXT_PUBLIC_SITE_ORIGIN=https://your-real-domain.example npm run build
```

Or replace the fallback in `content/site.ts`. Until it is set:

- No `<link rel="canonical">` is emitted anywhere. The site never publishes a
  placeholder domain as canonical.
- `robots.txt` returns `Disallow: /` and advertises no sitemap, so a preview
  cannot be mistaken for a public launch.
- `sitemap.xml` uses `http://localhost:3000`, because the sitemap format
  requires absolute URLs.
- `next build` prints one warning: *"metadataBase property in metadata export
  is not set…, using http://localhost:3000"*. That warning is the intended
  state, not a defect. It disappears once the origin is configured.

Only `https` origins are accepted (plus `localhost`); anything else throws at
build time rather than shipping a broken canonical.

---

## Design system

Every token — palette, type scale, spacing scale, grid, motion — lives in
`styles/tokens.css`. Component modules read the custom properties and never
hard-code a colour or a size.

`lib/design-tokens.test.ts` parses that file and asserts the exact token values
against the specification, plus the computed WCAG contrast ratio of every
foreground/background pair the site renders. If you change a colour, run
`npm test` and it will tell you which pair stopped passing.

Per-project accents are applied by setting `--page-accent` on a container
(the case-page `<main>`, or each homepage feature). Nothing downstream needs to
know which project it is rendering.

### Fonts

Instrument Serif (headings) and Manrope (body and UI) are loaded through
`next/font/google`, which downloads and self-hosts them at build time — no
runtime request to Google. Both use `display: swap` with metric fallbacks.
`--family-serif` and `--family-sans` in `styles/tokens.css` end in real system
serif and sans stacks, so the serif/sans hierarchy survives a font failure.
Licence notices are in `ASSET_LICENCES.md`.

The generated Open Graph images use the `next/og` default face rather than
Instrument Serif, because `next/font` keeps its downloaded files inside the
build output. To change that, commit the `.ttf` files under `assets/` and pass
them to `ImageResponse` via its `fonts` option.

---

## Accessibility notes

- One `<h1>` per page; headings descend without skipping.
- A skip link to `#main` on every page.
- Semantic landmarks: `header`, `nav` (each with an accessible name), `main`,
  `footer`, `article`, `aside`.
- The mobile menu is labelled, uses `aria-expanded`/`aria-controls`, closes on
  Escape and on navigation, and returns focus to its trigger.
- Every navigation item that points at the current page carries
  `aria-current="page"`.
- Focus is a 2px accent outline with a 3px offset, distinct from every hover
  state, and never relies on the low-contrast rule colour.
- Each figure exposes one coherent description: the SVG is `aria-hidden`, the
  wrapper carries `role="img"` and the asset's alt text, and a `<details>`
  disclosure repeats the content as text. The disclosure is native HTML and
  works without JavaScript.
- No hover-only content. Nothing essential is revealed by motion, and
  `prefers-reduced-motion` zeroes the motion tokens.
- The whole site is prerendered. Disable JavaScript and every case remains
  readable and navigable.
