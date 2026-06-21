---
status: accepted
---

# Sub-site comparison: one build-time content source, behaviour-only JS

The three Sub-sites' comparison content lived in **two parallel, divergent sources** — an untyped
`CMP` array in `public/assets/js/site.js` (the one actually rendered, at run-time, on the
visitor's device) and a typed-but-unused `src/data/comparison.ts` (+ `ComparisonTable.astro`) —
with hero copy and WhatsApp messages duplicated again across the `.astro` pages. We are
consolidating to **`src/data/comparison.ts` as the single source of truth** for all comparison
*content* (scoreboard rows + the three Comparatives, per-angle hero words/numbers, angle-lead
data, WhatsApp message text, advantage totals), rendered **at build time** by Astro components.
`site.js` is deliberately demoted to **behaviour only** (scroll reveals, count-up, lightbox,
floor-plan explorer, EMI calculator, lead-form submit, and run-time decode of the anti-scrape
WhatsApp number). The driver is **one place to edit every figure** and static-first HTML.

This also settles the layered structure (B2): each Sub-site **leads with its own Angle** via a
bespoke block (`/cost` cheque comparison · `/handover` 2027-vs-2031 timeline · `/rental-yield`
earnings build-up), followed by the full **Scoreboard** as supporting proof; the old grouped
deep-dive section is removed.

## Considered options

- **Keep the typed source as-is and switch to it** — rejected: `comparison.ts` was the *poorer*
  source (no Product Comparative, no scoreboard, no advantage maths). Consolidating meant porting
  the richer JS model *up* into the typed file, not adopting it verbatim.
- **Type the `CMP` array but keep rendering in JS** — rejected: leaves rendering at run-time and
  against Astro's static-first grain; `site.js` is an un-bundled `public/` script that cannot
  `import` a `src/` module, so data-in-JS and build-time render are mutually exclusive here.
- **Emit the data as JSON into the page for `site.js` to render** — rejected: a needless data
  bridge and client-side rendering when build-time render is available.
- **Move the entire hero (image + markup) into the data file** — rejected: a data file is the
  wrong home for layout and image choices; it owns hero *words + numbers* only, the page keeps
  layout + image.

## Consequences

- **Boundary:** `comparison.ts` owns content/figures; `.astro` pages own layout + which render
  image; `site.js` owns behaviour. The anti-scrape WhatsApp number stays decoded at run-time; only
  the *message text* is baked in at build time.
- **Canonical Angle key is the short form** `cost | handover | yield` (public path stays
  `/rental-yield`). The redundant `page` + `active` props on `SubSiteLayout` collapse to one
  `angle` prop; `data-page` → `data-angle`.
- **Deletions:** `CMP`, `GROUPS`, `GROUP_ORDER`, `HILITE`, `renderCompare`, `renderGroups`,
  `WA_MSG` leave `site.js`; the standalone grouped deep-dive section is removed;
  `ComparisonTable.astro` is folded into the new build-time components.
- Editing any comparison figure is now a single-file change — directly enabling the §7 swap of
  placeholder figures for audited ones before scaling ad spend.
