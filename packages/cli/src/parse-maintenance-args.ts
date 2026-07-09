import type {
  ParseArgsResult
} from "./parse-args.js";

const parseTimestampMs = (value: string): number | undefined => {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatMaintenanceUsage = (): string =>
  [
    "Usage: krn maintenance preview [--project <project-id>] [--memory-limit <n>] [--source-claim-limit <n>] [--near-expiry-days <n>] [--max-candidates <n>] [--evidence-ref <ref>] [--candidate-kind <kind>] [--acquisition-readback-file <path>] [--consensus-candidate-file <path>] [--review-candidate-id <id> --review-decision <decision> --review-reason <text> --review-evidence-ref <ref>] [--reviewer <name>] [--json]",
    "Usage: krn maintenance run --id <maintenance-queue-id>",
    "Usage: krn maintenance recover --id <maintenance-queue-id> --locked-before <iso-timestamp>",
    "",
    "Operator commands:",
    "krn maintenance preview",
    "krn maintenance run --id <maintenance-queue-id>",
    "krn maintenance recover --id <maintenance-queue-id> --locked-before <iso-timestamp>",
    "",
    "Preview options:",
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
    "Run options:",
    "--id <maintenance-queue-id>",
    "",
    "Recovery options:",
    "--id <maintenance-queue-id>",
    "--locked-before <iso-timestamp>",
    "",
    "Note: maintenance preview reads current Postgres memory/source state and renders candidate-only maintenance output. Optional review fields record a manual review result in output only. Maintenance run executes exactly one queued maintenance record through the explicit per-record executor. Maintenance recover explicitly returns one stale running record to queued state. Neither command starts a scheduler, daemon, autonomous promotion path, or broad worker platform."
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

type MaintenancePreviewParseState = {
  projectId: string | undefined;
  memoryLimit: number | undefined;
  sourceClaimLimit: number | undefined;
  nearExpiryDays: number | undefined;
  maxCandidates: number | undefined;
  evidenceRef: string | undefined;
  acquisitionReadbackFile: string | undefined;
  consensusCandidateFile: string | undefined;
  candidateKinds: MaintenanceCandidateKind[];
  reviewCandidateId: string | undefined;
  reviewDecision: MaintenanceReviewDecision | undefined;
  reviewReason: string | undefined;
  reviewEvidenceRef: string | undefined;
  reviewer: string | undefined;
  format: "text" | "json";
};

type MaintenanceReviewDecision =
  | "accept_for_manual_followup"
  | "defer_pending_evidence"
  | "reject_not_actionable";

type MaintenanceCandidateKind =
  | "memory_staleness"
  | "source_relation"
  | "knowledge_acquisition"
  | "consensus_evaluation";

type NonEmptyMaintenanceCandidateKinds = readonly [
  MaintenanceCandidateKind,
  ...MaintenanceCandidateKind[]
];

type MaintenanceCandidateReviewCommand = {
  candidateId: string;
  decision: MaintenanceReviewDecision;
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

type ParseMaintenancePreviewOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type MaintenanceOptionParser<State> = (
  args: readonly string[],
  index: number,
  state: State
) => ParseMaintenancePreviewOptionResult;

type MaintenancePreviewOptionParser = MaintenanceOptionParser<MaintenancePreviewParseState>;

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
): ParseMaintenancePreviewOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatMaintenanceUsage()}`
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
): ParseMaintenancePreviewOptionResult => {
  const required = requiredOption(args, index, option);

  if (!required.ok) {
    return {
      ok: false,
      error: `${required.error}\n${formatMaintenanceUsage()}`
    };
  }

  const parsed = parsePositiveInteger(required.value, option);

  if (!parsed.ok) {
    return {
      ok: false,
      error: `${parsed.error}\n${formatMaintenanceUsage()}`
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
): MaintenanceReviewDecision | undefined => {
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
): MaintenanceCandidateKind | undefined => {
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
  state: MaintenancePreviewParseState,
  candidateKind: MaintenanceCandidateKind
): void => {
  if (!state.candidateKinds.includes(candidateKind)) {
    state.candidateKinds.push(candidateKind);
  }
};

const maintenancePreviewOptionParsers: Record<string, MaintenancePreviewOptionParser> = {
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
        error: `${required.error}\n${formatMaintenanceUsage()}`
      };
    }

    const candidateKind = parseCandidateKind(required.value);

    if (candidateKind === undefined) {
      return {
        ok: false,
        error:
          "--candidate-kind must be memory_staleness, source_relation, knowledge_acquisition, or consensus_evaluation\n" +
          formatMaintenanceUsage()
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
        error: `${required.error}\n${formatMaintenanceUsage()}`
      };
    }

    const decision = parseReviewDecision(required.value);

    if (decision === undefined) {
      return {
        ok: false,
        error:
          "--review-decision must be accept_for_manual_followup, defer_pending_evidence, or reject_not_actionable\n" +
          formatMaintenanceUsage()
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

type MaintenanceRunParseState = {
  id: string | undefined;
};

type MaintenanceRunOptionParser = MaintenanceOptionParser<MaintenanceRunParseState>;

const maintenanceRunOptionParsers: Record<string, MaintenanceRunOptionParser> = {
  "--id": (args, index, state) =>
    assignTextOption(args, index, "--id", (value) => {
      state.id = value;
    })
};

type MaintenanceRecoverParseState = {
  id: string | undefined;
  lockedBefore: string | undefined;
};

type MaintenanceRecoverOptionParser = MaintenanceOptionParser<MaintenanceRecoverParseState>;

const maintenanceRecoverOptionParsers: Record<string, MaintenanceRecoverOptionParser> = {
  "--id": (args, index, state) =>
    assignTextOption(args, index, "--id", (value) => {
      state.id = value;
    }),
  "--locked-before": (args, index, state) => {
    const required = requiredOption(args, index, "--locked-before");

    if (!required.ok) {
      return {
        ok: false,
        error: `${required.error}\n${formatMaintenanceUsage()}`
      };
    }

    if (parseTimestampMs(required.value) === undefined) {
      return {
        ok: false,
        error: `--locked-before must be an ISO timestamp\n${formatMaintenanceUsage()}`
      };
    }

    state.lockedBefore = required.value;

    return {
      ok: true,
      nextIndex: index + 1
    };
  }
};

const hasAnyReviewField = (state: MaintenancePreviewParseState): boolean =>
  state.reviewCandidateId !== undefined ||
  state.reviewDecision !== undefined ||
  state.reviewReason !== undefined ||
  state.reviewEvidenceRef !== undefined ||
  state.reviewer !== undefined;

const validateReviewState = (state: MaintenancePreviewParseState): string | undefined => {
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

  return `Maintenance candidate review requires ${missing.join(", ")}\n${formatMaintenanceUsage()}`;
};

const buildCandidateReview = (
  state: MaintenancePreviewParseState
): MaintenanceCandidateReviewCommand | undefined => {
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
  candidateKinds: readonly MaintenanceCandidateKind[]
): NonEmptyMaintenanceCandidateKinds | undefined => {
  const [first, ...rest] = candidateKinds;

  return first === undefined ? undefined : [first, ...rest];
};

const buildMaintenancePreviewCommand = (state: MaintenancePreviewParseState): ParseArgsResult => {
  const candidateReview = buildCandidateReview(state);
  const candidateKinds = nonEmptyCandidateKinds(state.candidateKinds);

  return {
    command: {
      kind: "maintenancePreview",
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

const parseMaintenanceOptions = <State>(input: {
  readonly args: readonly string[];
  readonly state: State;
  readonly parsers: Record<string, MaintenanceOptionParser<State>>;
  readonly label: string;
}): string | undefined => {
  for (let index = 0; index < input.args.length; index += 1) {
    const arg = input.args[index]!;
    const parser = input.parsers[arg];

    if (parser === undefined) {
      return `Unsupported ${input.label} argument: ${arg}\n${formatMaintenanceUsage()}`;
    }

    const parsed = parser(input.args, index, input.state);

    if (!parsed.ok) {
      return parsed.error;
    }

    index = parsed.nextIndex;
  }

  return undefined;
};

const parseMaintenanceRunArgs = (args: readonly string[]): ParseArgsResult => {
  const state: MaintenanceRunParseState = {
    id: undefined
  };
  const optionError = parseMaintenanceOptions({
    args,
    state,
    parsers: maintenanceRunOptionParsers,
    label: "maintenance run"
  });

  if (optionError !== undefined) {
    return {
      error: optionError
    };
  }

  if (state.id === undefined) {
    return {
      error: `krn maintenance run requires --id <maintenance-queue-id>\n${formatMaintenanceUsage()}`
    };
  }

  return {
    command: {
      kind: "maintenanceRun",
      id: state.id
    }
  };
};

const parseMaintenanceRecoverArgs = (args: readonly string[]): ParseArgsResult => {
  const state: MaintenanceRecoverParseState = {
    id: undefined,
    lockedBefore: undefined
  };
  const optionError = parseMaintenanceOptions({
    args,
    state,
    parsers: maintenanceRecoverOptionParsers,
    label: "maintenance recover"
  });

  if (optionError !== undefined) {
    return {
      error: optionError
    };
  }

  if (state.id === undefined) {
    return {
      error: `krn maintenance recover requires --id <maintenance-queue-id>\n${formatMaintenanceUsage()}`
    };
  }

  if (state.lockedBefore === undefined) {
    return {
      error: `krn maintenance recover requires --locked-before <iso-timestamp>\n${formatMaintenanceUsage()}`
    };
  }

  return {
    command: {
      kind: "maintenanceRecover",
      id: state.id,
      lockedBefore: state.lockedBefore
    }
  };
};

export const parseMaintenanceArgs = (rest: readonly string[]): ParseArgsResult => {
  const [action, ...args] = rest;

  if (action === undefined || action === "--help" || action === "-h") {
    return {
      command: {
        kind: "maintenanceHelp"
      }
    };
  }

  if (action === "run") {
    return parseMaintenanceRunArgs(args);
  }

  if (action === "recover") {
    return parseMaintenanceRecoverArgs(args);
  }

  if (action !== "preview") {
    return {
      error: `Unsupported maintenance command: ${action}\n${formatMaintenanceUsage()}`
    };
  }

  const state: MaintenancePreviewParseState = {
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

  const optionError = parseMaintenanceOptions({
    args,
    state,
    parsers: maintenancePreviewOptionParsers,
    label: "maintenance preview"
  });

  if (optionError !== undefined) {
    return {
      error: optionError
    };
  }

  const reviewError = validateReviewState(state);

  if (reviewError !== undefined) {
    return {
      error: reviewError
    };
  }

  return buildMaintenancePreviewCommand(state);
};
