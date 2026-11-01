export type VendorQuestion = { id: string; section: string; prompt: string; riskWeight: number };

export const VENDOR_QUESTIONS: VendorQuestion[] = [
  { id: "v1", section: "Identity", prompt: "Legal name and primary contact for the AI product/service.", riskWeight: 1 },
  { id: "v2", section: "Identity", prompt: "Describe the AI capability you provide and where inference runs (EU / other).", riskWeight: 2 },
  { id: "v3", section: "Risk", prompt: "EU AI Act risk tier you believe applies and why.", riskWeight: 3 },
  { id: "v4", section: "Risk", prompt: "List prohibited or high-risk use cases you refuse to support.", riskWeight: 2 },
  { id: "v5", section: "Data", prompt: "What customer data do you process? Is personal data included?", riskWeight: 3 },
  { id: "v6", section: "Data", prompt: "Sub-processors and cross-border transfers (list).", riskWeight: 2 },
  { id: "v7", section: "Security", prompt: "Summarise access control, encryption, and logging for the service.", riskWeight: 2 },
  { id: "v8", section: "Assurance", prompt: "Attach or describe available SOC2 / ISO 27001 / ISO 42001 evidence (names only).", riskWeight: 2 },
  { id: "v9", section: "Assurance", prompt: "How do you handle serious incidents and customer notification timelines?", riskWeight: 3 },
  { id: "v10", section: "Models", prompt: "Foundation models used, fine-tuning practices, and evaluation cadence.", riskWeight: 2 },
];

export function scoreAnswers(answers: Record<string, string>): { score: number; label: string } {
  let risk = 0;
  let answered = 0;
  for (const q of VENDOR_QUESTIONS) {
    const a = (answers[q.id] || "").trim();
    if (!a) {
      risk += q.riskWeight * 2;
      continue;
    }
    answered += 1;
    const lower = a.toLowerCase();
    if (lower.includes("high-risk") || lower.includes("personal data") || lower.includes("no evidence")) {
      risk += q.riskWeight;
    }
  }
  const max = VENDOR_QUESTIONS.reduce((s, q) => s + q.riskWeight * 2, 0);
  const pct = Math.round((1 - risk / max) * 100);
  const label = pct >= 75 ? "lower" : pct >= 50 ? "moderate" : "elevated";
  return { score: pct, label: `${label} (${pct}/100 completeness-adjusted)` };
}
