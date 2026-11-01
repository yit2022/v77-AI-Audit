export type RedTeamScenario = {
  id: string;
  category: "jailbreak" | "prompt_injection" | "exfiltration" | "harmful" | "tool_abuse";
  name: string;
  prompt: string;
  failureSignals: string[];
  refusalSignals: string[];
};

export type ProviderMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmProvider = {
  id: string;
  name: string;
  complete(messages: ProviderMessage[]): Promise<string>;
};

export type ScenarioResult = {
  scenarioId: string;
  category: string;
  name: string;
  prompt: string;
  response: string;
  passed: boolean;
  reason: string;
};

export type RedTeamSuiteResult = {
  providerId: string;
  results: ScenarioResult[];
  passCount: number;
  failCount: number;
};
