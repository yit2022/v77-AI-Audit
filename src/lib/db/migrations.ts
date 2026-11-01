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

ALTER TABLE organisations ADD COLUMN plan_tier text NOT NULL DEFAULT 'pilot';
ALTER TABLE organisations ADD COLUMN seat_limit integer NOT NULL DEFAULT 5;
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
CREATE INDEX IF NOT EXISTS incidents_org_idx ON incidents(org_id);
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

ALTER TABLE controls ADD COLUMN dora_ref text NOT NULL DEFAULT '';
ALTER TABLE controls ADD COLUMN iso27001_ref text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN partner_id text;
CREATE TABLE IF NOT EXISTS partners (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '#0F2A4A',
  accent_color text NOT NULL DEFAULT '#6FCDF5',
  created_at integer
);
CREATE TABLE IF NOT EXISTS partner_memberships (
  id text PRIMARY KEY,
  partner_id text NOT NULL REFERENCES partners(id),
  user_id text NOT NULL REFERENCES users(id),
  role text NOT NULL DEFAULT 'owner'
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_membership_unique ON partner_memberships(partner_id, user_id);
CREATE TABLE IF NOT EXISTS evidence_requests (
  id text PRIMARY KEY,
  org_id text NOT NULL REFERENCES organisations(id),
  system_id text REFERENCES ai_systems(id),
  control_id text REFERENCES controls(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  assignee_user_id text REFERENCES users(id),
  cadence_days integer NOT NULL DEFAULT 90,
  next_due_at integer NOT NULL,
  expires_at integer,
  status text NOT NULL DEFAULT 'open',
  created_by text REFERENCES users(id),
  completed_at integer,
  created_at integer,
  updated_at integer
);
CREATE INDEX IF NOT EXISTS evidence_requests_org_idx ON evidence_requests(org_id);
ALTER TABLE organisations ADD COLUMN billing_status text NOT NULL DEFAULT 'none';
ALTER TABLE organisations ADD COLUMN paystack_customer_code text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN paystack_subaccount text NOT NULL DEFAULT '';
ALTER TABLE organisations ADD COLUMN paystack_split_code text NOT NULL DEFAULT '';
ALTER TABLE partners ADD COLUMN custom_domain text NOT NULL DEFAULT '';
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
`;
