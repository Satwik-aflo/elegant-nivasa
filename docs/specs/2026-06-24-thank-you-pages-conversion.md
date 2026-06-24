# Thank-you pages for form conversion tracking

> **IMPLEMENTED 2026-06-24.** Live in code: `layouts/ThankYouLayout.astro` + `/thank-you-visit` +
> `/thank-you-brochure`; `site.js` `showSuccess()` redirects on success. `astro check` 0/0/0, build
> green. Marketing's GTM page-view triggers are the remaining (non-code) step.

_Spec — 2026-06-24. Adds dedicated thank-you pages for the two on-site form conversions
(book-a-visit Lead, brochure request) so Google Ads can track them with a rock-solid
page-load trigger instead of a JS event. Requested by marketing. Covers the main site and
all three sub-sites (shared form code)._

## Goal

Give the two **form** conversions a real landing URL that loads on success, so the
marketing-owned GTM container fires Google Ads conversions off a **page-view trigger** —
the most reliable trigger there is — rather than depending on a `dataLayer` event firing
correctly at submit time.

This is **distinct from**, and complements, the existing `track()` / `dataLayer` bridge
(CLAUDE.md §5). That bridge stays — it is the **only** option for WhatsApp (see Non-goals).

## Scope

- `/thank-you-visit` — after a book-a-visit (`intent=lead`) submit.
- `/thank-you-brochure` — after a brochure (`intent=brochure`) submit; also auto-starts the
  PDF download on load + a manual download button fallback.
- One change in `site.js`: on a successful `POST /api/lead`, navigate to the matching
  thank-you page instead of showing the in-dialog success panel.

Because the book-a-visit and brochure dialogs/forms are shared across the homepage and the
three sub-sites, this one `site.js` change covers **every route**.

## Non-goals

- **WhatsApp Enquiry gets no thank-you page.** The tap leaves the site for the WhatsApp app,
  so it cannot land on our page. It stays on the existing `whatsapp_click` click event →
  GTM Custom-Event trigger. Unchanged.
- No PII in any conversion ping (same basic-scope rule as the rest of analytics).
- No GTM tag/trigger building — that is marketing's side (see "Outside the code").

## Design

### 1. Two new pages

`web/src/pages/thank-you-visit.astro` and `web/src/pages/thank-you-brochure.astro`.

- **Self-contained**, mirroring `privacy.astro`: own `<head>`, loads `site.css`,
  `<AnalyticsScripts />` in head, `<GtmNoscript />` as first child of `<body>`, simple
  header (logo + "Back to site") and footer.
- `<meta name="robots" content="noindex, nofollow" />` — these are post-submit pages, not
  meant to rank or be entered directly.
- Content: a clear confirmation ("We've got your details — our team will call you shortly"),
  and an **immediacy CTA row** for people who want to reach us now: click-to-call and a
  WhatsApp button (numbers come from the same anti-scrape mechanism already used; if that is
  more than this page needs, a plain `tel:` + a WhatsApp link to one rep is acceptable —
  decide at build time, keep it simple).
- A "← Back to the site" / "Explore the project" link.

### 2. Conversion signals fire on page load (not at submit)

Firing a tracking beacon immediately before navigating away can drop the beacon. So the
**thank-you page** owns the firing:

- Each thank-you page, on load, calls the existing `track()` once for its event
  (`lead_submit` on `/thank-you-visit`, `brochure_request` on `/thank-you-brochure`). That
  fans out to Meta Pixel (`Lead`), Clarity, and the `dataLayer` exactly as today.
- GTM's natural `gtm.js` page-view on this URL is what marketing maps the **Google Ads**
  conversion to.

This means the `track()` call is **removed from the form submit handler** and **moved to the
thank-you page** — the conversion is counted exactly once, at one place, with no navigation
race. (If `window.track` is not yet exposed the way the pages need, expose it or inline the
equivalent few lines — resolve at build time after checking how `track` reaches `window`.)

### 3. `site.js` submit handler change

In the `[data-leadform]` submit success path (`showSuccess`):

- On a successful POST, set `window.location.href` to `/thank-you-visit` (intent `lead`) or
  `/thank-you-brochure` (intent `brochure`).
- Remove the in-dialog success reveal, the in-dialog brochure auto-download, and the
  `track()` call (all three move to / are replaced by the thank-you page).
- **Failure path unchanged**: still flips the button to "Try again" and stays put. The lead
  is written to D1 before navigation, so navigating only on success loses nothing.

### 4. Brochure download on the thank-you page

`/thank-you-brochure` auto-starts the PDF download on load (same anchor-click trick used in
`site.js` today, pointing at the brochure asset path) and shows a visible "Download brochure"
button as a fallback for anyone whose auto-download is blocked.

## Data flow (after change)

ad click (`gclid`) → visitor submits form → `POST /api/lead` writes D1 + email →
on success, browser navigates to `/thank-you-visit` (or `-brochure`) → page loads →
`track()` fires Meta + Clarity + `dataLayer`; GTM page-view fires the Google Ads conversion.

## Outside the code (marketing, in GTM)

- Google Ads "Site Visit" conversion → **page-view** trigger, Page URL = `/thank-you-visit`.
- Google Ads "Brochure" conversion → **page-view** trigger, Page URL = `/thank-you-brochure`.
- Google Ads "WhatsApp Enquiry" conversion → **Custom Event** trigger, event =
  `whatsapp_click` (already planned).
- **Do NOT** also build Google Ads triggers on the `lead_submit` / `brochure_request`
  dataLayer events — the page-view triggers already cover those. Doing both double-counts.
- Per the standing ownership rule (CLAUDE.md §5): GTM must not re-add Meta Pixel or Clarity.

## Testing / verification

- `npx astro check` → 0/0/0.
- `npm run build` → green.
- Local dev: submit book-a-visit → lands on `/thank-you-visit`; submit brochure → lands on
  `/thank-you-brochure` and the PDF downloads. Confirm the lead still writes to local D1.
- Confirm both thank-you pages carry the GTM head snippet, `GtmNoscript`, Pixel and Clarity
  (curl/grep the built HTML, same check used for the GTM split).
- Confirm `noindex` is present on both.

## Notes

- **DPDP (CLAUDE.md §8):** unchanged — these pages load the same trackers pre-consent as the
  rest of the site. Same deferred consent item; no new exposure beyond what already ships.
- The thank-you pages are also a natural future home for richer post-conversion UX
  (next-steps, map, "what happens now") — out of scope here, but the page exists for it.
