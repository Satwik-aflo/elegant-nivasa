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
- **Host:** Cloudflare **Workers** (`@astrojs/cloudflare`, Workers-only since v13), free tier. Worker
  `elegant-nivasa`; **live at `https://elegantnivasa.com`** (apex + www custom domains, cutover
  2026-06-22 — see §6). The `*.workers.dev` URL still resolves as a fallback.
- **Form endpoint:** Astro server endpoint / Pages Function `POST /api/lead` (Worker runtime).
- **Database:** Cloudflare **D1** (SQLite) — `leads` table, source of truth.
- **Email:** **Resend** API (free tier) → notifies `sales@e-infra.in` on each Lead.
- **Deploy:** git is source of truth (GitHub `Satwik-aflo/elegant-nivasa`, **`main`** is the live
  branch); deploy via `wrangler deploy` from `web/` (one-time `wrangler login`). `wrangler deploy`
  ships straight to production — there is no staging environment.
- **Deploy rule (every prod push):** immediately after a `wrangler deploy`, **commit the deployed
  changes to git** on `main` with a clear message — so git keeps an audit log of exactly what
  shipped (deploys are otherwise off-the-record since the build comes from the working tree, not a
  commit) — and **confirm any cleanup deletions are done** (test rows/leads, temp/sentinel data).
  Commit only what was deployed; hold back unrelated WIP that wasn't part of the push. This is
  enforced by a `PostToolUse` reminder hook in `web/.claude/settings.json`.
- **Favicon/icons:** the **E-Infra gold mark** (cropped from the brand wordmark, on brand navy
  `#16204a`) — `public/favicon.ico` + `favicon-32/192/512.png` + `apple-touch-icon.png`, wired in
  `SocialMeta.astro` so all routes share it.
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
  email to **sales@e-infra.in** → **push to Tranquil CRM** → success. (Brochure capture is the same
  endpoint, intent `brochure` — also name + phone + email since 2026-06-25.) D1 is the source of
  truth; **email and the Tranquil push
  are both best-effort** downstream notifies — either can fail without losing the lead or blocking
  the user. _(Dialog open/close is in `site.js`; Spectra-style **OTP** verification is deferred —
  needs backend.)_
  - **Tranquil CRM push** (built+tested locally 2026-06-25, **NOT yet in prod**; spec
    [docs/specs/2026-06-25-tranquil-crm-lead-sync.md](./docs/specs/2026-06-25-tranquil-crm-lead-sync.md)):
    on each submit, after D1 + email, `lead.ts` fires `GET einfra.tranquilcrmone.in/v2/createlead`
    (Tranquil's **only** API; auth via an `api_key` **query param**, not a header — stored as the
    Worker secret **`TRANQUIL_API_KEY`**, never in `site.ts`). Config in `site.tranquil`:
    **`project_id=1`** (= Elegant Nivasa in Tranquil's project table), **`source_type=3`**
    (mandatory), `country_code=91`. Tranquil **dedupes server-side on `mobile_number`** — fine now
    that **both** forms require a phone (book-a-visit and, since 2026-06-25, brochure too; validated
    in `site.js` **and** `lead.ts`), so every lead carries a real number and gets its own CRM
    contact. (`site.tranquil.placeholderPhone` `9999999999` is now just a defensive fallback for a
    malformed direct API post.) A `crm` column on `leads` (migration `0003`, mirrors `notified`) flips to 1 on a
    confirmed insert. **Two apidoc gotchas (verified against the live API — don't trust the doc):**
    (1) the success response is **non-standard concatenated JSON** with `"status":"success"` as a
    **string** (not the doc's boolean `true`), so success is matched on the body **text**
    (`inserted successfully`), never `JSON.parse`; (2) Tranquil is **slow (~4s)**, so the call runs
    **after the response via `waitUntil()`** (from `cloudflare:workers`) — submit stays ~1.3s.
    **To go live:** `wrangler secret put TRANQUIL_API_KEY` + `wrangler d1 migrations apply
    elegant-nivasa --remote` + `wrangler deploy` (see the spec's rollout checklist), and delete the
    `ZZ TEST` rows from Tranquil. _Replaced an earlier idea of WhatsApp rep-notifications — rejected
    as too heavyweight (Meta template + dedicated SIM + business verification) for an internal alert
    the sales email already covers; see the spec's "Why not WhatsApp"._
  - _**The WhatsApp on the sub-sites is unrelated** — those are free visitor-facing `wa.me`
    Enquiry links (below), not an outbound API; untouched by the CRM work._
- **Enquiry (Sub-sites):** **two Sales rep cards** (Bharat → rep 1, Satish → rep 2), each its own
  WhatsApp click-to-chat button → opens WhatsApp with a per-angle prefilled message. _(Decision
  2026-06-20: we show both reps as cards rather than one round-robin button — better UX, and the
  "online now" social proof. Numbers come from `site.reps` in `config/site.ts`.)_ Numbers
  **injected via JS (anti-scrape)**, never raw in HTML. Not stored; the click is tracked as a
  Conversion.

## 4. Pages

- **Main site (`/`):** hero · highlights/key facts · amenities · floor plans · gallery ·
  location/connectivity (bespoke drive-time SVG **+ Google Maps embed**) · brochure (gated
  download — name + phone + email required, since 2026-06-25; a no-JS direct-download href is
  the only fallback) · RERA + legal footer. Single scrolling page, full nav.
  The **Lead** is captured via a **book-a-visit dialog** (see §3), not an inline form.
  **Dropped for MVP:** team, project updates, FAQs.
- **Sub-sites:** distraction-free (logo + soft "explore full project →" link only) · **lead with
  that angle's comparison** (static curated data, **unnamed** competitor; the full scoreboard may
  follow as supporting detail) · the two Sales rep WhatsApp cards.

## 5. Analytics (unified)

- **Microsoft Clarity** — behaviour/retention (heatmaps, recordings, scroll), one project across
  all routes. **LIVE:** project id `xah4dbk2kt` set in `config/site.ts` (2026-06-21); the snippet
  auto-injects on every route via `AnalyticsScripts.astro` (confirmed live on every route of the
  production domain). _(Reminder: this tracks before a consent banner — DPDP, §8.)_
- **Meta Pixel** — attribution for Instagram/Meta ad spend. **LIVE:** id `1036291125518805` set in
  `site.analytics.metaPixelId` (2026-06-23); auto-injects on every route via `AnalyticsScripts.astro`
  (base code + `PageView`). `track()` maps Conversions to standard events: `lead_submit`→**Lead**,
  `whatsapp_click`/`call_click`→**Contact** (homepage sticky Call/WhatsApp now fire via `[data-track]`);
  brochure/book open as custom events. _(Reminder: fires before a consent banner — DPDP, §8.)_
- **Google Tag Manager** — container `GTM-5FCBHXLJ` (**marketing-owned**). **LIVE:** id set in
  `site.analytics.gtmId` (2026-06-24); head snippet auto-injects on every route via
  `AnalyticsScripts.astro`, `<body>` noscript via `GtmNoscript.astro` (first child of `<body>` on all
  routes). **GTM owns Google Ads conversions** (and any future GA4 / remarketing) — those are **NOT
  hardcoded**. `track()` pushes every event to the **`dataLayer`** (`whatsapp_click` / `lead_submit` /
  `brochure_request` + props) so GTM **Custom-Event triggers** fire the conversions — the WhatsApp
  links are base64/JS-built and book-a-visit is a native dialog, so GTM's auto click/form triggers
  can't see them without this bridge. **Ownership rule (verified before adding): GTM must NOT re-add
  Meta Pixel or Clarity — code owns those, GTM would double-fire them.** _Marketing to-do: build the 3
  Custom-Event triggers + Google Ads conversion tags in GTM; mark Lead+WhatsApp Primary, Brochure
  Secondary._ _(Decision 2026-06-24: split architecture — Pixel+Clarity hardcoded, Ads via GTM. This
  **superseded** the earlier in-code gtag.js Google Ads tag, now removed; see spec
  [docs/specs/2026-06-23-google-ads-conversion-tracking.md](./docs/specs/2026-06-23-google-ads-conversion-tracking.md).)_
- One `track()` wrapper fires **Conversion** events (Lead = form submit, Enquiry = WhatsApp click)
  to Clarity + Meta Pixel directly **and** pushes them to the GTM `dataLayer`, so numbers reconcile.
- **Thank-you pages (form conversions)** — **LIVE 2026-06-24.** A successful book-a-visit or brochure
  submit now **navigates** to `/thank-you-visit` or `/thank-you-brochure` (shared
  `layouts/ThankYouLayout.astro`, both `noindex`) instead of revealing an in-dialog success panel.
  Each fires its conversion **on page load** (`track()` → Meta `Lead` / Clarity / dataLayer) so GTM can
  map **Google Ads** to a reliable **page-view trigger** rather than the submit-time event;
  `/thank-you-brochure` also auto-downloads the PDF. `site.js` `showSuccess()` just redirects now.
  _Marketing: build the Google Ads conversions on **page-view triggers** (`/thank-you-visit`,
  `/thank-you-brochure`) — do **NOT** also trigger Ads off the `lead_submit` / `brochure_request`
  dataLayer events, or it double-counts. WhatsApp has no thank-you page (it leaves the site) — it stays
  on the `whatsapp_click` click event._ **Gotcha:** Astro/Cloudflare serves these with a **trailing
  slash** (`/thank-you-visit/`; a bare `/thank-you-visit` 307-redirects to it), so `site.js` redirects
  straight to the trailing-slash URL — and GTM triggers must match on **Page URL _contains_**, not
  _equals_. (Spec:
  [docs/specs/2026-06-24-thank-you-pages-conversion.md](./docs/specs/2026-06-24-thank-you-pages-conversion.md).)
  - **Layout/CTA (redesigned 2026-06-26):** **two-column** — confirmation left (h1 just **"Thank you!"**
    on `/thank-you-visit`), projects video panorama right (above). Contact CTAs are the **homepage sticky
    CTA** (`.stickybar`: Call · WhatsApp · Book), **not** inline buttons. The **Book a site visit** button
    + `#bookDialog` ship **only on `/thank-you-brochure`** (gated by the layout's `showBook` prop — the
    visit page already booked, so it shows Call + WhatsApp as full labelled buttons via
    `.stickybar--nobook`). The "← Explore the project" link lives in the **header** (kept inline ≤940px
    since this header has no hamburger). _Known follow-ups (code-review 2026-06-26): the sticky-bar +
    book-dialog markup is now duplicated across `index.astro` / `SubSiteLayout` / `ThankYouLayout` (no
    shared component), `PHONE` is hardcoded per-file, and the copied `.form-success` panel is dead markup._
- **E-Infra projects panorama (thank-you pages)** — **LIVE 2026-06-25, redesigned 2026-06-26.**
  `components/ProjectsPanorama.astro` (rendered once in `ThankYouLayout`, right column of the two-column
  layout) shows "E-Infra is building across the city" over the **masterplan flythrough video** with **6
  numbered hotspots + a numbered legend** linking each project. Builds cross-project confidence
  post-conversion. _**Superseded the original static-image design**: the earlier `dots + labels` /
  tap-to-zoom render (`einfra-panorama.webp`, 135 KB) was **deleted**; the visual is now
  `assets/video/einfra-masterplan.mp4` (re-encoded **324 KB @ 960×540**) + poster
  `assets/img/renders/einfra-masterplan-poster.jpg` (72 KB)._
  - **Labelling — map-legend pattern** (chosen by prototype 2026-06-26): each hotspot is a numbered gold
    pin; the legend below repeats the numbers + names so dots are identifiable on mobile (desktop also
    reveals the name on hover). Pin order/number: **1 Moonglade · 2 Elegant Nivasa · 3 One Downtown ·
    4 Skyven · 5 La Casa · 6 Celosia** (Nivasa/Skyven numbers swapped per client). Positions are
    `left/top` % over the (static-camera) video — picked with a throwaway picker tool, since deleted.
  - **All 6 link out**: Elegant Nivasa → home; the rest → their sites in a new tab. **Celosia is now
    linked** (`celosiavillas.com` went live 2026-06-26 — no longer "coming soon").
  - **Video playback**: **no autoplay** — an IntersectionObserver plays it only while ≥25% on screen and
    pauses it off-screen (defers the download via `preload="metadata"`, stops forever-decoding), and it
    stays on the poster for `prefers-reduced-motion` (WCAG 2.2.2). Only other client JS is the
    `project_click` engagement ping. Classes namespaced `enp-`. (Spec:
    [docs/specs/2026-06-25-projects-panorama-thankyou.md](./docs/specs/2026-06-25-projects-panorama-thankyou.md).)
- **Deferred** (drop-in later): GA4 + Google Ads **enhanced/offline** conversions — these now layer
  into the **GTM container**, not the code.

## 6. Phasing (Cutover)

1. **Build** on the free `*.workers.dev` URL — production WordPress untouched, zero risk.
2. **Cutover — DONE 2026-06-22.** GoDaddy access was recovered, so we took the clean path:
   added `elegantnivasa.com` as a **Cloudflare zone**, mirrored all 17 Hostinger DNS records (apex/www +
   **MX/SPF/all 3 DKIM/DMARC/autodiscover/autoconfig + the Resend `send` records**), verified the copy
   by querying Cloudflare's NS directly **before** flipping, then changed **nameservers at GoDaddy** to
   `leif/ursula.ns.cloudflare.com`. Once active, attached the apex + `www` as **Worker custom domains**
   (Cloudflare-issued certs). `site.url` flipped to `https://elegantnivasa.com` and the homepage
   `noindex` removed (deployed, version `88dd94e0`). Verified live: apex+www serve the Astro worker,
   `/api/lead` responds, mail send+receive intact, DKIM resolves end-to-end.
   _**Gotchas hit & fixed:** the Worker custom-domain attach refused while the imported apex `A`/`AAAA`
   existed → must delete those first (mail records are a different type on `@`, untouched). And the 5
   mail CNAMEs (DKIM ×3, autodiscover, autoconfig) imported as **Proxied (orange)**, which breaks DKIM —
   set them to **DNS-only (grey)**. Watch for stale local DNS caches showing old WordPress; verify via
   `dig @leif.ns.cloudflare.com` / `curl --resolve` against the CF edge IPs, not the system resolver._
3. **Retire** WordPress hosting — only the **hosting** is retired; the **Hostinger email plan stays**
   (MX still points to `mx1/mx2.hostinger.com`). DNS now lives at Cloudflare; all mail records were
   recreated there during cutover.

## 7. Open items (fill before cutover)

- [x] Two **Sales rep WhatsApp numbers** — provided 2026-06-20, wired in `config/site.ts`
  (`site.reps`): Bharat → rep 1, Satish → rep 2. Base64-injected (anti-scrape), no raw number in
  HTML. _(Per-rep sales stats on the cards are still placeholders — see below.)_
- [x] Domain **registrar / DNS** — **RESOLVED 2026-06-22 by recovering GoDaddy access.** DNS moved
  off Hostinger to a **Cloudflare zone** (nameservers `leif/ursula.ns.cloudflare.com`, changed at
  GoDaddy; registration stays at GoDaddy). All mail records recreated in Cloudflare (MX still
  `mx1/mx2.hostinger.com`, SPF `_spf.mail.hostinger.com`, DKIM ×3, DMARC, autodiscover/autoconfig, +
  the Resend `send` records). Site is live on `https://elegantnivasa.com` (apex + www = Worker custom
  domains). See §6 for the full cutover record and gotchas. _(NB: the Hostinger **email plan** stays —
  only WordPress **hosting** is retired; DNS no longer lives at Hostinger.)_
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
  put`).  Test email on the **live** `elegantnivasa.com` site, not localhost._
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
- [x] **Domain/host setup — DONE 2026-06-22.** GoDaddy access recovered → took the clean path:
  nameservers moved to Cloudflare, site on a **Worker custom domain** (Cloudflare's preferred
  platform), clean apex (no www-forward). See §6.
- [x] **Custom-domain cutover — DONE 2026-06-22** (see §6 for the full record). `elegantnivasa.com`
  is a Cloudflare zone; apex + www are Worker custom domains with Cloudflare certs; `site.url` flipped
  and homepage `noindex` removed (deployed). Mail verified intact (send/receive + DKIM).
- [x] **Email/brochure → production go-live** — DONE 2026-06-21 (all 5 checklist steps complete:
  sending domain verified, `mailFrom` swapped, fresh prod key set, `--remote` migration applied,
  built + deployed + live test passed with `notified=1`).
- [x] One-time **`wrangler login`** — done; live at **`https://elegantnivasa.com`** (and the
  `elegant-nivasa.satwik-958.workers.dev` fallback). Build with `npm run build`, ship with
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

**Homepage (`index.astro`) — settled so far:** _(updated 2026-06-25)_ **"Stacked" hero** on an
**AI render** (`hero-ai.webp`, 205 KB; set via `HERO_IMG` in `index.astro`) — mobile shows the full
render in a top frame with a solid navy copy panel below; desktop is a left-scrim cinematic full-bleed.
_(Hero swapped to the AI render 2026-06-25 from the earlier E-Infra "Sunshine" `hero-alt.webp`, which
is retained for a one-line revert. **Image recipe** for the hero: source PNG (~1464×1074) →
`cwebp -q 80 src.png -o public/assets/img/renders/hero-ai.webp` → ~200 KB WebP; keep the hero ≈200 KB
since it's the `fetchpriority="high"` LCP image, and drop the multi-MB source PNG out of `public/` so it
doesn't ship as a dead asset. `cwebp` is installed locally via Homebrew.)_ Headline
**"A home, and a *world* around it."** + project-focused subhead (526 homes · 4 acres · 8-level
clubhouse · ₹6,999/sft\* · 2027); hero chips removed; CTAs **Book a visit** (dialog) + **Download
brochure**. E-Infra render badge + footer credit (gold mark). Flow: gallery → corridor → podium →
amenities → location (drive-time SVG **+ Google Maps embed**, two-up) → possession/trust (78% ring)
→ floor plans → confidence cross-sell → brochure (gated download — name + phone + email). **Sticky CTA** —
floating card on mobile, slim full-width bar on desktop (Call · WhatsApp · Book); all "Book a visit"
open the **book-a-visit dialog** (§3). Remaining homepage work:

- [x] **Amenities section** — built 2026-06-21 (`<section class="section am" id="amenities">` in
  `index.astro`, `.am-*` styles in `proto.css`, +nav link). Placed after the podium, before
  Location. 8-level/40,000+ sft clubhouse (indoor chip cloud) + outdoor amenities (outdoor chip
  cloud), static/zero-JS. _(Live in production.)_
- [x] **Confidence cross-sell band** — built 2026-06-21 (`<section class="section xs" id="compare">`
  in `index.astro`, `.xs-*` styles in `proto.css`). Placed between Floor Plans and Brochure as a
  "still comparing?" nudge — three cards linking `/cost` (₹20.6 L* less) · `/handover` (2027 not
  2031, 78%*) · `/rental-yield` (₹16.8 L* rent). _(Live in production.)_
- [x] **Sister-brand logo band ("By the team behind")** — built 2026-06-26
  (`<section class="brandband">` right after the hero in `index.astro`, `.brandband`/`.brandmarq-*` in
  `proto.css`; `brands` array drives it). Auto-scrolling marquee (pauses on hover; static centred row
  for reduced-motion) of E-Infra's other developments in their **own brand colours** on a **cream**
  band (deliberately not navy — it sat between the dark hero and the navy comparison table). Logos:
  **Skyven · River Edge · Skyila · La Casa · Rivera · La Paloma Villas · Moonglade · Apila**
  (`public/assets/img/brands/*.webp`, trimmed to content). **Two-tier optical sizing** via per-logo
  `mh`/`mw`: E-Infra projects (Moonglade/Skyven/La Casa) render larger, EIPL (Apila/Skyila/La
  Paloma/River Edge/Rivera) smaller. _Asset notes: logos came from the `E-Infra Client Sharing.site`
  Figma export (gitignored `*.site`); **Skyven** + **Rivera** were supplied/sourced separately (Rivera's
  light bg was keyed out); **La Paloma** existed only as white, so it's tinted antique-gold to read on
  cream._

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
  on prod, emails the visitor the brochure link. `site.js` `wireDialog()` drives both this and the
  book-a-visit dialog._ **Gated 2026-06-25 (lead-quality):** the brochure dialog now collects
  **name + phone + email — all three required** (was email-only) and the "download without sharing
  your email" escape link was **removed**, so the brochure only downloads after a real submit. (The
  no-JS `[data-brochure]` href is still a direct-download fallback for the JS-disabled edge case.)
  Client (`site.js`) enforces all three; `lead.ts` still gates server-side on **email only** as a
  belt-and-suspenders fallback — but real phones now flow through, so brochure leads dedupe on their
  own `mobile_number` in Tranquil instead of the `9999999999` placeholder. Visitor
  brochure email + sales notify send on **prod** (valid Resend secret); **broken on local dev**
  (revoked `.dev.vars` key — see §7).
- [x] **Sub-site comparison architecture — DECIDED 2026-06-21, IMPLEMENTED 2026-06-21**
  (grill-with-docs session; full rationale in
  [ADR-0002](./docs/adr/0002-comparison-single-source-build-time.md), terms in
  CONTEXT.md: Angle / Scoreboard / Comparative). Built per the spec below; `astro check` 0/0/0
  and `npm run build` green. `src/data/comparison.ts` is now the single source; new components
  `Scoreboard.astro` + `AngleLead{Cost,Handover,Yield}.astro` render it at build time;
  `ComparisonTable.astro` deleted; `site.js` is behaviour-only (CMP/GROUPS/GROUP_ORDER/HILITE/
  renderCompare/renderGroups/WA_MSG removed; reads `data-angle` + baked `data-wa-msg`).
  _(Live in production.)_ As-built spec:
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
