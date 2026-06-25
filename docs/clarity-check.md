# Clarity Check — running ledger

Living record of every Microsoft Clarity behaviour review for **elegantnivasa.com**. Maintained by
the [`clarity-check`](../.claude/skills/clarity-check/SKILL.md) skill. **Read this before a review,
update it after.** Its job is to remember when we last pulled data, which commit we checked it
against, and what's already fixed — so we never re-recommend shipped work.

Clarity project id: `xah4dbk2kt`.

---

## Last run

| | |
|---|---|
| **Date checked** | 2026-06-25 |
| **Clarity data window** | 2026-06-23 → 2026-06-25 (first 3 days post-cutover) |
| **Git checkpoint (HEAD)** | `1f2d608` — _docs: record hero AI-render swap + thank-you-page as-built gotchas_ |
| **Next run** | pull the window since 2026-06-25; diff against `git log 1f2d608..HEAD` |

---

## Rolling status — known issues

Status legend: ✅ Fixed · 🟡 Partial · 🔴 Open. "Evidence" = the commit or file that proves status.

| # | Issue (from behaviour) | Status | Evidence / where | Clarity signal |
|---|---|---|---|---|
| 1 | Floor-plan & render images not zoomable (dead "Enlarge" cards) | ✅ Fixed | `b5fddeb` (2026-06-23 10:35); `site.js` wires every `[data-gallery]` — both `fp-grid` & `g-grid` | Dead clicks on floor-plan/render **pre-fix only**; post-fix taps open lightbox |
| 2 | Corridor reads as clickable but is **scroll-only** | 🔴 Open | `index.astro` `[data-corridor]` + `proto.js` — no click/drag handler | Desktop clicks on "Same cheque…" / "Just a little more than rent" headlines (18-20) |
| 3 | Rent calculator **result tiles look like inputs** (display-only) | 🔴 Open | `index.astro` / `SubSiteLayout.astro` `.b` tiles (`rnt-emi`, `rnt-rent2`…) | Dead clicks on ₹70,989 / ₹16,000 / "Rent you pay now" |
| 4 | Hero doesn't front-load all proof | 🟡 Partial | `HERO_LEAD` has ₹6,999/sft + June 2027 (`b082905`, `dde6a75`); **comparison hook still missing** | 42% of homepage sessions bounce in top quarter (0-25% scroll) |
| 5 | Scoreboard "Add it all up → ₹43.6L ahead" summary | 🟡 Partial | **Uncommitted** working changes in `Scoreboard.astro`, `comparison.ts`, `site.css` | Comparison content is the dead-click cluster; this is polish, not the affordance fix |
| 6 | Meta/Instagram attribution collapsing into "Direct" | 🔴 Open (marketing-side) | Not a code task; IG link-in-bio already carries UTMs + `fbclid` (seen in recordings) | "Direct" 97 sessions vs ig/social ~3; in-app browser strips referrer |
| 7 | URL fragmentation across `http://` / `https://` / `www.` | 🔴 Open | No single canonical redirect confirmed (thank-you canonical only, `f902bf5`) | 35 `http://` + 14 `www.` homepage sessions split from canonical |
| 8 | Homepage → sub-site cross-sell barely used | 🔴 Open | `index.astro` confidence band (`#compare`) | "Already paying rent?" cross-sell: 4 mobile clicks; mobile 1.29 pages/session |

---

## Current prioritized fix list (as of 2026-06-25)

Ranked by behavioural impact. Already-shipped items (#1) excluded.

1. **Corridor click/drag-to-advance** (#2) — biggest dead-click cluster; code confirms scroll-only today.
2. **De-affordance the calculator result tiles** (#3) — or focus the related control on tap.
3. **Add the comparison hook to the hero** (#4) — addresses the 42% top-quarter bounce.
4. **Finish or stash the uncommitted scoreboard "₹43.6L ahead" work** (#5) — don't leave it half-done.
5. **Attribution: UTM every ad destination** (#6) — marketing-side; lean on `fbclid`/recordings to measure Meta.
6. **Enforce a single canonical** (`https://elegantnivasa.com/`) (#7) — stop URL/data fragmentation + redirect hop.
7. **Rethink the homepage→sub-site cross-sell** (#8) — elevate it or treat sub-sites as standalone ad landers.

---

## Run log

### 2026-06-25 — first review (window 2026-06-23 → 06-25, checkpoint `1f2d608`)

**Traffic & audience**
- 193 sessions · 159 unique users · 292 page views · avg scroll 48.7%.
- ~70% mobile (homepage: 95 mobile / 43 PC / 1 tablet).
- Channels (UTM source/medium): Direct 97 · t.co (X/Twitter) referral 49 · google organic 39 ·
  elegantnivasa.com 10 · e-infra.in 4 · bing 3 · l.instagram.com + ig/social ~3 · yahoo 1.
- Performance (from recordings): LCP ~1.1s, CLS 0, page load ~1.4s — not a bounce cause.

**Conversions (smart events)**
- Download (brochure) 21 · ContactUs/WhatsApp 17 · OutboundClick 15 · SubmitForm 13 · Book 7.
- ~6-7% form-submit rate on cold paid traffic — funnel works. Thank-you pages reached
  (`/thank-you-visit` 92% scroll, `/thank-you-brochure` 83%).

**Engagement**
- PC: 562s session / 169s active / 2.12 pages. Mobile: 159s / 86s / 1.29 pages. Tablet: 143s / 1 page.
- PC far more engaged; mobile converts-or-leaves fast, rarely a 2nd page.

**Friction**
- 157 dead clicks · 12 rage clicks · 6 quick-backs · 0 excessive scrolls.
- Dead-click hotspots (by text): comparison headlines ("Same cheque, very different", "Just a little
  more than rent") and rent-calculator outputs (₹70,989, ₹16,000, "Rent you pay now"), plus pre-fix
  floor-plan/render "Enlarge" cards.

**Scroll heatmap (homepage)** — bimodal:
- Mobile: 0-25% 41.8% · 25-50% 12.7% · 50-75% 15.2% · 75-100% 30.4%.
- PC: 0-25% 42.1% · 25-50% 2.6% · 50-75% 9.2% · 75-100% 46.1%.
- Thin middle = corridor/podium/amenities/location under-consumed.

**Exits:** homepage 183/193 (134 https + 35 http + 14 www); sub-sites rarely the exit.

**Key correction logged this run:** floor-plan/render lightbox (#1) was already shipped in `b5fddeb`
**mid-window** (2026-06-23 10:35), so its dead clicks are pre-fix noise. The genuine open friction is
the **corridor affordance (#2)** and **calculator result tiles (#3)** — both verified scroll-only /
display-only in code. Rec to "make comparison numbers expandable" was mis-framed: the content is
already interactive.

_Caveat:_ because the gallery fix landed inside the window, 23-25 data blends pre/post-fix. A
24-25-only re-pull would give a clean read.
