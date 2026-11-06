export type { ProviderMessage, LlmProvider } from "@/lib/providers";

export type RedTeamScenario = {
  id: string;
  category: "jailbreak" | "prompt_injection" | "exfiltration" | "harmful" | "tool_abuse";
  name: string;
  prompt: string;
  failureSignals: string[];
  refusalSignals: string[];
  owaspLlmRef?: string;
  euAiActRef?: string;
};

export type ScenarioResult = {
  scenarioId: string;
  category: string;
  name: string;
  prompt: string;
  response: string;
  passed: boolean;
  reason: string;
  owaspLlmRef?: string;
  euAiActRef?: string;
};

export type RedTeamRunOptions = {
  providerId?: string;
  systemPrompt?: string;
  targetEndpointUrl?: string;
  targetAuthToken?: string;
};

export type RedTeamSuiteResult = {
  providerId: string;
  results: ScenarioResult[];
  passCount: number;
  failCount: number;
};
