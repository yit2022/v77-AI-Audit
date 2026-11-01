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
`;
