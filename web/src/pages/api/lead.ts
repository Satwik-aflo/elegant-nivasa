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
  if (!name || !/^[6-9]\d{9}$/.test(phone)) {
    return json({ error: "validation" }, 422);
  }

  const lead = {
    name,
    phone,
    email: (body.email ?? "").toString().trim() || null,
    unit: (body.unit ?? "").toString().trim() || null,
    message: (body.message ?? "").toString().trim() || null,
    source_page: (body.source_page ?? "").toString().slice(0, 200),
    utm: (body.utm ?? "").toString().slice(0, 500),
    user_agent: request.headers.get("user-agent") ?? "",
  };

  const DB = (env as any)?.DB;
  const RESEND_API_KEY = (env as any)?.RESEND_API_KEY as string | undefined;

  // 1) store first — the lead must never be lost
  let id: number | null = null;
  if (DB) {
    try {
      const res = await DB.prepare(
        `INSERT INTO leads (name, phone, email, unit, message, source_page, utm, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          lead.name, lead.phone, lead.email, lead.unit,
          lead.message, lead.source_page, lead.utm, lead.user_agent
        )
        .run();
      id = res.meta?.last_row_id ?? null;
    } catch (err) {
      console.error("D1 insert failed:", err);
    }
  } else {
    console.warn("DB binding missing (dev?) — lead not persisted:", lead);
  }

  // 2) notify sales (best-effort; failure never blocks the user)
  if (RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Elegant Nivasa <leads@elegantnivasa.com>",
          to: [site.leadEmailTo],
          subject: `New lead: ${lead.name} (${lead.phone})`,
          text:
            `Name: ${lead.name}\nPhone: ${lead.phone}\n` +
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
  }

  return json({ ok: true });
};
