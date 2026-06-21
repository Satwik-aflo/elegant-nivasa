-- Brochure email-capture: distinguish brochure-intent rows from normal leads.
-- See docs/specs/2026-06-20-brochure-email-capture.md (§4.4, option A).
-- phone stays NOT NULL; brochure rows store phone = "" and intent = 'brochure'.
ALTER TABLE leads ADD COLUMN intent TEXT NOT NULL DEFAULT 'lead';
CREATE INDEX IF NOT EXISTS idx_leads_intent ON leads (intent);
