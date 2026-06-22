import type {
  EvidenceContract
} from "@krn/harness";
import type {
  CodexHookExpectation,
  CodexHookExpectationProjection
} from "./contracts.js";

const requiredCommands = (evidenceContract: EvidenceContract): string[] =>
  evidenceContract.commands
    .filter((command) => command.required)
    .map((command) => command.command);

const hookProjectionRules = [
  "only expectations/projections",
  "no hidden semantic decisions",
  "no actual hook scripts unless already conventional and decision-recorded"
] as const;

const hookProjectionDoesNotDo = [
  "create hook scripts",
  "execute hooks",
  "make hidden semantic decisions",
  "invoke Codex",
  "mutate memory"
] as const;

export const createCodexHookExpectationProjection = (
  evidenceContract: EvidenceContract
): CodexHookExpectationProjection => {
  const commandEvidence = requiredCommands(evidenceContract).map(
    (command) => `command evidence: ${command}`
  );

  return {
    title: "KRN Codex Hook Expectation Projection",
    expectations: [
      {
        phase: "SessionStart",
        action: "inject_pointer",
        reason: "Inject compact project and run pointers when configured.",
        required: false,
        appliesTo: ["compact project pointer", "execution run pointer"]
      },
      {
        phase: "PreToolUse",
        action: "warn_or_deny",
        reason:
          "Warn or deny destructive paths, generated files, destructive/write actions, and tool-boundary drift before tool execution.",
        required: true,
        appliesTo: [
          "destructive paths",
          "generated files",
          "destructive/write approval",
          "tool boundary notes"
        ]
      },
      {
        phase: "PostToolUse",
        action: "record_signal",
        reason: "Capture command evidence and record failure or success signals.",
        required: true,
        appliesTo: [
          ...(commandEvidence.length === 0
            ? ["command evidence: no required commands"]
            : commandEvidence),
          "failure signal",
          "success signal"
        ]
      },
      {
        phase: "PreCompact",
        action: "require_handoff",
        reason: "Require a compact handoff pointer before context compaction.",
        required: true,
        appliesTo: ["compact handoff pointer"]
      },
      {
        phase: "Stop",
        action: "suggest_evidence_capture",
        reason: "Require an evidence capture suggestion before stopping the run.",
        required: true,
        appliesTo: ["evidence capture suggestion"]
      }
    ],
    rules: [...hookProjectionRules],
    doesNotDo: [...hookProjectionDoesNotDo]
  };
};

export const createCodexHookExpectations = (
  evidenceContract: EvidenceContract
): CodexHookExpectation[] =>
  createCodexHookExpectationProjection(evidenceContract).expectations;

const renderExpectation = (expectation: CodexHookExpectation): string =>
  [
    expectation.phase,
    `action=${expectation.action}`,
    `required=${String(expectation.required)}`,
    ...(expectation.appliesTo === undefined
      ? []
      : [`applies_to=${expectation.appliesTo.join(", ")}`]),
    `reason=${expectation.reason}`
  ].join(" | ");

export const renderHookExpectationProjection = (
  projection: CodexHookExpectationProjection
): string[] => [
  projection.title,
  ...projection.expectations.map((expectation) => renderExpectation(expectation)),
  "Rules:",
  ...projection.rules.map((rule) => `- ${rule}`),
  "Does Not Do:",
  ...projection.doesNotDo.map((rule) => `- ${rule}`)
];

export const renderHookExpectations = (evidenceContract: EvidenceContract): string[] =>
  renderHookExpectationProjection(createCodexHookExpectationProjection(evidenceContract));
