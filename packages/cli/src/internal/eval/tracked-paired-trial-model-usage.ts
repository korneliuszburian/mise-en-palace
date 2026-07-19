import type { CommandResult } from "./paired-live-codex-repair.js";

type JsonRecord = Record<string, unknown>;

type CodexTokenUsage = {
  readonly inputTokens: number;
  readonly cachedInputTokens: number;
  readonly outputTokens: number;
  readonly reasoningOutputTokens: number;
};

export type ModelUsageObservation =
  | {
      readonly tokenUsage: "available";
      readonly source: "turn.completed";
      readonly baseline: CodexTokenUsage;
      readonly krn: CodexTokenUsage;
    }
  | {
      readonly tokenUsage: "unavailable";
      readonly reason: string;
      readonly latencySource: "arm_command_duration_ms";
    };

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTokenCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const isCodexTokenUsage = (value: unknown): value is CodexTokenUsage =>
  isRecord(value) &&
  isTokenCount(value["inputTokens"]) &&
  isTokenCount(value["cachedInputTokens"]) &&
  isTokenCount(value["outputTokens"]) &&
  isTokenCount(value["reasoningOutputTokens"]);

export const isModelUsageObservation = (value: unknown): value is ModelUsageObservation =>
  isRecord(value) && (
    value["tokenUsage"] === "available"
      ? value["source"] === "turn.completed" &&
        isCodexTokenUsage(value["baseline"]) &&
        isCodexTokenUsage(value["krn"])
      : value["tokenUsage"] === "unavailable" &&
        typeof value["reason"] === "string" && value["reason"].trim().length > 0 &&
        value["latencySource"] === "arm_command_duration_ms"
  );

export const unavailableModelUsageObservation = (): ModelUsageObservation => ({
  tokenUsage: "unavailable",
  reason: "Codex structured trial output did not expose complete token usage for both arms; command durationMs is the recorded latency proxy.",
  latencySource: "arm_command_duration_ms"
});

const readCodexTokenUsage = (stdout: string): CodexTokenUsage | undefined => {
  for (const line of stdout.trim().split("\n").reverse()) {
    try {
      const event: unknown = JSON.parse(line);
      if (!isRecord(event) || event["type"] !== "turn.completed" || !isRecord(event["usage"])) continue;
      const usage = event["usage"];
      const parsed = {
        inputTokens: usage["input_tokens"],
        cachedInputTokens: usage["cached_input_tokens"],
        outputTokens: usage["output_tokens"],
        reasoningOutputTokens: usage["reasoning_output_tokens"]
      };
      return isCodexTokenUsage(parsed) ? parsed : undefined;
    } catch {
      continue;
    }
  }
  return undefined;
};

export const observeModelUsage = (
  baseline: CommandResult,
  krn: CommandResult
): ModelUsageObservation => {
  const baselineUsage = readCodexTokenUsage(baseline.stdout);
  const krnUsage = readCodexTokenUsage(krn.stdout);
  return baselineUsage === undefined || krnUsage === undefined
    ? unavailableModelUsageObservation()
    : {
        tokenUsage: "available",
        source: "turn.completed",
        baseline: baselineUsage,
        krn: krnUsage
      };
};
