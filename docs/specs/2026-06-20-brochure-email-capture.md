# Spec — "Email me the brochure" (email-first soft capture)

**Status:** Implemented (capture-first) 2026-06-21 · **Date:** 2026-06-20 · **Surface:** Main site
(`web/src/pages/index.astro` — the homepage, since promoted from the old `prototype.astro`)

> **Implementation note (2026-06-21):** Built as an **addition**, not a replacement. By the time
> this was implemented, the brochure band's soft form had been repurposed to a "Book your site
> visit" callback (`intent="lead"`, unchanged). The email-brochure capture was added as a compact
> inline form in the band's **left column**, under the free-download button, so both paths coexist.
> Visitor email is wired but **gated on `RESEND_API_KEY`** — a no-op until Resend's sending domain
> is verified (§6); D1 capture + sales notify + the direct download all work today.

## 1. Goal

On the homepage brochure band, let a visitor receive the brochure **by email** with only an
email address (name optional, **no phone required**), while still capturing the lead. The 27 MB PDF
keeps downloading directly and freely; this is the low-friction alternative for people who'd rather
have it sent. Today the brochure band's soft-capture reuses the lead form, which requires a valid
10-digit mobile (`/api/lead` 422s otherwise) — so an email-only path needs explicit support.

## 2. Current state (reference, do not duplicate)

- Endpoint: `web/src/pages/api/lead.ts` — validates `name` + `phone` (`/^[6-9]\d{9}$/`), writes to
  D1 `leads`, then best-effort Resend notify to `site.leadEmailTo`. Honeypot field `company`.
- Client handler: `web/public/assets/js/site.js` `[data-leadform]` block — validates name+phone,
  POSTs `{name, phone, email, source_page, utm}`, swaps in the sibling `.form-success`.
- Schema: `web/migrations/0001_init.sql` — `leads.phone` is **`TEXT NOT NULL`**.
- Brochure asset: `/assets/brochure/Elegant-Nivasa-Brochure.pdf`.
- Config: `web/src/config/site.ts` (`leadEmailTo: sales@e-infra.in`). Resend key + verified sending
  domain are still open items (CLAUDE.md §7).

## 3. Core decision — extend `/api/lead`, don't add an endpoint

Add an **`intent`** field (`"lead"` default | `"brochure"`) to the same endpoint rather than a new
`/api/brochure` route. Rationale: reuses the D1 write + Resend wiring + honeypot in one place; the
only real differences are validation rules and one extra outbound email. A second endpoint would
duplicate all of that. Branch on `intent` for validation and email behaviour.

## 4. Design

### 4.1 Frontend (`prototype.astro` brochure band)

Replace the brochure soft-capture form's phone field with an **email** field; keep name (optional).
Mark the form so `site.js` switches modes:

```html
<form class="br-form" data-leadform data-intent="brochure" novalidate>
  <div class="form-field"><input name="name"  type="text"  placeholder="Your name (optional)" /><span class="form-err">…</span></div>
  <div class="form-field"><input name="email" type="email" placeholder="you@email.com" /><span class="form-err">Enter a valid email</span></div>
  <button type="submit">Email me the brochure →</button>
</form>
<div class="form-success">… "Check your inbox — the brochure is on its way." …</div>
```

The bottom contact form (`#enquire`, name + phone) is unchanged — it stays a normal `intent="lead"`.

### 4.2 Client handler (`site.js` `[data-leadform]`)

Read `form.dataset.intent` (default `"lead"`). Add a brochure branch:

- **Validation:** `brochure` → require valid `email` (regex already present), name/phone optional.
  `lead` → unchanged (name + phone required).
- **Payload:** include `intent` and whichever fields exist. Keep `source_page` + `utm`.
- **Success:** brochure → inbox-oriented copy; the existing `.form-success` swap is reused.
- **Tracking:** fire `window.track("brochure_request", {page})` (sits alongside `lead_submit`).

### 4.3 API (`api/lead.ts`)

```
const intent = body.intent === "brochure" ? "brochure" : "lead";
if (intent === "brochure") {
  if (!isEmail(email)) return 422;          // email required; name/phone optional
} else {
  if (!name || !validPhone(phone)) return 422;  // unchanged
}
```

- **Store** the lead as today (see §4.4 for the NOT NULL handling). Set `source_page`/`unit` so
  brochure leads are distinguishable (e.g. `source_page` already carries the path; also persist
  `intent`).
- **Emails:**
  1. **To the visitor** (brochure intent only): Resend send with a link to the absolute brochure
     URL. Derive origin from the request — `new URL(request.url).origin + "/assets/brochure/Elegant-Nivasa-Brochure.pdf"` —
     so no new config. Subject e.g. *"Your Elegant Nivasa brochure"*; link, not a 27 MB attachment.
  2. **To sales** (`site.leadEmailTo`): keep the existing best-effort notify for both intents, with
     the subject reflecting intent (`New brochure request: <email>` vs `New lead: …`).
- Failure of either email never blocks the response (best-effort, as today). Return `{ ok: true }`.

### 4.4 D1 — handle `phone NOT NULL`

`leads.phone` is `NOT NULL`. Two options:

- **(A, recommended) Store `phone = ""`** for brochure leads (and persist `intent`). Zero schema
  risk, no table rebuild. Add a nullable `intent TEXT` column via `0002_brochure_intent.sql`
  (`ALTER TABLE leads ADD COLUMN intent TEXT DEFAULT 'lead'`).
- (B) Rebuild the table to make `phone` nullable (SQLite can't drop NOT NULL via ALTER → create
  new table, copy, swap). More invasive; only do this if an empty-string phone is unacceptable.

Go with **A** unless there's a reporting reason phone must be NULL not `""`.

## 5. Validation rules

| intent | name | phone | email | other |
|---|---|---|---|---|
| `lead` (default) | required | valid 10-digit | optional | unchanged |
| `brochure` | optional | not required (`""`) | **required, valid** | honeypot `company` enforced |

## 6. Dependencies & risks

- **Blocked on Resend** (account + verified sending domain — CLAUDE.md §7) for the *visitor* email.
  Until live: the form still captures + stores the lead and notifies sales; the direct download
  already covers the user's need, so this can ship capture-first and switch on the visitor email
  when Resend is ready.
- **DPDP (CLAUDE.md §8):** collecting email is PII; consent banner still deferred. No new posture,
  but note it.
- **Abuse:** honeypot stays; an email-only form is cheaper to spam — consider a basic per-IP rate
  limit on `intent="brochure"` later (out of scope here).

## 7. Out of scope

Attaching the PDF (we email a link); double opt-in; a separate brochure-only D1 table; CRM push.

## 8. Test plan

- Brochure form: empty/invalid email → inline error, no POST. Valid email (no name/phone) →
  `{ok:true}`, success copy, row in `leads` with `intent="brochure"`, `phone=""`.
- `intent="lead"` path unchanged (name+phone still required; brochure email NOT sent).
- Dev (no bindings): endpoint still returns ok and logs; no crash.
- With Resend keys: visitor receives a working absolute brochure link; sales gets the notify.
- Honeypot `company` filled → silently accepted, not stored.

## 9. Rollout

1. `0002_brochure_intent.sql` migration (local `--local`, then `--remote` at deploy).
2. `api/lead.ts` intent branch + visitor email.
3. `site.js` intent-aware validation + brochure form markup + success copy.
4. Ship capture-first; enable visitor email once the Resend domain is verified.
