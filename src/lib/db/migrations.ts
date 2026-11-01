/** Additive SQLite / D1 migrations applied after SQLITE_DDL. Safe to re-run. */
export const MIGRATIONS = `
ALTER TABLE pilot_leads ADD COLUMN status text NOT NULL DEFAULT 'new';
ALTER TABLE pilot_leads ADD COLUMN notes text NOT NULL DEFAULT '';
ALTER TABLE pilot_leads ADD COLUMN updated_at integer;
CREATE INDEX IF NOT EXISTS pilot_leads_status_idx ON pilot_leads(status);
CREATE TABLE IF NOT EXISTS eu_annex_docs (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  answers_json text NOT NULL DEFAULT '{}',
  updated_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS eu_conformity_steps (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  step_id text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  notes text NOT NULL DEFAULT '',
  updated_at integer
);
CREATE INDEX IF NOT EXISTS eu_conformity_system_idx ON eu_conformity_steps(system_id);

ALTER TABLE organisations ADD COLUMN trust_public integer NOT NULL DEFAULT 0;
ALTER TABLE organisations ADD COLUMN trust_summary text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN trust_contact_email text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS approval_requests (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  requested_by text REFERENCES users(id),
  reviewed_by text REFERENCES users(id),
  decision_note text NOT NULL DEFAULT '',
  created_at integer,
  decided_at integer
);
CREATE TABLE IF NOT EXISTS reassessment_schedules (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  cadence_days integer NOT NULL DEFAULT 90,
  next_due_at integer NOT NULL,
  last_completed_at integer,
  enabled integer NOT NULL DEFAULT 1,
  created_at integer
);
CREATE TABLE IF NOT EXISTS in_app_reminders (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  user_id text REFERENCES users(id),
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  due_at integer,
  acknowledged_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS client_error_events (
  id text PRIMARY KEY,
  org_id text,
  message text NOT NULL,
  stack text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  created_at integer
);
CREATE INDEX IF NOT EXISTS reminders_org_idx ON in_app_reminders(org_id);
CREATE INDEX IF NOT EXISTS approvals_org_idx ON approval_requests(org_id);
`;
