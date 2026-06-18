# Elegant Nivasa — Website Project

Working notes for rebuilding **elegantnivasa.com** as a set of high-fidelity, conversion-focused
landing pages. This file is the single source of truth for project facts, brand, and the campaign
logic the three landing-page variations are built on. Keep it updated as decisions are made.

> ⚠️ **Verify before publishing.** Numbers and dates below are pulled from the brochure (May 2025)
> and the "Cost of Waiting" ad deck. Prices, possession dates, and the competitor comparison are
> marketing figures — confirm with the client before they go live on a public page (RERA/ASCI
> compliance).

---

## 1. What we're building

A redesign of the Elegant Nivasa marketing site, delivered as **three landing-page variations** that
share **one design system and one component library**. Each variation is the destination for a
different ad set — the hero, headline, and section order change per page; the underlying components
do not.

Deliverable sequence:
1. **High-fidelity interactive mockup** (this repo) → for client approval.
2. Push to **claude.ai/design** (via the DesignSync tool) for browsable review/sign-off.
3. **Live build** after approval.

Must-have features (present on every variation):
- **Lead-capture form** → in live build, store to a **database + trigger WhatsApp/SMS** to sales
  (speed-to-lead). Mockup simulates submit + validation.
- **EMI calculator** → anchored to project pricing (see §5).
- Render gallery, floor-plan explorer, amenities, location/connectivity, project highlights,
  RERA/legal footer.

---

## 2. The three landing-page variations (ad sets)

All three derive from the **"Cost of Waiting"** deck (`Nivasa Waiting Cost_For CP.pdf`). They are
three facets of one argument; each page leads with its facet, then can cross-sell the others.

| # | Ad Set | Angle | Hero leads with | Key number |
|---|--------|-------|-----------------|-----------|
| 01 | **Focus on Cost** | Same location, same SFT — lower price | "Same Kollur. Lower Cheque." | **₹34.4L** less than other premium builders |

> **Decided:** the competitor comparison appears **unnamed** ("other premium builders / comparable
> projects") — never naming a specific developer (ASCI safety). The ₹34.4L value story stays.
| 02 | **Focus on Lost Rental Yield** | The cost of *not* buying now | "Cashflow starts with possession." | **₹19.2L** rental income missed by waiting |
| 03 | **Focus on Handover** | Earlier possession = earlier returns | "When does the asset start working?" | Possession **June 2027** (78.19% structure complete) |

Shared closing argument (good as a sticky band / final CTA on all three):
**₹34.4L (lower entry) + ₹19.2L (avoided waiting cost) + ₹6.2L (interest saved) = ₹59.8L total
advantage** → *"Lower outlay today. More value over time."* / *"Nivasa. Start early. Stay ahead."*

### Campaign economics (from the ad deck)
- Nivasa price: **₹6,999/sft** → 1,375 sft ≈ **₹96.2L**.
- Branded builders (highest case): **₹9,499/sft** → same 1,375 sft ≈ **₹1.3 Cr**.
- Difference: **₹34.4L** on the same size, same side of Hyderabad.
- Possession: **Nivasa June 2027** vs **branded builders 2031**. Rent starts **2028 vs 2032**.
- "Cost of waiting" headline figure: **~₹60L** (buying earlier vs later).

### Campaign tone & taglines
"The Cost of Waiting." · "Same Tellapur. Lower Cheque." · "Cashflow starts with possession." ·
"Earlier possession. Earlier productivity." · "Pay Less. Earn Earlier. Save More." ·
"Pay less today and start earlier — or pay more and wait longer?"

### Sales-redirect comparison build (current — supersedes the section order above)
> These three pages are now built as a lean **sales re-direct** (not the full marketing site).
> Below the (unchanged) hero, each page is driven by **Sheet 1 of `Nivasa vs New Launch Branded
> Builder 2026.xlsx`**. Render gallery, floor-plan explorer, amenities and location are **stripped**;
> EMI calculator and lead form are **kept**.

**Page structure (all three):** Hero (per-variant) → **full comparison scoreboard with 3 section
breaks** → **grouped deep-dives** (same 3 groups) → EMI → lead form.

**Decided: on-page comparison uses Sheet 1's figures, not the ad-deck's.** The competitor is the
sheet's **₹8,500/sft** (not ₹9,499), so the cost delta on the page is **₹20.6 L** (1,375 sft:
₹96.25 L vs ₹1.169 Cr), and the advantage stack is **₹20.6 L + ₹16.8 L + ₹6.2 L = ₹43.6 L**
(was ₹20.6 + 19.2 + 6.2 = ₹46 before the Jun-2026 sheet update; ad-deck original ₹59.8 L).
Cost-page hero/meta show ₹20.6 L; yield-page hero/meta updated ₹19.2 L → **₹16.8 L** to match.

**Sheet 1 is now 3 labelled "comparatives" (the table breaks), 11 points total** — drives both the
scoreboard section dividers and the deep-dive groups:
- **The Cost Comparative** — 1 Price/sft ₹7,000 vs ₹8,500 · 2 Total cost (1,375 sft) ₹96.25 L vs ₹1.17 Cr.
- **The Product Comparative** — Flats/acre 131 vs 178 (26% less dense) · Ceiling 9.8 ft = 9.8 ft (tie) ·
  Car parks/home 2.09 vs 1.86 · Built-up÷saleable 0.77 vs 0.70 · Distance from ORR 2.1 km vs 1.9 km
  (**only near-tie — branded ~200 m closer; framed honestly**) · Corridor 8–14 ft vs 6–8 ft.
- **The Yield Comparative** — Handover 2027 vs 2031 · **Rent collected by 2032 ₹16.8 L vs ₹0** ·
  **Resale /sft @ 2031 ₹11,000 vs ₹12,000 → >14% higher ROI** (Nivasa's lower ₹7,000 entry vs ₹8,500
  drives the ROI; shown with that context so the "win" reads correctly).

**Tally: 9 ahead · 2 even · 0 behind.** Each variant floats its own group first in the deep-dives:
Cost→The Cost Comparative; Yield & Handover→The Yield Comparative (Yield highlights *Rent collected
by 2032*, Handover highlights *Handover*). Data + render live in `site/assets/js/site.js`
(`CMP`, `GROUP_SEQ`, `GROUPS`, `GROUP_ORDER`, `HILITE`); styles under "COMPARISON SCOREBOARD"
(incl. `.cmp-break`) / "GROUPED DEEP-DIVES" in `site.css`.

**Strategy note (from Sheet 2 "Distribution"):** *publicly "we are same", privately "we are better"* —
the scoreboard is the reveal. Competitor stays **unnamed** ("new-launch branded builder").

**Calculator = two tabs (replaces the single EMI tool).** (1) **"What can I afford?"** — income
+ optional co-applicant (checkbox reveals a field) + existing EMIs, with a **40–50% FOIR** slider →
eligible loan, total budget, serviceable EMI, affordable sft, and a ✓/✗ list of which Nivasa configs
fit (e.g. ₹2 L/mo → up to a 3 BHK 1,845 sft). (2) **"Already paying rent?"** — rent + a home + a
**10–20% down-payment** slider → the *top-up over your rent* to own (e.g. ₹45 k rent → ~₹26 k more
for a ₹96.2 L asset), with the "zero-equity rent vs owning" message. Logic in `site.js` under
`[data-calc]` (`calcAfford` / `calcRent`, reverse-EMI `loanFromEmi`); styles under the EMI block.

**Enquire section = "direct to a closer" (no middleman).** Replaces the generic form with two
**senior sales leads — Bharat & Satish** — each a card with closing stats and a **one-tap WhatsApp**
button (page-aware prefilled message via `[data-wa]`/`[data-rep]` in `site.js`), an "online now ·
fast reply" urgency cue, and a slim "drop your number, Bharat texts you himself" fallback capture
(keeps the lead-capture must-have, still framed as direct). ⚠️ **Names are real; the sales stats
(₹41/₹33 Cr, 34/28 homes, etc.) and the WhatsApp/phone numbers (`910000000000`) are PLACEHOLDERS —
confirm/replace before publishing** (ASCI + real-person accuracy).

**Repo:** private GitHub `Satwik-aflo/elegant-nivasa` (created 2026-06-18).

---

## 3. Project facts (from brochure, May 2025)

- **Project:** Elegant Nivasa — *"High Rise Lifestyle at Kollur"*
- **Developer:** E-Infra (*"Foundation on Values"*)
- **RERA:** TS RERA **P01100007243** · **HMDA & RERA approved**
- **Location:** **Kollur**, west Hyderabad (near ORR). *(Decided: site uses **Kollur** as the
  primary locality — matches brochure / RERA positioning. The ad deck's "Tellapur" wording is the
  adjacent locality; may still appear in ad-matched copy but Kollur is canonical on-site.)*
- **Scale:** 3 towers (Blocks A, B, C) · **23 floors each** · **526 apartments** · **4-acre** gated community
- **Configs:** 2 & 3 BHK · **1,375 – 2,205 sft** (super built-up)
- **Facing:** East, West & North-facing units · 100% Vastu
- **Parking:** 5-level (2 cellar + 3 podium) · EV charging provision (extra cost)
- **Build:** RCC framed, earthquake-resistant, premium construction, no common walls
- **Campaign spine:** the **"YOU"** brand campaign ("you are the reason / inspiration / future /
  celebration", "a home for the achiever in YOU", etc.).

### Unit types (floor plans)
| Type | Config | Super built-up | Built-up | Facing | Blocks |
|------|--------|---------------|----------|--------|--------|
| 1 | 3 BHK | 1,700 sft | 1,307 sft | East | A (5–8), B (4–6) |
| 2 | 3 BHK | 1,375 sft | 1,057 sft | West | A (1), B (1–3) |
| 3 | 3 BHK | 2,205 sft | 1,696 sft | West | A (2–4) |
| 4 | 3 BHK | 1,845 sft | 1,419 sft | West | C (2 & 9) |
| 5 | 2 BHK | 1,375 sft | 1,057 sft | North | C (3–7) |
| 6 | 3 BHK | 1,845 sft | 1,419 sft | East | C (1 & 8) |

### Location / connectivity (drive times from site)
Radial Road No. 7 — 1 min · Meru International School — 2 min · ORR Exit No. 2 — 3 min ·
Samasthi Intl School — 4 min · Narayana Junior College — 10 min · Glendale Intl School — 12 min ·
Nalagandla / Birla Open Minds — 15 min · Lingampalli Railway Station — 20 min · Neopolis — 28 min.
SEZs: Kokapet SEZ, Neopolis IT SEZ via ORR.

### Project highlights (stat band content)
4-acre gated community · 3 towers · 23 floors each · 526 (2 & 3 BHK) apartments · 5-level parking ·
100% Vastu · no common walls · 24-hr security + CC cameras · 24-hr water · 100% power backup ·
designer landscaping · EV charging provision · car wash area · service lifts.

### Amenities
- **Club @ Nivasa — 5-level exclusive clubhouse:** crossfit arena, badminton & squash courts,
  terrace swimming pool (men/women/kids), business lounge + work stations + board/conference room,
  crèche, reception lounge, meditation/yoga/aerobics rooms, gym (cardio + weights), multi-purpose
  banquet hall, spa & salon, guest rooms, library, indoor games (TT/carrom/chess/snooker),
  ATM, restaurant/coffee shop, supermarket provision.
- **Outdoors:** parks & play areas, jogging/cycling track, tennis court, cricket net,
  half-basketball court, outdoor gym, senior-citizen seating, skating rink, amphitheatre,
  gazebo, water features.

### Specifications (highlights)
RCC earthquake-resistant structure · 800×800 double-charged vitrified tiles (living/bedrooms/kitchen) ·
uPVC windows w/ mosquito mesh · premium CP fittings (Grohe/Jaquar), Hindware sanitaryware ·
Legrand/Schneider modular switches · 3-phase supply + individual prepaid meters · piped gas (LPG/PNG) ·
100% DG backup · high-speed Schindler/Mitsubishi lifts · WTP + STP + rainwater harvesting ·
fire hydrant + sprinkler + alarm on all floors · access ramps for differently-abled · automated
billing for water/power/gas.

---

## 4. Brand & design system

Two related palettes exist. Reconcile intentionally:

- **Brochure / corporate brand:** deep navy `#1a2456` (logo wordmark) + **orange/red logo peaks**
  `~#e8511f` + warm cream/sand `~#ece6d8` backgrounds + sunset-sky photography. Premium, calm,
  aspirational. Big confident type, generous whitespace.
- **"Cost of Waiting" campaign:** deep **teal/green** `~#0f6b5f` + charcoal/near-black headlines +
  off-white cream `~#f5f2ec`. Used for the value/finance message (charts, comparisons, big numbers).

**Recommendation:** navy + cream + orange-peak accent as the base brand system; use the campaign
**teal** as the accent for finance/value modules (EMI calculator, cost-comparison, "cost of waiting"
band) so the data story reads as one coherent layer across all three pages. Confirm with client.

- **Logo:** "ELEGANT NIVASA" wordmark with three orange roof-peak marks over the A's; bracket motif
  above "ELEGANT". Developer co-brand: **E-Infra** logo.
- **Type direction:** strong geometric/grotesque sans for headlines (matches brochure & deck);
  clean humanist sans for body. (Pick exact families in design doc.)
- **Voice:** second-person "YOU", confident, benefit-led, numbers-forward for the campaign pages.

---

## 5. EMI calculator pricing

Client chose **fixed price per unit type**. Base rate from the campaign is **₹6,999/sft** (starting).
Derived indicative all-in prices (super built-up × ₹6,999) — **placeholder, confirm before launch**:

| Config | Super built-up | Indicative price @ ₹6,999/sft |
|--------|---------------|-------------------------------|
| 2 BHK / 3 BHK | 1,375 sft | ~₹96.2L |
| 3 BHK | 1,700 sft | ~₹1.19 Cr |
| 3 BHK | 1,845 sft | ~₹1.29 Cr |
| 3 BHK | 2,205 sft | ~₹1.54 Cr |

> ⚠️ **OPEN:** confirm whether the live calculator uses a flat ₹6,999/sft or true per-type prices
> (floor-rise / facing premiums may apply). EMI defaults: editable down-payment %, interest rate
> (~8.5% default), tenure (20 yr default).

---

## 6. Assets in this repo

- `Brochure.pdf` — current 23-page brochure (brand, renders, floor plans, amenities, specs).
- `Nivasa Waiting Cost_For CP.pdf` — 6-page "Cost of Waiting" ad deck (campaign source for the 3 pages).
- `Nivasa vs New Launch Branded Builder 2026.xlsx` — competitor cost-comparison model (source of ₹/sft figures).
- `Renders/` — project 3D renders (`1.jpg`–`21.png`), Nivasa logo, E-Infra logos, 3D-render video link PDF.
- `Floor Plans/` — 6 floor-plan images (Types 1–6).
- `ProjectComparisionPicture/` — 4 finished campaign creatives used in the ad deck.

---

## 7. Open questions / to confirm with client

1. ~~Canonical locality wording~~ → **Decided: Kollur.**
2. Final pricing for the EMI calculator (flat ₹/sft vs per-type, premiums).
3. Exact lead-form fields + WhatsApp/CRM destination for live build.
4. ~~Competitor comparison naming~~ → **Decided: unnamed ("other premium builders").**
5. Possession date wording (June 2027) and the 78.19% "structure complete" figure — keep updated.
6. Domain / hosting / analytics + ad-tracking (per-variation UTM routing) for the live build.
