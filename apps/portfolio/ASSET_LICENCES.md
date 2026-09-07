# Asset and licence inventory

Every non-code asset the site ships, where it came from, and under what terms.
Nothing here is a third-party photograph, logo, screenshot, or chart.

Last reviewed: 7 September 2026.

---

## Fonts

Both families are loaded through `next/font/google`, which downloads the font
files at build time and serves them from the site's own origin. No request is
made to Google or any other third party when a visitor loads a page. The files
are emitted into the build output under `.next/static/media/`.

### Instrument Serif

- **Use:** editorial headings, project titles, the wordmark, and italic
  strategic questions.
- **Weights shipped:** 400 normal and 400 italic, `latin` subset only.
- **Designer:** Rodrigo Fuenzalida.
- **Licence:** SIL Open Font License, Version 1.1.
- **Licence text:** <https://openfontlicense.org/open-font-license-official-text/>
- **Specimen and licence source:** <https://fonts.google.com/specimen/Instrument+Serif>
- **Obligations met:** the font is used and redistributed unmodified; the
  Reserved Font Name is not used for any derivative; this notice accompanies
  the software. The OFL permits bundling with, and serving from, a web
  application.

### Manrope

- **Use:** body copy, navigation, controls, labels, figure text.
- **Weights shipped:** variable 200–800, `latin` subset only.
- **Designer:** Mikhail Sharanda (Mikhail Sharanda / Cyreal).
- **Licence:** SIL Open Font License, Version 1.1.
- **Licence text:** <https://openfontlicense.org/open-font-license-official-text/>
- **Specimen and licence source:** <https://fonts.google.com/specimen/Manrope>
- **Obligations met:** as above — unmodified use and redistribution, no
  Reserved Font Name derivative, notice retained here.

### Fallback stacks

`--family-serif` and `--family-sans` in `styles/tokens.css` end in system faces
(Iowan Old Style, Palatino, Georgia, generic `serif`; `-apple-system`, Segoe UI,
Roboto, Helvetica Neue, Arial, generic `sans-serif`). These are installed by the
operating system, are not redistributed by this project, and require no licence
from us. They exist so the serif/sans hierarchy survives a font-loading
failure.

### Open Graph images

The generated OG cards render with the default face bundled inside `next/og`
(part of Next.js, MIT licensed), not with Instrument Serif. `next/font` keeps
its downloaded files inside the build output, so they are not readable at
render time. If matching the site typography matters, commit the OFL-licensed
`.ttf` files under `assets/` and pass them to `ImageResponse` via `fonts` — the
OFL permits it, and this notice already covers redistribution.

---

## Images and figures

### Concept preview schematics (3)

| Asset ID | Drawn in | Depicts |
| --- | --- | --- |
| `schematic-disrupt-this-business` | `components/schematics/disrupt-this-business.tsx` | Two opposed strategic positions, two customer segments, and the four-quarter commit/reveal/resolve loop. |
| `schematic-the-moat-test` | `components/schematics/the-moat-test.tsx` | One transcript, a tagged-line baseline, a model extraction, and the line reference behind each claim. |
| `schematic-priced-in` | `components/schematics/priced-in.tsx` | A hypothetical expectations map of growth against margin, with the operating bridge it feeds. |

- **Origin:** original SVG, authored in this repository for this site. Each was
  drawn from the corresponding owner-authored brief in `docs/`
  (`01_Disrupt_This_Business_BRD.md`, `02_The_Moat_Test_BRD.md`,
  `03_Priced_In_BRD.md`).
- **Licence:** owned by the project owner. No third-party source, no traced or
  adapted artwork, no stock or generated imagery.
- **Labelling:** every one renders under the visible label **"Concept
  preview"**, with a caption stating what is illustrative and a text
  alternative in a `<details>` disclosure.
- **Content constraints:** none displays a benchmark score, a return, a user
  count, a currency figure, or any other result. The only quantities shown are
  the fictional market sizes from the Disrupt This Business brief (800 small
  teams, 200 enterprise teams), which the drawing itself labels "Fictional
  scenario", and the transcript line numbers in The Moat Test schematic, whose
  excerpt text is hand-authored and labelled "Illustrative excerpt".
- **Provenance records:** duplicated per asset in `content/assets.ts` under
  `source`, and rendered on each case page beneath the figure.

### Site icon

- `app/icon.svg` — original, three ruled lines in the site's paper, ink, and
  accent colours. An abstract index mark. Not a monogram, not a logo, not an
  AI motif.

### Absent by design

- **No portrait of Ankit.** None generated, none sourced. A user-supplied
  headshot can be added later with an intentional crop and meaningful alt text
  (see README, "Adding a resume" for the equivalent asset-record pattern).
- **No product screenshots.** None of the three applications runs yet, so
  there is nothing honest to capture.
- **No third-party logos.** No USC, no employer, no reference company, no
  technology badges. Nothing on the site implies endorsement.
- **No icon library.** The site uses no icon font or SVG icon set, so there is
  no additional licence to track. Where an icon would have gone, there is a
  word.
- **No stock imagery, illustration, or generated image of any kind.**

---

## Code dependencies

| Package | Licence | Use |
| --- | --- | --- |
| `next` 16.3.4 | MIT | Framework, `next/font`, `next/og`, metadata routes. |
| `react`, `react-dom` 19.2.8 | MIT | Rendering. |
| `zod` 4 | MIT | Content schemas. |
| `vitest` 5, `vite-tsconfig-paths`, `tsx` | MIT | Tests and the validator script. |
| `eslint`, `eslint-config-next` | MIT | Linting. |
| `typescript` | Apache-2.0 | Types. |

Run `npm ls --all` for the full resolved tree. No dependency was added beyond
the ones already scaffolded plus nothing — the site introduces no new runtime
dependency.

---

## Reference material — inspected, not reused

The design references named in the BRD were read for their approach to grid,
narrative, and component craft. **No layout, copy, image, logo, typeface
pairing, or colour value was copied from any of them.** See `DESIGN_NOTES.md`
for what was taken and how, including which references could and could not be
inspected.
