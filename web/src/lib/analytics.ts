// Single event layer. Every Conversion (Lead, Enquiry) and engagement event
// goes through track(); destinations are wired here so adding a CRM etc. later
// is one place, not scattered calls.
//   • Microsoft Clarity  — hardcoded (custom event tag)
//   • Meta Pixel         — hardcoded (standard events)
//   • Google Tag Manager — every event is pushed to the dataLayer so GTM
//     triggers fire Google Ads conversions (+ future GA4 / remarketing).
//     Google Ads is NOT fired here — it lives in the marketing-owned GTM container.
// NOTE: consent gating is deferred (CLAUDE.md §8) — events fire unconditionally for now.

type Props = Record<string, unknown>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown; // internal handle set by the Meta Pixel bootstrap snippet
    dataLayer?: Array<Record<string, unknown>>; // GTM queue (created by the GTM snippet)
  }
}

export function track(event: string, props: Props = {}): void {
  if (typeof window === "undefined") return;

  // Microsoft Clarity — custom event tag.
  try {
    window.clarity?.("event", event);
  } catch {}

  // Meta Pixel — map our Conversion vocabulary to standard pixel events.
  try {
    const fbq = window.fbq;
    if (fbq) {
      if (event === "lead_submit") fbq("track", "Lead", props);
      // WhatsApp + phone-call clicks are both "Contact" in Meta's vocabulary.
      else if (event === "whatsapp_click" || event === "call_click") fbq("track", "Contact", props);
      else fbq("trackCustom", event, props);
    }
  } catch {}

  // Google Tag Manager — push the semantic event so GTM triggers can fire Google
  // Ads conversions. The WhatsApp links are base64/JS-built and the book-a-visit
  // is a native dialog, so GTM's auto click/form triggers can't see them — this
  // dataLayer push is how GTM learns a conversion happened. Marketing builds a
  // Custom Event trigger per event name (whatsapp_click / lead_submit / brochure_request).
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...props });
  } catch {}
}

// Expose globally so inline <script> blocks in .astro files can call it
// without importing the module.
if (typeof window !== "undefined") {
  (window as unknown as { track: typeof track }).track = track;
}
