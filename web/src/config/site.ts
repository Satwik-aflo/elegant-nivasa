// Central site config. Values marked STUB must be replaced before cutover
// (see CLAUDE.md §7 — open items).

export const site = {
  name: "Elegant Nivasa",
  developer: "E-Infra",
  locality: "Tellapur",
  city: "Hyderabad",
  // Canonical/OG absolute-URL base. Domain cutover DONE 2026-06-22: elegantnivasa.com
  // is now a Cloudflare zone with the apex + www attached as Worker custom domains;
  // WordPress retired. OG/canonical resolve against the live branded domain.
  url: "https://elegantnivasa.com",
  rera: "P01100007243",
  startingPrice: "₹96.2 L",
  leadEmailTo: "sales@e-infra.in",
  // Resend "from" address. PROD: elegantnivasa.com is a verified Resend sending
  // domain (DNS records added in Hostinger, verified 2026-06-21), so we send as
  // a branded sender below — delivers to ANY recipient (no resend.dev test-mode
  // limits). Requires the prod RESEND_API_KEY secret to be set (CLAUDE.md §7).
  mailFrom: "Elegant Nivasa <leads@elegantnivasa.com>",

  // Two Sales reps — each sub-site shows BOTH as cards (one rep per card),
  // not a single round-robin button (decision 2026-06-20; see CLAUDE.md §3).
  // `wa` is E.164 with no '+'. Single source of truth: SubSiteLayout reads
  // these and base64-encodes the number into the markup (anti-scrape, §3);
  // site.js decodes it at runtime to build the wa.me link.
  // Numbers are REAL (provided 2026-06-20). Per-rep `closed`/`homes` stats are
  // still STUB placeholders — confirm with client before publishing (§7).
  reps: [
    { name: "Bharat", wa: "918712618996", initials: "BH", avatar: "av-b", closed: "₹41 Cr*", homes: "34" },
    { name: "Satish", wa: "919550488200", initials: "ST", avatar: "av-s", closed: "₹33 Cr*", homes: "28" },
  ],

  // Analytics — STUB ids. Empty string disables the snippet (safe for dev).
  analytics: {
    clarityId: "xah4dbk2kt",   // Microsoft Clarity project id (live 2026-06-21)
    metaPixelId: "1036291125518805",  // Meta Pixel id (live 2026-06-23)
    // Google Ads conversion tracking (for the Kollur/Tellapur conquest campaign).
    // Empty googleAdsId disables gtag entirely (same safety model as metaPixelId).
    // Create 3 conversion actions in Google Ads (Lead, WhatsApp Enquiry, Brochure),
    // mark Lead+WhatsApp as Primary, then paste the conversion id + 3 labels here.
    // See docs/specs/2026-06-23-google-ads-conversion-tracking.md.
    googleAdsId: "",           // "AW-XXXXXXXXX"
    googleAdsLabels: { lead: "", whatsapp: "", brochure: "" },
  },
} as const;

export type Site = typeof site;
