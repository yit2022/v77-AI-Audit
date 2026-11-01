export const DDL = `
CREATE TABLE IF NOT EXISTS organisations (
  id text PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, email text NOT NULL UNIQUE, name text NOT NULL,
  password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS memberships (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  user_id text NOT NULL REFERENCES users(id), role text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS membership_org_user ON memberships(org_id, user_id);
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY, user_id text NOT NULL REFERENCES users(id),
  org_id text NOT NULL REFERENCES organisations(id),
  expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ai_systems (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  name text NOT NULL, description text NOT NULL DEFAULT '',
  intended_purpose text NOT NULL DEFAULT '',
  role_in_value_chain text NOT NULL DEFAULT 'provider',
  domain text NOT NULL DEFAULT 'general', owner_user_id text REFERENCES users(id),
  risk_tier text, classification_notes text DEFAULT '',
  gpai boolean NOT NULL DEFAULT false,
  lifecycle_status text NOT NULL DEFAULT 'discovered',
  version_label text NOT NULL DEFAULT '',
  vendor_name text NOT NULL DEFAULT '',
  eu_database_id text NOT NULL DEFAULT '',
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS classification_answers (
  id text PRIMARY KEY, system_id text NOT NULL REFERENCES ai_systems(id),
  question_id text NOT NULL, answer text NOT NULL, rationale text DEFAULT ''
);
CREATE TABLE IF NOT EXISTS controls (
  id text PRIMARY KEY, code text NOT NULL UNIQUE, title text NOT NULL,
  description text NOT NULL, area text NOT NULL,
  eu_ref text NOT NULL DEFAULT '', nist_ref text NOT NULL DEFAULT '',
  iso_ref text NOT NULL DEFAULT '', gdpr_ref text NOT NULL DEFAULT '', applies_to text NOT NULL DEFAULT 'high_risk'
);
CREATE TABLE IF NOT EXISTS assessments (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS assessment_controls (
  id text PRIMARY KEY, assessment_id text NOT NULL REFERENCES assessments(id),
  control_id text NOT NULL REFERENCES controls(id),
  status text NOT NULL DEFAULT 'not_started',
  owner_user_id text REFERENCES users(id), notes text DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS assessment_control_unique ON assessment_controls(assessment_id, control_id);
CREATE TABLE IF NOT EXISTS evidence_items (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text REFERENCES ai_systems(id), control_id text REFERENCES controls(id),
  assessment_control_id text REFERENCES assessment_controls(id),
  title text NOT NULL, filename text NOT NULL, storage_path text NOT NULL,
  content_type text NOT NULL DEFAULT 'application/octet-stream',
  sha256 text NOT NULL DEFAULT '', prev_sha256 text NOT NULL DEFAULT '', uploaded_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS fairness_runs (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), filename text NOT NULL,
  metrics_json text NOT NULL, created_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS redteam_runs (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), provider text NOT NULL DEFAULT 'mock',
  results_json text NOT NULL, pass_count integer NOT NULL DEFAULT 0,
  fail_count integer NOT NULL DEFAULT 0, created_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auditor_comments (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  assessment_id text NOT NULL REFERENCES assessments(id),
  author_user_id text NOT NULL REFERENCES users(id), body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS impact_assessments (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), template_id text NOT NULL,
  title text NOT NULL, status text NOT NULL DEFAULT 'draft',
  created_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS impact_answers (
  id text PRIMARY KEY, impact_id text NOT NULL REFERENCES impact_assessments(id),
  question_id text NOT NULL, answer text NOT NULL DEFAULT ''
);
CREATE UNIQUE INDEX IF NOT EXISTS impact_answer_unique ON impact_answers(impact_id, question_id);
CREATE TABLE IF NOT EXISTS auditor_signoffs (
  id text PRIMARY KEY, assessment_id text NOT NULL UNIQUE REFERENCES assessments(id),
  auditor_user_id text NOT NULL REFERENCES users(id), opinion text NOT NULL,
  summary text NOT NULL DEFAULT '', signed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS monitoring_schedules (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), name text NOT NULL,
  cadence_hours integer NOT NULL DEFAULT 24, enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz, next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS monitoring_runs (
  id text PRIMARY KEY, schedule_id text NOT NULL REFERENCES monitoring_schedules(id),
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  status text NOT NULL DEFAULT 'ok', summary_json text NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS monitoring_alerts (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  run_id text REFERENCES monitoring_runs(id),
  severity text NOT NULL DEFAULT 'medium', kind text NOT NULL,
  message text NOT NULL, acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS eval_runs (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id), provider text NOT NULL DEFAULT 'mock',
  overall_score text NOT NULL DEFAULT '0', results_json text NOT NULL,
  pass_count integer NOT NULL DEFAULT 0, fail_count integer NOT NULL DEFAULT 0,
  created_by text REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
`;
