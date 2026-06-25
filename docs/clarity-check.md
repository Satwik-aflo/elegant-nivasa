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
| **Date checked** | 2026-06-25 (run 2) |
| **Clarity data window** | 2026-06-23 → 2026-06-25 |
| **Git checkpoint (HEAD)** | `0585d9d` — _Updates to Comparision figures and site css_ |
| **Next run** | pull the window since 2026-06-25; diff against `git log 0585d9d..HEAD` |

---

## Rolling status — known issues

Status legend: ✅ Fixed · 🟡 Partial · 🔴 Open. "Evidence" = the commit or file that proves status.

| # | Issue (from behaviour) | Status | Evidence / where | Clarity signal |
|---|---|---|---|---|
| 1 | Floor-plan & render images not zoomable (dead "Enlarge" cards) | ✅ Fixed | `b5fddeb` (2026-06-23 10:35); `site.js` wires every `[data-gallery]` — both `fp-grid` & `g-grid` | Dead clicks on floor-plan/render **pre-fix only**; post-fix taps open lightbox |
| 2 | Corridor reads as clickable but is **scroll-only** | ✅ Fixed | `8f76c53` (2026-06-25, deployed) — `proto.js` pointer click/drag→scroll on `[data-corridor]` | Was: desktop clicks on corridor headlines (684/760 dead clicks) |
| 3 | Rent calculator **result tiles look like inputs** (display-only) | ✅ Fixed | `8f76c53` — `site.css` `cursor:default`+`user-select:none` on `.emi-result` / `.yl-val` / `.cr-val` | Was: dead clicks on ₹70,989 / ₹16,000 / yield ₹96.2L·₹14.4L |
| 4 | Hero doesn't front-load all proof | ✅ Fixed | `8f76c53` — full Scoreboard now sits on homepage after hero ribbon + "Compare" nav link | Targets the 42% top-quarter bounce (re-measure next run) |
| 5 | Scoreboard "Add it all up → ₹43.6L ahead" summary | ✅ Fixed | `0585d9d` (2026-06-25 15:18) — `Scoreboard.astro` + `comparison.ts` + `site.css` | Polish only; did **not** move dead-click friction (158, flat) |
| 6 | Meta/Instagram attribution collapsing into "Direct" | 🔴 Open (marketing-side) | Not a code task; IG link-in-bio already carries UTMs + `fbclid` (seen in recordings) | "Direct" 97 sessions vs ig/social ~3; in-app browser strips referrer |
| 7 | URL fragmentation across `http://` / `https://` / `www.` | 🔴 Open | No single canonical redirect confirmed (thank-you canonical only, `f902bf5`) | 35 `http://` + 14 `www.` homepage sessions split from canonical |
| 8 | Homepage → sub-site cross-sell barely used | 🔴 Open | `index.astro` confidence band (`#compare`) | "Already paying rent?" cross-sell: 4 mobile clicks; mobile 1.29 pages/session |

---

## Current prioritized fix list (as of 2026-06-25 run 2)

Ranked by behavioural impact. Already-shipped items (#1, #2, #3, #4, #5) excluded.

1. **Attribution: UTM every ad destination** (#6) — marketing-side; lean on `fbclid`/recordings to measure Meta.
2. **Enforce a single canonical** (`https://elegantnivasa.com/`) (#7) — stop URL/data fragmentation + redirect hop.
3. **Rethink the homepage→sub-site cross-sell** (#8) — elevate it or treat sub-sites as standalone ad landers.

**Deployed 2026-06-25 (`8f76c53`):** #2 corridor click/drag, #3 number de-affordance, #4 homepage
comparison table. Re-measure dead clicks + top-quarter bounce on the next run to confirm impact.
_(Location/connect section redesign is in a separate prototype — `prototype-location.astro` — NOT
deployed.)_

---

## Run log

### 2026-06-25 (run 2) — window 2026-06-23 → 06-25, checkpoint `0585d9d`

**Commits since last run (`1f2d608..0585d9d`):** `4da46b9` (clarity-check skill + ledger, docs only) ·
`0585d9d` (comparison figures + site css — shipped the previously-uncommitted scoreboard work).

**Status change:** issue **#5 → ✅ Fixed** (`0585d9d`): the "Add it all up → ₹43.6 lakh ahead"
heading, `.cr-val` value wrappers, and disclaimer-star cleanup. **Polish only** — it does not touch
the open affordance friction (#2, #3).

**Data (vs run 1 in parens):**
- Traffic: 207 sessions (193) · 171 users (159) · 311 page views (292) · avg scroll 47.7% (48.7%).
- Friction: dead clicks **158 (157)** · rage 12 (12) · quick-backs 6 (6) · excessive 0 — **flat**.
- Conversions: Download **25 (21)** · ContactUs 17 (17) · OutboundClick 15 (15) · SubmitForm **15 (13)** · Book 7 (7).
- Dead-click hotspots **unchanged**: corridor headlines ("Just a little more than rent" 760, "Same
  cheque, very different" 684) and display numbers (₹70,989, ₹16,000, "Rent you pay now" 304 each;
  rental-yield ₹96.2 L / ₹14.4 L / "on top of your ₹16,000 rent" 228 each).

**Read:** the comparison-figures commit did not change behaviour — friction is flat and the same
hotspots persist. The genuine open work is still the **corridor affordance (#2)** and the
**display-number affordance (#3)**, now confirmed to span the rental-yield earnings figures too.
No new issue classes; #3 scope extended to the rental-yield numbers.

_Note:_ `0585d9d` landed inside the window (15:18) but is CSS/figures polish, so no clean-window
re-pull is needed for it.

---

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
