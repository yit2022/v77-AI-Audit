export const DDL = `
CREATE TABLE IF NOT EXISTS organisations (
  id text PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE,
  trust_public integer NOT NULL DEFAULT 0,
  trust_summary text NOT NULL DEFAULT '',
  trust_contact_email text NOT NULL DEFAULT '',
  plan_tier text NOT NULL DEFAULT 'pilot',
  seat_limit integer NOT NULL DEFAULT 5,
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
  iso_ref text NOT NULL DEFAULT '', gdpr_ref text NOT NULL DEFAULT '',
  dora_ref text NOT NULL DEFAULT '', iso27001_ref text NOT NULL DEFAULT '',
  applies_to text NOT NULL DEFAULT 'high_risk'
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
CREATE TABLE IF NOT EXISTS findings (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  assessment_id text REFERENCES assessments(id),
  title text NOT NULL, description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium', status text NOT NULL DEFAULT 'open',
  framework_ref text NOT NULL DEFAULT '',
  created_by text REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS remediation_tasks (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  finding_id text NOT NULL REFERENCES findings(id),
  title text NOT NULL, description text NOT NULL DEFAULT '',
  owner_user_id text REFERENCES users(id), owner_name text NOT NULL DEFAULT '',
  due_date text, status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  actor_user_id text REFERENCES users(id),
  action text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL DEFAULT '',
  detail_json text NOT NULL DEFAULT '{}',
  prev_sha256 text NOT NULL DEFAULT '', sha256 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_keys (
  id text PRIMARY KEY, org_id text NOT NULL REFERENCES organisations(id),
  name text NOT NULL, key_prefix text NOT NULL, key_hash text NOT NULL,
  role text NOT NULL DEFAULT 'ai_owner',
  created_by text REFERENCES users(id),
  last_used_at timestamptz, revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pilot_leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL DEFAULT '',
  role_title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'landing',
  status text NOT NULL DEFAULT 'new',
  notes text NOT NULL DEFAULT '',
  updated_at integer,
  created_at integer
);
CREATE INDEX IF NOT EXISTS pilot_leads_email_idx ON pilot_leads(email);

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

CREATE TABLE IF NOT EXISTS plan_catalog (
  id text PRIMARY KEY,
  tier text NOT NULL UNIQUE,
  name text NOT NULL,
  seat_limit integer NOT NULL DEFAULT 5,
  price_note text NOT NULL DEFAULT 'Pricing on request',
  features_json text NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS gap_analyses (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  assessment_id text REFERENCES assessments(id),
  provider text NOT NULL DEFAULT 'mock',
  summary text NOT NULL DEFAULT '',
  gaps_json text NOT NULL DEFAULT '[]',
  created_by text REFERENCES users(id),
  created_at integer
);
CREATE TABLE IF NOT EXISTS policy_documents (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  template_id text NOT NULL,
  title text NOT NULL,
  body_markdown text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  updated_by text REFERENCES users(id),
  updated_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS vendor_questionnaires (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  vendor_name text NOT NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open',
  answers_json text NOT NULL DEFAULT '{}',
  risk_score text NOT NULL DEFAULT '',
  created_by text REFERENCES users(id),
  submitted_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS incidents (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text REFERENCES ai_systems(id),
  title text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  discovered_at text NOT NULL DEFAULT '',
  occurred_at text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  impact_summary text NOT NULL DEFAULT '',
  root_cause text NOT NULL DEFAULT '',
  corrective_actions text NOT NULL DEFAULT '',
  authority_notified integer NOT NULL DEFAULT 0,
  authority_notified_at text NOT NULL DEFAULT '',
  serious_incident integer NOT NULL DEFAULT 0,
  eu_article_ref text NOT NULL DEFAULT 'Art. 73',
  created_by text REFERENCES users(id),
  updated_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS model_cards (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text NOT NULL REFERENCES ai_systems(id),
  version text NOT NULL DEFAULT '1.0',
  intended_use text NOT NULL DEFAULT '',
  out_of_scope text NOT NULL DEFAULT '',
  training_data_summary text NOT NULL DEFAULT '',
  evaluation_summary text NOT NULL DEFAULT '',
  ethical_considerations text NOT NULL DEFAULT '',
  limitations text NOT NULL DEFAULT '',
  caveats text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  updated_by text REFERENCES users(id),
  updated_at integer,
  created_at integer
);
CREATE TABLE IF NOT EXISTS platform_usage_daily (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  day text NOT NULL,
  api_calls integer NOT NULL DEFAULT 0,
  ai_calls integer NOT NULL DEFAULT 0,
  evidence_uploads integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS vendor_q_token_idx ON vendor_questionnaires(token);

CREATE TABLE IF NOT EXISTS notifications (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  user_id text,
  kind text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  read_at integer,
  created_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_org_idx ON notifications(org_id);
CREATE TABLE IF NOT EXISTS org_onboarding (
  id text PRIMARY KEY,
  org_id text NOT NULL,
  step_id text NOT NULL,
  done integer NOT NULL DEFAULT 0,
  done_at integer,
  updated_at integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS org_onboarding_org_step ON org_onboarding(org_id, step_id);

CREATE INDEX IF NOT EXISTS incidents_org_idx ON incidents(org_id);
CREATE TABLE IF NOT EXISTS billing_invoices (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  plan_tier text NOT NULL,
  amount_eur_cents integer NOT NULL DEFAULT 0,
  charge_currency text NOT NULL DEFAULT 'USD',
  charge_amount_minor integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paystack_reference text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  paid_at integer,
  created_at integer,
  updated_at integer
);
CREATE INDEX IF NOT EXISTS billing_invoices_org_idx ON billing_invoices(org_id);
CREATE INDEX IF NOT EXISTS billing_invoices_ref_idx ON billing_invoices(paystack_reference);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at integer NOT NULL,
  used_at integer,
  created_at integer
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id);


CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  token_hash text NOT NULL UNIQUE,
  created_at integer
);
CREATE TABLE IF NOT EXISTS lifecycle_email_log (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  user_id text REFERENCES users(id),
  kind text NOT NULL,
  sent_at integer
);
CREATE UNIQUE INDEX IF NOT EXISTS lifecycle_email_log_uniq ON lifecycle_email_log(org_id, kind);
`;
