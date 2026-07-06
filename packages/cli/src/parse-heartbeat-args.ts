import type {
  ParseArgsResult
} from "./parse-args.js";

export const formatHeartbeatUsage = (): string =>
  [
    "Usage: krn maintenance preview [--project <project-id>] [--memory-limit <n>] [--source-claim-limit <n>] [--near-expiry-days <n>] [--max-candidates <n>] [--evidence-ref <ref>] [--candidate-kind <kind>] [--acquisition-readback-file <path>] [--consensus-candidate-file <path>] [--review-candidate-id <id> --review-decision <decision> --review-reason <text> --review-evidence-ref <ref>] [--reviewer <name>] [--json]",
    "",
    "Read-only operator commands:",
    "krn maintenance preview",
    "legacy alias: krn heartbeat preview",
    "",
    "Optional:",
    "--project <project-id>",
    "--memory-limit <positive-integer>",
    "--source-claim-limit <positive-integer>",
    "--near-expiry-days <positive-integer>",
    "--max-candidates <positive-integer>",
    "--evidence-ref <ref>",
    "--candidate-kind memory_staleness|source_relation|knowledge_acquisition|consensus_evaluation",
    "--acquisition-readback-file <path-to-brain-or-source-search-json>",
    "--consensus-candidate-file <path-to-consensus-candidate-json>",
    "--review-candidate-id <id>",
    "--review-decision accept_for_manual_followup|defer_pending_evidence|reject_not_actionable",
    "--review-reason <text>",
    "--review-evidence-ref <ref>",
    "--reviewer <name>",
    "--json",
    "",
    "Note: maintenance preview reads current Postgres memory/source state and renders candidate-only maintenance output. Optional review fields record a manual review result in output only. It does not mutate Memory Core, source truth, source decisions, worker runtime state, or DB schema."
  ].join("\n") + "\n";

const parsePositiveInteger = (
  value: string,
  option: string
): { ok: true; value: number } | { ok: false; error: string } => {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed.toString() !== value.trim()) {
    return {
      ok: false,
      error: `${option} must be a positive integer`
    };
  }

  return {
    ok: true,
    value: parsed
  };
};

type HeartbeatParseState = {
  projectId: string | undefined;
  memoryLimit: number | undefined;
  sourceClaimLimit: number | undefined;
  nearExpiryDays: number | undefined;
  maxCandidates: number | undefined;
  evidenceRef: string | undefined;
  acquisitionReadbackFile: string | undefined;
  consensusCandidateFile: string | undefined;
  candidateKinds: HeartbeatCandidateKind[];
  reviewCandidateId: string | undefined;
  reviewDecision: HeartbeatReviewDecision | undefined;
  reviewReason: string | undefined;
  reviewEvidenceRef: string | undefined;
  reviewer: string | undefined;
  format: "text" | "json";
};

type HeartbeatReviewDecision =
  | "accept_for_manual_followup"
  | "defer_pending_evidence"
  | "reject_not_actionable";

type HeartbeatCandidateKind =
  | "memory_staleness"
  | "source_relation"
  | "knowledge_acquisition"
  | "consensus_evaluation";

type NonEmptyHeartbeatCandidateKinds = readonly [
  HeartbeatCandidateKind,
  ...HeartbeatCandidateKind[]
];

type HeartbeatCandidateReviewCommand = {
  candidateId: string;
  decision: HeartbeatReviewDecision;
  reason: string;
  evidenceRef: string;
  reviewer?: string;
};

const optionalProperty = <Key extends string, Value>(
  key: Key,
  value: Value | undefined
): { [Property in Key]?: Value } =>
  value === undefined
    ? {}
    : { [key]: value } as { [Property in Key]?: Value };

type ParseHeartbeatOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type HeartbeatOptionParser = (
  args: readonly string[],
  index: number,
  state: HeartbeatParseState
) => ParseHeartbeatOptionResult;

const requiredOption = (
  args: readonly string[],
  index: number,
  option: string
): { ok: true; value: string } | { ok: false; error: string } => {
  const value = args[index + 1];

  if (value === undefined || value.trim().length === 0) {
    return {
      ok: false,
      error: `${option} cannot be empty`
    };
  }

  return {
    ok: true,
    value: value.trim()
  };
};

const assignTextOption = (
  args: readonly string[],
  index: number,
  option: string,
  assign: (value: string) => void
): ParseHeartbeatOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatHeartbeatUsage()}`
    };
  }

  assign(required.value);

  return {
    ok: true,
    nextIndex: index + 1
  };
};

const assignPositiveIntegerOption = (
  args: readonly string[],
  index: number,
  option: string,
  assign: (value: number) => void
): ParseHeartbeatOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatHeartbeatUsage()}`
    };
  }

  const parsed = parsePositiveInteger(required.value, option);

  if (!parsed.ok) {
    return {
      ok: false,
      error: `${parsed.error}\n${formatHeartbeatUsage()}`
    };
  }

  assign(parsed.value);

  return {
    ok: true,
    nextIndex: index + 1
  };
};

const parseReviewDecision = (
  value: string
): HeartbeatReviewDecision | undefined => {
  if (
    value === "accept_for_manual_followup" ||
    value === "defer_pending_evidence" ||
    value === "reject_not_actionable"
  ) {
    return value;
  }

  return undefined;
};

const parseCandidateKind = (
  value: string
): HeartbeatCandidateKind | undefined => {
  if (
    value === "memory_staleness" ||
    value === "source_relation" ||
    value === "knowledge_acquisition" ||
    value === "consensus_evaluation"
  ) {
    return value;
  }

  return undefined;
};

const addCandidateKind = (
  state: HeartbeatParseState,
  candidateKind: HeartbeatCandidateKind
): void => {
  if (!state.candidateKinds.includes(candidateKind)) {
    state.candidateKinds.push(candidateKind);
  }
};

const heartbeatOptionParsers: Record<string, HeartbeatOptionParser> = {
  "--project": (args, index, state) =>
    assignTextOption(args, index, "--project", (value) => {
      state.projectId = value;
    }),
  "--memory-limit": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--memory-limit", (value) => {
      state.memoryLimit = value;
    }),
  "--source-claim-limit": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--source-claim-limit", (value) => {
      state.sourceClaimLimit = value;
    }),
  "--near-expiry-days": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--near-expiry-days", (value) => {
      state.nearExpiryDays = value;
    }),
  "--max-candidates": (args, index, state) =>
    assignPositiveIntegerOption(args, index, "--max-candidates", (value) => {
      state.maxCandidates = value;
    }),
  "--evidence-ref": (args, index, state) =>
    assignTextOption(args, index, "--evidence-ref", (value) => {
      state.evidenceRef = value;
    }),
  "--candidate-kind": (args, index, state) => {
    const required = requiredOption(args, index, "--candidate-kind");

    if (!required.ok) {
      return {
        ok: false,
        error: `${required.error}\n${formatHeartbeatUsage()}`
      };
    }

    const candidateKind = parseCandidateKind(required.value);

    if (candidateKind === undefined) {
      return {
        ok: false,
        error:
          "--candidate-kind must be memory_staleness, source_relation, knowledge_acquisition, or consensus_evaluation\n" +
          formatHeartbeatUsage()
      };
    }

    addCandidateKind(state, candidateKind);

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--acquisition-readback-file": (args, index, state) =>
    assignTextOption(args, index, "--acquisition-readback-file", (value) => {
      state.acquisitionReadbackFile = value;
    }),
  "--consensus-candidate-file": (args, index, state) =>
    assignTextOption(args, index, "--consensus-candidate-file", (value) => {
      state.consensusCandidateFile = value;
    }),
  "--review-candidate-id": (args, index, state) =>
    assignTextOption(args, index, "--review-candidate-id", (value) => {
      state.reviewCandidateId = value;
    }),
  "--review-decision": (args, index, state) => {
    const required = requiredOption(args, index, "--review-decision");

    if (!required.ok) {
      return {
        ok: false,
        error: `${required.error}\n${formatHeartbeatUsage()}`
      };
    }

    const decision = parseReviewDecision(required.value);

    if (decision === undefined) {
      return {
        ok: false,
        error:
          "--review-decision must be accept_for_manual_followup, defer_pending_evidence, or reject_not_actionable\n" +
          formatHeartbeatUsage()
      };
    }

    state.reviewDecision = decision;

    return {
      ok: true,
      nextIndex: index + 1
    };
  },
  "--review-reason": (args, index, state) =>
    assignTextOption(args, index, "--review-reason", (value) => {
      state.reviewReason = value;
    }),
  "--review-evidence-ref": (args, index, state) =>
    assignTextOption(args, index, "--review-evidence-ref", (value) => {
      state.reviewEvidenceRef = value;
    }),
  "--reviewer": (args, index, state) =>
    assignTextOption(args, index, "--reviewer", (value) => {
      state.reviewer = value;
    }),
  "--json": (_args, index, state) => {
    state.format = "json";

    return {
      ok: true,
      nextIndex: index
    };
  }
};

const hasAnyReviewField = (state: HeartbeatParseState): boolean =>
  state.reviewCandidateId !== undefined ||
  state.reviewDecision !== undefined ||
  state.reviewReason !== undefined ||
  state.reviewEvidenceRef !== undefined ||
  state.reviewer !== undefined;

const validateReviewState = (state: HeartbeatParseState): string | undefined => {
  if (!hasAnyReviewField(state)) {
    return undefined;
  }

  const missing = [
    ...(state.reviewCandidateId === undefined ? ["--review-candidate-id"] : []),
    ...(state.reviewDecision === undefined ? ["--review-decision"] : []),
    ...(state.reviewReason === undefined ? ["--review-reason"] : []),
    ...(state.reviewEvidenceRef === undefined ? ["--review-evidence-ref"] : [])
  ];

  if (missing.length === 0) {
    return undefined;
  }

  return `Maintenance candidate review requires ${missing.join(", ")}\n${formatHeartbeatUsage()}`;
};

const buildCandidateReview = (
  state: HeartbeatParseState
): HeartbeatCandidateReviewCommand | undefined => {
  if (
    state.reviewCandidateId === undefined ||
    state.reviewDecision === undefined ||
    state.reviewReason === undefined ||
    state.reviewEvidenceRef === undefined
  ) {
    return undefined;
  }

  return {
    candidateId: state.reviewCandidateId,
    decision: state.reviewDecision,
    reason: state.reviewReason,
    evidenceRef: state.reviewEvidenceRef,
    ...(state.reviewer === undefined ? {} : { reviewer: state.reviewer })
  };
};

const nonEmptyCandidateKinds = (
  candidateKinds: readonly HeartbeatCandidateKind[]
): NonEmptyHeartbeatCandidateKinds | undefined => {
  const [first, ...rest] = candidateKinds;

  return first === undefined ? undefined : [first, ...rest];
};

const buildHeartbeatPreviewCommand = (state: HeartbeatParseState): ParseArgsResult => {
  const candidateReview = buildCandidateReview(state);
  const candidateKinds = nonEmptyCandidateKinds(state.candidateKinds);

  return {
    command: {
      kind: "heartbeatPreview",
      ...optionalProperty("projectId", state.projectId),
      ...optionalProperty("memoryLimit", state.memoryLimit),
      ...optionalProperty("sourceClaimLimit", state.sourceClaimLimit),
      ...optionalProperty("nearExpiryDays", state.nearExpiryDays),
      ...optionalProperty("maxCandidates", state.maxCandidates),
      ...optionalProperty("evidenceRef", state.evidenceRef),
      ...optionalProperty("candidateKinds", candidateKinds),
      ...optionalProperty("acquisitionReadbackFile", state.acquisitionReadbackFile),
      ...optionalProperty("consensusCandidateFile", state.consensusCandidateFile),
      ...optionalProperty("candidateReview", candidateReview),
      format: state.format
    }
  };
};

export const parseHeartbeatArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "heartbeatPreviewHelp"
      }
    };
  }

  if (action !== "preview") {
    return {
      error: `Unsupported maintenance preview command: ${action}\n${formatHeartbeatUsage()}`
    };
  }

  const state: HeartbeatParseState = {
    projectId: undefined,
    memoryLimit: undefined,
    sourceClaimLimit: undefined,
    nearExpiryDays: undefined,
    maxCandidates: undefined,
    evidenceRef: undefined,
    acquisitionReadbackFile: undefined,
    consensusCandidateFile: undefined,
    candidateKinds: [],
    reviewCandidateId: undefined,
    reviewDecision: undefined,
    reviewReason: undefined,
    reviewEvidenceRef: undefined,
    reviewer: undefined,
    format: "text"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    const parser = heartbeatOptionParsers[arg];

    if (parser === undefined) {
      return {
        error: `Unsupported maintenance preview argument: ${arg}\n${formatHeartbeatUsage()}`
      };
    }

    const parsed = parser(args, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  const reviewError = validateReviewState(state);

  if (reviewError !== undefined) {
    return {
      error: reviewError
    };
  }

  return buildHeartbeatPreviewCommand(state);
};
