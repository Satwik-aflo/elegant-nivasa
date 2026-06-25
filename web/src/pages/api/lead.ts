// POST /api/lead — the only dynamic route. Runs in the Worker runtime.
// Flow: validate → store in D1 (source of truth) → notify sales via Resend.
// Defensive: works in dev without bindings (logs instead of failing).
import type { APIRoute } from "astro";
import { env, waitUntil } from "cloudflare:workers"; // Astro v6 binding access
import { site } from "../../config/site";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  // A valid-JSON non-object (null / number / string / array) parses fine but
  // would throw on property access below — reject it as a bad request.
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "invalid json" }, 400);
  }

  // honeypot — silently accept & drop bot submissions
  if (body.company) return json({ ok: true });

  const name = (body.name ?? "").toString().trim();
  const phone = (body.phone ?? "").toString().trim();
  const email = (body.email ?? "").toString().trim();
  // Both intents require name + phone (the brochure form now collects them too, 2026-06-25);
  // brochure ADDITIONALLY requires a valid email. Mirrors the client-side checks in site.js.
  const intent = body.intent === "brochure" ? "brochure" : "lead";
  const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  if (!name || !/^[6-9]\d{9}$/.test(phone)) return json({ error: "validation" }, 422);
  if (intent === "brochure" && !isEmail(email)) return json({ error: "validation" }, 422);

  const lead = {
    name,
    phone, // required for both intents now (validated above)
    email: email || null,
    unit: (body.unit ?? "").toString().trim() || null,
    message: (body.message ?? "").toString().trim() || null,
    source_page: (body.source_page ?? "").toString().slice(0, 200),
    utm: (body.utm ?? "").toString().slice(0, 500),
    user_agent: request.headers.get("user-agent") ?? "",
    intent,
  };

  const DB = (env as any)?.DB;
  const RESEND_API_KEY = (env as any)?.RESEND_API_KEY as string | undefined;
  const TRANQUIL_API_KEY = (env as any)?.TRANQUIL_API_KEY as string | undefined;

  // 1) store first — the lead must never be lost
  let id: number | null = null;
  if (DB) {
    try {
      const res = await DB.prepare(
        `INSERT INTO leads (name, phone, email, unit, message, source_page, utm, user_agent, intent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          lead.name, lead.phone, lead.email, lead.unit,
          lead.message, lead.source_page, lead.utm, lead.user_agent, lead.intent
        )
        .run();
      id = res.meta?.last_row_id ?? null;
    } catch (err) {
      console.error("D1 insert failed:", err);
    }
  } else {
    console.warn("DB binding missing (dev?) — lead not persisted:", lead);
  }

  // 2) emails (best-effort; failure never blocks the user). All gated on
  //    RESEND_API_KEY — until Resend is wired (CLAUDE.md §7) this is a no-op,
  //    so the feature ships capture-first (D1 row + the direct download cover it).
  if (RESEND_API_KEY) {
    // 2a) notify sales for every submission
    try {
      const subject =
        intent === "brochure"
          ? `New brochure request: ${lead.email}`
          : `New lead: ${lead.name} (${lead.phone})`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: site.mailFrom,
          to: [site.leadEmailTo],
          subject,
          text:
            `Intent: ${intent}\nName: ${lead.name || "-"}\nPhone: ${lead.phone || "-"}\n` +
            `Email: ${lead.email ?? "-"}\nUnit: ${lead.unit ?? "-"}\n` +
            `Message: ${lead.message ?? "-"}\nPage: ${lead.source_page}\nUTM: ${lead.utm}`,
        }),
      });
      if (r.ok && DB && id != null) {
        await DB.prepare("UPDATE leads SET notified = 1 WHERE id = ?").bind(id).run();
      }
    } catch (err) {
      console.error("Resend notify failed:", err);
    }

    // 2b) brochure intent → email the visitor the brochure LINK (not the file).
    //     Absolute URL derived from the request origin, so no extra config.
    if (intent === "brochure" && lead.email) {
      try {
        const link =
          new URL(request.url).origin + "/assets/brochure/Elegant-Nivasa-Brochure.pdf";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: site.mailFrom,
            to: [lead.email],
            // Replies (the email invites "just reply") go to the monitored sales
            // inbox, not the send-only leads@ address (which has no mailbox).
            reply_to: site.leadEmailTo,
            subject: "Your Elegant Nivasa brochure",
            html:
              `<p>Hi${lead.name ? " " + lead.name : ""},</p>` +
              `<p>Thanks for your interest in <b>Elegant Nivasa</b>, Tellapur. Here is the full ` +
              `brochure — master plan, all unit plans, amenities and specifications:</p>` +
              `<p><a href="${link}">Download the Elegant Nivasa brochure (PDF)</a></p>` +
              `<p>Prefer to talk? Just reply to this email and a senior sales lead will help you.</p>` +
              `<p>— Team Elegant Nivasa · E-Infra</p>`,
          }),
        });
      } catch (err) {
        console.error("Resend brochure email failed:", err);
      }
    }
  }

  // 3) push to Tranquil CRM (best-effort). Gated on TRANQUIL_API_KEY — until the secret is
  //    set this is a no-op (like Resend). Tranquil is SLOW (~4s) and runs AFTER the response
  //    via waitUntil() so it never blocks the visitor; it updates leads.crm in the background.
  //    Skipped under `astro dev` (import.meta.env.DEV) so local test submits never punch a
  //    lead into the LIVE CRM (the api_key sits in .dev.vars for parity; there is no sandbox).
  //    The waitUntil() call itself is wrapped — it must never be the thing that 500s the POST
  //    (which would make the visitor resubmit and duplicate the already-saved lead + email).
  if (TRANQUIL_API_KEY && !import.meta.env.DEV) {
    try {
      waitUntil(syncTranquil(TRANQUIL_API_KEY, lead, intent, DB, id));
    } catch (err) {
      console.error("Tranquil waitUntil failed:", err instanceof Error ? err.name : "error");
    }
  }

  return json({ ok: true });
};

// Push one lead to Tranquil CRM. Tranquil's ONLY API: GET /v2/createlead with the api_key
// as a query param (no auth header). Two real-world gotchas the apidoc gets wrong (verified
// against the live endpoint 2026-06-25):
//   • Response is non-standard: two concatenated JSON objects, e.g.
//     {"message":"success","callid":"…"}{"status":"success","message":"Lead inserted successfully"}
//     — so JSON.parse throws; we detect success by matching the body TEXT instead.
//   • `status` is the STRING "success", not the documented boolean true.
// Sets leads.crm = 1 only on a confirmed fresh insert (duplicates/errors stay 0).
async function syncTranquil(
  apiKey: string,
  lead: {
    name: string;
    phone: string;
    email: string | null;
    message: string | null;
    source_page: string;
    utm: string;
  },
  intent: string,
  DB: any,
  id: number | null
) {
  try {
    const fromUtm = (key: string) => {
      try {
        return new URLSearchParams(lead.utm.replace(/^\?/, "")).get(key) || "";
      } catch {
        return "";
      }
    };
    // Tranquil requires mobile_number; no-phone brochure leads go under a placeholder
    // (dedups in the CRM — see site.tranquil.placeholderPhone & the spec).
    const mobile = lead.phone || site.tranquil.placeholderPhone;
    const remark = [`intent=${intent}`, lead.message, lead.source_page]
      .filter(Boolean)
      .join(" | ");

    const params = new URLSearchParams({
      api_key: apiKey,
      country_code: site.tranquil.countryCode,
      mobile_number: mobile,
      project_id: String(site.tranquil.projectId),
      source_type: String(site.tranquil.sourceType),
      lead_type: "sales",
    });
    if (lead.name) params.set("customer_name", lead.name);
    if (lead.email) params.set("email", lead.email);
    const campaign = fromUtm("utm_campaign");
    if (campaign) params.set("campaign_name", campaign);
    const gclid = fromUtm("gclid");
    if (gclid) params.set("gcl_id", gclid);
    if (lead.source_page) params.set("sub_source", lead.source_page);
    if (remark) params.set("remark", remark);

    // 15s timeout — generous because this runs in the background (waitUntil, 30s budget);
    // Tranquil typically answers in ~4s.
    const r = await fetch(`${site.tranquil.endpoint}?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    });
    const body = await r.text();
    // Success = a fresh insert. Match the body TEXT (the response isn't parseable JSON).
    // Cover the live phrase ("Lead inserted successfully") and the apidoc phrase ("punched
    // in the CRM"); exclude duplicates ("Lead is Duplicate…"), which leave crm = 0.
    const inserted =
      r.ok &&
      /inserted successfully|punched in the crm/i.test(body) &&
      !/duplicate/i.test(body);
    if (inserted && DB && id != null) {
      await DB.prepare("UPDATE leads SET crm = 1 WHERE id = ?").bind(id).run();
    }
  } catch (err) {
    // Never log the request URL — it carries the api_key in the query string, and some
    // runtimes embed the failing URL in a fetch error's message/cause. Sanitize before logging.
    const msg = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).replace(
      /api_key=[^&\s]*/gi,
      "api_key=***"
    );
    console.error("Tranquil sync failed:", msg);
  }
}
