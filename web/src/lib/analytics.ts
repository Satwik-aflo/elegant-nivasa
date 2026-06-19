// Single event layer. Every Conversion (Lead, Enquiry) and engagement event
// goes through track(); destinations (Clarity, Meta Pixel) are added here so
// adding GA4 / Google Ads / a CRM later is one place, not scattered calls.
// NOTE: consent gating is deferred (CLAUDE.md §8) — events fire unconditionally for now.

type Props = Record<string, unknown>;

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
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
      else if (event === "whatsapp_click") fbq("track", "Contact", props);
      else fbq("trackCustom", event, props);
    }
  } catch {}
}

// Expose globally so inline <script> blocks in .astro files can call it
// without importing the module.
if (typeof window !== "undefined") {
  (window as unknown as { track: typeof track }).track = track;
}
