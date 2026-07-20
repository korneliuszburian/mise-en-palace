import type {
  ContextInclusionUsefulnessOutcomeFeedback,
  EvidenceCommandStatus,
  KnowledgeUsefulnessOutcomeFeedback,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidenceChangedFileInput,
  TargetEvidenceInput
} from "@krn/core";
import type {
  EvidenceCommandCaptureInput
} from "./evidence-command-artifacts.js";
import {
  contextSubjectTypes,
  isIsoTimestamp,
  isSourceUsefulnessOutcome
} from "@krn/core";
import {
  optionValue
} from "./parse-cli-options.js";
import type {
  ParseArgsResult
} from "./parse-args.js";

const evidenceUsage = [
  "Usage: krn evidence capture [--run-id <id>|--run <id>] [--decision-packet-checksum <sha256> --decision-packet-generated-at <iso-timestamp>] [--persist] [--intended-file <path>] [--verification <command=status>] [--source-usefulness \"claim:<id>|decision:<id>=helped|reason|evidence-ref[,ref]|doesNotProve[|application-id[|applied-at]]\"] [--memory-usefulness \"<knowledge-id>=helped|reason|evidence-ref[,ref]|doesNotProve[|application-id[|applied-at]]\"] [--target-repo <path>] [--target-mode observation-only|headless-repair|real-second-operator|unknown] [--target-dirty-before clean|dirty|unknown] [--target-dirty-after clean|dirty|unknown] [--target-owned-changes external|owned-by-current-krn-run|partial|unknown] [--target-status-freshness fresh-current-task|stale-prior-selection|changed-since-selection|unknown] [--target-patch-lifecycle none|accepted-by-target-owner|rejected-by-target-owner|stronger-verification-requested|handed-off-unresolved|unknown] [--target-handoff-artifact <path>] [--target-owner-decision <text>] [--target-changed-file <status path>|none] [--target-command <cmd>] [--command <cmd> --status passed|failed|skipped|missing|not_run [--exit-code <code>] [--started-at <iso-timestamp>] [--captured-at <iso-timestamp>] [--stdout-file <path>] [--stderr-file <path>]]",
  "Example: krn evidence capture --intended-file packages/cli/src/run-evidence-capture-command.ts --verification \"pnpm typecheck=passed\" --verification \"pnpm test=passed\"",
  "Source usefulness example: krn evidence capture --source-usefulness \"claim:source-claim-1=helped|Source kept proof boundaries visible|evidence-1,feedback-1|Does not prove future selector quality\"",
  "Memory usefulness example: krn evidence capture --memory-usefulness \"knowledge:ts-boundary-unknown-first-result-state=helped|Memory selected the unknown-first parser shape|evidence-1|Does not prove future memory recall quality\"",
  "Context usefulness: --context-usefulness \"search_document:<subject-id>=noise|reason|packet:<checksum>|doesNotProve[|application-id[|applied-at]]\"",
  "Application phase 1: pass application-id without applied-at; persisted output returns the database-issued application-id|applied-at token.",
  "Application phase 2: after verification, pass the returned application-id|applied-at pair on the helped outcome.",
  "Target example: krn evidence capture --target-repo ../target --target-mode observation-only --target-dirty-before dirty --target-dirty-after dirty --target-owned-changes external --target-allowed-write none --target-forbidden-write \"target source edits\" --target-changed-file \"M src/app.ts\" --target-command \"target pnpm test\" --verification \"target pnpm test=passed\"",
  "Persisted example: krn evidence capture --run-id <execution-run-id> --intended-file packages/cli/src/run-evidence-capture-command.ts --verification \"git diff --check=passed\" --persist",
  "Note: evidence capture records operator/captured evidence; it does not run commands."
].join("\n");

export const formatEvidenceCaptureUsage = (): string => `${evidenceUsage}\n`;

const evidenceStatuses = ["passed", "failed", "skipped", "missing", "not_run"] as const;
const targetModes = ["observation-only", "headless-repair", "real-second-operator", "unknown"] as const;
const targetDirtyStates = ["clean", "dirty", "unknown"] as const;
const targetOwnerships = ["external", "owned-by-current-krn-run", "partial", "unknown"] as const;
const targetStatusFreshnesses = ["fresh-current-task", "stale-prior-selection", "changed-since-selection", "unknown"] as const;
const targetPatchLifecycles = [
  "none",
  "accepted-by-target-owner",
  "rejected-by-target-owner",
  "stronger-verification-requested",
  "handed-off-unresolved",
  "unknown"
] as const;

const isEvidenceStatus = (value: string): value is EvidenceCommandStatus =>
  evidenceStatuses.some((status) => status === value);

const normalizeToken = (value: string): string =>
  value.trim().toLowerCase().replaceAll("_", "-");

const isAllowed = (value: string, allowed: readonly string[]): boolean =>
  allowed.some((item) => item === normalizeToken(value));

const parseExitCode = (value: string): number | undefined => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return undefined;
  }

  return parsed;
};

const incoherentCommandExitCodeError = (
  status: EvidenceCommandStatus,
  exitCode: number | undefined
): string | undefined => {
  if (status === "passed" && exitCode !== undefined && exitCode !== 0) {
    return "--status passed requires --exit-code 0";
  }

  if (status === "failed" && exitCode === 0) {
    return "--status failed requires a non-zero --exit-code";
  }

  return undefined;
};

type CompletedEvidenceCommand =
  | {
      ok: true;
      command: EvidenceCommandCaptureInput;
    }
  | {
      ok: false;
      error: string;
    };

const nonEmptyTrimmed = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const optionalEvidenceCommandFields = (
  pending: Partial<EvidenceCommandCaptureInput>
): Partial<Omit<EvidenceCommandCaptureInput, "command" | "status">> => {
  const startedAt = nonEmptyTrimmed(pending.startedAt);
  const capturedAt = nonEmptyTrimmed(pending.capturedAt);
  const stdoutFile = nonEmptyTrimmed(pending.stdoutFile);
  const stderrFile = nonEmptyTrimmed(pending.stderrFile);

  return {
    ...(pending.exitCode === undefined ? {} : { exitCode: pending.exitCode }),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(capturedAt === undefined ? {} : { capturedAt }),
    ...(stdoutFile === undefined ? {} : { stdoutFile }),
    ...(stderrFile === undefined ? {} : { stderrFile })
  };
};

const outputArtifactRequestError = (
  pending: Partial<EvidenceCommandCaptureInput>,
  status: EvidenceCommandStatus
): string | undefined => {
  if (status !== "passed" && status !== "failed") {
    return "command output files require --status passed or failed";
  }
  if (pending.exitCode === undefined) {
    return "command output files require --exit-code";
  }
  if (pending.startedAt === undefined) {
    return "command output files require --started-at";
  }
  if (pending.capturedAt === undefined) {
    return "command output files require --captured-at";
  }
  if (pending.stdoutFile === undefined || pending.stderrFile === undefined) {
    return "command output capture requires both --stdout-file and --stderr-file";
  }
  if (Date.parse(pending.capturedAt) < Date.parse(pending.startedAt)) {
    return "--captured-at must be at or after --started-at";
  }

  return undefined;
};

const outputArtifactRequested = (
  pending: Partial<EvidenceCommandCaptureInput>
): boolean => [
  pending.startedAt,
  pending.capturedAt,
  pending.stdoutFile,
  pending.stderrFile
].some((value) => value !== undefined);

const completeEvidenceCommand = (
  pending: Partial<EvidenceCommandCaptureInput>
): CompletedEvidenceCommand => {
  const command = nonEmptyTrimmed(pending.command);

  if (command === undefined) {
    return {
      ok: false,
      error: "--command requires a non-empty value"
    };
  }

  const status = pending.status;

  if (status === undefined) {
    return {
      ok: false,
      error: "--command requires --status passed|failed|skipped|missing|not_run"
    };
  }

  const exitCodeError = incoherentCommandExitCodeError(status, pending.exitCode);

  if (exitCodeError !== undefined) {
    return { ok: false, error: exitCodeError };
  }

  if (outputArtifactRequested(pending)) {
    const artifactRequestError = outputArtifactRequestError(pending, status);
    if (artifactRequestError !== undefined) {
      return { ok: false, error: artifactRequestError };
    }
  }

  return {
    ok: true,
    command: {
      command,
      status,
      ...optionalEvidenceCommandFields(pending)
    }
  };
};

const pushPendingCommand = (
  commands: EvidenceCommandCaptureInput[],
  pending: Partial<EvidenceCommandCaptureInput> | undefined
): { error?: string } => {
  if (pending === undefined) {
    return {};
  }

  const completed = completeEvidenceCommand(pending);

  if (!completed.ok) {
    return { error: completed.error };
  }

  commands.push(completed.command);

  return {};
};

const parseVerification = (value: string): { command?: EvidenceCommandCaptureInput; error?: string } => {
  const separatorIndex = value.lastIndexOf("=");

  if (separatorIndex < 0) {
    return {
      error: "--verification requires <command=status>"
    };
  }

  const command = value.slice(0, separatorIndex).trim();
  const status = value.slice(separatorIndex + 1).trim();

  if (command.length === 0) {
    return {
      error: "--verification requires a non-empty command"
    };
  }

  if (!isEvidenceStatus(status)) {
    return {
      error: "--verification status must be passed, failed, skipped, missing, or not_run"
    };
  }

  return {
    command: {
      command,
      status,
      provenance: "operator_reported"
    }
  };
};

type SourceUsefulnessOutcome = SourceUsefulnessOutcomeFeedback["outcome"];
type SourceUsefulnessSelectorKind = "claim" | "decision";

type SourceUsefulnessParts = {
  selector: string;
  body: string;
};

type SourceUsefulnessSelector = {
  kind: SourceUsefulnessSelectorKind;
  id: string;
};

type SourceUsefulnessBody = {
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
  applicationId?: string;
  appliedAt?: string;
};

type SourceUsefulnessParseResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      error: string;
    };

const parseSourceUsefulnessParts = (
  value: string
): SourceUsefulnessParseResult<SourceUsefulnessParts> => {
  const separatorIndex = value.indexOf("=");

  if (separatorIndex < 0) {
    return {
      ok: false,
      error: "--source-usefulness requires <claim:id|decision:id=outcome|reason|evidence-ref[,ref]|doesNotProve>"
    };
  }

  return {
    ok: true,
    value: {
      selector: value.slice(0, separatorIndex).trim(),
      body: value.slice(separatorIndex + 1)
    }
  };
};

const parseSourceUsefulnessSelector = (
  selector: string
): SourceUsefulnessParseResult<SourceUsefulnessSelector> => {
  const selectorSeparatorIndex = selector.indexOf(":");

  if (selectorSeparatorIndex < 0) {
    return {
      ok: false,
      error: "--source-usefulness selector must start with claim:<id> or decision:<id>"
    };
  }

  const selectorKind = selector.slice(0, selectorSeparatorIndex).trim();
  const selectorId = selector.slice(selectorSeparatorIndex + 1).trim();

  if (selectorId.length === 0) {
    return {
      ok: false,
      error: "--source-usefulness requires a non-empty source id"
    };
  }

  if (selectorKind !== "claim" && selectorKind !== "decision") {
    return {
      ok: false,
      error: "--source-usefulness selector must start with claim:<id> or decision:<id>"
    };
  }

  return {
    ok: true,
    value: {
      kind: selectorKind,
      id: selectorId
    }
  };
};

const parseEvidenceRefs = (value: string): string[] =>
  value
    .split(",")
    .map((ref) => ref.trim())
    .filter((ref) => ref.length > 0);

const parseUsefulnessOutcomeToken = (
  value: string | undefined
): SourceUsefulnessParseResult<SourceUsefulnessOutcome> =>
  value !== undefined && isSourceUsefulnessOutcome(value)
    ? { ok: true, value }
    : {
        ok: false,
        error: "--source-usefulness outcome must be selected, used, helped, neutral, noise, stale, or unknown"
      };

const parseRequiredUsefulnessText = (
  value: string | undefined,
  field: "reason" | "doesNotProve"
): SourceUsefulnessParseResult<string> => value !== undefined && value.length > 0
  ? { ok: true, value }
  : {
      ok: false,
      error: `--source-usefulness requires a non-empty ${field}${field === "reason" ? "" : " field"}`
    };

const parseUsefulnessApplicationReference = (
  applicationId: string | undefined,
  appliedAt: string | undefined
): SourceUsefulnessParseResult<Pick<SourceUsefulnessBody, "applicationId" | "appliedAt">> => {
  const normalizedApplicationId = nonEmptyTrimmed(applicationId);
  const normalizedAppliedAt = nonEmptyTrimmed(appliedAt);

  if (normalizedAppliedAt === undefined) {
    return {
      ok: true,
      value: normalizedApplicationId === undefined
        ? {}
        : { applicationId: normalizedApplicationId }
    };
  }
  if (normalizedApplicationId === undefined) {
    return {
      ok: false,
      error: "--source-usefulness appliedAt requires applicationId"
    };
  }
  if (!isIsoTimestamp(normalizedAppliedAt)) {
    return {
      ok: false,
      error: "--source-usefulness appliedAt must be an ISO timestamp"
    };
  }

  return {
    ok: true,
    value: {
      applicationId: normalizedApplicationId,
      appliedAt: normalizedAppliedAt
    }
  };
};

const parseSourceUsefulnessBody = (
  body: string
): SourceUsefulnessParseResult<SourceUsefulnessBody> => {
  const [
    outcomeToken,
    reasonToken,
    evidenceRefsToken,
    doesNotProveToken,
    applicationIdToken,
    appliedAtToken
  ] =
    body.split("|").map((part) => part.trim());

  const outcome = parseUsefulnessOutcomeToken(outcomeToken);
  if (!outcome.ok) return outcome;
  const reason = parseRequiredUsefulnessText(reasonToken, "reason");
  if (!reason.ok) return reason;
  const doesNotProve = parseRequiredUsefulnessText(doesNotProveToken, "doesNotProve");
  if (!doesNotProve.ok) return doesNotProve;
  const application = parseUsefulnessApplicationReference(applicationIdToken, appliedAtToken);
  if (!application.ok) return application;

  return {
    ok: true,
    value: {
      outcome: outcome.value,
      reason: reason.value,
      evidenceRefs: parseEvidenceRefs(evidenceRefsToken ?? ""),
      doesNotProve: doesNotProve.value,
      ...application.value
    }
  };
};

const parseKnowledgeUsefulnessBody = (
  body: string
): SourceUsefulnessParseResult<SourceUsefulnessBody> => {
  const parsed = parseSourceUsefulnessBody(body);

  if (parsed.ok) {
    return parsed;
  }

  return {
    ok: false,
    error: parsed.error.replaceAll("--source-usefulness", "--memory-usefulness")
  };
};

const buildSourceUsefulnessOutcome = (
  selector: SourceUsefulnessSelector,
  body: SourceUsefulnessBody
): SourceUsefulnessOutcomeFeedback => ({
  ...(selector.kind === "claim" ? { sourceClaimId: selector.id } : { sourceDecisionId: selector.id }),
  outcome: body.outcome,
  reason: body.reason,
  evidenceRefs: body.evidenceRefs,
  doesNotProve: body.doesNotProve,
  ...(body.applicationId === undefined ? {} : { applicationId: body.applicationId }),
  ...(body.appliedAt === undefined ? {} : { appliedAt: body.appliedAt })
});

const parseSourceUsefulness = (
  value: string
): { outcome?: SourceUsefulnessOutcomeFeedback; error?: string } => {
  const parts = parseSourceUsefulnessParts(value);

  if (!parts.ok) {
    return {
      error: parts.error
    };
  }

  const selector = parseSourceUsefulnessSelector(parts.value.selector);

  if (!selector.ok) {
    return {
      error: selector.error
    };
  }

  const body = parseSourceUsefulnessBody(parts.value.body);

  if (!body.ok) {
    return {
      error: body.error
    };
  }

  return {
    outcome: buildSourceUsefulnessOutcome(selector.value, body.value)
  };
};

const parseKnowledgeUsefulness = (
  value: string
): { outcome?: KnowledgeUsefulnessOutcomeFeedback; error?: string } => {
  const separatorIndex = value.indexOf("=");

  if (separatorIndex < 0) {
    return {
      error: "--memory-usefulness requires <knowledge-id=outcome|reason|evidence-ref[,ref]|doesNotProve>"
    };
  }

  const knowledgeId = value.slice(0, separatorIndex).trim();

  if (knowledgeId.length === 0) {
    return {
      error: "--memory-usefulness requires a non-empty knowledge id"
    };
  }

  const body = parseKnowledgeUsefulnessBody(value.slice(separatorIndex + 1));

  if (!body.ok) {
    return {
      error: body.error
    };
  }

  return {
    outcome: {
      knowledgeId,
      outcome: body.value.outcome,
      reason: body.value.reason,
      evidenceRefs: body.value.evidenceRefs,
      doesNotProve: body.value.doesNotProve,
      ...(body.value.applicationId === undefined
        ? {}
        : { applicationId: body.value.applicationId }),
      ...(body.value.appliedAt === undefined ? {} : { appliedAt: body.value.appliedAt })
    }
  };
};

const parseContextInclusionUsefulness = (
  value: string
): { outcome?: ContextInclusionUsefulnessOutcomeFeedback; error?: string } => {
  const separatorIndex = value.indexOf("=");
  const selector = separatorIndex < 0 ? "" : value.slice(0, separatorIndex).trim();
  const subjectSeparatorIndex = selector.indexOf(":");
  const subjectType = subjectSeparatorIndex < 0 ? "" : selector.slice(0, subjectSeparatorIndex);
  const subjectId = subjectSeparatorIndex < 0 ? "" : selector.slice(subjectSeparatorIndex + 1).trim();

  if (!contextSubjectTypes.some((candidate) => candidate === subjectType) || subjectId.length === 0) {
    return { error: "--context-usefulness requires <subject-type:subject-id=outcome|reason|evidence-ref[,ref]|doesNotProve>" };
  }

  const body = parseSourceUsefulnessBody(value.slice(separatorIndex + 1));
  if (!body.ok) {
    return { error: body.error.replaceAll("--source-usefulness", "--context-usefulness") };
  }

  return {
    outcome: {
      subjectType: subjectType as ContextInclusionUsefulnessOutcomeFeedback["subjectType"],
      subjectId,
      outcome: body.value.outcome,
      reason: body.value.reason,
      evidenceRefs: body.value.evidenceRefs,
      doesNotProve: body.value.doesNotProve,
      ...(body.value.applicationId === undefined ? {} : { applicationId: body.value.applicationId }),
      ...(body.value.appliedAt === undefined ? {} : { appliedAt: body.value.appliedAt })
    }
  };
};

const parseTargetChangedFile = (
  value: string
): { changedFile?: TargetEvidenceChangedFileInput; none?: true; error?: string } => {
  const trimmed = value.trim();

  if (normalizeToken(trimmed) === "none") {
    return {
      none: true
    };
  }

  const separatorIndex = trimmed.search(/\s/);

  if (separatorIndex < 0) {
    return {
      error: "--target-changed-file requires <status path>"
    };
  }

  const status = trimmed.slice(0, separatorIndex).trim();
  const path = trimmed.slice(separatorIndex + 1).trim();

  if (status.length === 0 || path.length === 0) {
    return {
      error: "--target-changed-file requires <status path>"
    };
  }

  return {
    changedFile: {
      status,
      path
    }
  };
};

type ParsedStringOption =
  | {
      ok: true;
      value: string;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

const parseNonEmptyOption = (
  rest: readonly string[],
  index: number,
  optionName: string,
  emptyError: string
): ParsedStringOption => {
  const valueResult = optionValue(rest, index, optionName);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      ok: false,
      error: valueResult.error ?? evidenceUsage
    };
  }

  const value = valueResult.value.trim();

  if (value.length === 0) {
    return {
      ok: false,
      error: emptyError
    };
  }

  return {
    ok: true,
    value,
    nextIndex: valueResult.nextIndex
  };
};

const parseEvidenceOption = (
  rest: readonly string[],
  index: number,
  optionName: string
): ParsedStringOption => {
  const valueResult = optionValue(rest, index, optionName);

  if (valueResult.error !== undefined || valueResult.value === undefined) {
    return {
      ok: false,
      error: valueResult.error ?? evidenceUsage
    };
  }

  return {
    ok: true,
    value: valueResult.value,
    nextIndex: valueResult.nextIndex
  };
};

const parseOptionAfterPendingCommand = (
  rest: readonly string[],
  index: number,
  optionName: string,
  commandOutcomes: EvidenceCommandCaptureInput[],
  pendingCommand: Partial<EvidenceCommandCaptureInput> | undefined
): ParsedStringOption => {
  const parsed = parseEvidenceOption(rest, index, optionName);

  if (!parsed.ok) {
    return parsed;
  }

  const pushResult = pushPendingCommand(commandOutcomes, pendingCommand);

  if (pushResult.error !== undefined) {
    return {
      ok: false,
      error: pushResult.error
    };
  }

  return parsed;
};

type EvidenceParseState = {
  persist: boolean;
  runId: string | undefined;
  decisionPacketChecksum: string | undefined;
  decisionPacketGeneratedAt: string | undefined;
  pendingCommand: Partial<EvidenceCommandCaptureInput> | undefined;
  commandOutcomes: EvidenceCommandCaptureInput[];
  intendedFiles: string[];
  targetRepo: string | undefined;
  targetMode: string | undefined;
  targetDirtyBefore: string | undefined;
  targetDirtyAfter: string | undefined;
  targetOwnedChanges: string | undefined;
  targetStatusFreshness: string | undefined;
  targetPatchLifecycle: string | undefined;
  handoffArtifact: string | undefined;
  targetOwnerDecision: string | undefined;
  targetAllowedWrites: string[];
  targetForbiddenWrites: string[];
  targetChangedFiles: TargetEvidenceChangedFileInput[];
  targetChangedFilesExplicitNone: boolean;
  targetCommands: string[];
  sourceUsefulnessOutcomes: SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes: KnowledgeUsefulnessOutcomeFeedback[];
  contextInclusionUsefulnessOutcomes: ContextInclusionUsefulnessOutcomeFeedback[];
};

type EvidenceOptionResult =
  | {
      ok: true;
      nextIndex: number;
    }
  | {
      ok: false;
      error: string;
    };

type EvidenceOptionHandler = (
  rest: readonly string[],
  index: number,
  state: EvidenceParseState
) => EvidenceOptionResult;

const evidenceOptionNames = [
  "--persist",
  "--run-id",
  "--run",
  "--decision-packet-checksum",
  "--decision-packet-generated-at",
  "--intended-file",
  "--target-repo",
  "--target-mode",
  "--target-dirty-before",
  "--target-dirty-after",
  "--target-owned-changes",
  "--target-status-freshness",
  "--target-patch-lifecycle",
  "--target-handoff-artifact",
  "--target-owner-decision",
  "--target-changed-file",
  "--target-command",
  "--target-allowed-write",
  "--target-forbidden-write",
  "--command",
  "--verification",
  "--source-usefulness",
  "--memory-usefulness",
  "--context-usefulness",
  "--status",
  "--exit-code",
  "--started-at",
  "--captured-at",
  "--stdout-file",
  "--stderr-file"
] as const;

type EvidenceOptionName = typeof evidenceOptionNames[number];

const evidenceOptionMatches = (arg: string, optionName: EvidenceOptionName): boolean =>
  optionName === "--persist"
    ? arg === optionName
    : arg === optionName || arg.startsWith(`${optionName}=`);

const findEvidenceOption = (arg: string): EvidenceOptionName | undefined =>
  evidenceOptionNames.find((optionName) => evidenceOptionMatches(arg, optionName));

const parseAllowedEvidenceOption = (
  rest: readonly string[],
  index: number,
  optionName: EvidenceOptionName,
  allowed: readonly string[],
  error: string
): ParsedStringOption => {
  const parsed = parseEvidenceOption(rest, index, optionName);

  if (!parsed.ok) {
    return parsed;
  }

  if (!isAllowed(parsed.value, allowed)) {
    return {
      ok: false,
      error
    };
  }

  return {
    ok: true,
    value: parsed.value.trim(),
    nextIndex: parsed.nextIndex
  };
};

const requiredEvidenceHandler = (
  optionName: EvidenceOptionName,
  emptyError: string,
  apply: (state: EvidenceParseState, value: string) => void
): EvidenceOptionHandler =>
  (rest, index, state) => {
    const parsed = parseNonEmptyOption(rest, index, optionName, emptyError);

    if (!parsed.ok) {
      return parsed;
    }

    apply(state, parsed.value);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  };

const packetGeneratedAtEvidenceHandler: EvidenceOptionHandler = (rest, index, state) => {
  const parsed = parseNonEmptyOption(
    rest,
    index,
    "--decision-packet-generated-at",
    "--decision-packet-generated-at requires a valid ISO timestamp"
  );

  if (!parsed.ok) {
    return parsed;
  }

  if (!isIsoTimestamp(parsed.value)) {
    return {
      ok: false,
      error: "--decision-packet-generated-at requires a valid ISO timestamp"
    };
  }

  state.decisionPacketGeneratedAt = parsed.value;

  return {
    ok: true,
    nextIndex: parsed.nextIndex
  };
};

const allowedEvidenceHandler = (
  optionName: EvidenceOptionName,
  allowed: readonly string[],
  error: string,
  apply: (state: EvidenceParseState, value: string) => void
): EvidenceOptionHandler =>
  (rest, index, state) => {
    const parsed = parseAllowedEvidenceOption(rest, index, optionName, allowed, error);

    if (!parsed.ok) {
      return parsed;
    }

    apply(state, parsed.value);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  };

const evidenceOptionHandlers: Record<EvidenceOptionName, EvidenceOptionHandler> = {
  "--persist": (_rest, index, state) => {
    state.persist = true;

    return {
      ok: true,
      nextIndex: index
    };
  },
  "--run-id": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--run-id");

    if (!parsed.ok) {
      return parsed;
    }

    state.runId = parsed.value.trim();

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--run": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--run");

    if (!parsed.ok) {
      return parsed;
    }

    state.runId = parsed.value.trim();

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--decision-packet-checksum": requiredEvidenceHandler(
    "--decision-packet-checksum",
    "--decision-packet-checksum requires a non-empty checksum",
    (state, value) => {
      state.decisionPacketChecksum = value;
    }
  ),
  "--decision-packet-generated-at": packetGeneratedAtEvidenceHandler,
  "--intended-file": requiredEvidenceHandler(
    "--intended-file",
    "--intended-file requires a non-empty path",
    (state, value) => state.intendedFiles.push(value)
  ),
  "--target-repo": requiredEvidenceHandler(
    "--target-repo",
    "--target-repo requires a non-empty value",
    (state, value) => {
      state.targetRepo = value;
    }
  ),
  "--target-mode": allowedEvidenceHandler(
    "--target-mode",
    targetModes,
    "--target-mode must be observation-only, headless-repair, real-second-operator, or unknown",
    (state, value) => {
      state.targetMode = value;
    }
  ),
  "--target-dirty-before": allowedEvidenceHandler(
    "--target-dirty-before",
    targetDirtyStates,
    "--target-dirty-before must be clean, dirty, or unknown",
    (state, value) => {
      state.targetDirtyBefore = value;
    }
  ),
  "--target-dirty-after": allowedEvidenceHandler(
    "--target-dirty-after",
    targetDirtyStates,
    "--target-dirty-after must be clean, dirty, or unknown",
    (state, value) => {
      state.targetDirtyAfter = value;
    }
  ),
  "--target-owned-changes": allowedEvidenceHandler(
    "--target-owned-changes",
    targetOwnerships,
    "--target-owned-changes must be external, owned-by-current-krn-run, partial, or unknown",
    (state, value) => {
      state.targetOwnedChanges = value;
    }
  ),
  "--target-status-freshness": allowedEvidenceHandler(
    "--target-status-freshness",
    targetStatusFreshnesses,
    "--target-status-freshness must be fresh-current-task, stale-prior-selection, changed-since-selection, or unknown",
    (state, value) => {
      state.targetStatusFreshness = value;
    }
  ),
  "--target-patch-lifecycle": allowedEvidenceHandler(
    "--target-patch-lifecycle",
    targetPatchLifecycles,
    "--target-patch-lifecycle must be none, accepted-by-target-owner, rejected-by-target-owner, stronger-verification-requested, handed-off-unresolved, or unknown",
    (state, value) => {
      state.targetPatchLifecycle = value;
    }
  ),
  "--target-handoff-artifact": requiredEvidenceHandler(
    "--target-handoff-artifact",
    "--target-handoff-artifact requires a non-empty value",
    (state, value) => {
      state.handoffArtifact = value;
    }
  ),
  "--target-owner-decision": requiredEvidenceHandler(
    "--target-owner-decision",
    "--target-owner-decision requires a non-empty value",
    (state, value) => {
      state.targetOwnerDecision = value;
    }
  ),
  "--target-changed-file": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--target-changed-file");

    if (!parsed.ok) {
      return parsed;
    }

    const parseResult = parseTargetChangedFile(parsed.value);

    if (parseResult.error !== undefined) {
      return {
        ok: false,
        error: parseResult.error
      };
    }

    if (parseResult.none === true) {
      state.targetChangedFilesExplicitNone = true;
    } else if (parseResult.changedFile !== undefined) {
      state.targetChangedFiles.push(parseResult.changedFile);
    }

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--target-command": requiredEvidenceHandler(
    "--target-command",
    "--target-command requires a non-empty value",
    (state, value) => state.targetCommands.push(value)
  ),
  "--target-allowed-write": requiredEvidenceHandler(
    "--target-allowed-write",
    "--target-allowed-write requires a non-empty value",
    (state, value) => state.targetAllowedWrites.push(value)
  ),
  "--target-forbidden-write": requiredEvidenceHandler(
    "--target-forbidden-write",
    "--target-forbidden-write requires a non-empty value",
    (state, value) => state.targetForbiddenWrites.push(value)
  ),
  "--command": (rest, index, state) => {
    const parsed = parseOptionAfterPendingCommand(
      rest,
      index,
      "--command",
      state.commandOutcomes,
      state.pendingCommand
    );

    if (!parsed.ok) {
      return parsed;
    }

    state.pendingCommand = {
      command: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--verification": (rest, index, state) => {
    const parsed = parseOptionAfterPendingCommand(
      rest,
      index,
      "--verification",
      state.commandOutcomes,
      state.pendingCommand
    );

    if (!parsed.ok) {
      return parsed;
    }

    state.pendingCommand = undefined;

    const verificationResult = parseVerification(parsed.value);

    if (verificationResult.error !== undefined || verificationResult.command === undefined) {
      return {
        ok: false,
        error: verificationResult.error ?? evidenceUsage
      };
    }

    state.commandOutcomes.push(verificationResult.command);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--source-usefulness": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--source-usefulness");

    if (!parsed.ok) {
      return parsed;
    }

    const outcomeResult = parseSourceUsefulness(parsed.value);

    if (outcomeResult.error !== undefined || outcomeResult.outcome === undefined) {
      return {
        ok: false,
        error: outcomeResult.error ?? evidenceUsage
      };
    }

    state.sourceUsefulnessOutcomes.push(outcomeResult.outcome);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--memory-usefulness": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--memory-usefulness");

    if (!parsed.ok) {
      return parsed;
    }

    const outcomeResult = parseKnowledgeUsefulness(parsed.value);

    if (outcomeResult.error !== undefined || outcomeResult.outcome === undefined) {
      return {
        ok: false,
        error: outcomeResult.error ?? evidenceUsage
      };
    }

    state.knowledgeUsefulnessOutcomes.push(outcomeResult.outcome);

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--context-usefulness": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--context-usefulness");
    if (!parsed.ok) return parsed;
    const outcomeResult = parseContextInclusionUsefulness(parsed.value);
    if (outcomeResult.error !== undefined || outcomeResult.outcome === undefined) {
      return { ok: false, error: outcomeResult.error ?? evidenceUsage };
    }
    state.contextInclusionUsefulnessOutcomes.push(outcomeResult.outcome);
    return { ok: true, nextIndex: parsed.nextIndex };
  },
  "--status": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--status");

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--status requires a preceding --command"
      };
    }

    if (!isEvidenceStatus(parsed.value)) {
      return {
        ok: false,
        error: "--status must be passed, failed, skipped, missing, or not_run"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      status: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--exit-code": (rest, index, state) => {
    const parsed = parseEvidenceOption(rest, index, "--exit-code");

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--exit-code requires a preceding --command"
      };
    }

    const exitCode = parseExitCode(parsed.value);

    if (exitCode === undefined) {
      return {
        ok: false,
        error: "--exit-code must be an integer"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      exitCode
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--started-at": (rest, index, state) => {
    const parsed = parseNonEmptyOption(
      rest,
      index,
      "--started-at",
      "--started-at requires a valid ISO timestamp"
    );

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--started-at requires a preceding --command"
      };
    }

    if (!isIsoTimestamp(parsed.value)) {
      return {
        ok: false,
        error: "--started-at requires a valid ISO timestamp"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      startedAt: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--captured-at": (rest, index, state) => {
    const parsed = parseNonEmptyOption(
      rest,
      index,
      "--captured-at",
      "--captured-at requires a valid ISO timestamp"
    );

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--captured-at requires a preceding --command"
      };
    }

    if (!isIsoTimestamp(parsed.value)) {
      return {
        ok: false,
        error: "--captured-at requires a valid ISO timestamp"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      capturedAt: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--stdout-file": (rest, index, state) => {
    const parsed = parseNonEmptyOption(
      rest,
      index,
      "--stdout-file",
      "--stdout-file requires a non-empty path"
    );

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--stdout-file requires a preceding --command"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      stdoutFile: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  },
  "--stderr-file": (rest, index, state) => {
    const parsed = parseNonEmptyOption(
      rest,
      index,
      "--stderr-file",
      "--stderr-file requires a non-empty path"
    );

    if (!parsed.ok) {
      return parsed;
    }

    if (state.pendingCommand === undefined) {
      return {
        ok: false,
        error: "--stderr-file requires a preceding --command"
      };
    }

    state.pendingCommand = {
      ...state.pendingCommand,
      stderrFile: parsed.value
    };

    return {
      ok: true,
      nextIndex: parsed.nextIndex
    };
  }
};

const targetScalarValues = (state: EvidenceParseState): readonly (string | undefined)[] => [
  state.targetRepo,
  state.targetMode,
  state.targetDirtyBefore,
  state.targetDirtyAfter,
  state.targetOwnedChanges,
  state.targetStatusFreshness,
  state.targetPatchLifecycle,
  state.handoffArtifact,
  state.targetOwnerDecision
];

const targetListSizes = (state: EvidenceParseState): readonly number[] => [
  state.targetAllowedWrites.length,
  state.targetForbiddenWrites.length,
  state.targetChangedFiles.length,
  state.targetCommands.length
];

const hasTargetEvidence = (state: EvidenceParseState): boolean =>
  targetScalarValues(state).some((value) => value !== undefined) ||
  targetListSizes(state).some((size) => size > 0) ||
  state.targetChangedFilesExplicitNone;

const assignTargetScalarFields = (
  targetEvidence: TargetEvidenceInput,
  state: EvidenceParseState
): void => {
  if (state.targetMode !== undefined) targetEvidence.mode = state.targetMode;
  if (state.targetDirtyBefore !== undefined) targetEvidence.dirtyBefore = state.targetDirtyBefore;
  if (state.targetDirtyAfter !== undefined) targetEvidence.dirtyAfter = state.targetDirtyAfter;
  if (state.targetOwnedChanges !== undefined) targetEvidence.ownedChanges = state.targetOwnedChanges;
  if (state.targetStatusFreshness !== undefined) targetEvidence.targetStatusFreshness = state.targetStatusFreshness;
  if (state.targetPatchLifecycle !== undefined) targetEvidence.targetPatchLifecycle = state.targetPatchLifecycle;
  if (state.handoffArtifact !== undefined) targetEvidence.handoffArtifact = state.handoffArtifact;
  if (state.targetOwnerDecision !== undefined) targetEvidence.targetOwnerDecision = state.targetOwnerDecision;
};

const assignTargetListFields = (
  targetEvidence: TargetEvidenceInput,
  state: EvidenceParseState
): void => {
  if (state.targetAllowedWrites.length > 0) targetEvidence.allowedWrites = state.targetAllowedWrites;
  if (state.targetForbiddenWrites.length > 0) targetEvidence.forbiddenWrites = state.targetForbiddenWrites;
  if (state.targetChangedFiles.length > 0) targetEvidence.changedFiles = state.targetChangedFiles;
  if (state.targetCommands.length > 0) targetEvidence.commands = state.targetCommands;
};

const buildTargetEvidence = (
  state: EvidenceParseState
): { targetEvidence?: TargetEvidenceInput; error?: string } => {
  if (!hasTargetEvidence(state)) {
    return {};
  }

  if (state.targetRepo === undefined) {
    return {
      error: "--target-repo is required when target evidence flags are supplied"
    };
  }

  const targetEvidence: TargetEvidenceInput = {
    targetRepo: state.targetRepo
  };

  assignTargetScalarFields(targetEvidence, state);
  assignTargetListFields(targetEvidence, state);

  return {
    targetEvidence
  };
};

const decisionPacketBindingFor = (state: EvidenceParseState) => ({
  ...(state.decisionPacketChecksum === undefined
    ? {}
    : { decisionPacketChecksum: state.decisionPacketChecksum }),
  ...(state.decisionPacketGeneratedAt === undefined
    ? {}
    : { decisionPacketGeneratedAt: state.decisionPacketGeneratedAt })
});

export const parseEvidenceArgs = (rest: readonly string[]): ParseArgsResult => {
  if (rest[0] !== "capture") {
    return {
      error: evidenceUsage
    };
  }

  const state: EvidenceParseState = {
    persist: false,
    runId: undefined,
    decisionPacketChecksum: undefined,
    decisionPacketGeneratedAt: undefined,
    pendingCommand: undefined,
    commandOutcomes: [],
    intendedFiles: [],
    targetRepo: undefined,
    targetMode: undefined,
    targetDirtyBefore: undefined,
    targetDirtyAfter: undefined,
    targetOwnedChanges: undefined,
    targetStatusFreshness: undefined,
    targetPatchLifecycle: undefined,
    handoffArtifact: undefined,
    targetOwnerDecision: undefined,
    targetAllowedWrites: [],
    targetForbiddenWrites: [],
    targetChangedFiles: [],
    targetChangedFilesExplicitNone: false,
    targetCommands: [],
    sourceUsefulnessOutcomes: [],
    knowledgeUsefulnessOutcomes: [],
    contextInclusionUsefulnessOutcomes: []
  };

  for (let index = 1; index < rest.length; index += 1) {
    const arg = rest[index]!;
    const option = findEvidenceOption(arg);

    if (option === undefined) {
      return {
        error: evidenceUsage
      };
    }

    const parsed = evidenceOptionHandlers[option](rest, index, state);

    if (!parsed.ok) {
      return {
        error: parsed.error
      };
    }

    index = parsed.nextIndex;
  }

  const pushResult = pushPendingCommand(state.commandOutcomes, state.pendingCommand);

  if (pushResult.error !== undefined) {
    return {
      error: pushResult.error
    };
  }

  const targetEvidenceResult = buildTargetEvidence(state);

  if (targetEvidenceResult.error !== undefined) {
    return {
      error: targetEvidenceResult.error
    };
  }

  return {
    command: {
      kind: "evidenceCapture",
      persist: state.persist,
      ...(state.runId === undefined ? {} : { runId: state.runId.trim() }),
      ...decisionPacketBindingFor(state),
      ...(state.intendedFiles.length === 0 ? {} : { intendedFiles: state.intendedFiles }),
      ...(state.commandOutcomes.length === 0 ? {} : { commandOutcomes: state.commandOutcomes }),
      ...(targetEvidenceResult.targetEvidence === undefined ? {} : { targetEvidence: targetEvidenceResult.targetEvidence }),
      ...(state.sourceUsefulnessOutcomes.length === 0 ? {} : { sourceUsefulnessOutcomes: state.sourceUsefulnessOutcomes }),
      ...(state.knowledgeUsefulnessOutcomes.length === 0 ? {} : { knowledgeUsefulnessOutcomes: state.knowledgeUsefulnessOutcomes }),
      ...(state.contextInclusionUsefulnessOutcomes.length === 0 ? {} : { contextInclusionUsefulnessOutcomes: state.contextInclusionUsefulnessOutcomes })
    }
  };
};
