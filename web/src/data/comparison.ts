// Single source of truth for ALL Sub-site comparison content (ADR-0002).
// Owns content/figures only: the Scoreboard (3 Comparatives), per-Angle hero
// words+numbers, the bespoke angle-lead data, the WhatsApp message text, and
// the advantage maths. Rendered at BUILD TIME by Astro components. The .astro
// pages own hero layout + image; site.js owns behaviour only.
//
// The Nearby builder is ALWAYS unnamed (see CONTEXT.md).
// FIGURES MARKED * ARE PLACEHOLDERS — confirm with client before cutover
// (CLAUDE.md §7); editing any figure here updates every Sub-site at once.

/** Canonical Angle key — short form (public path /rental-yield maps to yield). */
export type Angle = "cost" | "handover" | "yield";

/** Thematic grouping inside the Scoreboard (CONTEXT.md: Comparative). */
export type Comparative = "cost" | "product" | "yield";

export type Verdict = "win" | "tie";

/** One Scoreboard point. */
export interface ScoreRow {
  comparative: Comparative;
  metric: string;
  sub: string;
  us: string;
  them: string;
  edge: string;
  v: Verdict;
}

export interface ComparativeMeta {
  /** "The Cost Comparative" */
  label: string;
  /** Short header tag, e.g. "What you pay". */
  kicker: string;
}

/* ========================================================================
   SCOREBOARD — the full cross-angle comparison shown on every Sub-site.
   Order is canonical: Cost → Product → Yield (Sheet 1).
   ======================================================================== */
export const COMPARATIVES: Record<Comparative, ComparativeMeta> = {
  cost: { label: "The Cost Comparative", kicker: "What you pay" },
  product: { label: "The Product Comparative", kicker: "What you get" },
  yield: { label: "The Yield Comparative", kicker: "What it returns" },
};

/** Render order of the Comparatives in the Scoreboard. */
export const COMPARATIVE_ORDER: Comparative[] = ["cost", "product", "yield"];

export const SCOREBOARD: ScoreRow[] = [
  // ── The Cost Comparative ──
  { comparative: "cost", metric: "Price / sft", sub: "Same Tellapur micro-market", us: "₹7,000*", them: "₹8,500*", edge: "₹1,500/sft* lighter", v: "win" },
  { comparative: "cost", metric: "Total cost · 1,375 sft", sub: "Like-for-like home", us: "₹96.25 L*", them: "₹1.17 Cr*", edge: "You keep ₹20.6 L*", v: "win" },
  // ── The Product Comparative ──
  { comparative: "product", metric: "Flats per acre", sub: "How dense it feels", us: "131", them: "178", edge: "26% less dense", v: "win" },
  { comparative: "product", metric: "Ceiling height", sub: "Floor to ceiling", us: "9.8 ft", them: "9.8 ft", edge: "Matched", v: "tie" },
  { comparative: "product", metric: "Car parks / home", sub: "Covered parking", us: "2.09", them: "1.86", edge: "13% more parking", v: "win" },
  { comparative: "product", metric: "Built-up ÷ saleable", sub: "Usable floor you pay for", us: "0.77", them: "0.70", edge: "7% more livable", v: "win" },
  { comparative: "product", metric: "Distance from ORR", sub: "To the expressway", us: "2.1 km", them: "1.9 km", edge: "+200 m · ~30 sec", v: "tie" },
  { comparative: "product", metric: "Corridor width", sub: "Shared corridors", us: "8–14 ft", them: "6–8 ft", edge: "Wider & brighter", v: "win" },
  // ── The Yield Comparative ──
  { comparative: "yield", metric: "Handover", sub: "Keys in your hand", us: "2027", them: "2031", edge: "4 years earlier", v: "win" },
  { comparative: "yield", metric: "Rent collected by 2032", sub: "You earn from 2028; they build", us: "₹16.8 L*", them: "₹0", edge: "₹16.8 L* ahead", v: "win" },
  { comparative: "yield", metric: "Resale /sft @ 2031", sub: "On a ₹7,000* entry vs ₹8,500*", us: "₹11,000*", them: "₹12,000*", edge: ">14% higher ROI", v: "win" },
];

/** Running tally derived from the Scoreboard — keeps the score honest. */
export const SCORE = {
  wins: SCOREBOARD.filter((r) => r.v === "win").length,
  ties: SCOREBOARD.filter((r) => r.v === "tie").length,
  behind: 0,
};

export const SCORE_NOTE =
  "Elegant Nivasa vs a new-launch branded builder · same micro-market · 2026 model";

/* ========================================================================
   ADVANTAGE MATHS — the total-advantage band under the Scoreboard.
   ======================================================================== */
export interface AdvCard {
  a: string;
  l: string;
  total?: boolean;
}
export const ADVANTAGE: AdvCard[] = [
  { a: "₹20.6L*", l: "Lower entry cost" },
  { a: "₹16.8L*", l: "Rent earned by 2032" },
  { a: "₹6.2L*", l: "Interest saved" },
  { a: "₹43.6L*", l: "Total advantage", total: true },
];
export const ADVANTAGE_TAGLINE = {
  lead: "Same cheque today.",
  rest: "A great deal more over time — plus >14% higher ROI.",
};

/* ========================================================================
   HERO — per-Angle words + numbers (the .astro page owns layout + image).
   ======================================================================== */
export interface HeroBadge {
  /** Corner: top-left or bottom-right. */
  pos: "tl" | "br";
  k: string;
  /** Value; may contain inline <small> markup. */
  v: string;
}
export interface HeroContent {
  eyebrow: string;
  /** Headline; may contain <br> and <em> markup. */
  headline: string;
  /** Lead paragraph; may contain inline <b>/<em> markup. */
  lead: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badges: [HeroBadge, HeroBadge];
}

/* ========================================================================
   ANGLE-LEAD — the bespoke block each Sub-site leads with (B2).
   Each Angle has a differently-shaped payload, rendered by its own component.
   ======================================================================== */
interface LeadHead {
  eyebrow: string;
  headline: string;
  sub: string;
}

export interface CostLead extends LeadHead {
  kind: "cost";
  them: { cap: string; amount: string; rate: string };
  us: { cap: string; amount: string; rate: string };
  saving: string;
}

export interface HandoverMilestone {
  year: string;
  label: string;
  hot?: boolean;
}
export interface HandoverTrack {
  who: "us" | "them";
  label: string;
  milestones: HandoverMilestone[];
}
export interface HandoverLead extends LeadHead {
  kind: "handover";
  tracks: [HandoverTrack, HandoverTrack];
  gap: string;
}

export interface YieldStep {
  year: string;
  amount: string;
  /** Bar length as a % of the 2032 total — drives the horizontal bar graph. */
  pct: number;
}
export interface YieldLead extends LeadHead {
  kind: "yield";
  steps: YieldStep[];
  total: string;
  themNote: string;
}

export type AngleLead = CostLead | HandoverLead | YieldLead;

export interface AngleContent {
  angle: Angle;
  hero: HeroContent;
  lead: AngleLead;
  /** Pre-filled WhatsApp message; {rep} interpolated at runtime by site.js. */
  waMessage: string;
}

const THEM = "a comparable new launch nearby";

export const ANGLES: Record<Angle, AngleContent> = {
  cost: {
    angle: "cost",
    hero: {
      eyebrow: "The cost question · Tellapur, West Hyderabad",
      headline: "Save <em>₹20.6 lakh*</em><br>on the same Tellapur home.",
      lead: "Same 1,375 sft 3 BHK, same ORR corridor. Branded launches near the Financial District ask around <b>₹1.17 crore*</b> (₹8,500/sft*). At Elegant Nivasa, Tellapur it’s about <b>₹96 lakh*</b> (₹6,999/sft*) — you pocket <b>₹20.6 lakh*</b>.",
      ctaPrimary: "Get the price sheet",
      ctaSecondary: "See the difference",
      badges: [
        { pos: "tl", k: "Starting", v: '₹6,999<small style="font-size:.9rem">/sft*</small>' },
        { pos: "br", k: "You could save", v: "₹20.6 L*" },
      ],
    },
    lead: {
      kind: "cost",
      eyebrow: "The cost, side by side",
      headline: "Same home. Two very different cheques.",
      sub: `For an identical 1,375 sft on the same side of Tellapur, ${THEM} writes a materially heavier cheque. Here is what each one actually costs.`,
      them: { cap: THEM, amount: "₹1.17 Cr*", rate: "₹8,500*/sft · 1,375 sft" },
      us: { cap: "Elegant Nivasa", amount: "₹96.25 L*", rate: "₹7,000*/sft · 1,375 sft" },
      saving: "₹20.6 L*",
    },
    waMessage:
      "Hi {rep}, I saw the Elegant Nivasa cost comparison at Tellapur — can you send the best price for a 3 BHK and current availability?",
  },

  handover: {
    angle: "handover",
    hero: {
      eyebrow: "The possession question · Tellapur, West Hyderabad",
      headline: "Your keys in 2027.<br>Theirs in <em>2031</em>.",
      lead: "Branded launches near the Financial District are still sold off a brochure, with RERA possession around <b>2031</b>. Elegant Nivasa is already <b>78% built</b> and hands over <b>June 2027</b> — your keys, and your rent, a full four years sooner.",
      ctaPrimary: "Book a site visit",
      ctaSecondary: "See the timeline",
      badges: [
        { pos: "tl", k: "Possession", v: "Jun 2027" },
        { pos: "br", k: "Structure complete", v: "78%" },
      ],
    },
    lead: {
      kind: "handover",
      eyebrow: "One timeline, two outcomes",
      headline: "One asset is nearly ready. One hasn't started.",
      sub: `Elegant Nivasa is 78% structure-complete and hands over in 2027. ${THEM} is a fresh launch — keys, and rent, arrive years later.`,
      tracks: [
        {
          who: "us",
          label: "Elegant Nivasa",
          milestones: [
            { year: "Now", label: "78% structure complete" },
            { year: "2027", label: "Possession", hot: true },
            { year: "2028", label: "Rent begins" },
          ],
        },
        {
          who: "them",
          label: THEM,
          milestones: [
            { year: "Now", label: "New launch · groundwork" },
            { year: "2031", label: "Possession" },
            { year: "2032", label: "Rent begins" },
          ],
        },
      ],
      gap: "≈4 years of earlier possession",
    },
    waMessage:
      "Hi {rep}, I'm interested in Elegant Nivasa, Tellapur (June 2027 possession) — can you share price, availability and a site-visit slot?",
  },

  yield: {
    angle: "yield",
    hero: {
      eyebrow: "The rental-yield question · Tellapur, West Hyderabad",
      headline: "Collect <em>₹16.8 lakh*</em> rent<br>while they’re still building.",
      lead: "Possession in 2027 puts your Tellapur 3 BHK on rent from <b>2028</b> — to the IT crowd from Gachibowli and the Financial District. By 2032 that’s <b>₹16.8 lakh*</b> in your account. A still-under-construction branded launch has collected <b>₹0</b>.",
      ctaPrimary: "Start earning sooner",
      ctaSecondary: "See the yield timeline",
      badges: [
        { pos: "tl", k: "Rent starts", v: "2028" },
        { pos: "br", k: "Income you’d miss", v: "₹16.8 L*" },
      ],
    },
    lead: {
      kind: "yield",
      eyebrow: "The earnings build-up",
      headline: "Rent collected, year after year — while they build.",
      sub: `Possession in 2027 means rent from 2028. By 2032 that’s a potential ₹16.8 lakh* in the bank — money ${THEM} simply can’t collect yet.`,
      steps: [
        { year: "2028", amount: "₹3.4 L*", pct: 20 },
        { year: "2029", amount: "₹6.7 L*", pct: 40 },
        { year: "2030", amount: "₹10.1 L*", pct: 60 },
        { year: "2031", amount: "₹13.4 L*", pct: 80 },
        { year: "2032", amount: "₹16.8 L*", pct: 100 },
      ],
      total: "₹16.8 L*",
      themNote: `By 2032, ${THEM} is only just handing over — ₹0 collected so far.`,
    },
    waMessage:
      "Hi {rep}, I'm looking at Elegant Nivasa, Tellapur for rental yield — can you share pricing and the expected rentals/possession?",
  },
};

export const ANGLE_KEYS = Object.keys(ANGLES) as Angle[];
