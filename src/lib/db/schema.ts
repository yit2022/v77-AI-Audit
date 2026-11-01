import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const ROLES = ["admin", "ai_owner", "auditor"] as const;
export type Role = (typeof ROLES)[number];

export const organisations = pgTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fairnessRuns = pgTable("fairness_runs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  filename: text("filename").notNull(),
  metricsJson: text("metrics_json").notNull(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditorComments = pgTable("auditor_comments", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().references(() => organisations.id),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id),
  authorUserId: text("author_user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditorSignoffs = pgTable("auditor_signoffs", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull().references(() => assessments.id).unique(),
  auditorUserId: text("auditor_user_id").notNull().references(() => users.id),
  opinion: text("opinion").notNull(),
  summary: text("summary").notNull().default(""),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const monitoringRuns = pgTable("monitoring_runs", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id").notNull().references(() => monitoringSchedules.id),
  orgId: text("org_id").notNull().references(() => organisations.id),
  systemId: text("system_id").notNull().references(() => aiSystems.id),
  status: text("status").notNull().default("ok"),
  summaryJson: text("summary_json").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
