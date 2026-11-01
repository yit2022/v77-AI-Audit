export type PolicyTemplate = {
  id: string;
  title: string;
  category: "ai_policy" | "acceptable_use" | "model_risk";
  body: string;
};

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "ai-policy",
    title: "Organisational AI Policy",
    category: "ai_policy",
    body: `# Organisational AI Policy

## 1. Purpose
This policy sets governance expectations for the design, procurement, deployment and monitoring of AI systems at {{ORG_NAME}}.

## 2. Scope
Applies to all staff, contractors and vendors who develop, procure or operate AI systems that affect {{ORG_NAME}} customers, employees or the public.

## 3. Roles
- **AI Owner** — accountable for a registered system in V77 Trust.
- **Reviewer** — approves material changes and assessment packs.
- **Auditor** — read-only assurance access.

## 4. Inventory & classification
All AI systems must be registered and EU AI Act risk-classified before production use.

## 5. Human oversight & transparency
High-risk systems require documented human oversight and user-facing transparency measures.

## 6. Data protection
Personal data processing must have a lawful basis and, where required, a DPIA linked to FRIA work.

## 7. Incidents
Serious incidents are logged in the V77 Trust incident register and escalated per EU AI Act Art. 73 expectations.

## 8. Review
This policy is reviewed at least annually or after material regulatory change.

_Operator note: V77 Trust is operated by Vertex77 sp. z o.o. This template is not legal advice._
`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use of AI Systems",
    category: "acceptable_use",
    body: `# Acceptable Use of AI Systems

## Allowed
- Assistive drafting, summarisation and coding with human review.
- Decision-support where the human remains accountable for outcomes.

## Prohibited
- Using AI to discriminate unlawfully or to circumvent safety, privacy or security controls.
- Feeding secrets, payment card data or special-category data into unapproved tools.
- Deploying unregistered high-risk systems.

## Reporting
Suspected misuse is reported via the incident register in V77 Trust (in-app). No automated email escalation is performed by the platform.

_Template for {{ORG_NAME}} — customise before adoption._
`,
  },
  {
    id: "mrm",
    title: "Model Risk Management Standard",
    category: "model_risk",
    body: `# Model Risk Management Standard

## 1. Model inventory
Every model or AI system is recorded with intended use, value-chain role and risk tier.

## 2. Validation
Pre-production validation covers performance, fairness, robustness and documentation (model card).

## 3. Ongoing monitoring
Monitoring schedules and re-assessments are configured in V77 Trust. Reminders are in-app only.

## 4. Change control
Material model changes require reviewer approval and updated evidence.

## 5. Third parties
Vendor AI is assessed via the third-party questionnaire before reliance.

## 6. Documentation
Model cards and Annex IV-style technical documentation are maintained for high-risk systems.

_{{ORG_NAME}} — pricing for managed assurance programmes is on request (sales@vertex77.com)._
`,
  },
];

export function renderTemplate(body: string, orgName: string): string {
  return body.replaceAll("{{ORG_NAME}}", orgName);
}
