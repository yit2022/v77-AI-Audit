/** Additive SQLite / D1 migrations applied after SQLITE_DDL. Safe to re-run. */
export const MIGRATIONS = `
ALTER TABLE pilot_leads ADD COLUMN status text NOT NULL DEFAULT 'new';
ALTER TABLE pilot_leads ADD COLUMN notes text NOT NULL DEFAULT '';
ALTER TABLE pilot_leads ADD COLUMN updated_at integer;
CREATE INDEX IF NOT EXISTS pilot_leads_status_idx ON pilot_leads(status);
`;
