# Handover checklist

State as handed over: **P0 built, not deployed.** All three projects are at
concept status, no demo exists, and `robots.txt` disallows all crawling until a
real site origin is configured.

Work through this before showing the site to anyone outside the project, and
again before launch.

---

## 1. Owner-supplied material still needed

Nothing below has been invented or guessed at. Each item is absent from the
site, and the site renders correctly without it.

| # | Item | Where it goes | Blocking launch? |
| --- | --- | --- | --- |
| 1 | **At least one verified contact method** (LinkedIn URL, email, or a deliberate decision to omit contact entirely) | `profile.verifiedLinks` in `content/profile.ts` | **Yes** — or a conscious decision to launch without contact |
| 2 | **The real site origin** (domain or hosting URL) | `NEXT_PUBLIC_SITE_ORIGIN`, or the fallback in `content/site.ts` | **Yes** — canonical URLs and robots stay off without it |
| 3 | **Review of the biography copy** in `content/profile.ts` — four paragraphs, written from the BRD's starter copy plus confirmed facts only | `content/profile.ts` | **Yes** |
| 4 | **Review of the three case narratives** — the long-form sections, trade-offs, and uncertainties are drafted from the project briefs and are the owner's argument to sign off | `content/projects.ts` | **Yes** |
| 5 | Resume file, if one is wanted | `public/`, then an asset record and `profile.resumeAsset` | No |
| 6 | Headshot, if one is wanted | `public/`, then an asset record and `profile.portraitAsset`. **Not generated** — must be a real photograph | No |
| 7 | Location line, if wanted in the footer | `profile.locationOptional` | No |
| 8 | GitHub or repository URLs for the three projects | `repositoryUrl` on each project | No |
| 9 | Working demo URLs, once the applications run | `status` + `demoUrl` per project — see README, "Updating project status" | No |
| 10 | Real screenshots, once the applications run | New `kind: "file"` assets — see README, "Replacing a concept preview" | No |
| 11 | Employers, job titles, dates, or any impact number, if they are to appear at all | `content/profile.ts` — and the honesty assertions in `lib/site-content.test.ts` will need updating in the same edit | No |
| 12 | Confirmation that "USC Marshall" and "BITS Pilani Dubai" are the preferred renderings of the two institutions | `profile.education` | No |

Items 5, 6, 7, 8, 9, and 10 are configuration tasks, not defects. The UI treats
absence as the normal case: no placeholder, no disabled control, no dead link.

---

## 2. Verify before launch

### Content and honesty

- [ ] `npm run validate:content` passes with **zero warnings** (it currently
      reports one: no verified links configured).
- [ ] Every project's `status` and `evidenceStatus` matches reality. A
      successful build is not a reason to promote either.
- [ ] No project has been promoted past `concept` without its demo actually
      running and its `recommendation` written.
- [ ] The owner has read every sentence of `content/profile.ts` and
      `content/projects.ts` and stands behind it.
- [ ] Nothing on the site claims a title, client, employer, date, award, or
      number the owner has not confirmed.

### Configuration

- [ ] `NEXT_PUBLIC_SITE_ORIGIN` is set to the real origin.
- [ ] `npm run build` no longer prints the `metadataBase` warning.
- [ ] `curl <origin>/robots.txt` returns `Allow: /` and the sitemap line.
- [ ] `curl <origin>/sitemap.xml` lists six absolute URLs on the real origin
      and contains no `localhost`.
- [ ] `<link rel="canonical">` is present on `/`, `/about`, `/method`, and each
      case page, and points at the real origin.
- [ ] The three Open Graph cards render correctly in a preview tool
      (`/opengraph-image` and `/work/<slug>/opengraph-image`).

### Accessibility — manual, not automated

Automated checks supplement this list; they do not replace it.

- [ ] Tab through every page from the top: skip link fires first, focus order
      follows reading order, and the focus ring is visible on every control.
- [ ] Open the mobile menu with the keyboard, press Escape, and confirm focus
      returns to the Menu button.
- [ ] Follow a link from inside the open mobile menu and confirm the panel does
      not stay open over the new page.
- [ ] Zoom to 200% at 1280px wide and confirm nothing is clipped or overlapped.
- [ ] Disable JavaScript and confirm: every case is fully readable, all three
      nav items are reachable in the header, and each figure's text
      alternative still opens.
- [ ] Disable web fonts and confirm the serif/sans hierarchy still reads.
- [ ] Run a screen reader over one case page and confirm each figure is
      announced once, with its full alt text, rather than as loose SVG labels.
- [ ] Confirm one `<h1>` per page and no skipped heading level.
- [ ] Confirm `prefers-reduced-motion` is honoured (motion tokens go to 0ms).

### Responsive review

- [ ] Inspect `/`, one case page, `/about`, `/method`, and `/404` at 360, 390,
      768, and 1440px.
- [ ] Hero line breaks land as authored: four lines from 641px up, six lines at
      640px and below.
- [ ] No horizontal scrolling at any width.
- [ ] The three project features alternate their proportions and sides on
      desktop and read title → question → preview → summary → actions on mobile.

### Performance

- [ ] Run Lighthouse on mobile against a production build and record the actual
      numbers with the test conditions. Do **not** report field INP, LCP, or
      CLS until field data exists.
- [ ] Confirm the homepage client JavaScript stays small — there is one client
      island (`components/layout/site-header.tsx`) and it should stay that way.

---

## 3. Deployment

Nothing here is configured, and nothing should be assumed.

- [ ] No hosting platform is set up. There is no `.openai/hosting.json` and no
      deployment configuration in this app.
- [ ] No custom domain, no DNS records, and no purchases have been made.
- [ ] No analytics. P0 works without it; if it is added later, keep it to page
      views, project opens, demo opens, and verified contact clicks — and never
      record visitor text or model inputs.
- [ ] A preview deployment must not be described as a public launch. Until the
      site origin is configured, `robots.txt` enforces that.
- [ ] The footer currently states the site is "not hosted publicly". Update
      that line when it stops being true.

---

## 4. Sibling applications

The three project applications live in sibling directories under `apps/` and
are **not** wired into this site in any way. Their URLs are configuration
values (`demoUrl` per project) and nothing more. This app imports no code from
them and does not need them to build, test, or run.

To connect one, see README, "Updating project status". Verify the demo actually
runs first.

---

## 5. What the repository already guarantees

You do not need to re-check these by hand; they fail the build or the test
suite.

- Content shape, enums, and required fields (zod, at import time).
- Duplicate slugs and duplicate project numbers.
- Dangling evidence citations, and evidence with no citation.
- Cover assets that reference an unregistered asset, and file-backed assets
  whose file is not on disk.
- `concept` with a demo URL; `prototype`/`published` without one.
- `concept` with a recommendation, or a Position that does not open with
  "Investigation in progress".
- Evidence items claiming a stronger status than their project.
- Malformed dates, impossible dates, and `updatedAt` before `publishedAt`.
- Homepage introductions outside 50–80 words.
- The exact palette, spacing scale, grid, hero clamp, and motion values.
- The computed contrast ratio of every foreground/background pair on the site.
- The hero headline reconstituting the positioning statement at every
  breakpoint.
- Navigation being exactly Work/About/Contact, Method staying a footer link,
  and no `/projects` route existing anywhere.
- The sitemap covering every route exactly once with absolute URLs and no
  placeholder domain.
- No email address, phone number, social URL, percentage, or currency figure
  anywhere in the content.
