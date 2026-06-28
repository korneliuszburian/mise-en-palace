import {
  execFile
} from "node:child_process";
import {
  promisify
} from "node:util";
import type {
  DiffRisk,
  EvidenceCommand,
  NormalizedEvidenceCommand,
  MemoryCandidate,
  SourceDecision,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidence,
  TargetEvidenceInput
} from "@krn/core";
import {
  assessCandidateReviewability,
  normalizeEvidenceCommand,
  normalizeTargetEvidence
} from "@krn/core";
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  CreateDatabaseRuntime
} from "./runPlanCommand.js";

const execFileAsync = promisify(execFile);

export interface EvidenceCaptureRuntime {
  env: Record<string, string | undefined>;
  cwd: string;
  now(): string;
  createId(prefix: string): string;
  persist: boolean;
  runId?: string;
  intendedFiles?: readonly string[];
  commandOutcomes?: readonly EvidenceCommand[];
  targetEvidence?: TargetEvidenceInput;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  readGitStatus?(): Promise<string>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface EvidenceCaptureResult {
  stdout: string;
}

interface ChangedFile {
  status: string;
  path: string;
}

interface ChangedFileClassification {
  intended: ChangedFile[];
  unrelated: ChangedFile[];
  unknown: ChangedFile[];
  intendedFiles: string[];
  unmatchedIntendedFiles: string[];
}

interface PersistedEvidenceIdentity {
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
}

interface MemoryCandidateProposal {
  id: string;
  kind: MemoryCandidate["kind"];
  status: MemoryCandidate["status"];
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  sourceLineage: MemoryCandidate["sourceLineage"];
  missingFields: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

const candidateReviewabilityDoesNotProve =
  "This reviewability classification does not approve, promote, or persist the candidate as Memory Core truth.";

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";

const readGitStatus = async (runtime: EvidenceCaptureRuntime): Promise<string> => {
  if (runtime.readGitStatus !== undefined) {
    return runtime.readGitStatus();
  }

  const result = await execFileAsync("git", ["status", "--short"], {
    cwd: runtime.cwd
  });

  return result.stdout;
};

const diffRiskFromChangedFiles = (changedFiles: readonly ChangedFile[]): DiffRisk => {
  if (changedFiles.length === 0) {
    return "low";
  }

  if (changedFiles.length <= 5) {
    return "medium";
  }

  return "high";
};

const normalizeChangedFilePath = (path: string): string =>
  path
    .trim()
    .replace(/^\.\//, "")
    .replace(/^(\.\.\/)+/, "")
    .replace(/\/$/, "");

const parseChangedFiles = (statusOutput: string): ChangedFile[] =>
  statusOutput
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => ({
      status: line.slice(0, 2).trim() || "changed",
      path: normalizeChangedFilePath(line.slice(3))
    }))
    .filter((file) => file.path.length > 0);

const changedFileMatchesIntendedFile = (changedPath: string, intendedPath: string): boolean => {
  if (changedPath === intendedPath) {
    return true;
  }

  if (intendedPath.startsWith(`${changedPath}/`)) {
    return true;
  }

  return intendedPath.startsWith("packages/") && intendedPath.endsWith(`/${changedPath}`);
};

const classifyChangedFiles = (
  changedFiles: readonly ChangedFile[],
  intendedFiles: readonly string[] | undefined
): ChangedFileClassification => {
  const normalizedIntendedFiles = [
    ...new Set((intendedFiles ?? [])
      .map(normalizeChangedFilePath)
      .filter((path) => path.length > 0))
  ];

  if (normalizedIntendedFiles.length === 0) {
    return {
      intended: [],
      unrelated: [],
      unknown: [...changedFiles],
      intendedFiles: [],
      unmatchedIntendedFiles: []
    };
  }

  const intendedFileSet = new Set(normalizedIntendedFiles);
  const intended: ChangedFile[] = [];
  const unrelated: ChangedFile[] = [];
  const changedFileSet = new Set<string>();

  for (const file of changedFiles) {
    const normalizedPath = normalizeChangedFilePath(file.path);
    changedFileSet.add(normalizedPath);

    if ([...intendedFileSet].some((intendedPath) =>
      changedFileMatchesIntendedFile(normalizedPath, intendedPath)
    )) {
      intended.push(file);
    } else {
      unrelated.push(file);
    }
  }

  return {
    intended,
    unrelated,
    unknown: [],
    intendedFiles: normalizedIntendedFiles,
    unmatchedIntendedFiles: normalizedIntendedFiles.filter((intendedPath) =>
      ![...changedFileSet].some((changedPath) =>
        changedFileMatchesIntendedFile(changedPath, intendedPath)
      )
    )
  };
};

const sourceDecisionSignal = (file: ChangedFile): boolean => {
  const path = file.path.toLowerCase();

  return (
    path === "goal.md" ||
    path === "plan.md" ||
    path.startsWith("docs/decisions/") ||
    path.startsWith("docs/runs/") ||
    path.startsWith(".agents/skills/") ||
    path.includes("source")
  );
};

const buildSourceDecisionCandidates = (
  runtime: Pick<EvidenceCaptureRuntime, "createId" | "now">,
  changedFiles: readonly ChangedFile[]
): SourceDecision[] => {
  const candidateFiles = changedFiles.filter(sourceDecisionSignal);

  if (candidateFiles.length === 0) {
    return [];
  }

  const timestamp = runtime.now();
  const changedFilePaths = candidateFiles.map((file) => file.path);
  const reviewability = assessCandidateReviewability({
    summary: "Review changed files for source graph decision updates.",
    body: `Changed files imply a possible source decision: ${changedFilePaths.join(", ")}`,
    evidenceRefs: changedFilePaths,
    applicationGuidance:
      "Review only if a SourceClaim with mechanism, doesNotProve, and consumer exists.",
    doesNotProve: candidateReviewabilityDoesNotProve
  });

  return [{
    id: runtime.createId("source-decision-candidate"),
    status: "defer",
    decision: "Review changed files for source graph decision updates.",
    rationale: `Changed files imply a possible source decision: ${changedFilePaths.join(", ")}`,
    falsifier:
      "Do not promote unless a SourceClaim with mechanism, doesNotProve, and consumer exists.",
    consumer: "krn evidence capture",
    metadata: {
      candidateType: "sourceDecisionCandidate",
      changedFiles: changedFilePaths,
      changedFileCount: changedFilePaths.length,
      candidateEvidenceRefs: changedFilePaths,
      reviewability: reviewability.reviewability,
      reviewabilityReasons: reviewability.reasons,
      promotion: "proposal-only"
    },
    createdAt: timestamp,
    updatedAt: timestamp
  }];
};

const buildMemoryCandidateProposals = (
  runtime: Pick<EvidenceCaptureRuntime, "createId" | "now">,
  changedFiles: readonly ChangedFile[]
): MemoryCandidateProposal[] => {
  if (changedFiles.length === 0) {
    return [];
  }

  const timestamp = runtime.now();
  const changedFilePaths = changedFiles.map((file) => file.path);
  const missingFields = ["applicationGuidance", "sourceLineage", "invalidationRule"];
  const reviewability = assessCandidateReviewability({
    summary: "Review changed files for reusable memory.",
    body: `Changed files may contain reusable KRN operating knowledge: ${changedFilePaths.join(", ")}`,
    evidenceRefs: changedFilePaths,
    sourceLineage: [],
    missingFields,
    doesNotProve: candidateReviewabilityDoesNotProve
  });

  return [{
    id: runtime.createId("memory-candidate-proposal"),
    kind: "pattern",
    status: "proposed",
    summary: "Review changed files for reusable memory.",
    body: `Changed files may contain reusable KRN operating knowledge: ${changedFilePaths.join(", ")}`,
    owner: "krn-cli",
    confidence: 50,
    sourceLineage: [],
    missingFields,
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {
      candidateType: "memoryCandidateProposal",
      changedFiles: changedFilePaths,
      changedFileCount: changedFilePaths.length,
      completeness: "incomplete",
      missingFields,
      reviewability: reviewability.reviewability,
      reviewabilityReasons: reviewability.reasons,
      persistence: "feedback-delta-proposal-only",
      promotion: "manual-only"
    }
  }];
};

const defaultCommands = (): EvidenceCommand[] => [
  {
    command: "pnpm typecheck",
    status: "not_run",
    provenance: "default_template"
  },
  {
    command: "pnpm test",
    status: "not_run",
    provenance: "default_template"
  },
  {
    command: "git diff --check",
    status: "not_run",
    provenance: "default_template"
  }
];

const renderCommand = (command: EvidenceCommand): string => {
  const normalized = normalizeEvidenceCommand(command);

  return [
    `${normalized.command}: ${normalized.status}`,
    `provenance=${normalized.provenance}`,
    ...("exitCode" in normalized && normalized.exitCode !== undefined
      ? [`exitCode=${normalized.exitCode}`]
      : []),
    ...("outputRef" in normalized && normalized.outputRef !== undefined
      ? [`output=${normalized.outputRef}`]
      : []),
    `doesNotProve=${normalized.doesNotProve}`
  ].join(" | ");
};

const hasWeakCommandProvenance = (commands: readonly NormalizedEvidenceCommand[]): boolean =>
  commands.some((command) => command.kind === "default_template");

const normalizeCommands = (commands: readonly EvidenceCommand[]): NormalizedEvidenceCommand[] =>
  commands.map(normalizeEvidenceCommand);

const persistenceLabel = (runtime: EvidenceCaptureRuntime): string =>
  runtime.persist
    ? "enabled (Postgres, explicit --persist)"
    : "disabled (explicit printed-only preview; use --persist to write)";

const commandInputHint =
  "Command evidence input: use --verification \"pnpm typecheck=passed\" for operator-reported outcomes.";

const commandExecutionNotice =
  "Command execution: none (evidence capture records supplied outcomes; it does not run shell commands).";

const renderTargetEvidenceList = (values: readonly string[]): string[] => {
  if (values.length === 0) {
    return ["  - none"];
  }

  return values.map((value) => `  - ${value}`);
};

const renderTargetChangedFiles = (targetEvidence: TargetEvidence): string[] => {
  if (targetEvidence.changedFiles.length === 0) {
    return ["  - none"];
  }

  return targetEvidence.changedFiles.map((file) =>
    `  - ${file.status} ${file.path} | ownership=${file.ownership}`
  );
};

const renderTargetEvidence = (targetEvidence: TargetEvidence | undefined): string[] => {
  if (targetEvidence === undefined) {
    return [
      "Target evidence:",
      "- none"
    ];
  }

  return [
    "Target evidence:",
    `- repo: ${targetEvidence.targetRepo}`,
    `- mode: ${targetEvidence.mode}`,
    `- dirtyBefore: ${targetEvidence.dirtyBefore}`,
    `- dirtyAfter: ${targetEvidence.dirtyAfter}`,
    `- ownedChanges: ${targetEvidence.ownedChanges}`,
    `- targetStatusFreshness: ${targetEvidence.targetStatusFreshness}`,
    `- targetPatchLifecycle: ${targetEvidence.targetPatchLifecycle}`,
    `- handoffArtifact: ${targetEvidence.handoffArtifact ?? "none"}`,
    `- targetOwnerDecision: ${targetEvidence.targetOwnerDecision ?? "none"}`,
    "- allowedWrites:",
    ...renderTargetEvidenceList(targetEvidence.allowedWrites),
    "- forbiddenWrites:",
    ...renderTargetEvidenceList(targetEvidence.forbiddenWrites),
    "- changedFiles:",
    ...renderTargetChangedFiles(targetEvidence),
    "- commands:",
    ...renderTargetEvidenceList(targetEvidence.commands),
    "- doesNotProve:",
    ...renderTargetEvidenceList(targetEvidence.doesNotProve)
  ];
};

const renderChangedFileGroup = (files: readonly ChangedFile[]): string[] => {
  if (files.length === 0) {
    return ["- none"];
  }

  return files.map((file) => `- ${file.status} ${file.path}`);
};

const renderChangedFiles = (classification: ChangedFileClassification): string[] => {
  const changedFileCount =
    classification.intended.length +
    classification.unrelated.length +
    classification.unknown.length;

  if (changedFileCount === 0) {
    return ["- none"];
  }

  if (classification.intendedFiles.length === 0) {
    return [
      "unknown:",
      ...renderChangedFileGroup(classification.unknown)
    ];
  }

  const lines = [
    "intended:",
    ...renderChangedFileGroup(classification.intended),
    "unrelated:",
    ...renderChangedFileGroup(classification.unrelated),
    "unknown:",
    ...renderChangedFileGroup(classification.unknown)
  ];

  if (classification.unmatchedIntendedFiles.length > 0) {
    lines.push(
      "unmatched intended files:",
      ...classification.unmatchedIntendedFiles.map((path) => `- ${path}`)
    );
  }

  return lines;
};

const renderDirtyContext = (classification: ChangedFileClassification): string => {
  if (classification.intendedFiles.length === 0) {
    return "Dirty context: unclassified (no --intended-file provided).";
  }

  if (classification.unrelated.length > 0) {
    return "Dirty context: unrelated files present; review burden increased.";
  }

  return "Dirty context: none detected from intended-file classification.";
};

const reviewBurdenFromClassification = (classification: ChangedFileClassification): string => {
  if (classification.unrelated.length > 0) {
    return "Review intended files, unrelated dirty files, command proof, residual risk, and rollback path.";
  }

  if (classification.intendedFiles.length === 0 && classification.unknown.length > 0) {
    return "Review unclassified changed files, command proof, residual risk, and rollback path.";
  }

  return "Review changed files, command proof, residual risk, and rollback path.";
};

const reviewBurdenWithTargetEvidence = (
  classification: ChangedFileClassification,
  targetEvidence: TargetEvidence | undefined
): string => {
  const base = reviewBurdenFromClassification(classification);

  if (targetEvidence === undefined) {
    return base;
  }

  return `${base} Review target repo mode, dirty state, ownership, allowed/forbidden writes, target command proof, and target does-not-prove boundaries separately.`;
};

const renderSourceDecisionCandidates = (
  candidates: readonly SourceDecision[]
): string[] => {
  if (candidates.length === 0) {
    return ["- none"];
  }

  return candidates.flatMap((candidate) => {
    const reviewability = assessCandidateReviewability({
      summary: candidate.decision,
      body: candidate.rationale,
      evidenceRefs: Array.isArray(candidate.metadata.changedFiles)
        ? candidate.metadata.changedFiles.filter((value): value is string => typeof value === "string")
        : [],
      applicationGuidance: candidate.falsifier,
      doesNotProve: candidateReviewabilityDoesNotProve
    });

    return [
      `- ${candidate.id}: ${candidate.decision}`,
      `  status: ${candidate.status}`,
      `  reviewability: ${reviewability.reviewability}`,
      "  reviewability reasons:",
      ...reviewability.reasons.map((reason) => `  - ${reason}`),
      `  consumer: ${candidate.consumer}`,
      `  falsifier: ${candidate.falsifier}`,
      "  No SourceClaim created"
    ];
  });
};

const renderSourceUsefulnessOutcomes = (
  outcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined
): string[] => {
  if (outcomes === undefined || outcomes.length === 0) {
    return ["- none"];
  }

  return outcomes.flatMap((outcome) => [
    `- outcome=${outcome.outcome} sourceClaim=${outcome.sourceClaimId ?? "none"} sourceDecision=${outcome.sourceDecisionId ?? "none"}`,
    `  reason: ${outcome.reason}`,
    ...(outcome.evidenceRefs.length === 0
      ? ["  evidenceRef: none"]
      : outcome.evidenceRefs.map((evidenceRef) => `  evidenceRef: ${evidenceRef}`)),
    `  doesNotProve: ${outcome.doesNotProve}`
  ]);
};

const renderMemoryCandidateProposals = (
  proposals: readonly MemoryCandidateProposal[]
): string[] => {
  if (proposals.length === 0) {
    return ["- none"];
  }

  return proposals.flatMap((proposal) => {
    const metadataEvidenceRefs = Array.isArray(proposal.metadata.changedFiles)
      ? proposal.metadata.changedFiles.filter((value): value is string => typeof value === "string")
      : [];
    const applicationGuidance =
      typeof proposal.metadata.applicationGuidance === "string"
        ? proposal.metadata.applicationGuidance
        : undefined;
    const reviewability = assessCandidateReviewability({
      summary: proposal.summary,
      body: proposal.body,
      evidenceRefs: metadataEvidenceRefs,
      sourceLineage: proposal.sourceLineage,
      ...(applicationGuidance === undefined ? {} : { applicationGuidance }),
      doesNotProve: candidateReviewabilityDoesNotProve,
      missingFields: proposal.missingFields
    });

    return [
      `- ${proposal.id}: ${proposal.summary}`,
      `  status: ${proposal.status}`,
      `  kind: ${proposal.kind}`,
      `  reviewability: ${reviewability.reviewability}`,
      "  reviewability reasons:",
      ...reviewability.reasons.map((reason) => `  - ${reason}`),
      "  completeness: incomplete",
      `  missing: ${proposal.missingFields.join(", ")}`,
      "  No MemoryCandidate row created",
      "  No MemoryRecord created"
    ];
  });
};

const materializeFeedbackDeltaMemoryCandidate = (
  proposal: MemoryCandidateProposal,
  projectId: string,
  executionRunId: string
): MemoryCandidate => ({
  id: proposal.id,
  projectId,
  executionRunId,
  proposedBy: "krn evidence capture",
  kind: proposal.kind,
  status: proposal.status,
  summary: proposal.summary,
  body: proposal.body,
  owner: proposal.owner,
  confidence: proposal.confidence,
  applicationGuidance:
    "Incomplete proposal: define concrete application guidance before creating a MemoryCandidate row.",
  sourceClaimIds: [],
  sourceLineage: proposal.sourceLineage,
  isUserPreference: false,
  validFrom: proposal.createdAt,
  metadata: proposal.metadata,
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt
});

const persistEvidenceCapture = async (
  runtime: EvidenceCaptureRuntime,
  changedFiles: readonly ChangedFile[],
  classification: ChangedFileClassification,
  commands: NormalizedEvidenceCommand[],
  diffRisk: DiffRisk,
  targetEvidence: TargetEvidence | undefined,
  sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  sourceDecisionCandidates: readonly SourceDecision[],
  memoryCandidateProposals: readonly MemoryCandidateProposal[]
): Promise<PersistedEvidenceIdentity> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const runId = runtime.runId?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn evidence capture --persist");
  }

  if (runId === undefined || runId.length === 0) {
    throw new Error("--run-id is required for krn evidence capture --persist");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const aggregate = await databaseRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(runId);

    if (aggregate === undefined) {
      throw new Error(`No persisted harness run found for --run-id ${runId}`);
    }

    const nextSequence =
      aggregate.runEvents.reduce(
        (max, event) => Math.max(max, event.sequence),
        0
      ) + 1;
    const evidenceBundle = await databaseRuntime.harnessRunRepository.createEvidenceBundle({
      executionRunId: runId,
      status: "captured",
      changedFiles: changedFiles.map((file) => file.path),
      commands,
      diffRisk,
      reviewBurden: reviewBurdenWithTargetEvidence(classification, targetEvidence),
      rollbackPath: "Revert the focused implementation commit or discard uncommitted changes.",
      event: {
        sequence: nextSequence,
        type: "evidence.captured",
        message: "Evidence captured from CLI",
        payload: {
          changedFileCount: changedFiles.length,
          intendedChangedFileCount: classification.intended.length,
          unrelatedChangedFileCount: classification.unrelated.length,
          unknownChangedFileCount: classification.unknown.length,
          commandCount: commands.length,
          targetEvidencePresent: targetEvidence !== undefined
        }
      },
      metadata: {
        command: "krn evidence capture --persist",
        runId,
        intendedFiles: classification.intendedFiles,
        changedFileClassification: {
          intended: classification.intended.map((file) => file.path),
          unrelated: classification.unrelated.map((file) => file.path),
          unknown: classification.unknown.map((file) => file.path),
          unmatchedIntendedFiles: classification.unmatchedIntendedFiles
        },
        dirtyContext: {
          hasUnrelatedFiles: classification.unrelated.length > 0,
          unrelatedFileCount: classification.unrelated.length
        },
        ...(targetEvidence === undefined ? {} : { targetEvidence })
      }
    });
    const reviewAssessment = await databaseRuntime.harnessRunRepository.createReviewAssessment({
      evidenceBundleId: evidenceBundle.id,
      status: "pending",
      reviewer: "krn-cli",
      summary: "Evidence captured; human review still required.",
      findings: [],
      metadata: {
        runId,
        changedFileCount: changedFiles.length,
        intendedChangedFileCount: classification.intended.length,
        unrelatedChangedFileCount: classification.unrelated.length,
        unknownChangedFileCount: classification.unknown.length,
        targetEvidencePresent: targetEvidence !== undefined
      }
    });
    const memoryCandidates = memoryCandidateProposals.map((proposal) =>
      materializeFeedbackDeltaMemoryCandidate(
        proposal,
        databaseRuntime.projectId,
        runId
      )
    );
    const feedbackDelta = await databaseRuntime.harnessRunRepository.createFeedbackDelta({
      reviewAssessmentId: reviewAssessment.id,
      status: "candidate",
      memoryCandidates,
      sourceDecisions: [...sourceDecisionCandidates],
      evalCandidates: [],
      metadata: {
        runId,
        changedFileCount: changedFiles.length,
        intendedChangedFileCount: classification.intended.length,
        unrelatedChangedFileCount: classification.unrelated.length,
        unknownChangedFileCount: classification.unknown.length,
        targetEvidencePresent: targetEvidence !== undefined,
        memoryCandidateProposalCount: memoryCandidates.length,
        memoryCandidateRowCount: 0,
        sourceDecisionCandidateCount: sourceDecisionCandidates.length,
        ...(sourceUsefulnessOutcomes === undefined || sourceUsefulnessOutcomes.length === 0
          ? {}
          : { sourceUsefulnessOutcomes: [...sourceUsefulnessOutcomes] })
      }
    });

    return {
      evidenceBundleId: evidenceBundle.id,
      reviewAssessmentId: reviewAssessment.id,
      feedbackDeltaId: feedbackDelta.id
    };
  } finally {
    await databaseRuntime.close();
  }
};

export const runEvidenceCaptureCommand = async (
  runtime: EvidenceCaptureRuntime
): Promise<EvidenceCaptureResult> => {
  const statusOutput = await readGitStatus(runtime);
  const changedFiles = parseChangedFiles(statusOutput);
  const changedFileClassification = classifyChangedFiles(changedFiles, runtime.intendedFiles);
  const commands =
    runtime.commandOutcomes === undefined || runtime.commandOutcomes.length === 0
      ? normalizeCommands(defaultCommands())
      : normalizeCommands(runtime.commandOutcomes);
  const targetEvidence =
    runtime.targetEvidence === undefined
      ? undefined
      : normalizeTargetEvidence(runtime.targetEvidence);
  const diffRisk = diffRiskFromChangedFiles(changedFiles);
  const sourceDecisionCandidates = buildSourceDecisionCandidates(runtime, changedFiles);
  const memoryCandidateProposals = buildMemoryCandidateProposals(runtime, changedFiles);
  const persistedIdentity = runtime.persist
    ? await persistEvidenceCapture(
      runtime,
      changedFiles,
      changedFileClassification,
      commands,
      diffRisk,
      targetEvidence,
      runtime.sourceUsefulnessOutcomes,
      sourceDecisionCandidates,
      memoryCandidateProposals
    )
    : undefined;
  const feedbackCandidate =
    changedFiles.length === 0
      ? "No changed files; no feedback candidate proposed."
      : "Review changed files and command evidence before promoting memory/source/eval candidates.";
  const lines = [
    "KRN Evidence Capture",
    `Captured at: ${runtime.now()}`,
    `Persistence: ${persistenceLabel(runtime)}`,
    ...(runtime.runId === undefined ? [] : [`Run ID: ${runtime.runId}`]),
    commandInputHint,
    commandExecutionNotice,
    "Changed files:",
    ...renderChangedFiles(changedFileClassification),
    renderDirtyContext(changedFileClassification),
    "Commands:",
    ...commands.map(renderCommand),
    ...renderTargetEvidence(targetEvidence),
    ...(hasWeakCommandProvenance(commands)
      ? ["Command provenance is weak: default_template rows are not proof that commands ran."]
      : []),
    `Diff risk: ${diffRisk}`,
    `Review burden: ${reviewBurdenWithTargetEvidence(changedFileClassification, targetEvidence)}`,
    "Rollback path: revert the focused implementation commit or discard uncommitted changes.",
    "Memory mutation: none",
    "Feedback candidates:",
    `- ${feedbackCandidate}`,
    "memoryCandidates:",
    ...renderMemoryCandidateProposals(memoryCandidateProposals),
    "sourceDecisionCandidates:",
    ...renderSourceDecisionCandidates(sourceDecisionCandidates),
    "sourceUsefulnessOutcomes:",
    ...renderSourceUsefulnessOutcomes(runtime.sourceUsefulnessOutcomes)
  ];

  if (persistedIdentity !== undefined) {
    lines.push(
      "Persisted IDs:",
      `evidenceBundle: ${persistedIdentity.evidenceBundleId}`,
      `reviewAssessment: ${persistedIdentity.reviewAssessmentId}`,
      `feedbackDelta: ${persistedIdentity.feedbackDeltaId}`
    );
  }

  return {
    stdout: `${lines.join("\n")}\n`
  };
};
