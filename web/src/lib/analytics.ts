// Single event layer. Every Conversion (Lead, Enquiry) and engagement event
// goes through track(); destinations (Clarity, Meta Pixel) are added here so
// adding GA4 / Google Ads / a CRM later is one place, not scattered calls.
// NOTE: consent gating is deferred (CLAUDE.md §8) — events fire unconditionally for now.

import { site } from "../config/site";

type Props = Record<string, unknown>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown; // internal handle set by the Meta Pixel bootstrap snippet
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Our Conversion vocabulary → the matching Google Ads conversion-action label.
const GOOGLE_ADS_EVENTS: Record<string, keyof typeof site.analytics.googleAdsLabels> = {
  lead_submit: "lead",
  whatsapp_click: "whatsapp",
  brochure_request: "brochure",
};

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

  // Google Ads — fire a conversion for the events we've mapped to a conversion
  // action. Guarded on the id + that action's label being set (empty = off).
  try {
    const { googleAdsId, googleAdsLabels } = site.analytics;
    const labelKey = GOOGLE_ADS_EVENTS[event];
    const label = labelKey && googleAdsLabels[labelKey];
    if (window.gtag && googleAdsId && label) {
      window.gtag("event", "conversion", { send_to: `${googleAdsId}/${label}` });
    }
  } catch {}
}

// Expose globally so inline <script> blocks in .astro files can call it
// without importing the module.
if (typeof window !== "undefined") {
  (window as unknown as { track: typeof track }).track = track;
}
