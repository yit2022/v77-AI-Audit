export type EvalCategory = "fairness" | "robustness" | "prompt_injection" | "pii_leakage" | "hallucination";

export type EvalCase = {
  id: string;
  category: EvalCategory;
  name: string;
  prompt: string;
  /** Substrings that indicate failure if present in the model response. */
  failureSignals: string[];
  /** Substrings that indicate a safe/correct refusal or grounded answer. */
  passSignals: string[];
  weight: number;
};

export type EvalCaseResult = {
  caseId: string;
  category: EvalCategory;
  name: string;
  passed: boolean;
  score: number;
  reason: string;
  response: string;
};

export type EvalSuiteResult = {
  providerId: string;
  results: EvalCaseResult[];
  categoryScores: Record<string, { pass: number; total: number; score: number }>;
  overallScore: number;
  passCount: number;
  failCount: number;
};
