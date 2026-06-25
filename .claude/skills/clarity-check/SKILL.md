---
name: clarity-check
description: Use when analyzing Microsoft Clarity analytics for the Elegant Nivasa site, reviewing user-behaviour/heatmap data, or producing a prioritized list of UX fixes from real visitor behaviour. Cross-references Clarity data against git history and the running ledger so already-shipped fixes are never re-recommended.
---

# Clarity Check

## Overview

A repeatable procedure for turning Microsoft Clarity behaviour data into a **prioritized, de-duplicated fix list** for the Elegant Nivasa site. The core discipline: **never recommend work that's already shipped.** Every candidate finding is checked against git history and the running ledger before it reaches the fix list.

The single source of truth is the ledger at **`docs/clarity-check.md`**. It records, for every run: when Clarity was last pulled, the git commit checkpoint it was checked against, what's already Fixed/Partial/Open, and the raw data snapshot. Always read it first; always update it last.

## When to use

- "Analyze the Clarity data", "pull the new Clarity data", "what are users doing on the site"
- "Give me a list of things to fix" based on analytics / heatmaps / session recordings
- Any recurring behaviour-analytics review for elegantnivasa.com

## Project specifics

- **Clarity project id:** `xah4dbk2kt` (in `web/src/config/site.ts`). MCP server `clarity` is already connected.
- **Site routes:** `/` (homepage, self-contained, loads `proto.css`/`proto.js` **and** `site.js`), `/cost` · `/handover` · `/rental-yield` (sub-sites, `SubSiteLayout`), `/thank-you-visit` · `/thank-you-brochure` (conversion pages).
- **Where behaviour lives in code (check here before claiming an issue is open):**
  | Behaviour | File(s) |
  |---|---|
  | Gallery + floor-plan lightbox | `web/public/assets/js/site.js` (wires every `[data-gallery]`) |
  | Corridor scroll animation | `web/src/pages/index.astro` (`[data-corridor]`) + `proto.js` |
  | Rent-vs-own / EMI calculator | `web/src/pages/index.astro` + `web/src/layouts/SubSiteLayout.astro` (`rnt-*`, `[data-calc]`) in `site.js` |
  | Comparison scoreboard / angle-leads | `web/src/data/comparison.ts`, `Scoreboard.astro`, `AngleLead{Cost,Handover,Yield}.astro` |
  | Hero | `index.astro` (`HERO_LEAD`, `HERO_IMG`) |
  | Conversion tracking (`track()`) | `site.js` + `AnalyticsScripts.astro` |
- **MCP tools:** `mcp__clarity__query-analytics-dashboard` (natural-language, one focused ask per call; always state a date range) and `mcp__clarity__list-session-recordings` (filter by date — required — device, rageClickPresent, entryUrls, etc.).

## Procedure

1. **Set the checkpoint.** Run `git -C "<repo>" log -1 --format="%h %ci %s"` and note today's date. This run's checkpoint = that commit hash.
2. **Read the ledger** (`docs/clarity-check.md`). Load the previous run's date, its commit checkpoint, and the rolling status table (Fixed / Partial / Open). This is what stops you re-recommending shipped work.
3. **Pull Clarity data** for the window since the last pull (default: last 3 days if unsure). Use the Standard query set below; fire independent queries in parallel. For friction, pull session recordings of the worst sessions (e.g. `rageClickPresent: true`, or mobile homepage sorted by `SessionClickCount_DESC`).
4. **Cross-reference before judging.** For each candidate finding:
   - Check `git log <lastCheckpoint>..HEAD` for a commit that addresses it.
   - Check the ledger's Fixed/Partial rows.
   - **Verify in the actual code** (grep the file map above) — don't trust the commit message alone.
   - Classify: **Fixed** · **Partial** (shipped but incomplete) · **Open** · **New**.
5. **Watch for mid-window fixes.** If a fix commit landed *inside* the data window, early data is pre-fix noise. Note it, and offer to re-pull the post-fix-only window for a clean read.
6. **Produce the prioritized fix list** — Open + New + the remaining half of Partial items only. Rank by behavioural impact (conversion-blocking > friction > polish), not by ease.
7. **Update the ledger** (`docs/clarity-check.md`): bump the "Last run" block (date + Clarity window + commit checkpoint), update the rolling status table (move shipped items to Fixed with their commit hash), and append a dated run-log entry with the raw snapshot. Commit only when the user asks.

## Standard query set

Run these (adjust the date range), each as its own `query-analytics-dashboard` call:

- Traffic: total sessions, unique users, page views, avg scroll depth — last N days
- Top pages by traffic + device-type breakdown
- Friction: dead clicks, rage clicks, quick backs, excessive scrolls (counts)
- Top clicked text/elements (overall, and per device for the homepage) — surfaces dead-click hotspots
- Channels / UTM source + medium / countries
- Smart events / conversions: Download, ContactUs, OutboundClick, SubmitForm, Book
- Engagement: avg session duration, active time, pages/session by device
- Scroll-depth bucket distribution (0-25/25-50/50-75/75-100) for the homepage, by device
- Exit pages

## Reading the data — known patterns for this site

- **Bimodal homepage scroll** (big 0-25% bucket + big 76-100% bucket, thin middle) = hero is the whole funnel; the rich middle sections are under-consumed. Front-load proof in the hero.
- **Dead clicks on text/numbers** usually mean an **affordance mismatch**, not "make it expandable." Trace the exact text to source: it's often the **corridor** (scroll-driven, but users click it) or the **calculator result tiles** (display-only `.b` tiles that look like inputs).
- **"Direct" traffic dominating** = Meta/Instagram in-app browsers stripping the referrer; the IG link-in-bio carries UTMs and `fbclid` (visible in recordings). Trust recordings over Clarity's channel label.
- **URL fragmentation** across `http://`, `https://`, `www.` splits the numbers and adds a redirect hop — flag if a single canonical isn't enforced.

## Common mistakes

- Recommending a fix that already shipped — **always** do step 4 (git + ledger + grep) first. This is the whole point of the ledger.
- Trusting a commit message without checking the code.
- Treating a mid-window fix's pre-fix dead clicks as a current problem.
- Mis-framing affordance bugs as "add a feature" (e.g. "make numbers expandable" when the calculator is already interactive and the real issue is tile affordance).
- Forgetting to update the ledger — then the next run repeats this work.

## Quick reference

| Step | Action |
|---|---|
| Checkpoint | `git log -1` hash + today's date |
| Load state | Read `docs/clarity-check.md` |
| Pull | Standard query set, parallel, date-bounded |
| De-dup | `git log <ckpt>..HEAD` + ledger + grep code → classify |
| Output | Prioritized Open/New/Partial-remainder list |
| Persist | Update ledger: status table + dated run-log entry |
