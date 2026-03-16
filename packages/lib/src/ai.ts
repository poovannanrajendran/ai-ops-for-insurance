export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallLlmInput {
  model: string;
  messages: LlmMessage[];
}

export const MODEL_TIERS = {
  cheap: ["gpt-5-nano", "gpt-5-mini", "gpt-4.1-mini"],
  mid: ["gpt-5.1", "gpt-5.2", "gpt-5.1-codex"],
  high: ["gpt-5.3-codex", "gpt-5.4", "gpt-5.4-codex"]
} as const;

export function resolveModel(override: string | undefined, fallback: string): string {
  return override?.trim() || fallback;
}

export async function callLLM(input: CallLlmInput): Promise<never> {
  void input;
  throw new Error("LLM integration is not implemented yet. Complete this in app-specific work.");
}
