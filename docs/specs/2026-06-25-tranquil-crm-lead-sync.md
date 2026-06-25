# Tranquil CRM lead sync

> **BUILT & TESTED LOCALLY 2026-06-25** (verified end-to-end against the LIVE Tranquil CRM —
> insert → `crm=1`, duplicate → `crm=0`, response no longer blocked by Tranquil's ~4s latency).
> `astro check` 0/0/0, build green. **Not yet in production** — remaining: set the prod secret
> `TRANQUIL_API_KEY`, apply migration `0003 --remote`, `wrangler deploy`, and have the client
> delete the `ZZ TEST` rows (numbers `9000000001`–`9000000004`) from Tranquil. Adds a third
> best-effort notify step to `/api/lead` that pushes every lead/brochure submission into the
> Tranquil CRM, alongside the existing D1 write and Resend email. Replaces the earlier
> (rejected) idea of WhatsApp rep-notifications — see "Why not WhatsApp" below.
>
> **Two apidoc inaccuracies found at build time** (the design code below is updated to match
> reality; see "As-built notes"): (1) the success response is **non-standard concatenated JSON**
> with `"status":"success"` as a **string**, not the documented `status:true` boolean — so we
> detect success by matching the body **text**, not `JSON.parse`; (2) Tranquil is **slow (~4s)**,
> so the call runs **after the response via `waitUntil()`**, not inline.

_Spec — 2026-06-25. The client wants leads and brochure requests to land in their Tranquil
CRM (`einfra.tranquilcrmone.in`) in addition to the sales email, so sales works leads from
the CRM instead of an inbox. Covers the main site and all three sub-sites (shared endpoint)._

## Goal

On every successful `POST /api/lead`, after the lead is saved to D1 and emailed to
`sales@e-infra.in`, also create the lead in **Tranquil CRM** via its `createlead` API. The
email stays (client decision 2026-06-25) — Tranquil is **added**, not a replacement. D1
remains the source of truth; Tranquil and email are both best-effort downstream pushes that
never block the user or the D1 write.

## Why not WhatsApp

The original request was to WhatsApp-notify the two reps on each lead. Research killed it as
not worth the overhead: business-initiated WhatsApp **requires a pre-approved Meta template**,
a **dedicated sender number** (a fresh SIM never registered on the WhatsApp app), and Meta
business verification (up to ~2 weeks) — heavyweight for an internal staff alert that the
existing sales email already covers. Pushing leads into the CRM the client already uses is the
better-fitting integration. (The visitor-facing `wa.me` Enquiry buttons on the sub-sites are
unrelated and unchanged — those are free person-to-business links.)

## The Tranquil API (as documented)

Docs: `https://einfra.tranquilcrmone.in/apidoc/3` (account: Elegantea Infra LLP).

- **Endpoint:** `GET https://einfra.tranquilcrmone.in/v2/createlead`
- **Auth:** an `api_key` query parameter. No token/login flow. No auth header.
- **Request:** query-string parameters (it's a GET — no JSON body).
- **Response:** JSON. Success `{ "status": true, "msg": "Lead punched in the CRM" }`.
  Duplicate `{ "status": false, "msg": "Lead is Duplicate But Different Requirement..." }`.
- **Dedup:** Tranquil dedupes server-side on `mobile_number` (that's what triggers the
  duplicate response). Important — drives the no-phone-brochure design below.
- **`project_id` for Elegant Nivasa = `1`** (from the docs' project table).

### Parameters we send

| Tranquil param  | Required | Our value |
|-----------------|----------|-----------|
| `api_key`       | yes | Worker secret `TRANQUIL_API_KEY` |
| `country_code`  | yes | `91` (config) |
| `mobile_number` | yes | `lead.phone` — digits only (or placeholder, see below) |
| `project_id`    | yes | `1` (config) |
| `source_type`   | yes | `3` (config) — Tranquil's mandatory source id |
| `customer_name` | no  | `lead.name` (omitted when empty) |
| `email`         | no  | `lead.email` (omitted when null) |
| `campaign_name` | no  | `utm_campaign` parsed from `lead.utm` |
| `lead_type`     | no  | `"sales"` |
| `sub_source`    | no  | `lead.source_page` (which route the lead came from) |
| `gcl_id`        | no  | `gclid` parsed from `lead.utm`, if present |
| `remark`        | no  | `intent=<lead\|brochure>` + message + source_page, joined |

Unused documented params (`min_budget`, `budget`, `property_type`, `configuration`,
`requirment_type`, `adgroup_name`, `ad_name`, `spi`, `project_id_type`, `location`) are left
off — we have no reliable data for them at submit time. Easy to add later if the forms grow.

## Scope

- `web/src/config/site.ts` — new `tranquil` config block (endpoint, ids, country code,
  placeholder number). **No api_key in config** — it's a secret.
- `web/src/pages/api/lead.ts` — new best-effort step 3, mirroring the Resend block: gated on
  `env.TRANQUIL_API_KEY`, builds the query string, fires the GET, swallows errors.
- `web/migrations/0003_crm_synced.sql` — adds a `crm` status column to `leads` (mirrors the
  existing `notified` column) for observability: which leads reached the CRM.
- Secret: `wrangler secret put TRANQUIL_API_KEY` (prod) + a line in `web/.dev.vars` (local).

## Non-goals

- **No UI change.** No new fields, no new pages. Purely a server-side downstream push.
- **No change to the D1 write or the Resend email.** Both stay exactly as-is.
- **No retry queue.** Best-effort, same as email today. A failed Tranquil push is logged and
  the lead is still in D1 + email (the durable record). A retry/replay job can read the `crm`
  column later if ever needed — out of scope here.
- **No reading from Tranquil.** Write-only (createlead). No sync-back, no contact lookups.

## Design

### 1. Config (`site.ts`)

```ts
// Tranquil CRM — leads push to einfra.tranquilcrmone.in/v2/createlead on each submit
// (best-effort, after D1 + email). api_key is a Worker SECRET (TRANQUIL_API_KEY), never
// here. project_id 1 = Elegant Nivasa; source_type 3 = Tranquil's mandatory source id.
tranquil: {
  endpoint: "https://einfra.tranquilcrmone.in/v2/createlead",
  projectId: 1,
  sourceType: 3,
  countryCode: "91",
  // Defensive fallback for Tranquil's required mobile_number. As of 2026-06-25 BOTH forms
  // require a phone (front- and back-end validated), so this is effectively unreachable —
  // it only guards a malformed direct API post. (History: it used to cover phone-less
  // brochure captures, which collided on Tranquil's mobile_number dedup; forcing a phone
  // on the brochure form removed that trade-off — see the update note below.)
  placeholderPhone: "9999999999",
},
```

### 2. The notify step (`lead.ts`, step 3)

Added after the Resend block, before `return json({ ok: true })`, in the same defensive
style (gated on the secret; whole block wrapped so any failure is logged and swallowed):

```ts
const TRANQUIL_API_KEY = (env as any)?.TRANQUIL_API_KEY as string | undefined;

if (TRANQUIL_API_KEY) {
  try {
    const fromUtm = (key: string) => {
      try { return new URLSearchParams(lead.utm.replace(/^\?/, "")).get(key) || ""; }
      catch { return ""; }
    };
    const mobile = lead.phone || site.tranquil.placeholderPhone;
    const remark = [`intent=${intent}`, lead.message, lead.source_page]
      .filter(Boolean).join(" | ");

    const params = new URLSearchParams({
      api_key: TRANQUIL_API_KEY,
      country_code: site.tranquil.countryCode,
      mobile_number: mobile,
      project_id: String(site.tranquil.projectId),
      source_type: String(site.tranquil.sourceType),
      lead_type: "sales",
    });
    if (lead.name) params.set("customer_name", lead.name);
    if (lead.email) params.set("email", lead.email);
    const campaign = fromUtm("utm_campaign"); if (campaign) params.set("campaign_name", campaign);
    const gclid = fromUtm("gclid"); if (gclid) params.set("gcl_id", gclid);
    if (lead.source_page) params.set("sub_source", lead.source_page);
    if (remark) params.set("remark", remark);

    // 15s timeout — runs in the background (waitUntil, 30s budget); Tranquil insert is ~4s.
    const r = await fetch(`${site.tranquil.endpoint}?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    });
    const body = await r.text();
    // Match the body TEXT — the response is non-parseable concatenated JSON (see As-built).
    const inserted =
      r.ok && /inserted successfully|punched in the crm/i.test(body) && !/duplicate/i.test(body);
    if (inserted && DB && id != null) {
      await DB.prepare("UPDATE leads SET crm = 1 WHERE id = ?").bind(id).run();
    }
  } catch (err) {
    console.error("Tranquil sync failed:", err);  // never log the full URL (carries api_key)
  }
}
```

The above lives in a module-level `syncTranquil(...)` helper; the POST handler calls it via
**`waitUntil(syncTranquil(...))`** (imported from `cloudflare:workers`) so it runs *after* the
response — Tranquil's ~4s insert never blocks the visitor.

Notes:
- **GET with query string** is Tranquil's documented design. `URLSearchParams` URL-encodes
  every value (handles names/remarks with spaces/`&`).
- **Never log the full request URL** — the `api_key` rides in the query string. Log the
  caught error only.
- **`waitUntil` + 15s timeout:** the call is off the request path (submit stays ~1.3s), and
  15s comfortably covers the ~4s insert without the jitter-clipping a 5s inline cap caused.
- `crm = 1` is set only on a confirmed **insert**. A **duplicate** stays `crm = 0` — expected,
  and a useful signal (the no-phone placeholder collisions show up as `crm = 0`).

### 3. Migration (`0003_crm_synced.sql`)

```sql
-- CRM sync status: 1 once Tranquil createlead returns status:true for this lead.
-- Mirrors `notified` (email). Duplicates / failures stay 0 (best-effort, like email).
ALTER TABLE leads ADD COLUMN crm INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_leads_crm ON leads (crm);
```

Apply `--local` for dev and **`--remote` at deploy** (same drill as `0002`).

## Data flow (after change)

```
visitor submits form
  → POST /api/lead
  → validate
  → INSERT into D1            (source of truth, never lost)
  → Resend: email sales@e-infra.in        [best-effort, unchanged]
  → Resend: brochure email to visitor     [brochure intent only, unchanged]
  → Tranquil GET /v2/createlead           [best-effort, NEW] → on status:true, leads.crm = 1
  → return { ok: true }
```

## Impact on the live site

- **Risk: low.** Purely additive and best-effort. The visitor-facing behaviour, the D1
  write, the email, and every UI are untouched. A Tranquil outage/slow response cannot lose a
  lead (D1 first) and cannot hang the response (5s timeout) — worst case the lead just isn't
  in the CRM that minute, and `crm = 0` flags it.
- **Safe rollout:** deploy the code first — with **no `TRANQUIL_API_KEY` secret set, the block
  is a no-op** (exactly how the Resend block behaved before its key existed). Then
  `wrangler secret put TRANQUIL_API_KEY` to switch it on. The migration must be applied
  `--remote` before/with the deploy or the `crm = 1` update throws (caught, but no-op).
- **Latency:** adds one outbound GET to the request path, capped at 5s. Tranquil normally
  responds fast; typical added latency is small. (Future option: move all downstream notifies
  to `ctx.waitUntil` so they run after the response — not done here, to match the existing
  inline-email pattern and keep the change small.)
- **Cost:** none. Tranquil API is part of the client's existing CRM subscription.

## Security / privacy

- **`api_key` is a Worker secret**, set via `wrangler secret put` — never committed, never in
  `site.ts`, never logged (don't log the request URL). The value shown in the public apidoc
  (`TRNQUILCRMeinfra`) is treated as the real production key (client, 2026-06-25) but is still
  stored as a secret, not hardcoded.
- **PII over HTTPS query string:** name/phone/email ride in the GET query string. This is
  Tranquil's documented design and is transport-encrypted; the only caveat is not logging the
  URL on our side (handled above).
- **DPDP (CLAUDE.md §8):** unchanged. The lead's PII already leaves the site via email today;
  Tranquil is the same data to one more first-party destination (the client's own CRM). No new
  consent surface beyond the already-deferred banner.

## Testing / verification

- `npx astro check` → expect 0/0/0.
- `npm run build` → green.
- **Local dev** (`npm run dev`, key in `.dev.vars`): submit a book-a-visit → confirm the lead
  writes to local D1 **and** a Tranquil `createlead` GET fires (it will hit the real CRM —
  use an obviously-fake test name/number and tell the client, or point at a throwaway). Verify
  `leads.crm` flips to 1 on `status:true`. Re-submit the same number → confirm the duplicate
  response is handled (no throw; `crm` stays 0).
- Submit a **brochure** (now name + phone + email) → confirm it lands in Tranquil under its
  real phone and `leads.crm` flips to 1.
- Confirm the validation rejects (HTTP 422, no D1/Tranquil call): brochure missing phone,
  brochure missing email, lead missing phone.
- Confirm the D1 write and the sales email still happen regardless of Tranquil's outcome.

## Update — brochure now requires a phone (2026-06-25)

After the initial build, the **brochure form was changed to require name + phone + email**
(previously email-only). The `#brochureDialog` gained name/phone inputs, `site.js` validates all
three client-side, and `lead.ts` was tightened to match server-side: **both intents now require
name + phone; brochure additionally requires a valid email** (`if (!name || !phoneRe.test(phone))
422; if (intent==='brochure' && !isEmail(email)) 422`). Consequences:

- **The no-phone-brochure dedup trade-off is gone.** Real brochure leads now carry a real phone,
  so each gets its own Tranquil contact — no more placeholder collisions.
- **`placeholderPhone` is now a defensive fallback only** — effectively unreachable in normal
  flow (a real submit always has a phone); it only guards a malformed direct API post. Kept as
  belt-and-suspenders rather than removed.

## Outside the code (client / E-Infra)

- Confirm what `source_type = 3` represents in Tranquil (likely "Website") and that
  `project_id = 1` is still Elegant Nivasa — both are stable per the current apidoc.
- Confirm the `api_key` value and that the createlead API is enabled for this account.

## As-built notes

Verified against the **live** Tranquil endpoint on 2026-06-25 (client authorised test leads).
The apidoc is wrong in two ways that matter — keep these if the integration is ever touched:

- **Response is non-standard concatenated JSON, not the documented shape.** A successful insert
  returns TWO JSON objects back-to-back (not a single valid document):
  `{"message":"success","callid":"…"}{"status":"success","message":"Lead inserted successfully"}`.
  So `JSON.parse(body)` **throws**. And `status` is the **string** `"success"`, not the apidoc's
  boolean `true`. → We detect success by matching the body **text**
  (`/inserted successfully|punched in the crm/i` and not `/duplicate/i`), never `JSON.parse`.
- **Duplicate response** (real): `{"status":"Failed","message":"Failed to insert lead due to
  duplicate mode selected as not insert"}` — HTTP 200, fast (~0.6s). Correctly yields `crm = 0`
  (no `inserted successfully`, and contains `duplicate`).
- **Tranquil is slow on insert (~4s); duplicates are fast (~0.6s).** A ~4s call inline would make
  every form submit wait ~4s. → The push runs **after** the response via **`waitUntil()`**
  (imported from `cloudflare:workers`, same module as `env`; works in `astro dev`/Miniflare and
  in production). Measured submit response dropped to ~1.3s; `crm` still flips in the background.
  Timeout raised to **15s** (background has a 30s budget) so the ~4s insert isn't clipped by
  jitter (an earlier 5s inline timeout intermittently aborted real inserts).
- **`api_key` `TRNQUILCRMeinfra` works**, and `project_id=1` + `source_type=3` are accepted by the
  live endpoint (lead lands in the CRM). Stored as the Worker secret `TRANQUIL_API_KEY` and in
  `web/.dev.vars` for local dev.
- **Test-lead cleanup owed:** local D1 test rows were deleted, but the live CRM now holds the
  `ZZ TEST` leads (`9000000001`–`9000000004`) created during verification — the client should
  delete them in Tranquil.

## Code-review hardening (2026-06-25, post-review)

A high-effort review surfaced these; all applied:

- **Dev guard — the push is skipped under `astro dev`** (`if (TRANQUIL_API_KEY &&
  !import.meta.env.DEV)`). Tranquil has no sandbox, and the api_key sits in `.dev.vars`, so
  without this every local submit punched a real lead into the live CRM. **Consequence for
  testing: local dev no longer pushes to Tranquil** (a dev submit writes D1 with `crm=0` and
  makes no CRM call) — verify the live push via the prod smoke test below, not localhost.
- **`waitUntil()` call wrapped in try/catch** — it's the only downstream notify in the response
  path; if it ever threw synchronously the POST would 500 *after* the D1 insert, and the
  visitor's resubmit would duplicate the lead + sales email. Now it can't.
- **`adTag()` (site.js) now treats a Google Ads click id as "tagged"** — it persisted the query
  string only when it contained `utm_`, so an auto-tagged `?gclid=…`-only landing lost `gcl_id`
  before it reached the CRM. Now matches `utm_|gclid=|gclsrc=|wbraid=|gbraid=`.
- **Catch log sanitised** — the api_key (in the GET query string) could ride along in a fetch
  error's message; the log now strips `api_key=…`.

Reviewed-and-accepted (no change): `placeholderPhone` kept as defensive dead code; success
detection by body-text match (verified against the live API, only affects the `crm` flag);
`site.js` served `cache-control: max-age=0, must-revalidate` so returning visitors revalidate
and pick up the gating change immediately (no stale-client 422 window).

## Production rollout checklist

1. `cd web && wrangler secret put TRANQUIL_API_KEY` → paste `TRNQUILCRMeinfra` (switches the
   block on; until set it's a no-op, like Resend pre-key).
2. `wrangler d1 migrations apply elegant-nivasa --remote` (adds the `crm` column to prod D1).
3. `npm run build && wrangler deploy` from `web/`.
4. Live smoke test on `elegantnivasa.com`: submit one marked test lead, confirm it appears in
   Tranquil, then delete it (+ the local-test `ZZ TEST` rows above).
