# Google Ads conversion tracking

> **SUPERSEDED 2026-06-24.** The in-code gtag.js approach described below was replaced by a
> **split architecture**: Meta Pixel + Clarity stay hardcoded, while **Google Ads conversions
> move to the marketing-owned GTM container `GTM-5FCBHXLJ`**. `track()` now pushes events to the
> `dataLayer` and GTM fires the conversions off Custom-Event triggers. The `googleAdsId` /
> `googleAdsLabels` config and the in-code gtag block were removed. Kept for history /
> rationale. See CLAUDE.md §5.

_Spec — 2026-06-23. For the Kollur/Tellapur Google Search competitor-conquest campaign
(see `ElegantNivasa_Competitor_MediaPlan_Jun2026.xlsx`). Closes the loop between ad spend
and leads so Google can report CPL and optimise bidding._

## Goal

Fire a Google Ads **conversion** when a visitor converts, so the conquest campaign is
measurable (CPL in the Ads dashboard) and Google can steer budget toward keywords that
convert. This is **distinct from Microsoft Clarity** (behaviour/heatmaps, no link to Ads).

**Scope: Basic conversion tag only.** No PII sent in the conversion ping. Enhanced
conversions (hashed email/phone) and offline quality-lead import are explicitly **out of
scope** — the config is shaped so they can be added later without rework.

## What counts as a conversion

Three distinct conversion actions, each its own Google Ads label:

| Event (already fires today) | Google conversion | Intended Ads status |
| --- | --- | --- |
| `lead_submit` (book-a-visit form) | `labels.lead` | **Primary** (bid target) |
| `whatsapp_click` (sub-site Enquiry) | `labels.whatsapp` | **Primary** (bid target) |
| `brochure_request` (brochure email) | `labels.brochure` | Secondary (observe-only) |

Primary/Secondary is set **in the Google Ads UI per conversion action, not in code** — so
the code is identical regardless and needs no redeploy if the choice changes.

## Design

Slots into the two places that already handle Clarity + Meta Pixel. No new patterns.
`site.js` / `proto.js` are **not touched** — all three events already fire; we only add a
listener.

**1. Config — `web/src/config/site.ts`**, add to `site.analytics`:

```ts
googleAdsId: "",                                            // "AW-XXXXXXXXX" — empty = off
googleAdsLabels: { lead: "", whatsapp: "", brochure: "" },  // per-conversion-action labels
```

Empty `googleAdsId` disables everything (same safety model as `metaPixelId`) → ships
dormant, dev stays clean until real IDs are pasted.

**2. Snippet loader — `web/src/components/AnalyticsScripts.astro`**: one new conditional
block. When `googleAdsId` is set, inject `gtag.js` + `gtag('config', googleAdsId)`. This
also enables Google **auto-tagging** (captures `gclid` from ad clicks automatically) — the
mechanism that attributes a conversion to the exact keyword. Mirrors the existing
`is:inline define:vars` Clarity/Meta blocks; exposes `window.gtag`.

**3. Event layer — `web/src/lib/analytics.ts`**: add a Google destination inside the
existing `track()`. Import the IDs from `site.config` (public values, fine in the client
bundle). Map each event to `gtag('event', 'conversion', { send_to: '<AW-id>/<label>' })`.
Guard on `googleAdsId` + the relevant label being set and `window.gtag` existing.

## Data flow

ad click (`gclid` in URL) → visitor submits → `site.js` calls `window.track("lead_submit")`
→ `track()` fans out to Clarity, Meta, **and now the gtag conversion** → Google attributes
it to the keyword/ad group.

## Outside the code (client / Ads operator)

1. Create 3 conversion actions in Google Ads: Lead, WhatsApp Enquiry, Brochure.
2. Mark **Lead + WhatsApp = Primary**, Brochure = Secondary.
3. Paste the conversion ID (`AW-…`) + the 3 labels into `site.analytics`.

Until step 3, the tag is inert (same as the Meta Pixel today).

## Testing / verification

- `npx astro check` → 0/0/0.
- `npm run build` → green.
- With a test `googleAdsId` set: load a page, confirm `gtag.js` loads and a conversion hit
  fires on form submit (Network tab / Google Tag Assistant).
- Post-deploy: confirm in Google Ads → Conversions diagnostics that hits are recording.

## Notes (no scope change)

- **DPDP:** Basic mode sends no PII, but `gtag` still sets cookies pre-consent — the same
  deferred consent item as Clarity/Meta (CLAUDE.md §8). This campaign is the "before scaling
  ad spend" trigger; revisit the banner alongside go-live.
- **Future, no rework:** enhanced conversions and offline quality-lead (GCLID) import layer
  onto this same config shape.
