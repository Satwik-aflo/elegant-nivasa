# Elegant Nivasa — Web

Operating spec for the new Elegant Nivasa website (MVP). Terminology lives in
[CONTEXT.md](./CONTEXT.md); architectural decisions in [docs/adr/](./docs/adr/). Keep this file
updated as decisions land.

> **Fresh start (2026-06-19).** Supersedes the earlier campaign notes, archived at
> `docs/archive/campaign-notes-2026-06.md`. Don't re-import old figures/structure from there —
> use the brochure / renders / comparison sheet as the content source instead.

---

## 1. What we're building (MVP)

A single statically-built **Astro** site on **Cloudflare**, **replacing** the legacy WordPress
site (see [ADR-0001](./docs/adr/0001-retire-wordpress.md)). It is:

- **One Main site** at `/` — full experience, holds the **Lead** form.
- **Three distraction-free Sub-sites** at `/cost`, `/handover`, `/rental-yield` — comparison
  instruments, each proving Elegant Nivasa beats the (unnamed) **Nearby builder** on one angle and
  driving a WhatsApp **Enquiry**.

One codebase → one deploy → one analytics property = **unified metrics**, the core reason for
leaving WordPress. Traffic is **paid** (Instagram/Meta + others), so SEO parity is not a cutover
blocker; we 301-redirect old URLs as a courtesy. (Terms: see CONTEXT.md.)

## 2. Architecture / stack

- **Framework:** Astro — static-first, zero-JS by default, shared components across all routes.
- **Host:** Cloudflare Pages (`@astrojs/cloudflare`), free tier.
- **Form endpoint:** Astro server endpoint / Pages Function `POST /api/lead` (Worker runtime).
- **Database:** Cloudflare **D1** (SQLite) — `leads` table, source of truth.
- **Email:** **Resend** API (free tier) → notifies `sales@e-infra.in` on each Lead.
- **Deploy:** git is source of truth; deploy via `wrangler` (one-time `wrangler login`).
- **Layout:** `components/` (Header, Footer, ComparisonTable, LeadForm, WhatsAppButton) ·
  `layouts/` (MainLayout = full nav + form, SubSiteLayout = distraction-free + WhatsApp) ·
  `pages/` (index + 3 sub-sites) · `functions/api/lead.ts`.
- **Type-check:** run `npx astro check` before builds/commits — it catches type & config
  errors `npm run build` silently ships (the Cloudflare adapter can emit a 0-byte page on a
  frontmatter throw). `@astrojs/check` + `typescript` are devDeps; currently **green** (0/0/0).
  Worker binding types (`cloudflare:workers`, `Env`) come from `worker-configuration.d.ts`, which
  is **git-ignored & generated** — run `npm run generate-types` after cloning or editing
  `wrangler.jsonc`.

## 3. Lead & Enquiry flows

- **Lead (Main site):** form → `POST /api/lead` → validate → write to **D1 first** (never lost) →
  email to **sales@e-infra.in** → success. A CRM (e.g. Tranquil) is a later add the same endpoint
  can call; no CRM in the MVP.
- **Enquiry (Sub-sites):** **two Sales rep cards** (Bharat → rep 1, Satish → rep 2), each its own
  WhatsApp click-to-chat button → opens WhatsApp with a per-angle prefilled message. _(Decision
  2026-06-20: we show both reps as cards rather than one round-robin button — better UX, and the
  "online now" social proof. Numbers come from `site.reps` in `config/site.ts`.)_ Numbers
  **injected via JS (anti-scrape)**, never raw in HTML. Not stored; the click is tracked as a
  Conversion.

## 4. Pages

- **Main site (`/`):** hero · highlights/key facts · amenities · floor plans · gallery ·
  location/connectivity · **Lead form** (brochure gated behind it) · RERA + legal footer.
  Single scrolling page, full nav. **Dropped for MVP:** team, project updates, FAQs.
- **Sub-sites:** distraction-free (logo + soft "explore full project →" link only) · **lead with
  that angle's comparison** (static curated data, **unnamed** competitor; the full scoreboard may
  follow as supporting detail) · the two Sales rep WhatsApp cards.

## 5. Analytics (unified)

- **Microsoft Clarity** — behaviour/retention (heatmaps, recordings, scroll), one project across
  all routes.
- **Meta Pixel** — attribution for Instagram/Meta ad spend.
- One `track()` wrapper fires **Conversion** events (Lead = form submit, Enquiry = WhatsApp click)
  to both, so numbers reconcile.
- **Deferred** (drop-in later via the same wrapper): GA4, Google Ads conversion tag (Google ad
  spend unconfirmed).

## 6. Phasing (Cutover)

1. **Build** on the free `*.pages.dev` URL — production WordPress untouched, zero risk.
2. **Cutover** — point `elegantnivasa.com` DNS at Cloudflare (change nameservers at the registrar;
   verify Cloudflare imported existing DNS incl. **email/MX** first), add the custom domain in Pages.
3. **Retire** WordPress / cancel Hostinger.

## 7. Open items (fill before cutover)

- [x] Two **Sales rep WhatsApp numbers** — provided 2026-06-20, wired in `config/site.ts`
  (`site.reps`): Bharat → rep 1, Satish → rep 2. Base64-injected (anti-scrape), no raw number in
  HTML. _(Per-rep sales stats on the cards are still placeholders — see below.)_
- [ ] Domain **registrar** + login (for the nameserver change at cutover).
- [ ] Static **comparison figures** per sub-site (price/sft, handover, rental yield) — to confirm.
- [ ] **Sales stats** on the rep cards (aggregate ₹74 Cr+/62 + per-rep `closed`/`homes` in
  `site.reps`) are placeholders — confirm real figures before publishing.
- [ ] **Resend** account + verified sending domain.
- [ ] One-time **`wrangler login`** so deploys can run from here.

## 8. Deferred / known risks

- **Consent banner + privacy policy (DPDP Act 2023)** — *knowingly deferred* by client decision.
  Pixel + Clarity set cookies / process PII without consent until then. **Revisit before scaling
  ad spend.**

## 9. Source material (in repo)

`Brochure.pdf` · `Renders/` · `Floor Plans/` · `Nivasa vs New Launch Branded Builder 2026.xlsx` ·
`ProjectComparisionPicture/` — the content source for the rebuild. Core project facts (RERA
**P01100007243**, 3 towers · 23 floors · 526 units · 4 acres, 2 & 3 BHK 1,375–2,205 sft, Tellapur)
are in the archived notes if needed.

## 10. Repo layout — where things live

**`web/` is the website. It is the only site and the single source of truth.** All work happens
here. Run it with `npm run dev` (Astro dev server on `localhost:4321`); build/deploy from here.

- `web/src/pages/` — routes: `index.astro` (Main), `cost.astro` · `handover.astro` ·
  `rental-yield.astro` (Sub-sites), `prototype.astro` (the in-progress new homepage), `api/lead.ts`.
- `web/src/{layouts,components,config,data,lib}/` — `SubSiteLayout`/`MainLayout`,
  shared components, `config/site.ts` (reps, analytics ids), `data/comparison.ts` (figures).
- `web/public/assets/` — `css/` (`site.css`, `proto.css`), `js/` (`site.js`, `proto.js`), `img/`.

Other top-level folders are **not** the site:

- `prototypes/` — throwaway plain-HTML sketches for the corridor animation (served via
  `python3 -m http.server`). Reference only; the real animation is rebuilt inside `web/`.
- `Renders/` · `Floor Plans/` · `ProjectComparisionPicture/` · `Brochure.pdf` · the `.xlsx` —
  source content (see §9). · `docs/` — ADRs + archived notes.

> **History:** a hand-coded static `site/` (plain `.html`) was the original design that `web/` was
> ported from. It was **deleted 2026-06-20** once `web/` superseded it — recoverable from git
> history if ever needed. Don't recreate it; edit `web/` only.

## 11. To-do / planned work

Specs live in [docs/specs/](./docs/specs/); implement against the spec, not a re-derivation.

- [ ] **"Email me the brochure" (email-first soft capture)** — spec:
  [docs/specs/2026-06-20-brochure-email-capture.md](./docs/specs/2026-06-20-brochure-email-capture.md).
  Add an `intent` field to `POST /api/lead` so the homepage brochure band can capture an
  **email only** (no phone) and email the visitor a brochure link. Notes: `leads.phone` is
  `NOT NULL` (store `""` + new `intent` column via a `0002` migration); the *visitor* email is
  **blocked on Resend** (verified sending domain — §7), so ship capture-first and switch the email
  on once Resend is ready. The direct brochure download already works regardless.
- [ ] **Grill-me session on the sub-site comparison architecture** (before coding it). Run the
  `grill-with-docs` skill to lock two handoff decisions one question at a time, capturing
  terminology in CONTEXT.md as it crystallises:
  - **B1 — comparison-source consolidation.** Today the on-page scoreboard is rendered from an
    untyped `CMP` array hard-coded in `public/assets/js/site.js`, while the typed, intended source
    `src/data/comparison.ts` (+ `ComparisonTable.astro`) is unused — two parallel sources of truth.
    Pick one (recommend: drive sections from `comparison.ts` at build time, retire the JS array) so
    figures live in exactly one place. Ties into the placeholder figures in §7.
  - **B2 — each sub-site leads with its OWN angle's comparison.** All three currently share the same
    full scoreboard via `SubSiteLayout`, differing only in the hero. Make each open with its angle
    (`/cost` → cost rows, `/handover` → timeline, `/rental-yield` → yield rows), full scoreboard as
    supporting detail below. Depends on B1; key off the `active` slug `SubSiteLayout` already
    receives as a prop (retained for this — see the frontmatter note).
