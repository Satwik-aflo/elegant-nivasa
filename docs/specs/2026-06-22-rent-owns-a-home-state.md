# Rent-vs-own calc — "Your rent already owns a home" state

**Date:** 2026-06-22 · **Status:** approved, ready to implement
**Scope:** homepage (`index.astro`) + all three sub-sites (`SubSiteLayout.astro`),
driven by the shared `public/assets/js/site.js`. All `.emi*` styles live in
`public/assets/css/site.css` (loaded by both the homepage and the sub-sites; `proto.css`
has none), so the new `.emi--owns` styles go there — one file covers every route.

## Problem

The rent-vs-own tab currently has only one presentation: "Just a little more than
rent" + a ₹X/mo **top-up** figure, driven by the dropdown-selected unit. When the
entered rent is *already* enough to cover a config's full EMI, the code only swaps the
message string (`top <= 0` branch in `calcRent()`) — the header still reads "Just a
little more than rent" and the hero number shows ₹0, which is confusing and buries the
single most persuasive sales moment: **the visitor already pays enough to own a home
here.**

## Goal

Add a distinct second state to the rent result panel that fires when the rent covers at
least one apartment configuration, surfacing **the largest config their rent fully
covers** in a celebratory, self-consistent layout.

## Detection

In `calcRent()` (`site.js`), using the current Down-payment / Rate / Tenure slider
values, compute the EMI for **every** config in `UNITS`:

```
emi(unit) = emiOf(priceOf(unit.area) * (1 - dp), rate, tenure)
```

`covered` = the config with the **largest price** (≡ largest area, since
`price = area * RATE`) whose `emi(unit) <= rent`. If none qualify, `covered` is null.

This drives a two-way switch on the result panel:

- **`covered === null` → State A (top-up).**
- **`covered` exists → State B (owns-a-home).**

## State A — Top-up (existing, unchanged)

Current behaviour, driven by the **dropdown-selected** unit: "Just a little more than
rent" header, `₹X/mo more` hero, breakdown grid (EMI / rent / down payment / asset),
and the existing message. No change beyond now being gated on `covered === null`.

## State B — Owns-a-home (new)

The entire result panel re-renders around `covered` (not the prior dropdown pick) and
gains a distinct accent via a `.emi--owns` class on the `.emi-result` container.

- **Header (`.k`):** "Your rent already buys a home"
- **Hero (`#rnt-topup` / `.emi-big`):** the config unlocked, e.g. **"3 BHK · 1,845 sft"**
  (from `covered.name` / `covered.area`), with subline "your rent already covers this —
  **₹0 more**".
- **Secondary line:** "**₹{surplus}/mo to spare** after the EMI", where
  `surplus = rent - emi(covered)`. If `surplus` rounds to ₹0, omit the "to spare"
  phrasing (show just the ₹0-more framing).
- **Breakdown grid (`#rnt-emi`, `#rnt-rent2`, `#rnt-dpamt`, `#rnt-equity`):** all reflect
  `covered` — its EMI, the entered rent, its down-payment amount, its asset value.
- **Message (`#rnt-msg`):** reinforced, e.g. "Your {rent} rent already covers the full
  EMI on this home. You're paying for a home every month — it just isn't yours."

## Dropdown sync

When State B is active, set the "home you'd own" dropdown (`#rnt-unit`) to `covered` so
the dropdown, headline, and breakdown all agree. The user can still pick a **bigger**,
uncovered config, which recomputes `covered` (now possibly a smaller config, or still
the same) — the panel stays in whichever state the detection yields.

Note: areas 1,375 and 1,845 each appear twice in `UNITS`. Since price/EMI are identical
per area, the math is unaffected; `covered` is resolved to a specific unit object and its
own `name` is surfaced. Setting `#rnt-unit.value` by area selects the first option of
that area — acceptable, as both share identical figures.

## Edge cases

- **Rent covers all configs:** `covered` = the 2,205 sft Type 3; large surplus.
- **Rent covers none:** State A, unchanged.
- **Exact match (rent === EMI):** `<=` means covered; surplus ₹0 → omit "to spare".
- **Rent = 0 / blank:** already clamped to 0 by `num()`; no config covered → State A.

## Out of scope

- No change to the affordability tab.
- No new inputs; reuses existing rent / DP / rate / tenure controls.
- No backend/analytics changes.

## Verification

- `npx astro check` → 0/0/0.
- `node --check public/assets/js/site.js`.
- Manual: on the live-ish dev server, set rent above/below config EMIs and confirm the
  state flips, the dropdown syncs, surplus math is right, and the ₹0-surplus edge omits
  "to spare". Check homepage and one sub-site.
