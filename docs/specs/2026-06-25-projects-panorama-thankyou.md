# E-Infra projects panorama on the thank-you pages

> **⚠️ SUPERSEDED 2026-06-26 — this spec describes the original static-image design, since replaced.**
> The panorama is now the **masterplan flythrough video** (`assets/video/einfra-masterplan.mp4`, 324 KB
> @ 960×540 + poster) with **numbered hotspots + a numbered legend** (map-legend pattern, picked by a
> fresh prototype) inside a **two-column** thank-you layout. The static `einfra-panorama.webp` and the
> tap-to-zoom interaction described below are **gone**; Celosia is now a live link (`celosiavillas.com`);
> the video plays only while on-screen (IntersectionObserver) and respects `prefers-reduced-motion`.
> **See CLAUDE.md §5 "E-Infra projects panorama" for the current design.** Kept below for history only.
>
> **IMPLEMENTED 2026-06-25 (original).** `components/ProjectsPanorama.astro` rendered in `ThankYouLayout`
> (both thank-you pages); image `assets/img/renders/einfra-panorama.webp` (135 KB). `astro check`
> 0/0/0, build green. Not yet deployed at time of writing.

_Spec — 2026-06-25. Adds an "E-Infra is building across the city" panorama with clickable projects to
both thank-you pages, to build cross-project confidence right after a visitor converts. Direction was
chosen by prototyping (`prototypes/panorama/`): **Variant A (dots + labels)** with the **tap-to-zoom**
mobile treatment._

## Goal

Show, on the post-conversion thank-you pages, that Elegant Nivasa is one of **several** E-Infra
developments — proof the company is established, not a one-off new builder. Each building in a shared
E-Infra render links to that project's site.

## Decided design (from the prototype)

- **Interaction:** Variant A — each project is a gold **dot + name label** overlaid on the panorama
  (percentage-positioned so they scale), plus a **chip row** below as the always-reliable tap target.
- **Mobile (primary, per Tranquil):** **tap-to-zoom**. The whole skyline shows clean and small as a
  preview with a top-left "⤢ Tap to zoom" badge; tapping opens a **fullscreen, horizontally-scrollable**
  view (centered on open) where buildings are large and tappable. Desktop uses the inline dots/labels.
- **Projects & links** (6, from the marked coordinates):
  | Project | Link |
  | --- | --- |
  | Moonglade | https://beseen.moonglade.life/ |
  | Skyven | https://www.theskyven.com |
  | One Downtown | https://onedowntown.in/ |
  | Elegant Nivasa | `/` (home — so the visitor returns after signing up) |
  | La Casa | https://lacasavilla.in/ |
  | Celosia | **coming soon** — not linked yet (`celosiavillas.com` is owned but the site is
    pending; see the handoff doc). Flip to a link once it's live. |
- External project links open in a **new tab** (`target=_blank rel=noopener`) so the thank-you page
  isn't lost.
- A **"Completed projects — coming soon"** placeholder note sits beneath, per the future plan.

## Architecture

- **New component:** `web/src/components/ProjectsPanorama.astro` — self-contained: the `PROJECTS` array
  in frontmatter, the section markup (heading, panorama with hotspots **rendered at build time**, chip
  row, and the zoom-overlay markup with its own build-time hotspots), scoped `<style>`, and a small
  `<script>` for **only** the zoom open/close/center + a `project_click` analytics ping. No client-side
  rendering — the dots/labels/chips are baked at build time.
- **Placement:** rendered once in `web/src/layouts/ThankYouLayout.astro`, after the confirmation
  `<main>` and before the `<footer>`, so **both** `/thank-you-visit` and `/thank-you-brochure` get it.
- **Image:** `public/assets/img/renders/einfra-panorama.webp` (135 KB, converted from the 1500×500
  source with `cwebp -q 82`).
- **Analytics:** clicking a project fires `track("project_click", { project })` → Clarity / Meta /
  dataLayer (engagement signal, not a conversion). `window.track` already exists on these pages.

## Non-goals

- No CMS / dynamic data — the six projects are a static, rarely-changing list baked into the component.
- Not added to the homepage or sub-sites in this pass (thank-you pages only).
- The Celosia link and the "completed projects" gallery are explicitly deferred.

## Testing / verification

- `npx astro check` → 0/0/0; `npm run build` → green.
- Built HTML for both thank-you pages contains the panorama section, the 6 projects, the webp image,
  and the zoom overlay markup. Elegant Nivasa → `/`; external links carry `target="_blank"`.
- Manual: desktop shows dots/labels; narrow/mobile shows the preview + "Tap to zoom" → fullscreen
  swipeable view centered on open; chips link on both.

## Notes

- Keep the panorama ≈135 KB WebP; it's below the fold so not LCP, but still meaningful weight on mobile.
- When `celosiavillas.com` goes live, change Celosia from `soon` to a real link (one line in the
  component's `PROJECTS`).
