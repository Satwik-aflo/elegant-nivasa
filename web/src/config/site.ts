// Central site config. Values marked STUB must be replaced before cutover
// (see CLAUDE.md §7 — open items).

export const site = {
  name: "Elegant Nivasa",
  developer: "E-Infra",
  locality: "Tellapur",
  city: "Hyderabad",
  rera: "P01100007243",
  startingPrice: "₹96.2 L",
  leadEmailTo: "sales@e-infra.in",

  // Two Sales reps — each sub-site shows BOTH as cards (one rep per card),
  // not a single round-robin button (decision 2026-06-20; see CLAUDE.md §3).
  // `wa` is E.164 with no '+'. Single source of truth: SubSiteLayout reads
  // these and base64-encodes the number into the markup (anti-scrape, §3);
  // site.js decodes it at runtime to build the wa.me link.
  // Numbers are REAL (provided 2026-06-20). Per-rep `closed`/`homes` stats are
  // still STUB placeholders — confirm with client before publishing (§7).
  reps: [
    { name: "Bharat", wa: "918712618996", initials: "BH", avatar: "av-b", closed: "₹41 Cr", homes: "34" },
    { name: "Satish", wa: "919550488200", initials: "ST", avatar: "av-s", closed: "₹33 Cr", homes: "28" },
  ],

  // Analytics — STUB ids. Empty string disables the snippet (safe for dev).
  analytics: {
    clarityId: "",   // Microsoft Clarity project id
    metaPixelId: "", // Meta Pixel id
  },
} as const;

export type Site = typeof site;
