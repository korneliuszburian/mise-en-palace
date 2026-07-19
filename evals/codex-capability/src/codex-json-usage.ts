import type { CodexCapabilityUsageSource } from "./contracts.js";

export type CodexExecTokenUsage = {
  readonly inputTokens: number;
  readonly cachedInputTokens: number;
  readonly outputTokens: number;
  readonly reasoningOutputTokens: number;
  readonly totalTokens: number;
};

export type CodexExecUsageObservation =
  | {
      readonly status: "available";
      readonly source: "codex_exec_json";
      readonly lineNumber: number;
      readonly usage: CodexExecTokenUsage;
    }
  | {
      readonly status: "unavailable";
      readonly source: CodexCapabilityUsageSource;
      readonly reason: string;
    };

export const extractCodexExecUsageFromJsonLines = (
  output: string
): CodexExecUsageObservation => {
  const latest = latestUsageObservation(output.split(/\r?\n/u));
  return latest ?? unavailableUsageObservation();
};

const latestUsageObservation = (
  lines: readonly string[]
): Extract<CodexExecUsageObservation, { readonly status: "available" }> | undefined => {
  let latest: Extract<CodexExecUsageObservation, { readonly status: "available" }> | undefined;

  for (const [index, rawLine] of lines.entries()) {
    latest = usageObservationFromLine(rawLine, index + 1) ?? latest;
  }

  return latest;
};

const usageObservationFromLine = (
  rawLine: string,
  lineNumber: number
): Extract<CodexExecUsageObservation, { readonly status: "available" }> | undefined => {
  const event = completedTurnEvent(rawLine);
  const usage = event === undefined ? undefined : readUsage(event["usage"]);
  return usage === undefined
    ? undefined
    : {
        status: "available",
        source: "codex_exec_json",
        lineNumber,
        usage
      };
};

const completedTurnEvent = (rawLine: string): Record<string, unknown> | undefined => {
  const line = rawLine.trim();
  const parsed = line.length === 0 ? undefined : parseJsonLine(line);
  return isRecord(parsed) && parsed["type"] === "turn.completed" ? parsed : undefined;
};

const unavailableUsageObservation = (): CodexExecUsageObservation => ({
  status: "unavailable",
  source: "codex_exec_json",
  reason: "No turn.completed event with numeric usage was present in codex exec JSON output."
});

const parseJsonLine = (line: string): unknown => {
  try {
    return JSON.parse(line);
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readUsage = (value: unknown): CodexExecTokenUsage | undefined => {
  if (!isRecord(value)) return undefined;

  const tokenCounts = readTokenCounts(value);
  if (tokenCounts === undefined) return undefined;

  const [inputTokens, cachedInputTokens, outputTokens, reasoningOutputTokens] = tokenCounts;
  return {
    inputTokens,
    cachedInputTokens,
    outputTokens,
    reasoningOutputTokens,
    totalTokens: inputTokens + outputTokens
  };
};

const readTokenCounts = (
  value: Record<string, unknown>
): readonly [number, number, number, number] | undefined => {
  const counts = [
    readTokenCount(value["input_tokens"]),
    readTokenCount(value["cached_input_tokens"]),
    readTokenCount(value["output_tokens"]),
    readTokenCount(value["reasoning_output_tokens"])
  ];
  if (!isCompleteTokenCountTuple(counts)) {
    return undefined;
  }
  return counts;
};

const isCompleteTokenCountTuple = (
  values: readonly (number | undefined)[]
): values is readonly [number, number, number, number] =>
  values.length === 4 && values.every((value) => value !== undefined);

const readTokenCount = (value: unknown): number | undefined =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0
    ? value
    : undefined;
