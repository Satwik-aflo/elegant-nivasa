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

## 3. Lead & Enquiry flows

- **Lead (Main site):** form → `POST /api/lead` → validate → write to **D1 first** (never lost) →
  email to **sales@e-infra.in** → success. A CRM (e.g. Tranquil) is a later add the same endpoint
  can call; no CRM in the MVP.
- **Enquiry (Sub-sites):** one WhatsApp click-to-chat button → **round-robin** across the **two
  Sales rep** numbers → opens WhatsApp with a per-angle prefilled message. Numbers **injected via
  JS (anti-scrape)**, never raw in HTML. Not stored; the click is tracked as a Conversion.

## 4. Pages

- **Main site (`/`):** hero · highlights/key facts · amenities · floor plans · gallery ·
  location/connectivity · **Lead form** (brochure gated behind it) · RERA + legal footer.
  Single scrolling page, full nav. **Dropped for MVP:** team, project updates, FAQs.
- **Sub-sites:** distraction-free (logo + soft "explore full project →" link only) · the
  comparison for that angle (static curated data, **unnamed** competitor) · single WhatsApp CTA.

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

- [ ] Two **Sales rep WhatsApp numbers** (stubbed in code until provided).
- [ ] Domain **registrar** + login (for the nameserver change at cutover).
- [ ] Static **comparison figures** per sub-site (price/sft, handover, rental yield) — to confirm.
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
