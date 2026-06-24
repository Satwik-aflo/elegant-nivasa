# Thank-you Pages for Form Conversion Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/thank-you-visit` and `/thank-you-brochure` pages that load on a successful form submit, so the marketing-owned GTM container fires Google Ads conversions off a reliable page-view trigger.

**Architecture:** A shared `ThankYouLayout.astro` (self-contained chrome, loads analytics, fires its conversion via `window.track` on load) plus two thin page files. `site.js`'s form-success path navigates to the matching page instead of revealing an in-dialog success panel. Covers the homepage and all three sub-sites because they share one form code path.

**Tech Stack:** Astro (static, Cloudflare Workers), plain JS (`public/assets/js/site.js`), existing `track()`/dataLayer + GTM bridge.

## Global Constraints

- No unit-test harness in this repo. The test cycle per task is: `npx astro check` → **0/0/0**, then `npm run build` → green, then grep the built `dist/` HTML. Run all commands from `web/`.
- `track()` is exposed as `window.track` by the `analytics.ts` module import in `AnalyticsScripts.astro`; it is a deferred module script, so any inline call must poll until `window.track` exists.
- Brochure asset path: `/assets/brochure/Elegant-Nivasa-Brochure.pdf`. Public sales line: `9090366366` (matches `index.astro`).
- No PII in conversion pings. WhatsApp Enquiry is out of scope (it leaves the site) — unchanged.
- Both thank-you pages MUST carry `<meta name="robots" content="noindex, nofollow" />`.
- Commit messages end with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

### Task 1: Shared `ThankYouLayout` + `/thank-you-visit` page

**Files:**
- Create: `web/src/layouts/ThankYouLayout.astro`
- Create: `web/src/pages/thank-you-visit.astro`

**Interfaces:**
- Produces: `ThankYouLayout` with props `{ title: string; event: "lead_submit" | "brochure_request"; heading: string; lead: string }` and a default `<slot />` for page-specific content (used by Task 2). Fires `window.track(event, { page: "thankyou" })` once on load.

- [ ] **Step 1: Create `web/src/layouts/ThankYouLayout.astro`**

```astro
---
// Shared chrome for the post-submit thank-you pages (/thank-you-visit, /thank-you-brochure).
// Self-contained like privacy.astro: own <head>, loads site.css + AnalyticsScripts, GtmNoscript
// first in <body>. Fires its conversion `event` via window.track once on load (poll until the
// analytics module exposes it) → Meta Pixel (Lead) + Clarity + dataLayer. GTM's page-view on this
// URL is what marketing maps the Google Ads conversion to. noindex — post-submit page.
import AnalyticsScripts from "../components/AnalyticsScripts.astro";
import GtmNoscript from "../components/GtmNoscript.astro";
import SocialMeta from "../components/SocialMeta.astro";
import { site } from "../config/site.ts";

interface Props {
  title: string;
  event: "lead_submit" | "brochure_request";
  heading: string;
  lead: string;
}
const { title, event, heading, lead } = Astro.props;
const PHONE = "9090366366"; // public sales line (matches index.astro)
---
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title}</title>
<meta name="description" content="Thank you — Elegant Nivasa." />
<SocialMeta title={title} description="Thank you — Elegant Nivasa." />
<meta name="robots" content="noindex, nofollow" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/assets/css/site.css" />
<AnalyticsScripts />
<style>
  .ty { min-height: 72vh; display: grid; place-items: center; text-align: center;
        padding: clamp(120px,16vw,160px) 0 clamp(56px,8vw,90px); }
  .ty .wrap { max-width: 620px; }
  .ty .tick { width: 64px; height: 64px; border-radius: 50%; background: var(--gold); color: #fff;
              display: grid; place-items: center; margin: 0 auto 24px; font-size: 2rem; line-height: 1; }
  .ty h1 { font-family: var(--font-display); color: var(--navy); margin: 0 0 12px;
           font-size: clamp(1.9rem,4.5vw,2.7rem); }
  .ty p.lead { color: var(--ink-soft); font-size: 1.08rem; line-height: 1.6; margin: 0 0 28px; }
  .ty .cta-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 22px; }
  .ty .slot { margin-bottom: 22px; }
  .ty .back { color: var(--navy); font-weight: 600; text-decoration: underline; }
</style>
</head>
<body data-page="thankyou">
<GtmNoscript />

<header class="site-header scrolled">
  <a class="brand" href="/" aria-label="Elegant Nivasa home">
    <img src="/assets/img/brand/nivasa-logo.png" alt="Elegant Nivasa" />
  </a>
  <nav class="nav">
    <a class="btn btn--gold" href="/">Back to site</a>
  </nav>
</header>

<main class="ty">
  <div class="wrap">
    <div class="tick" aria-hidden="true">✓</div>
    <h1>{heading}</h1>
    <p class="lead">{lead}</p>
    <div class="cta-row">
      <a class="btn btn--gold btn--lg" href={`tel:${PHONE}`} data-track="call_click">Call us now</a>
      <a class="btn btn--ghost btn--lg" href={`https://wa.me/91${PHONE}`} target="_blank" rel="noopener" data-track="whatsapp_click">WhatsApp us</a>
    </div>
    <div class="slot"><slot /></div>
    <a class="back" href="/">← Explore the project</a>
  </div>
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="foot-bottom">
      <span>© <span data-year>2026</span> {site.name} · {site.developer}. All rights reserved.</span>
      <span><a href="/" style="color:inherit">Home</a></span>
    </div>
  </div>
</footer>

<script is:inline src="/assets/js/site.js"></script>
<script is:inline define:vars={{ event }}>
  (function fire() {
    if (window.track) { window.track(event, { page: "thankyou" }); }
    else { setTimeout(fire, 50); }
  })();
</script>
</body>
</html>
```

- [ ] **Step 2: Create `web/src/pages/thank-you-visit.astro`**

```astro
---
import ThankYouLayout from "../layouts/ThankYouLayout.astro";
---
<ThankYouLayout
  title="Thank you — Elegant Nivasa"
  event="lead_submit"
  heading="Thank you — we've got your details"
  lead="Our sales team will call you shortly to schedule your visit. Want to talk right now? Call or WhatsApp us below."
/>
```

- [ ] **Step 3: Type-check**

Run: `npx astro check`
Expected: `0 errors, 0 warnings, 0 hints`

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: green; `dist/thank-you-visit/index.html` (or `dist/thank-you-visit.html`) produced.

- [ ] **Step 5: Verify the built page**

Run: `f=$(find dist -name 'index.html' -path '*thank-you-visit*' -o -name 'thank-you-visit.html' | head -1); echo "$f"; grep -c 'noindex' "$f"; grep -c 'gtm.start' "$f"; grep -c 'lead_submit' "$f"; grep -c 'clarity' "$f"`
Expected: each count ≥ 1 (noindex present, GTM head snippet present, the `lead_submit` fire present, Clarity present).

- [ ] **Step 6: Commit**

```bash
git add web/src/layouts/ThankYouLayout.astro web/src/pages/thank-you-visit.astro
git commit -m "feat(thankyou): add /thank-you-visit page + shared ThankYouLayout

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `/thank-you-brochure` page (auto-download)

**Files:**
- Create: `web/src/pages/thank-you-brochure.astro`

**Interfaces:**
- Consumes: `ThankYouLayout` from Task 1.

- [ ] **Step 1: Create `web/src/pages/thank-you-brochure.astro`**

```astro
---
import ThankYouLayout from "../layouts/ThankYouLayout.astro";
const BROCHURE = "/assets/brochure/Elegant-Nivasa-Brochure.pdf";
---
<ThankYouLayout
  title="Brochure on its way — Elegant Nivasa"
  event="brochure_request"
  heading="Your brochure is downloading"
  lead="If the download doesn't start automatically, tap the button below. We've noted your interest — our team may reach out with availability and pricing."
>
  <a class="btn btn--gold btn--lg" href={BROCHURE} download>Download brochure</a>
  <script is:inline define:vars={{ BROCHURE }}>
    (function () {
      var a = document.createElement("a");
      a.href = BROCHURE; a.setAttribute("download", "");
      document.body.appendChild(a); a.click(); a.remove();
    })();
  </script>
</ThankYouLayout>
```

- [ ] **Step 2: Type-check**

Run: `npx astro check`
Expected: `0 errors, 0 warnings, 0 hints`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: green; `thank-you-brochure` page produced.

- [ ] **Step 4: Verify the built page**

Run: `f=$(find dist -name 'index.html' -path '*thank-you-brochure*' -o -name 'thank-you-brochure.html' | head -1); echo "$f"; grep -c 'noindex' "$f"; grep -c 'brochure_request' "$f"; grep -c 'Elegant-Nivasa-Brochure.pdf' "$f"`
Expected: each count ≥ 1 (noindex, the `brochure_request` fire, and the PDF download link/script present).

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/thank-you-brochure.astro
git commit -m "feat(thankyou): add /thank-you-brochure page with auto-download

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Navigate to the thank-you page on form success

**Files:**
- Modify: `web/public/assets/js/site.js` (the `showSuccess` function inside the `[data-leadform]` handler, ~lines 438-452)

**Interfaces:**
- Consumes: `/thank-you-visit` and `/thank-you-brochure` from Tasks 1-2; the existing `intent` variable (`"lead" | "brochure"`) in scope.

- [ ] **Step 1: Replace the `showSuccess` body**

Find this block:

```js
      function showSuccess() {
        form.style.display = "none";
        if (success) {
          success.classList.add("show");
          var nm = success.querySelector("[data-name]"); if (nm && name) nm.textContent = name.value.trim().split(" ")[0];
        }
        // brochure prompt: kick off the actual PDF download once captured
        var dl = form.getAttribute("data-download");
        if (dl) {
          var a = document.createElement("a");
          a.href = dl; a.setAttribute("download", "");
          document.body.appendChild(a); a.click(); a.remove();
        }
        if (window.track) window.track(intent === "brochure" ? "brochure_request" : "lead_submit", { page: angleKey });
      }
```

Replace with:

```js
      function showSuccess() {
        // Lead is already written to D1. Navigate to the matching thank-you page; it
        // fires the conversion on load (Meta + Clarity + dataLayer via track(), GTM
        // page-view → Google Ads) and, for brochure, auto-starts the PDF download.
        window.location.href = intent === "brochure" ? "/thank-you-brochure" : "/thank-you-visit";
      }
```

(The in-dialog `.form-success` panels and the `data-download` attribute stay in the markup but are now unused — harmless. The `var success` declaration above becomes unused; leave it to keep the edit minimal.)

- [ ] **Step 2: Type-check + build (site.js is plain JS, so this just confirms nothing else broke)**

Run: `npx astro check && npm run build`
Expected: `0/0/0` and green.

- [ ] **Step 3: Manual dev verification**

Run: `npm run dev` then, in a browser at `http://localhost:4321`:
- Open "Book a visit", submit a valid name + `9876543210` → lands on `/thank-you-visit`.
- Open "Email me the brochure", submit a valid email → lands on `/thank-you-brochure` and the PDF downloads.
- Repeat the book-a-visit on `/cost` → also lands on `/thank-you-visit`.
Stop the dev server when done.

- [ ] **Step 4: Commit**

```bash
git add web/public/assets/js/site.js
git commit -m "feat(thankyou): navigate to thank-you page on form success

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Document the change (CLAUDE.md) + mark spec live

**Files:**
- Modify: `CLAUDE.md` (§5 Analytics — add the thank-you-page note + marketing GTM instruction)
- Modify: `docs/specs/2026-06-24-thank-you-pages-conversion.md` (add a one-line "IMPLEMENTED" banner)

- [ ] **Step 1: Add to CLAUDE.md §5**, after the GTM bullet, a new bullet:

```markdown
- **Thank-you pages (form conversions)** — **LIVE 2026-06-24.** A successful book-a-visit or
  brochure submit now **navigates** to `/thank-you-visit` or `/thank-you-brochure` (shared
  `layouts/ThankYouLayout.astro`, both `noindex`). Each fires its conversion **on page load**
  (`track()` → Meta `Lead`/Clarity/dataLayer) so GTM can map **Google Ads** to a reliable
  **page-view trigger** instead of the submit-time event. `/thank-you-brochure` also
  auto-downloads the PDF. `site.js` `showSuccess()` just redirects now. _Marketing: build the
  Google Ads conversions on **page-view triggers** (`/thank-you-visit`, `/thank-you-brochure`)
  — do NOT also trigger Ads off the `lead_submit`/`brochure_request` dataLayer events, or it
  double-counts. WhatsApp has no thank-you page (leaves the site) — stays on `whatsapp_click`._
  (Spec: [docs/specs/2026-06-24-thank-you-pages-conversion.md](./docs/specs/2026-06-24-thank-you-pages-conversion.md).)
```

- [ ] **Step 2: Add an IMPLEMENTED banner to the spec** (top of `docs/specs/2026-06-24-thank-you-pages-conversion.md`, after the H1):

```markdown
> **IMPLEMENTED 2026-06-24.** Live in code: `ThankYouLayout.astro` + `/thank-you-visit` +
> `/thank-you-brochure`; `site.js` redirects on success. Marketing's GTM page-view triggers
> are the remaining (non-code) step.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md docs/specs/2026-06-24-thank-you-pages-conversion.md
git commit -m "docs: record thank-you-page conversion flow live

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## After all tasks

- Final `npx astro check` (0/0/0) + `npm run build` (green).
- **Do NOT deploy automatically.** Deploy ships straight to production (`npx wrangler deploy` from `web/`, no staging). Present the result and let the user trigger the deploy.

## Self-Review

- **Spec coverage:** two pages (Tasks 1-2) ✓; fire-on-load not at submit (Task 1 layout script + Task 3 removes submit-time track) ✓; site.js redirect for both main + sub-sites (Task 3, shared form code) ✓; brochure auto-download (Task 2) ✓; noindex (Task 1) ✓; marketing GTM note (Task 4) ✓; WhatsApp out of scope (unchanged) ✓.
- **Placeholders:** none — every step has full file content or the exact find/replace.
- **Type consistency:** `ThankYouLayout` prop `event` typed `"lead_submit" | "brochure_request"`; both pages pass one of those literals; `define:vars={{ event }}` matches.
