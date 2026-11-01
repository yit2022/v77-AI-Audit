import { relations } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const boolean = (name: string) => integer(name, { mode: "boolean" });
const timestamp = (name: string, _opts?: { withTimezone?: boolean }) => {
  void _opts;
  return integer(name, { mode: "timestamp_ms" });
};
const pgTable = sqliteTable;

export const ROLES = ["admin", "ai_owner", "reviewer", "auditor"] as const;
export type Role = (typeof ROLES)[number];

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  trustPublic: boolean("trust_public").notNull().default(false),
  trustSummary: text("trust_summary").notNull().default(""),
  trustContactEmail: text("trust_contact_email").notNull().default(""),
  planTier: text("plan_tier").notNull().default("pilot"),
  seatLimit: integer("seat_limit").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const memberships = pgTable(
  "memberships",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").notNull().references(() => organisations.id),
    userId: text("user_id").notNull().references(() => users.id),
    role: text("role").notNull(),
  },
  (t) => [uniqueIndex("membership_org_user").on(t.orgId, t.userId)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  orgId: text("org_id").notNull().references(() => organisations.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const aiSystems = pgTable("ai_systems", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  intendedPurpose: text("intended_purpose").notNull().default(""),
  roleInValueChain: text("role_in_value_chain").notNull().default("provider"),
  domain: text("domain").notNull().default("general"),
  ownerUserId: text("owner_user_id").references(() => users.id),
  riskTier: text("risk_tier"),
  classificationNotes: text("classification_notes").default(""),
  gpai: boolean("gpai").notNull().default(false),
  lifecycleStatus: text("lifecycle_status").notNull().default("discovered"),
  versionLabel: text("version_label").notNull().default(""),
  vendorName: text("vendor_name").notNull().default(""),
  euDatabaseId: text("eu_database_id").notNull().default(""),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const classificationAnswers = pgTable("classification_answers", {
  id: text("id").primaryKey(),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  questionId: text("question_id").notNull(),
  answer: text("answer").notNull(),
  rationale: text("rationale").default(""),
});

export const controls = pgTable("controls", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  area: text("area").notNull(),
  euRef: text("eu_ref").notNull().default(""),
  nistRef: text("nist_ref").notNull().default(""),
  isoRef: text("iso_ref").notNull().default(""),
  gdprRef: text("gdpr_ref").notNull().default(""),
  appliesTo: text("applies_to").notNull().default("high_risk"),
});

export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const assessmentControls = pgTable(
  "assessment_controls",
  {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id").notNull().references(() => assessments.id),
    controlId: text("control_id").notNull().references(() => controls.id),
    status: text("status").notNull().default("not_started"),
    ownerUserId: text("owner_user_id").references(() => users.id),
    notes: text("notes").default(""),
  },
  (t) => [uniqueIndex("assessment_control_unique").on(t.assessmentId, t.controlId)],
);

export const evidenceItems = pgTable("evidence_items", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").references(() => aiSystems.id),
  controlId: text("control_id").references(() => controls.id),
  assessmentControlId: text("assessment_control_id").references(() => assessmentControls.id),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  contentType: text("content_type").notNull().default("application/octet-stream"),
  sha256: text("sha256").notNull().default(""),
  prevSha256: text("prev_sha256").notNull().default(""),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const fairnessRuns = pgTable("fairness_runs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  filename: text("filename").notNull(),
  metricsJson: text("metrics_json").notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const redteamRuns = pgTable("redteam_runs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  provider: text("provider").notNull().default("mock"),
  resultsJson: text("results_json").notNull(),
  passCount: integer("pass_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const auditorComments = pgTable("auditor_comments", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  authorUserId: text("author_user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const auditorSignoffs = pgTable("auditor_signoffs", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id).unique(),
  auditorUserId: text("auditor_user_id").notNull().references(() => users.id),
  opinion: text("opinion").notNull(),
  summary: text("summary").notNull().default(""),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const organisationsRelations = relations(organisations, ({ many }) => ({
  memberships: many(memberships),
  systems: many(aiSystems),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const impactAssessments = pgTable("impact_assessments", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  templateId: text("template_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const impactAnswers = pgTable(
  "impact_answers",
  {
    id: text("id").primaryKey(),
    impactId: text("impact_id").notNull().references(() => impactAssessments.id),
    questionId: text("question_id").notNull(),
    answer: text("answer").notNull().default(""),
  },
  (t) => [uniqueIndex("impact_answer_unique").on(t.impactId, t.questionId)],
);

export const monitoringSchedules = pgTable("monitoring_schedules", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  name: text("name").notNull(),
  cadenceHours: integer("cadence_hours").notNull().default(24),
  enabled: boolean("enabled").notNull().default(true),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const monitoringRuns = pgTable("monitoring_runs", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id").notNull().references(() => monitoringSchedules.id),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  status: text("status").notNull().default("ok"),
  summaryJson: text("summary_json").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const monitoringAlerts = pgTable("monitoring_alerts", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  runId: text("run_id").references(() => monitoringRuns.id),
  severity: text("severity").notNull().default("medium"),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
  acknowledged: boolean("acknowledged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const evalRuns = pgTable("eval_runs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  provider: text("provider").notNull().default("mock"),
  overallScore: text("overall_score").notNull().default("0"),
  resultsJson: text("results_json").notNull(),
  passCount: integer("pass_count").notNull().default(0),
  failCount: integer("fail_count").notNull().default(0),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const findings = pgTable("findings", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  assessmentId: text("assessment_id").references(() => assessments.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  frameworkRef: text("framework_ref").notNull().default(""),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const remediationTasks = pgTable("remediation_tasks", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  findingId: text("finding_id").notNull().references(() => findings.id),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ownerUserId: text("owner_user_id").references(() => users.id),
  ownerName: text("owner_name").notNull().default(""),
  dueDate: text("due_date"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  actorUserId: text("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull().default(""),
  detailJson: text("detail_json").notNull().default("{}"),
  prevSha256: text("prev_sha256").notNull().default(""),
  sha256: text("sha256").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull(),
  role: text("role").notNull().default("ai_owner"),
  createdBy: text("created_by").references(() => users.id),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const orgInvites = pgTable("org_invites", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  email: text("email").notNull(),
  role: text("role").notNull().default("ai_owner"),
  token: text("token").notNull().unique(),
  invitedBy: text("invited_by").references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const pilotLeads = pgTable("pilot_leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull().default(""),
  roleTitle: text("role_title").notNull().default(""),
  message: text("message").notNull().default(""),
  source: text("source").notNull().default("landing"),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});


export const euAnnexDocs = pgTable("eu_annex_docs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  answersJson: text("answers_json").notNull().default("{}"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const euConformitySteps = pgTable("eu_conformity_steps", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  stepId: text("step_id").notNull(),
  status: text("status").notNull().default("not_started"),
  notes: text("notes").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});


export const approvalRequests = pgTable("approval_requests", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("pending"),
  requestedBy: text("requested_by").references(() => users.id),
  reviewedBy: text("reviewed_by").references(() => users.id),
  decisionNote: text("decision_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export const reassessmentSchedules = pgTable("reassessment_schedules", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  cadenceDays: integer("cadence_days").notNull().default(90),
  nextDueAt: timestamp("next_due_at", { withTimezone: true }).notNull(),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const inAppReminders = pgTable("in_app_reminders", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  userId: text("user_id").references(() => users.id),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  href: text("href").notNull().default(""),
  dueAt: timestamp("due_at", { withTimezone: true }),
  acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const clientErrorEvents = pgTable("client_error_events", {
  id: text("id").primaryKey(),
  orgId: text("org_id"),
  message: text("message").notNull(),
  stack: text("stack").notNull().default(""),
  url: text("url").notNull().default(""),
  userAgent: text("user_agent").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const PLAN_TIERS = ["pilot", "team", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const planCatalog = pgTable("plan_catalog", {
  id: text("id").primaryKey(),
  tier: text("tier").notNull().unique(),
  name: text("name").notNull(),
  seatLimit: integer("seat_limit").notNull().default(5),
  priceNote: text("price_note").notNull().default("Pricing on request"),
  featuresJson: text("features_json").notNull().default("[]"),
});

export const gapAnalyses = pgTable("gap_analyses", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  assessmentId: text("assessment_id").references(() => assessments.id),
  provider: text("provider").notNull().default("mock"),
  summary: text("summary").notNull().default(""),
  gapsJson: text("gaps_json").notNull().default("[]"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const policyDocuments = pgTable("policy_documents", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  templateId: text("template_id").notNull(),
  title: text("title").notNull(),
  bodyMarkdown: text("body_markdown").notNull().default(""),
  status: text("status").notNull().default("draft"),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const vendorQuestionnaires = pgTable("vendor_questionnaires", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  vendorName: text("vendor_name").notNull(),
  token: text("token").notNull().unique(),
  status: text("status").notNull().default("open"),
  answersJson: text("answers_json").notNull().default("{}"),
  riskScore: text("risk_score").notNull().default(""),
  createdBy: text("created_by").references(() => users.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const incidents = pgTable("incidents", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").references(() => aiSystems.id),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  discoveredAt: text("discovered_at").notNull().default(""),
  occurredAt: text("occurred_at").notNull().default(""),
  description: text("description").notNull().default(""),
  impactSummary: text("impact_summary").notNull().default(""),
  rootCause: text("root_cause").notNull().default(""),
  correctiveActions: text("corrective_actions").notNull().default(""),
  authorityNotified: boolean("authority_notified").notNull().default(false),
  authorityNotifiedAt: text("authority_notified_at").notNull().default(""),
  seriousIncident: boolean("serious_incident").notNull().default(false),
  euArticleRef: text("eu_article_ref").notNull().default("Art. 73"),
  createdBy: text("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const modelCards = pgTable("model_cards", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  version: text("version").notNull().default("1.0"),
  intendedUse: text("intended_use").notNull().default(""),
  outOfScope: text("out_of_scope").notNull().default(""),
  trainingDataSummary: text("training_data_summary").notNull().default(""),
  evaluationSummary: text("evaluation_summary").notNull().default(""),
  ethicalConsiderations: text("ethical_considerations").notNull().default(""),
  limitations: text("limitations").notNull().default(""),
  caveats: text("caveats").notNull().default(""),
  contact: text("contact").notNull().default(""),
  updatedBy: text("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().$defaultFn(() => new Date()),
});

export const platformUsageDaily = pgTable("platform_usage_daily", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  day: text("day").notNull(),
  apiCalls: integer("api_calls").notNull().default(0),
  aiCalls: integer("ai_calls").notNull().default(0),
  evidenceUploads: integer("evidence_uploads").notNull().default(0),
});
