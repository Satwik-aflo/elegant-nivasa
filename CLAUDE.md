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
- **Layout:** the **homepage (`index.astro`) is self-contained** (own `<head>`/header/footer,
  loads `proto.css`/`proto.js`); the three **Sub-sites** share `layouts/SubSiteLayout`
  (distraction-free + WhatsApp) · `pages/` (index + 3 sub-sites) · `functions/api/lead.ts`.
- **Type-check:** run `npx astro check` before builds/commits — it catches type & config
  errors `npm run build` silently ships (the Cloudflare adapter can emit a 0-byte page on a
  frontmatter throw). `@astrojs/check` + `typescript` are devDeps; currently **green** (0/0/0).
  Worker binding types (`cloudflare:workers`, `Env`) come from `worker-configuration.d.ts`, which
  is **git-ignored & generated** — run `npm run generate-types` after cloning or editing
  `wrangler.jsonc`.

## 3. Lead & Enquiry flows

- **Lead (Main site):** every "Book a visit" trigger (`[data-book]` — header, hero, sticky CTA,
  footer) opens a centred **book-a-visit dialog** (native `<dialog>`, name + `+91` phone) instead
  of navigating; submit → `POST /api/lead` (intent `lead`) → write to **D1 first** (never lost) →
  email to **sales@e-infra.in** → success. (Brochure email capture is the same endpoint, intent
  `brochure`.) A CRM (e.g. Tranquil) is a later add the same endpoint can call; no CRM in the MVP.
  _(Dialog open/close is in `site.js`; Spectra-style **OTP** verification is deferred — needs backend.)_
- **Enquiry (Sub-sites):** **two Sales rep cards** (Bharat → rep 1, Satish → rep 2), each its own
  WhatsApp click-to-chat button → opens WhatsApp with a per-angle prefilled message. _(Decision
  2026-06-20: we show both reps as cards rather than one round-robin button — better UX, and the
  "online now" social proof. Numbers come from `site.reps` in `config/site.ts`.)_ Numbers
  **injected via JS (anti-scrape)**, never raw in HTML. Not stored; the click is tracked as a
  Conversion.

## 4. Pages

- **Main site (`/`):** hero · highlights/key facts · amenities · floor plans · gallery ·
  location/connectivity (bespoke drive-time SVG **+ Google Maps embed**) · brochure (ungated
  download + optional email capture) · RERA + legal footer. Single scrolling page, full nav.
  The **Lead** is captured via a **book-a-visit dialog** (see §3), not an inline form.
  **Dropped for MVP:** team, project updates, FAQs.
- **Sub-sites:** distraction-free (logo + soft "explore full project →" link only) · **lead with
  that angle's comparison** (static curated data, **unnamed** competitor; the full scoreboard may
  follow as supporting detail) · the two Sales rep WhatsApp cards.

## 5. Analytics (unified)

- **Microsoft Clarity** — behaviour/retention (heatmaps, recordings, scroll), one project across
  all routes. **LIVE:** project id `xah4dbk2kt` set in `config/site.ts` (2026-06-21); the snippet
  auto-injects on every route via `AnalyticsScripts.astro` (confirmed in the build). Starts
  recording once deployed. _(Reminder: this tracks before a consent banner — DPDP, §8.)_
- **Meta Pixel** — attribution for Instagram/Meta ad spend. _[ ] still needs a Pixel id_ —
  drop into `site.analytics.metaPixelId` (same auto-inject path as Clarity).
- One `track()` wrapper fires **Conversion** events (Lead = form submit, Enquiry = WhatsApp click)
  to both, so numbers reconcile.
- **Deferred** (drop-in later via the same wrapper): GA4, Google Ads conversion tag (Google ad
  spend unconfirmed).

## 6. Phasing (Cutover)

1. **Build** on the free `*.pages.dev` URL — production WordPress untouched, zero risk.
2. **Cutover** — **BLOCKED on GoDaddy access (re-confirmed 2026-06-21).** A custom domain on this
   site requires the domain to be a **Cloudflare zone**, which means changing **nameservers at the
   registrar (GoDaddy)** — the login we don't have. _(The "host on **Pages** + external Hostinger
   CNAME, no GoDaddy" idea was investigated and **rejected 2026-06-21**: Astro 6 / `@astrojs/cloudflare`
   v13 **dropped Pages support** — the adapter is Workers-only and the official path is Pages→Workers.
   So we can't move to Pages without fighting the framework. The other no-GoDaddy route, Cloudflare
   for SaaS custom hostnames, itself needs an existing Cloudflare zone → also a dead end.)_ **The only
   real unlock is recovering GoDaddy.** Then: add domain to Cloudflare, verify it imported existing
   DNS incl. **email/MX + the Resend `send` records + the catch-all** first, flip nameservers, attach
   the Worker custom domain. Until then the site runs on `elegant-nivasa.satwik-958.workers.dev`.
3. **Retire** WordPress hosting. _(NB: on the eventual Cloudflare-DNS cutover, email moves to
   Cloudflare DNS too — recreate all Hostinger mail records there before flipping. Until cutover,
   Hostinger DNS + email/forwarders stay live.)_

## 7. Open items (fill before cutover)

- [x] Two **Sales rep WhatsApp numbers** — provided 2026-06-20, wired in `config/site.ts`
  (`site.reps`): Bharat → rep 1, Satish → rep 2. Base64-injected (anti-scrape), no raw number in
  HTML. _(Per-rep sales stats on the cards are still placeholders — see below.)_
- [~] Domain **registrar / DNS** — discovered 2026-06-21: registrar is **GoDaddy**, but DNS is
  **delegated to Hostinger** (nameservers `ns1/ns2.dns-parking.com`); email runs through Hostinger
  (`mx1/mx2.hostinger.in` + SPF `_spf.mail.hostinger.com`). **Client has Hostinger access but NOT
  GoDaddy.** Decision: take the **Hostinger-only DNS path** — edit records in Hostinger's zone, leave
  nameservers at Hostinger, never touch GoDaddy. This already unblocked the Resend sending domain
  (verified 2026-06-21, records added in Hostinger). **Still open:** custom-domain cutover for the
  *website* — without GoDaddy we can't move nameservers to Cloudflare, so the route is CNAME
  `www` → Pages + apex domain-forwarding in Hostinger (apex can't take a plain CNAME). GoDaddy access
  is still worth recovering for a clean cutover; chase via whoever set up the domain (created
  2024-01-22, privacy-protected). _(NB: §6 step 3 "cancel Hostinger" no longer fully applies — the
  DNS zone must stay at Hostinger on this path; only the WordPress hosting is retired.)_
- [x] Static **comparison figures** confirmed 2026-06-21: **₹7,000/sft** (us) vs **₹8,500/sft**
  (competitor) → **₹20.6 L** saving on 1,375 sft; possession **2027 vs 2031**; **₹16.8 L** rent by
  2032; structure **78%** (latest 78.19, shown rounded). Clubhouse corrected to **8-level / 40,000+
  sft**. All money figures carry a `*` → footer disclaimer.
- [ ] **Sales stats** on the rep cards (aggregate ₹74 Cr+/62 + per-rep `closed`/`homes` in
  `site.reps`) — decision 2026-06-21: **ship as-is with a `*`** (disclaimer-backed); replace with
  audited figures before scaling ad spend.
- [x] **Resend — prod email LIVE** (2026-06-21). Sending domain `elegantnivasa.com` verified at
  resend.com (DNS records added in **Hostinger**, on the `send` subdomain so the existing root
  Hostinger MX/SPF are untouched). `site.mailFrom` swapped to
  `Elegant Nivasa <leads@elegantnivasa.com>`; prod secret `RESEND_API_KEY` set via
  `wrangler secret put` (fresh key, typed at the hidden prompt — not in chat). Verified end-to-end
  on the **live** site: a brochure submit wrote to prod D1 with **`notified=1`** (test row deleted),
  confirming both the visitor email and the `sales@e-infra.in` notify now send to any recipient
  (no more resend.dev test-mode limit). _**Local-dev email is currently broken** (2026-06-22): the
  key in `web/.dev.vars` is the **revoked** `re_FqkEryya…` test key, so all Resend calls from
  `npm run dev` 401 silently — the lead still writes to local D1 and the PDF still downloads, but no
  email sends and `notified` stays 0. To exercise email locally, drop a fresh full-access Resend key
  into `web/.dev.vars` and restart. **Prod is unaffected** (valid secret set via `wrangler secret
  put`).  Test email on the **live** workers.dev URL, not localhost._
- [x] **Exposed Resend keys revoked** (2026-06-21). Both `re_FqkEryya…` (original test key) and
  `re_ZiCVqNvh…` (accidentally pasted on the command line) were revoked & deleted at resend.com.
  The live prod key (set via `wrangler secret put`, never pasted) is safe and remains in use.
  _NB: `web/.dev.vars` was **not** updated and still holds the revoked `re_FqkEryya…` — hence
  local-dev email is dead until a fresh key replaces it (see the Resend item above)._
- [ ] **Inbound email for the branded domain** (so mail *to* `@elegantnivasa.com` is received, not
  just sent). Plan (all Hostinger-side, since DNS/email live there): (1) create mailbox
  `leads@elegantnivasa.com`, (2) Forwarders → **Create catch-all** → destination `leads@`, (3)
  Forwarders → **Create a forwarder** `leads@` → `sales@e-infra.in` (external), "save copies" ON.
  **Blocked (2026-06-21):** step 3 needs clicking a verification link sent to `sales@e-infra.in`,
  and the client has no credentials for that inbox until **2026-06-22**. _(Outbound/branded sending
  and the `reply_to: sales@e-infra.in` on the brochure email are already live — this only adds direct
  inbound + catch-all.)_ Needs an active Hostinger Email plan with a free mailbox slot.
- [ ] **FUTURE — if GoDaddy access is recovered:** reconsider the domain/host setup. With the
  registrar login we could (a) move nameservers to Cloudflare for a clean apex (no www-forward) +
  domain-wide Cloudflare features, and/or (b) move the site back to a **Worker** custom domain
  (Cloudflare's preferred long-term platform). Not urgent — the Pages-via-Hostinger path (§6) works
  fully without it. Chase GoDaddy via whoever set up the domain (created 2024-01-22, privacy-protected).
- [ ] **Custom-domain cutover — BLOCKED on GoDaddy** (re-confirmed 2026-06-21; see §6). The
  Pages-via-Hostinger workaround was investigated and **ruled out** (Astro 6 / adapter v13 dropped
  Pages support; Workers-only). No sane no-GoDaddy path exists. Action: **recover GoDaddy access**
  (the future item above), then do the §6 cutover. Until then the site stays on the `workers.dev` URL.
- [x] **Email/brochure → production go-live** — DONE 2026-06-21 (all 5 checklist steps complete:
  sending domain verified, `mailFrom` swapped, fresh prod key set, `--remote` migration applied,
  built + deployed + live test passed with `notified=1`).
- [x] One-time **`wrangler login`** — done; deployed to
  `elegant-nivasa.satwik-958.workers.dev` (2026-06-21). Build with `npm run build`, ship with
  `npx wrangler deploy` from `web/`.
- [ ] **DPDP consent banner + privacy policy** (DPDP Act 2023) — Clarity is now LIVE (§5) and the
  Pixel will be too, so cookies / PII are processed **without consent**. Knowingly deferred by
  client decision (details in §8); **must be addressed before scaling ad spend.**

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

- `web/src/pages/` — routes: `index.astro` (Main homepage — the product/desire-first
  design promoted from the old `prototype.astro` on 2026-06-21; self-contained, loads
  `proto.css`/`proto.js` like the sub-sites), `cost.astro` · `handover.astro` ·
  `rental-yield.astro` (Sub-sites), `api/lead.ts`. (The `prototype*`/`podium-prototype`
  experiments and the unused `MainLayout`/`LeadForm` were deleted 2026-06-21.)
- `web/src/{layouts,components,config,data,lib}/` — `SubSiteLayout` (the sub-sites' chrome),
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

**Homepage (`index.astro`) — settled so far:** _(updated 2026-06-22)_ **"Stacked" hero** on the
bright E-Infra "Sunshine" render (`hero-alt.webp`, 212 KB) — mobile shows the full render in a top
frame with a solid navy copy panel below; desktop is a left-scrim cinematic full-bleed. Headline
**"A home, and a *world* around it."** + project-focused subhead (526 homes · 4 acres · 8-level
clubhouse · ₹6,999/sft\* · 2027); hero chips removed; CTAs **Book a visit** (dialog) + **Download
brochure**. E-Infra render badge + footer credit (gold mark). Flow: gallery → corridor → podium →
amenities → location (drive-time SVG **+ Google Maps embed**, two-up) → possession/trust (78% ring)
→ floor plans → confidence cross-sell → brochure (download + email capture). **Sticky CTA** —
floating card on mobile, slim full-width bar on desktop (Call · WhatsApp · Book); all "Book a visit"
open the **book-a-visit dialog** (§3). Remaining homepage work:

- [x] **Amenities section** — built 2026-06-21 (`<section class="section am" id="amenities">` in
  `index.astro`, `.am-*` styles in `proto.css`, +nav link). Placed after the podium, before
  Location. 8-level/40,000+ sft clubhouse (indoor chip cloud) + outdoor amenities (outdoor chip
  cloud), static/zero-JS. _(Local only — not yet deployed.)_
- [x] **Confidence cross-sell band** — built 2026-06-21 (`<section class="section xs" id="compare">`
  in `index.astro`, `.xs-*` styles in `proto.css`). Placed between Floor Plans and Brochure as a
  "still comparing?" nudge — three cards linking `/cost` (₹20.6 L* less) · `/handover` (2027 not
  2031, 78%*) · `/rental-yield` (₹16.8 L* rent). _(Local only — not yet deployed.)_

- [x] **"Email me the brochure" (email-first soft capture)** — built capture-first 2026-06-21
  (spec: [docs/specs/2026-06-20-brochure-email-capture.md](./docs/specs/2026-06-20-brochure-email-capture.md)).
  `POST /api/lead` now branches on an **`intent`** field (`lead` default | `brochure`): brochure
  requires a valid email, name/phone optional (stored as `""` — `phone` stays `NOT NULL`); new
  `intent` column added via `migrations/0002_brochure_intent.sql` (applied `--local`; **run
  `npx wrangler d1 migrations apply elegant-nivasa --remote` at next deploy**). _**Reworked
  2026-06-22:** the dedicated brochure band/section was **deleted** (it ate a full-width band for
  little). The download "See it all in the brochure" now lives in the **trust** section; the email
  capture is a **lightweight prompt dialog** (`#brochureDialog`, reuses `.bookdlg`) that every
  `[data-brochure]` trigger (hero · trust · footer) opens. On submit → `POST /api/lead`
  (intent=brochure) → success **auto-triggers the PDF download** (`data-download` on the form) and,
  on prod, emails the visitor the brochure link. A "download without sharing your email" escape keeps
  it ungated. `site.js` `wireDialog()` drives both this and the book-a-visit dialog._ Visitor
  brochure email + sales notify send on **prod** (valid Resend secret); **broken on local dev**
  (revoked `.dev.vars` key — see §7).
- [x] **Sub-site comparison architecture — DECIDED 2026-06-21, IMPLEMENTED 2026-06-21**
  (grill-with-docs session; full rationale in
  [ADR-0002](./docs/adr/0002-comparison-single-source-build-time.md), terms in
  CONTEXT.md: Angle / Scoreboard / Comparative). Built per the spec below; `astro check` 0/0/0
  and `npm run build` green. `src/data/comparison.ts` is now the single source; new components
  `Scoreboard.astro` + `AngleLead{Cost,Handover,Yield}.astro` render it at build time;
  `ComparisonTable.astro` deleted; `site.js` is behaviour-only (CMP/GROUPS/GROUP_ORDER/HILITE/
  renderCompare/renderGroups/WA_MSG removed; reads `data-angle` + baked `data-wa-msg`). _(Local
  only — not yet deployed.)_ As-built spec:
  - **B1 — single source + build-time render.** `src/data/comparison.ts` becomes the **one** home
    for all comparison *content* — scoreboard rows (the 3 Comparatives: Cost/Product/Yield),
    per-angle hero **words + numbers**, angle-lead data, WhatsApp message text, advantage totals.
    New Astro components render it **at build time**. `site.js` is demoted to **behaviour only**
    (reveals, count-up, lightbox, floor plans, EMI calc, lead-form POST, run-time decode of the
    anti-scrape WA number — now reading the baked-in message text). Delete from `site.js`: `CMP`,
    `GROUPS`, `GROUP_ORDER`, `HILITE`, `renderCompare`, `renderGroups`, `WA_MSG`. Hero **layout +
    image** stay in the `.astro` page (data file owns text/numbers only). Fold
    `ComparisonTable.astro` into the new components.
  - **B2 — each sub-site leads with its own Angle.** New shape per sub-site:
    `hero → bespoke angle-lead block → full Scoreboard (supporting) → EMI → Enquire`. The grouped
    deep-dive section is **removed**. Angle-lead blocks are **fully bespoke**: `/cost` cheque
    comparison · `/handover` 2027-vs-2031 timeline · `/rental-yield` earnings build-up.
  - **Cleanup:** canonical Angle key is the short form `cost | handover | yield` (public path stays
    `/rental-yield`); collapse `SubSiteLayout`'s `page` + `active` props into one `angle` prop;
    `data-page` → `data-angle`.
