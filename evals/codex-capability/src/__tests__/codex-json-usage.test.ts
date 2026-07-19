import assert from "node:assert/strict";
import test from "node:test";

import {
  extractCodexExecUsageFromJsonLines
} from "../codex-json-usage.js";

test("Codex exec JSON usage extraction reads token usage from turn.completed", () => {
  const output = [
    JSON.stringify({ type: "item.completed", item: { type: "agent_message" } }),
    JSON.stringify({
      type: "turn.completed",
      usage: {
        input_tokens: 131839,
        cached_input_tokens: 106240,
        output_tokens: 1300,
        reasoning_output_tokens: 337
      }
    })
  ].join("\n");

  assert.deepEqual(extractCodexExecUsageFromJsonLines(output), {
    status: "available",
    source: "codex_exec_json",
    lineNumber: 2,
    usage: {
      inputTokens: 131839,
      cachedInputTokens: 106240,
      outputTokens: 1300,
      reasoningOutputTokens: 337,
      totalTokens: 133139
    }
  });
});

test("Codex exec JSON usage extraction does not invent missing token usage", () => {
  const result = extractCodexExecUsageFromJsonLines(
    JSON.stringify({ type: "turn.completed", status: "ok" })
  );

  assert.deepEqual(result, {
    status: "unavailable",
    source: "codex_exec_json",
    reason: "No turn.completed event with numeric usage was present in codex exec JSON output."
  });
});
