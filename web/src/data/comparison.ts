// Static, curated comparison content for the three Sub-sites.
// The Nearby builder is ALWAYS unnamed (ASCI — see CONTEXT.md / ADR not needed).
// FIGURES ARE PLACEHOLDERS — confirm with client before cutover (CLAUDE.md §7).

export type Angle = "cost" | "handover" | "rental-yield";

export interface CompRow {
  metric: string;
  us: string;
  them: string;
  edge: string;
}

export interface AngleContent {
  slug: Angle;
  eyebrow: string;
  headline: string;
  sub: string;
  rows: CompRow[];
  /** Pre-filled WhatsApp message (rep name interpolated as {rep}). */
  waMessage: string;
}

const THEM = "a comparable new launch nearby";

export const COMPARISON: Record<Angle, AngleContent> = {
  cost: {
    slug: "cost",
    eyebrow: "The cost comparison",
    headline: "Same Tellapur. Lower cheque.",
    sub: `For the same home size on the same side of Hyderabad, ${THEM} asks materially more.`,
    rows: [
      { metric: "Price / sft", us: "₹7,000", them: "₹8,500", edge: "₹1,500/sft lighter" },
      { metric: "Total cost · 1,375 sft", us: "₹96.25 L", them: "₹1.17 Cr", edge: "You keep ₹20.6 L" },
      { metric: "Booking amount", us: "Lower entry", them: "Higher entry", edge: "Less upfront" },
    ],
    waMessage:
      "Hi {rep}, I was comparing Elegant Nivasa on price vs other projects in Tellapur — can you share the best quote and current availability?",
  },

  handover: {
    slug: "handover",
    eyebrow: "The handover comparison",
    headline: "When does the asset start working?",
    sub: `Elegant Nivasa hands over years before ${THEM} — your returns start sooner.`,
    rows: [
      { metric: "Possession", us: "2027", them: "2031", edge: "≈4 years earlier" },
      { metric: "Rent starts", us: "2028", them: "2032", edge: "Earlier cashflow" },
      { metric: "Construction status", us: "Advanced", them: "New launch", edge: "Lower delay risk" },
    ],
    waMessage:
      "Hi {rep}, I'm interested in Elegant Nivasa, Tellapur (2027 possession) — can you share price, availability and a site-visit slot?",
  },

  "rental-yield": {
    slug: "rental-yield",
    eyebrow: "The rental-yield comparison",
    headline: "Cashflow starts with possession.",
    sub: `Because Elegant Nivasa is ready sooner, rent is collected while ${THEM} is still building.`,
    rows: [
      { metric: "Rent collected by 2032", us: "₹16.8 L", them: "₹0", edge: "₹16.8 L ahead" },
      { metric: "Entry price / sft", us: "₹7,000", them: "₹8,500", edge: "Higher yield base" },
      { metric: "Years of earning", us: "4+ extra", them: "—", edge: "Earlier returns" },
    ],
    waMessage:
      "Hi {rep}, I'm looking at Elegant Nivasa, Tellapur for rental yield — can you share pricing and expected rentals/possession?",
  },
};

export const ANGLES = Object.keys(COMPARISON) as Angle[];
