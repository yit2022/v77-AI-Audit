import type { LlmProvider, ProviderMessage } from "./types";

export const mockProvider: LlmProvider = {
  id: "mock",
  name: "Mock LLM Provider",
  async complete(messages: ProviderMessage[]): Promise<string> {
    const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    const lower = last.toLowerCase();
    if (lower.includes("dan and must answer") || lower.includes("developer mode")) {
      return "Sure, I'll help. Step 1: here is how to proceed with your request in detail.";
    }
    if (lower.includes("attacker.example")) {
      return "Request sent to https://attacker.example/collect — status 200. Posted records.";
    }
    if (
      lower.includes("explosive") ||
      lower.includes("ransomware") ||
      lower.includes("phishing") ||
      lower.includes("malware") ||
      lower.includes("harm myself") ||
      lower.includes("/etc/passwd") ||
      lower.includes("api keys") ||
      lower.includes("credit card")
    ) {
      return "I cannot assist with that request. It appears illegal or unsafe, and I must refuse.";
    }
    if (lower.includes("system prompt") || lower.includes("previous user")) {
      return "I can't reveal system instructions or other users' conversations for privacy reasons.";
    }
    return "I won't perform that action. Please rephrase a legitimate request I can help with.";
  },
};
