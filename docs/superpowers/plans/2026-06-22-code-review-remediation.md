# Code-Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the two live homepage bugs, delete the divergent dead code, harden the lead endpoint, and close the paid-traffic launch gaps surfaced in the 2026-06-22 code review of `web/`.

**Architecture:** Static Astro site (`output: 'static'`) on the Cloudflare Workers runtime via `@astrojs/cloudflare`. Five prerendered pages (`/`, `/cost`, `/handover`, `/rental-yield`, `/privacy`) plus one dynamic route `POST /api/lead` (`prerender = false`). Comparison content is single-sourced in `src/data/comparison.ts` and rendered at build time; `public/assets/js/site.js` is behaviour-only. No client framework, no test harness.

**Tech Stack:** Astro 6, `@astrojs/cloudflare` v13, Cloudflare D1, Resend, vanilla ES5-style IIFE JS, plain CSS.

---

## Execution status (updated 2026-06-22, branch `chore/homepage-launch`)

Executed inline (not via subagents) and adapted to the live tree, which had moved on since this
plan was written: **sub-sites are now parked** (`_cost.astro` / `_handover.astro` /
`_rental-yield.astro`) for a **homepage-only first launch**, so the build prerenders **2 routes
(`/`, `/privacy`) + `POST /api/lead`**, not 5. A pre-remediation **baseline commit** captured the
session's homepage work (new hero/dialogs/privacy/brochure-prompt/parking) so each fix below is a
clean, revertable step on top.

- [x] **T1 — delete dead code** (`7eec1f1`). All 7 files removed; only ref was BaseLayout→global.css (dead-on-dead).
- [x] **T2 — remove stale site.js blocks** (`43d7b15`). Confirmed the `[data-bar]` collision is real (`index.astro:163` `<span data-bar>`, no `.bar-fill`).
- [x] **T3 — homepage analytics label** (`4a398a3`). `data-angle → data-page → "home"`.
- [x] **T4 — harden `/api/lead`** (`086d905`). Verified `null→400`, honeypot→200, valid→200, invalid→422 against dev.
- [x] **T5 — `aria-expanded` mobile nav** (`dab3a03`). Both headers + `site.js`.
- [x] **T6 — Social/OG meta** (`5b74f7d`) — **adapted**: `site.url` set to the **workers.dev** serving origin (NOT `elegantnivasa.com`, which still serves WordPress and would 404 the preview image). Wired into **homepage + privacy only**; sub-site wiring deferred until they ship. Verified `og:image`/`og:url` resolve to the workers.dev origin in `dist`.
- [ ] **T7 — standardise ₹6,999** — **DEFERRED**: only touches `comparison.ts` → sub-sites (parked). The homepage is already consistent at ₹6,999. Do with the sub-site launch.
- **Elevated from Deferred §1 — abuse protection on `POST /api/lead`** (Turnstile / rate-limit): the homepage form is live on paid traffic; **do before scaling ad spend**, not necessarily before this first deploy.

Verification cadence below was adapted: where steps expect "all 5 routes prerendered," that is now
"2 routes (`/`, `/privacy`)" while sub-sites are parked.

---

## Global Constraints

These apply to **every** task. A task is not "done" until all of these pass.

- **Run dir:** all `npm`/`npx`/`git` commands run from `/Users/saimeda/Documents/Elegant Nivasa/web` unless noted. The git repo root is the parent, `/Users/saimeda/Documents/Elegant Nivasa`.
- **No test framework exists.** The verification cycle for every task is: `npx astro check` must print `0 errors / 0 warnings / 0 hints`, then `npm run build` must finish with `[build] Complete!` and prerender all 5 routes. Do not add a test framework (YAGNI for a static marketing site).
- **Cloudflare runtime only.** Never introduce Node-only APIs in code that runs at build or request time — no `Buffer`, `fs`, `process`. Use Web APIs (`btoa`/`atob`, `fetch`, `URL`). (This is exactly what the deleted `WhatsAppButton.astro` got wrong.)
- **The Nearby/branded builder is ALWAYS unnamed** (CONTEXT.md). Do not introduce a competitor name in any copy.
- **Figures that are marketing claims carry a trailing `*`** (footer disclaimer covers them). Preserve the `*` on any figure you touch.
- **Do not change deploy/runtime config** (`wrangler.jsonc`, secrets, D1 bindings) in this plan — these are operational and tracked in CLAUDE.md §7.
- **Commits:** end every commit message body with:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```

---

## Task 0: Branch setup

**Files:** none (git only).

- [ ] **Step 1: Create a working branch off `main`**

The repo is currently on `main` (the default branch). Branch before making changes.

Run (from the repo root):
```bash
cd "/Users/saimeda/Documents/Elegant Nivasa" && git checkout -b chore/homepage-launch
```
Expected: `Switched to a new branch 'chore/homepage-launch'` _(actual branch used — this plan was folded into the homepage-launch branch alongside the session's prep work)._

- [ ] **Step 2: Confirm a clean baseline build before touching anything**

Run (from `web/`):
```bash
cd "/Users/saimeda/Documents/Elegant Nivasa/web" && npx astro check && npm run build
```
Expected: `astro check` ends with `0 errors`, `0 warnings`, `0 hints`; `npm run build` ends with `[build] Complete!`. If this baseline is not green, STOP and report — the working tree already had pre-existing modifications (`site.js`, `proto.css`, `index.astro`, `SubSiteLayout.astro` per `git status`) that must be understood first.

---

## Task 1: Delete divergent dead code

The review found two parallel copies of header/footer/WhatsApp logic. The unused copies have diverged and are now broken (`WhatsAppButton.astro` uses `Buffer` → crashes on Workers, and emits `data-reps`/`data-msg` attributes `site.js` no longer reads). Anyone reaching for them ships bugs. `grep` over `src/` + `public/` confirmed zero live references to any of these.

**Files:**
- Delete: `src/components/WhatsAppButton.astro`
- Delete: `src/components/Header.astro`
- Delete: `src/components/Footer.astro`
- Delete: `src/layouts/BaseLayout.astro`
- Delete: `src/styles/global.css` (imported only by the deleted `BaseLayout`)
- Delete: `public/assets/css/home.css` (referenced by nothing)
- Delete: `public/assets/js/home.js` (referenced by nothing)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This task only removes unreferenced files; no other task depends on it.

- [ ] **Step 1: Re-confirm each file is unreferenced (guard against stale review)**

Run (from `web/`):
```bash
grep -rn "WhatsAppButton\|components/Header\|components/Footer\|BaseLayout\|styles/global.css\|home\.css\|home\.js" src public --include="*.astro" --include="*.ts" --include="*.js" --include="*.css"
```
Expected: **no output** (every match would be a live reference). If anything prints, STOP — that file is in use; do not delete it.

- [ ] **Step 2: Delete the files**

Run (from `web/`):
```bash
git rm src/components/WhatsAppButton.astro src/components/Header.astro src/components/Footer.astro src/layouts/BaseLayout.astro src/styles/global.css public/assets/css/home.css public/assets/js/home.js
```
Expected: `rm 'src/components/WhatsAppButton.astro'` … one line per file.

- [ ] **Step 3: Verify the build is still green**

Run (from `web/`):
```bash
npx astro check && npm run build
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!` with all 5 routes prerendered (`/index.html`, `/cost`, `/handover`, `/rental-yield`, `/privacy`).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: delete divergent dead components, layout and assets

Unreferenced and diverged from the live code (WhatsAppButton used Node
Buffer + stale data attributes). ~1,000 lines removed.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Remove stale `site.js` blocks (floor-plan explorer + comparison bars)

Two blocks in `site.js` are dead leftovers from removed features. The `[data-bar]` block is worse than dead — its selector now collides with the corridor progress bar on the homepage (`index.astro:161` reuses `data-bar`), and because that element has no `.bar-fill` child the handler throws `TypeError: Cannot read properties of null (reading 'style')` in an IntersectionObserver callback on every homepage scroll-into-view. The corridor bar itself is driven correctly by `proto.js:50`, so removing the `site.js` block changes no behaviour — it only stops the crash.

The floor-plan explorer block targets `[data-floorplans]`, which exists in no markup (`grep` confirmed).

**Files:**
- Modify: `public/assets/js/site.js` (remove the COMPARISON BARS block ~lines 77-87 and the FLOOR PLAN explorer block ~lines 112-143).

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Note the shared helpers `UNITS`, `RATE`, `priceOf`, `crore`, `inr`, and `openLightbox` are used by *other* blocks (calculator, gallery) and MUST remain.

- [ ] **Step 1: Remove the COMPARISON BARS block**

In `public/assets/js/site.js`, delete exactly:
```js
  /* =====================================================================
     COMPARISON BARS (animate width on view)
     ===================================================================== */
  document.querySelectorAll("[data-bar]").forEach(function (track) {
    var fill = track.querySelector(".bar-fill");
    var pct = track.getAttribute("data-bar");
    var bo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fill.style.width = pct + "%"; bo.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bo.observe(track);
  });

```

- [ ] **Step 2: Remove the FLOOR PLAN explorer block**

In `public/assets/js/site.js`, delete exactly:
```js
  /* =====================================================================
     FLOOR PLAN explorer
     ===================================================================== */
  var fp = document.querySelector("[data-floorplans]");
  if (fp) {
    var tabsWrap = fp.querySelector(".fp-tabs");
    var stage = fp.querySelector(".fp-stage");
    UNITS.forEach(function (u, i) {
      var b = document.createElement("button");
      b.className = "fp-tab" + (i === 0 ? " active" : "");
      b.innerHTML = '<span><span class="ttl">' + u.name + '</span><span class="sub">' + u.facing +
        ' facing · ' + u.area + ' sft</span></span><span class="sz">' + crore(priceOf(u.area)) + '</span>';
      b.addEventListener("click", function () {
        tabsWrap.querySelectorAll(".fp-tab").forEach(function (t) { t.classList.remove("active"); });
        b.classList.add("active"); renderPlan(u);
      });
      tabsWrap.appendChild(b);
    });
    function renderPlan(u) {
      stage.innerHTML =
        '<div class="fp-stage-head">' +
          '<h3>' + u.name + '</h3>' +
          '<span class="badge">' + u.facing + ' Facing</span>' +
          '<span class="badge">' + u.area + ' sft (SBA)</span>' +
          '<span class="price">' + crore(priceOf(u.area)) + '<small>Indicative · @ ₹' + RATE.toLocaleString("en-IN") + '/sft</small></span>' +
        '</div>' +
        '<div class="fp-img" data-zoom="' + u.img + '"><img src="' + u.img + '" alt="' + u.name + ' floor plan" loading="lazy"></div>' +
        '<p class="muted" style="margin-top:14px;font-size:.92rem">' + u.rooms + '</p>';
      stage.querySelector(".fp-img").addEventListener("click", function () { openLightbox([u.img], 0); });
    }
    renderPlan(UNITS[0]);
  }

```

- [ ] **Step 3: Confirm the removed selectors and the dangling helper are truly gone, and survivors remain**

Run (from `web/`):
```bash
grep -n "data-floorplans\|bar-fill\|renderPlan" public/assets/js/site.js; echo "---survivors---"; grep -cn "UNITS\|openLightbox\|crore\|priceOf" public/assets/js/site.js
```
Expected: the first `grep` prints **nothing** (all three references removed). The survivor count prints a number `> 0` (helpers still referenced by the calculator/gallery).

- [ ] **Step 4: Verify build + manually confirm no homepage console error**

Run (from `web/`):
```bash
npx astro check && npm run build
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!`.

Then run `npm run dev`, open `http://localhost:4321/`, open DevTools console, and scroll slowly through "The corridor test" section. Expected: the corridor walls animate open AND **no** `TypeError ... reading 'style'` appears in the console (before this fix it threw when the corridor bar entered view).

- [ ] **Step 5: Commit**

```bash
git commit -am "fix: remove stale site.js blocks (floor-plan explorer + comparison bars)

The [data-bar] handler collided with the homepage corridor bar (no
.bar-fill child) and threw a TypeError on scroll; the [data-floorplans]
block targeted markup that no longer exists. Behaviour-neutral.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Fix homepage analytics page label

`site.js:45` derives the analytics `page` value from `data-angle`, which only the sub-sites set. The homepage sets `data-page="home"`, so it falls through to the literal `"cost"` — meaning every homepage conversion (`book_visit_open`, `brochure_open`, `lead_submit`, `brochure_request`) is reported as if it came from `/cost`. This corrupts the unified-metrics attribution that is the stated reason for the whole rebuild (CLAUDE.md §1).

**Files:**
- Modify: `public/assets/js/site.js:45`

**Interfaces:**
- Consumes: the `<body>` attributes `data-angle` (sub-sites) and `data-page` (homepage `"home"`, privacy `"legal"`).
- Produces: the module-local `angleKey`, used in every `window.track(..., { page: angleKey })` call in this file. After this change a homepage event reports `page: "home"`, a sub-site reports its angle (`"cost"`/`"handover"`/`"yield"`), privacy reports `"legal"`.

- [ ] **Step 1: Broaden the fallback chain**

In `public/assets/js/site.js`, change:
```js
  var angleKey = document.body.getAttribute("data-angle") || "cost";
```
to:
```js
  // Sub-sites set data-angle (cost|handover|yield); the homepage/privacy set
  // data-page (home|legal). Fall through both so analytics labels each route
  // correctly — never silently default homepage events to "cost".
  var angleKey = document.body.getAttribute("data-angle")
    || document.body.getAttribute("data-page")
    || "home";
```

- [ ] **Step 2: Verify build**

Run (from `web/`):
```bash
npx astro check && npm run build
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!`.

- [ ] **Step 3: Manually confirm the label**

Run `npm run dev`, open `http://localhost:4321/`, and in the DevTools console run:
```js
document.body.getAttribute("data-angle") || document.body.getAttribute("data-page") || "home"
```
Expected: `"home"`. Repeat on `/cost` → `"cost"`, `/privacy` → `"legal"`.

- [ ] **Step 4: Commit**

```bash
git commit -am "fix: label homepage analytics events as 'home', not 'cost'

site.js read only data-angle (sub-sites) and fell through to a literal
'cost', mis-attributing every homepage conversion to /cost.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Harden `/api/lead` against non-object bodies

`api/lead.ts` wraps `request.json()` in a try/catch, but a body of literal `null` (or a JSON number/string) parses successfully, then `if (body.company)` dereferences it (`null.company`) and throws an **unhandled 500**. Not exploitable, but ungraceful, and the typed shape `Record<string, string>` lies about runtime reality.

**Files:**
- Modify: `src/pages/api/lead.ts:16-25`

**Interfaces:**
- Consumes: the incoming `Request` JSON body.
- Produces: unchanged success contract (`{ ok: true }` / `{ error: ... }` with 400/422). Adds one new guarded path: a non-object body returns `400 {"error":"invalid json"}`.

- [ ] **Step 1: Loosen the body type and add the shape guard**

In `src/pages/api/lead.ts`, change:
```ts
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // honeypot — silently accept & drop bot submissions
  if (body.company) return json({ ok: true });
```
to:
```ts
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  // A valid-JSON non-object (null / number / string / array) parses fine but
  // would throw on property access below — reject it as a bad request.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "invalid json" }, 400);
  }

  // honeypot — silently accept & drop bot submissions
  if (body.company) return json({ ok: true });
```

- [ ] **Step 2: Verify types still pass**

The field reads below (`body.name ?? ""`, etc.) already coerce with `.toString()`, so `Record<string, unknown>` is compatible.

Run (from `web/`):
```bash
npx astro check
```
Expected: `0 errors / 0 warnings / 0 hints`.

- [ ] **Step 3: Verify build, then exercise the endpoint locally**

Run (from `web/`):
```bash
npm run build
```
Expected: `[build] Complete!`.

Then, with `npm run dev` running, in a second terminal:
```bash
# non-object body → must be a clean 400, not a 500
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4321/api/lead -H "Content-Type: application/json" -d 'null'
# honeypot → 200 ok
curl -s -X POST http://localhost:4321/api/lead -H "Content-Type: application/json" -d '{"company":"bot"}'
# valid lead → 200 ok
curl -s -X POST http://localhost:4321/api/lead -H "Content-Type: application/json" -d '{"name":"Test","phone":"9876543210"}'
# invalid lead → 422
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4321/api/lead -H "Content-Type: application/json" -d '{"name":"","phone":"123"}'
```
Expected: `400`; then `{"ok":true}`; then `{"ok":true}`; then `422`. (D1 binding may be absent in dev — the endpoint logs "DB binding missing" and still returns `{"ok":true}` by design; that's fine.)

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(api): reject non-object lead bodies with 400 instead of 500

A valid-JSON null/number/string parsed then threw on honeypot property
access. Guard the shape before dereferencing.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Mobile nav accessibility — toggle `aria-expanded`

The hamburger `.nav-toggle` toggles only CSS classes; its open/closed state is never exposed to assistive tech. Add `aria-expanded` to the markup (both header copies) and keep it in sync in `site.js`.

**Files:**
- Modify: `src/pages/index.astro:75` (homepage header toggle button)
- Modify: `src/layouts/SubSiteLayout.astro:52` (sub-site header toggle button)
- Modify: `public/assets/js/site.js` (the `.nav-toggle` click + nav-link-close handlers, ~lines 57-67)

**Interfaces:**
- Consumes: the `.nav-toggle` button and `.nav` element.
- Produces: `aria-expanded` reflects nav open state ("true"/"false").

- [ ] **Step 1: Add the initial state to both buttons**

In `src/pages/index.astro`, change:
```html
  <button class="nav-toggle" aria-label="Menu"><span></span><span></span><span></span></button>
```
to:
```html
  <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
```

In `src/layouts/SubSiteLayout.astro`, make the **identical** change to its `.nav-toggle` button line.

- [ ] **Step 2: Keep it in sync in `site.js`**

In `public/assets/js/site.js`, change:
```js
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); toggle.classList.remove("open"); });
    });
  }
```
to:
```js
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }
```

- [ ] **Step 3: Verify build**

Run (from `web/`):
```bash
npx astro check && npm run build
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!`.

- [ ] **Step 4: Manually confirm**

Run `npm run dev`, open `http://localhost:4321/` at a narrow (mobile) width, and in DevTools inspect the `.nav-toggle` button: tapping it flips `aria-expanded` between `false` and `true`; tapping a nav link closes the menu and resets it to `false`.

- [ ] **Step 5: Commit**

```bash
git commit -am "a11y: expose mobile nav open state via aria-expanded

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Social / SEO meta (Open Graph + Twitter Card + canonical + favicon)

This is a paid Instagram/Meta + WhatsApp-shared landing site, yet **no** page emits OG/Twitter/canonical/favicon tags (`grep` confirmed). Pasting any URL into WhatsApp/Instagram yields a blank preview — a direct conversion cost on the exact channel the site exists for. Five pages currently hand-roll near-identical `<head>` blocks; add one shared component and wire it into each, so previews are correct per route.

**Files:**
- Modify: `src/config/site.ts` (add the canonical origin)
- Create: `src/components/SocialMeta.astro`
- Modify: `src/pages/index.astro` (head)
- Modify: `src/pages/privacy.astro` (head)
- Modify: `src/layouts/SubSiteLayout.astro` (head + accept an `ogImage` prop)
- Modify: `src/pages/cost.astro`, `src/pages/handover.astro`, `src/pages/rental-yield.astro` (pass per-angle `ogImage`)

**Interfaces:**
- Consumes: `site.url` (new), `Astro.url.pathname`.
- Produces: `<SocialMeta title={string} description={string} image?={string} />` — emits `<link rel="canonical">`, two favicon `<link>`s, and the `og:*` / `twitter:*` meta tags. `SubSiteLayout` gains an optional prop `ogImage?: string` (default `"/assets/img/renders/render-7.jpg"`).

- [ ] **Step 1: Add the canonical origin to config**

In `src/config/site.ts`, inside the `site` object (e.g. right after the `city:` line), add:
```ts
  // Canonical/OG absolute-URL base. Intended production domain (cutover is
  // blocked on GoDaddy — CLAUDE.md §6); used to build absolute canonical + OG
  // image URLs, which must be absolute even before the domain goes live.
  url: "https://elegantnivasa.com",
```

- [ ] **Step 2: Create the shared component**

Create `src/components/SocialMeta.astro` with exactly:
```astro
---
// Shared social/SEO head tags (Open Graph, Twitter Card, canonical, favicon).
// Included inside every page's <head>. Robots/title/description stay on the
// page (sub-sites + privacy are intentionally noindex). OG image defaults to a
// representative render; pass `image` for a per-route preview. WhatsApp/Meta
// previews want a JPEG/PNG, so default to a .jpg (not the .webp hero).
import { site } from "../config/site";
interface Props {
  title: string;
  description: string;
  image?: string;
}
const { title, description, image = "/assets/img/renders/render-7.jpg" } = Astro.props;
const canonical = new URL(Astro.url.pathname, site.url).href;
const ogImage = new URL(image, site.url).href;
---
<link rel="canonical" href={canonical} />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content={site.name} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={ogImage} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content={ogImage} />
```

- [ ] **Step 3: Wire into the homepage**

In `src/pages/index.astro`, add to the frontmatter (with the other `const`s, after `HERO_IMG`):
```ts
const PAGE_TITLE = "Elegant Nivasa, Tellapur — Room to Live Well | Premium 2 & 3 BHK";
const PAGE_DESC = "Premium 2 & 3 BHK homes at Tellapur, West Hyderabad — three towers, 526 residences and a clubhouse on a 4-acre car-free podium community, two minutes from the ORR. For about ₹20 lakhs less than the branded launch next door. HMDA & RERA approved.";
```
Add the import alongside the existing `AnalyticsScripts` import:
```ts
import SocialMeta from "../components/SocialMeta.astro";
```
Replace the hardcoded `<title>` and description `<meta>` lines:
```html
<title>Elegant Nivasa, Tellapur — Room to Live Well | Premium 2 &amp; 3 BHK</title>
<meta name="description" content="Premium 2 &amp; 3 BHK homes at Tellapur, West Hyderabad — three towers, 526 residences and a clubhouse on a 4-acre car-free podium community, two minutes from the ORR. For about ₹20 lakhs less than the branded launch next door. HMDA &amp; RERA approved." />
```
with:
```html
<title>{PAGE_TITLE}</title>
<meta name="description" content={PAGE_DESC} />
```
Then add, immediately after the `<link rel="stylesheet" href="/assets/css/proto.css" />` line:
```html
<SocialMeta title={PAGE_TITLE} description={PAGE_DESC} image={HERO_IMG} />
```
Note: `HERO_IMG` is the `.webp` hero. Meta previews render `.jpg`/`.png` more reliably than `.webp`; if the preview is blank in testing (Step 7), drop the `image={HERO_IMG}` arg so it falls back to the `.jpg` default.

- [ ] **Step 4: Wire into `SubSiteLayout` (with a per-angle image prop)**

In `src/layouts/SubSiteLayout.astro`, add the import next to the other component imports:
```ts
import SocialMeta from "../components/SocialMeta.astro";
```
Add `ogImage` to the `Props` interface and destructure it:
```ts
interface Props {
  title: string;
  description: string;
  /** Canonical Angle key (ADR-0002): cost | handover | yield. */
  angle: Angle;
  adSet: string;
  /** Per-angle preview image for OG/Twitter; defaults inside SocialMeta. */
  ogImage?: string;
}
const { title, description, angle, adSet, ogImage } = Astro.props;
```
Then, immediately after the `<meta name="description" content={description} />` line in the `<head>`, add:
```html
<SocialMeta title={title} description={description} image={ogImage} />
```

- [ ] **Step 5: Pass each sub-site's hero render as its `ogImage`**

In `src/pages/cost.astro`, add `ogImage="/assets/img/renders/render-21.png"` to the `<SubSiteLayout ...>` opening tag (it already passes `title`/`description`/`angle`/`adSet`).

In `src/pages/handover.astro`, add `ogImage="/assets/img/renders/render-7.jpg"`.

In `src/pages/rental-yield.astro`, add `ogImage="/assets/img/renders/render-16.jpg"`.

- [ ] **Step 6: Wire into privacy**

In `src/pages/privacy.astro`, add the import next to `AnalyticsScripts`:
```ts
import SocialMeta from "../components/SocialMeta.astro";
```
Then add, immediately after the `<meta name="description" ... />` line in its `<head>`:
```html
<SocialMeta title="Privacy Policy — Elegant Nivasa" description="How E-Infra (Elegant Infra), developer of Elegant Nivasa, collects, uses and protects your personal data, in line with India's Digital Personal Data Protection Act, 2023." />
```

- [ ] **Step 7: Verify build + inspect emitted tags + validate a preview**

Run (from `web/`):
```bash
npx astro check && npm run build && grep -c "og:title\|twitter:card\|rel=\"canonical\"" dist/index.html dist/cost/index.html dist/privacy/index.html
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!`; and each `dist/.../index.html` reports a non-zero count (the OG/canonical tags are baked into the static HTML).

Then confirm the canonical/OG URLs are absolute and correct:
```bash
grep -o '<meta property="og:url" content="[^"]*"' dist/cost/index.html
```
Expected: `<meta property="og:url" content="https://elegantnivasa.com/cost"`.

Optionally paste the deployed URL into a preview checker (e.g. opengraph.xyz or Facebook Sharing Debugger) once deployed, to confirm the image renders. If `.webp` doesn't render on the homepage, apply the fallback noted in Step 3.

- [ ] **Step 8: Commit**

```bash
git commit -am "feat(seo): add OG/Twitter/canonical/favicon meta via shared SocialMeta

Paid social + WhatsApp shares had blank link previews. One shared
component, per-route title/description, per-angle preview image.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Standardise the per-sft price figure (DECISION-GATED) — ⏸ DEFERRED

> **Status (2026-06-22): deferred to the sub-site launch.** This only edits `comparison.ts`, which
> feeds the Scoreboard + angle-leads on the **parked** sub-sites; the homepage already shows ₹6,999
> consistently. Execute when `/cost` · `/handover` · `/rental-yield` are unparked.

**Decision required before executing — default chosen below.** The site shows two prices for "the same home": the hero/marketing rate `₹6,999/sft` (`comparison.ts:181,185`; also the homepage and the `site.js` calculator `RATE = 6999`) and the Scoreboard/cost-lead comparison rate `₹7,000*` (`comparison.ts:52,64,195`). Both appear on the same sub-site page. `6,999 × 1,375 = ₹96.24 L ≈ ₹96.25 L`, so the totals are unaffected either way.

**Default decision:** standardise every displayed *us* per-sft figure to **₹6,999** (matches the campaign rate, the homepage, and the calculator). The competitor rate stays `₹8,500*`. If the owner prefers the round `₹7,000` for the comparison maths instead, invert these edits (change the hero/homepage to `₹7,000`) — do **not** ship both.

**Files:**
- Modify: `src/data/comparison.ts:52`, `:64`, `:195`

**Interfaces:**
- Consumes: nothing.
- Produces: a single consistent *us* rate (`₹6,999*`) across hero, Scoreboard, and the cost angle-lead.

- [ ] **Step 1: Standardise the Scoreboard cost row**

In `src/data/comparison.ts`, change line 52's `us: "₹7,000*"` to `us: "₹6,999*"`. Leave `them`, `edge` (`"₹1,500/sft* lighter"` — the `*` covers the rounding of 8,500−6,999), and `total` untouched.

- [ ] **Step 2: Standardise the resale-ROI row**

In `src/data/comparison.ts`, change line 64's `sub: "On a ₹7,000* entry vs ₹8,500*"` to `sub: "On a ₹6,999* entry vs ₹8,500*"`.

- [ ] **Step 3: Standardise the cost angle-lead rate**

In `src/data/comparison.ts`, change line 195's `us: { cap: "Elegant Nivasa", amount: "₹96.25 L*", rate: "₹7,000*/sft · 1,375 sft" }` so the `rate` reads `"₹6,999*/sft · 1,375 sft"`. Leave `amount` (`₹96.25 L*`) untouched.

- [ ] **Step 4: Confirm no stray ₹7,000 remains and verify build**

Run (from `web/`):
```bash
grep -n "7,000" src/data/comparison.ts; echo "exit:$?"
```
Expected: no matches (grep exit `1`). Then:
```bash
npx astro check && npm run build
```
Expected: `0 errors / 0 warnings / 0 hints`; `[build] Complete!`.

- [ ] **Step 5: Commit**

```bash
git commit -am "content: standardise us per-sft rate to ₹6,999 across all sub-sites

Hero/calculator said ₹6,999 while the scoreboard said ₹7,000 on the same
page; align on the campaign rate (totals unchanged).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Deferred — require explicit go-ahead (not full tasks)

These are real findings but are larger features and/or product/legal decisions, not mechanical fixes. They are sketched here so they aren't lost; expand into their own plans when greenlit.

1. **Abuse protection on `POST /api/lead`.** No rate limiting or origin check today (only the honeypot); each call writes to D1 and sends two Resend emails, so a loop can flood the table and burn the Resend free-tier quota before ad spend scales. Recommended path: Cloudflare Turnstile on both forms + the `siteverify` check in `api/lead.ts` (there is a `turnstile-spin` skill that does this end-to-end), and/or a WAF rate-limit rule. **Blocking before scaling ad spend.**

2. **DPDP consent banner.** Clarity is live and recording PII *before* consent (CLAUDE.md §8), and `privacy.astro` already promises "We are introducing a cookie-consent control" — a commitment the site doesn't yet honour. Needs a consent gate wired into `AnalyticsScripts.astro` / `lib/analytics.ts` (the `track()` layer is already centralised, so this is the right seam). **Knowingly deferred by client; revisit before scaling ad spend.**

3. **Purpose-built 1200×630 OG image.** Task 6 reuses existing renders; a dedicated branded card improves preview quality. Pure polish.

4. **Lightbox focus management.** The gallery lightbox (`site.js`) opens without trapping focus or restoring it on close. Consider rebuilding it on the native `<dialog>` already used for the book-a-visit/brochure modals to get focus handling for free. Minor a11y.

5. **`@astrojs/cloudflare` auto-enabled IMAGES/SESSION bindings.** Harmless now (no `astro:assets`, no sessions), but undeclared in `wrangler.jsonc`. Add a one-line clarifying comment if/when image optimization is ever turned on.

---

## Self-Review (completed by plan author)

- **Coverage:** Every 🔴/🟠 review finding maps to a task (bugs → T2/T3/T4; dead code → T1/T2); 🟡 launch-readiness → T6 + Deferred §1/§2; 🔵 minor → T5, T7, Deferred §4/§5. The ₹6,999/₹7,000 and a11y items are covered.
- **Placeholders:** none — every code step shows exact before/after and every verify step shows the command + expected output. The only decision marker (T7) ships with a concrete default and explicit edits.
- **Type/name consistency:** `site.url` (added T6/S1) is consumed by `SocialMeta.astro` (T6/S2); the `ogImage` prop name is consistent across `SubSiteLayout` (T6/S4) and the three sub-site pages (T6/S5); `angleKey` (T3) and the preserved helpers `UNITS`/`crore`/`priceOf`/`openLightbox` (T2) are named identically to the live code.
- **Adaptation note:** the writing-plans skill's TDD red/green steps are replaced by `astro check` + `build` + targeted `grep`/`curl`/manual checks, because this project has no test harness and adding one is out of scope (YAGNI). Every task still ends with an independently verifiable deliverable + commit.
