---
status: accepted
---

# Retire WordPress; rebuild as one Astro site on Cloudflare

The legacy `elegantnivasa.com` is WordPress + Elementor — outdated, plugin-locked, and (with the
ad angles split across separate properties) it gave no unified view of metrics. We will **replace
it entirely** with a single statically-built **Astro** app on **Cloudflare** (Pages + Workers +
D1): the Main site at `/` and the three Sub-sites as **paths** under the same domain — *not*
subdomains. The driver is **unified metrics + full code/deploy control**: one codebase and one
analytics property, with paths keeping Clarity/Meta Pixel unfragmented, and Cloudflare's free
serverless/edge model removing server ops.

## Considered options

- **Coexist** (new build alongside WordPress) — rejected: client wants a clean break and full
  control; coexistence is exactly the fragmentation we're leaving.
- **Subdomains per angle** (`cost.elegantnivasa.com`, …) — rejected: fragments analytics and
  triples DNS/SSL/deploy overhead for a paid-ads funnel that gains nothing from it.
- **Vercel / a VPS** — Cloudflare chosen for the free tier, CLI-driven deploys, and least ops.

## Consequences

- **No CMS** — non-technical content edits now need a developer / git. Acceptable: edits are
  occasional and traffic is paid, not organic.
- **Cutover** requires a registrar **nameserver change** and careful preservation of existing DNS
  (especially email/MX) when onboarding the domain to Cloudflare.
- **Consent/DPDP** compliance is deferred (tracked in CLAUDE.md §8).
