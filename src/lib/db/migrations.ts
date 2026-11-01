export const MIGRATIONS = `
ALTER TABLE ai_systems ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'discovered';
ALTER TABLE ai_systems ADD COLUMN IF NOT EXISTS version_label text NOT NULL DEFAULT '';
ALTER TABLE ai_systems ADD COLUMN IF NOT EXISTS vendor_name text NOT NULL DEFAULT '';
ALTER TABLE ai_systems ADD COLUMN IF NOT EXISTS eu_database_id text NOT NULL DEFAULT '';
ALTER TABLE ai_systems ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS gdpr_ref text NOT NULL DEFAULT '';
ALTER TABLE evidence_items ADD COLUMN IF NOT EXISTS prev_sha256 text NOT NULL DEFAULT '';
`;
