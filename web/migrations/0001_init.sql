-- Leads: every main-site form submission, stored before any downstream push.
-- This is the source of truth (CLAUDE.md §3).
CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  unit        TEXT,            -- configuration of interest, optional
  message     TEXT,
  source_page TEXT,            -- which route the lead came from
  utm         TEXT,            -- raw UTM querystring, for attribution
  user_agent  TEXT,
  notified    INTEGER NOT NULL DEFAULT 0  -- 1 once the sales email succeeds
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads (phone);
