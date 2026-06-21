// POST /api/lead — the only dynamic route. Runs in the Worker runtime.
// Flow: validate → store in D1 (source of truth) → notify sales via Resend.
// Defensive: works in dev without bindings (logs instead of failing).
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers"; // Astro v6 binding access
import { site } from "../../config/site";

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // honeypot — silently accept & drop bot submissions
  if (body.company) return json({ ok: true });

  const name = (body.name ?? "").toString().trim();
  const phone = (body.phone ?? "").toString().trim();
  const email = (body.email ?? "").toString().trim();
  // intent="brochure" → email-only soft capture; default "lead" → name + phone.
  const intent = body.intent === "brochure" ? "brochure" : "lead";
  const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

  if (intent === "brochure") {
    if (!isEmail(email)) return json({ error: "validation" }, 422);
  } else if (!name || !/^[6-9]\d{9}$/.test(phone)) {
    return json({ error: "validation" }, 422);
  }

  const lead = {
    name, // "" allowed for brochure intent (phone NOT NULL → stored as "")
    phone,
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

  return json({ ok: true });
};
