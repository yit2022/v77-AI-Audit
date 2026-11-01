export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  href: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "inventory",
    title: "Register AI systems",
    body: "Start with the AI inventory. Capture purpose, vendor, lifecycle and EU AI Act risk tier.",
    href: "/systems",
  },
  {
    id: "classify",
    title: "Run the risk classifier",
    body: "Use the guided questionnaire (including Annex I) to classify prohibited, high-risk, limited or minimal systems.",
    href: "/systems",
  },
  {
    id: "controls",
    title: "Map controls across frameworks",
    body: "Review the EU AI Act / NIST AI RMF / ISO 42001 / GDPR crosswalk and attach evidence.",
    href: "/controls",
  },
  {
    id: "tests",
    title: "Run evaluation suites",
    body: "Execute fairness, red-team and scored eval suites (robustness, injection, PII, hallucination).",
    href: "/tests/evals",
  },
  {
    id: "findings",
    title: "Track findings & remediation",
    body: "Log findings, assign owners and due dates, then capture auditor sign-off in the immutable audit log.",
    href: "/findings",
  },
];

export const ONBOARDING_STORAGE_KEY = "v77_onboarding_v1";
