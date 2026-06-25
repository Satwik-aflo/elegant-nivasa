-- CRM sync status: 1 once Tranquil createlead returns status:true for this lead.
-- Mirrors `notified` (email). Duplicates / failures stay 0 (best-effort, like email).
-- See docs/specs/2026-06-25-tranquil-crm-lead-sync.md.
ALTER TABLE leads ADD COLUMN crm INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_leads_crm ON leads (crm);
