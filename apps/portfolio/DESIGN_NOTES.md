# Design notes

Written 7 September 2026, alongside the build.

---

## 1. Reference-to-decision note

### What was actually inspected, and what was not

**Be clear about the limit of this.** I retrieved the text and DOM content of
three of the named references through a fetch tool. I did **not** see them
rendered. No browser was available to me in this session — attempts to open a
tab returned "No browser tab available" every time — so I have no screenshots
of any reference site, and I cannot speak to their spacing, colour, type sizes,
or motion from observation.

| Reference | URL | Inspected | How |
| --- | --- | --- | --- |
| Pentagram — Scenario | `https://www.pentagram.com/work/scenario` | Text and structure only | Fetched 7 Sep 2026 |
| The Pudding | `https://pudding.cool/` | Text and structure only | Fetched 7 Sep 2026 |
| Linear — How we redesigned the Linear UI (part II) | `https://linear.app/now/how-we-redesigned-the-linear-ui` | Full article text | Fetched 7 Sep 2026 |
| Pentagram — Publications | `https://www.pentagram.com/publications` | Not inspected | — |
| Stripe — 2025 annual letter | `https://stripe.com/annual-updates/2025` | Not inspected | — |
| Datawrapper blog | `https://www.datawrapper.de/blog` | Not inspected | — |
| Siteinspire | `https://www.siteinspire.com/` | Not inspected | — |

So the numeric tokens and the composition in BRD section 9 did the work that
visual reference inspection would otherwise have done. What follows is what I
took from the three texts I did read — no more than that.

### Pentagram, Scenario → project features and figure discipline

The page's own account of the Scenario identity is that the team built a custom
wordmark arranged on a 3×3 modular grid, and that "the grid system repeats
throughout the brand, with coloured blocks framing photographs and imagery
across print and digital applications."

Two decisions came from that:

1. **The grid is the identity, not the decoration.** There is no ornament
   anywhere on this site. Structure is carried by a 12-column grid, 1px rules,
   and the proportion between text and figure. The three homepage features
   alternate a 5/7 and a 7/5 text/figure relationship and swap sides, so the
   rhythm down the page comes from proportion rather than from a repeated card
   shape. That is also why the features are explicitly *not* a three-card grid,
   which the BRD rejects.
2. **A consistent frame around varying content.** Pentagram frames disparate
   imagery in a repeating device. Here, every figure sits inside the same
   `EvidenceFigure` chrome — surface background, 1px rule, and a label tab
   printed over the top rule — while the three drawings inside are completely
   different diagrams. The frame is constant; the content is specific.

I did not copy the 3×3 module, the wordmark treatment, the colour blocks, or
any layout.

### The Pudding → question-led entry, and one purposeful preview

The index reads as a numbered run of pieces, each a title plus a one-line
question or premise: "#224 mowing experiment — Why some people mow a lawn
better than others." Numbered, dated, question-first, and no images in the
listing text at all.

Three decisions:

1. **The "Index of questions" companion.** Three linked prompts — "How does AI
   change competition?", "What remains worth paying for?", "What do the
   economics require?" — as text with small project numbers, in a four-column
   rail beside the hero. Not cards. That block came directly from seeing how
   much work a numbered question does on its own.
2. **The question outranks the title on every case.** On each case page the
   strategic question is set in italic serif above the `<h1>`, and on the
   homepage features it sits directly under the title. The project name is the
   label; the question is the invitation.
3. **One purposeful preview per project, and interaction only where it
   clarifies.** The Pudding earns its interactions. This site has almost none:
   one client island for the mobile menu, and native `<details>` disclosures
   for figure text alternatives. Nothing essential is behind an interaction,
   and every case reads with JavaScript off.

I did not copy their layout, their numbering style, their copy, or their
imagery.

### Linear, UI redesign → hierarchy, contrast, and component craft

Three passages changed what I built.

1. **On contrast:** "The contrast of the content has also been improved by
   making our text and neutral icons darker in light mode." They treated
   contrast as something to compute and tune, not assume — they even generate a
   contrast variable. The BRD warns that its palette is *proposed and not
   validated*, so `lib/design-tokens.test.ts` reads `styles/tokens.css`,
   computes the real WCAG ratio for every pair the site renders, and asserts
   it. Findings: ink on paper 14.26:1, muted ink on paper 5.42:1, accent on
   paper 5.91:1, the three project accents 6.40:1, 5.77:1, and 6.38:1. The rule
   colour is **1.38:1** against paper — fine as a divider, and failing WCAG
   1.4.11 as a control boundary. That is why `--border-control` exists and
   resolves to ink: buttons and the skip link never depend on the rule colour
   to be perceived. That specific check exists because the Linear piece treats
   contrast as measurable.
2. **On restraint:** "we've adjusted the sidebar, tabs, headers, and panels to
   reduce visual noise, maintain visual alignment, and increase the hierarchy
   and density of navigation elements." Applied literally: a 64/80px static
   header with a plain typographic wordmark and three items, and no second
   oversized call to action in the footer. The header is deliberately **not**
   sticky, because a fixed bar sits over anchored headings and over the
   keyboard focus ring.
3. **On expressive headings over one type family:** "We started using Inter
   Display to add more expression to our headings while maintaining their
   readability and kept using regular Inter for the rest." The same division of
   labour, with a sharper split: Instrument Serif carries every heading, the
   wordmark, and the italic questions; Manrope carries all reading text,
   labels, controls, and figure text. Serif for the argument, sans for the
   apparatus.

I did not copy their component designs, their LCH theme generation, their
colour values, or their layout.

### Where I had no reference

Because I could not inspect Stripe's annual letter or the Datawrapper blog, two
areas rest on the BRD numbers and my own judgement rather than on a reference:

- **Long-form financial narrative** (the Priced In case pacing). I followed the
  BRD's fixed section order and kept the reading measure at 720px, but I have
  no reference for how a financial letter paces a long argument.
- **Chart labelling craft.** The schematics carry axis labels, annotation
  labels, and a text alternative, and no numbers. That satisfies the BRD, but
  it was not checked against Datawrapper's writing on chart clarity, and the
  labelling is the part of this build I would most want reviewed.

---

## 2. Art direction decisions

**Warm paper, deep ink, and no panels.** Paper `#F6F3ED` throughout, with
`#FFFEFA` surface used *only* for figures and the authorship block. That
restriction is what keeps the page reading as a printed publication instead of
a stack of components: there are almost no boxes, and the ones that exist mean
"this is evidence".

**Rules do the structural work.** Section heads sit above a 2px ink rule;
records, list items, and features are separated by 1px rules in the rule
colour. No shadows anywhere, radii of 2–4px, and no pill shapes.

**Authored line breaks, not a shrinking heading.** The hero headline is stored
in `lib/hero-headline.ts` as eight phrase units with an explicit break after
each, and the breaks render conditionally per breakpoint: four lines at 641px
and up, six lines at 640px and below. The character budget for each was derived
from the 8-of-12 column width (~819px at 1440px) against the clamped font size
(~94px), and from 320px of usable width at the 48px clamp floor. A test asserts
both line sets *and* that joining the units reproduces the positioning
statement exactly, so a break edit cannot silently change the sentence.

**Per-project accent, applied once.** Each project sets `--page-accent` on one
container — the case-page `<main>`, or its homepage feature. Everything inside,
including the SVG schematics, inherits it. Blue for the competitive game, violet
for the investigation, green for the finance workbench.

**Status is typography, not a badge.** Status appears as plain text with a small
dot: filled for a running project, a hollow ring for concept. There is no
coloured pill, because a pill would make "Concept" look like a feature.

### Named exclusions — checked

No purple-to-blue gradient hero. No glowing orb. No floating glass cards. No
dot-grid wallpaper. No 3D robot. No rounded bento layout (there is no card grid
at all). No centred hero, and the two hero actions are deliberately unequal —
one filled button, one plain text link. No logo marquee. No scroll hijacking, no
parallax, no scroll-triggered reveals of any kind. No decorative chart with
invented performance: the three schematics contain no score, return, or user
count, and the only quantities anywhere are the two fictional market sizes from
the project brief, labelled "Fictional scenario" inside the drawing itself.

Also absent from the site: visitor accounts, a resume chatbot, a newsletter
prompt, testimonials, impact statistics, a blog, skill bars, and a loading
animation.

---

## 3. Honesty as a build constraint

The unusual part of this build is that the honesty rules are enforced by code
rather than by care.

- `content/projects.ts` runs the full cross-record validator at import time, so
  inconsistent content fails `npm run build` rather than rendering.
- A `concept` project cannot carry a `demoUrl`, cannot carry a
  `recommendation`, and must open its Position with "Investigation in
  progress". Promotion is not the reverse of that: a `prototype` needs no
  `demoUrl` and no `recommendation`, because `status` describes how mature the
  software is while `demoUrl` describes whether the public can reach it and
  `evidenceStatus` describes what it has produced. Three separate facts.
- Launch actions are a pure function of `status` and `demoUrl`. Absence is the
  default branch, not a special case, so there is no way to leave a dead
  button on the page.
- `npm test` scans every content string and fails on an email address, a phone
  number, a LinkedIn or GitHub URL, a percentage, a currency figure, the phrase
  "AI strategist", or a claim that the site is deployed.
- Each project's `summary` is checked to be 50–80 words, so the homepage
  features cannot drift into being either thin or essay-length.

---

## 4. Known limitations of this build

1. **Reference inspection was text-only.** Stated above, and worth repeating:
   no reference site was seen rendered.
2. **Figure text is small on narrow screens.** The schematics use a fixed
   `720 × 500` viewBox, so at 360px their labels scale to roughly 7px. The
   `.fine` annotations are hidden below 720px for that reason, and the alt text
   plus the `<details>` alternative carry the content — but the drawings are
   closer to decorative than informative on a phone. A second, coarser mobile
   variant of each schematic is the right fix and is not built.
3. **OG images use the wrong typeface.** They render with the `next/og` default
   face, not Instrument Serif. See `ASSET_LICENCES.md` for the fix.
4. **No measured performance data.** The site is fully prerendered with one
   small client island, but no Lighthouse run or field measurement is reported
   here, so no LCP, CLS, or INP figure is claimed.
5. **Chart labelling is unreviewed.** Noted above.
