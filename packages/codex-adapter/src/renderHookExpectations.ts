import type {
  EvidenceContract
} from "@krn/harness";
import type {
  CodexHookExpectation
} from "./contracts.js";

const commandList = (evidenceContract: EvidenceContract): string =>
  evidenceContract.commands
    .filter((command) => command.required)
    .map((command) => command.command)
    .join(", ");

export const createCodexHookExpectations = (
  evidenceContract: EvidenceContract
): CodexHookExpectation[] => [
  {
    phase: "SessionStart",
    action: "inject_pointer",
    reason: "Surface the compact project and run pointer when configured.",
    required: false
  },
  {
    phase: "PreToolUse",
    action: "warn_or_deny",
    reason: "Guard destructive writes and commands before tool execution.",
    required: true
  },
  {
    phase: "PostToolUse",
    action: "record_signal",
    reason: `Capture command evidence for: ${commandList(evidenceContract)}`,
    required: true
  },
  {
    phase: "PreCompact",
    action: "require_handoff",
    reason: "Require a compact handoff pointer before context compaction.",
    required: true
  },
  {
    phase: "Stop",
    action: "suggest_evidence_capture",
    reason: "Suggest evidence capture before stopping the run.",
    required: false
  }
];

export const renderHookExpectations = (evidenceContract: EvidenceContract): string[] =>
  createCodexHookExpectations(evidenceContract).map((expectation) =>
    [
      expectation.phase,
      `action=${expectation.action}`,
      `required=${String(expectation.required)}`,
      `reason=${expectation.reason}`
    ].join(" | ")
  );
