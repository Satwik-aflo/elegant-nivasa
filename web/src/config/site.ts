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

  // Two Sales reps — sub-site WhatsApp Enquiries round-robin across these.
  // STUB numbers (E.164, no '+'). Replace before cutover.
  reps: [
    { name: "Rep One", wa: "910000000001" },
    { name: "Rep Two", wa: "910000000002" },
  ],

  // Analytics — STUB ids. Empty string disables the snippet (safe for dev).
  analytics: {
    clarityId: "",   // Microsoft Clarity project id
    metaPixelId: "", // Meta Pixel id
  },
} as const;

export type Site = typeof site;
