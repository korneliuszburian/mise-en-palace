import {
  execFile
} from "node:child_process";
import path from "node:path";
import {
  promisify
} from "node:util";
import type {
  DiffRisk,
  EvalCandidateProposal,
  EvidenceCommand,
  EvidenceCommandReadback,
  MemoryCandidate,
  KnowledgeUsefulnessOutcomeFeedback,
  SourceDecision,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidence,
  TargetEvidenceInput
} from "@krn/core";
import {
  assessCandidateReviewability,
  knowledgeUsefulnessOutcomesFromMetadata,
  isReviewableFeedbackOutcome,
  sourceUsefulnessOutcomesFromMetadata,
  toEvidenceCommandReadback,
  normalizeTargetEvidence
} from "@krn/core";
import type {
  CreateEvidenceBundleInput,
  CreateFeedbackDeltaInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate
} from "@krn/core/repositories";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import {
  postgresPersistedLabel,
  persistenceLine
} from "./command-runtime-support.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";
import {
  authorizePacketUsefulness,
  usefulnessAuthorizationDowngradeReason
} from "./packet-usefulness-authorization.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";

const execFileAsync = promisify(execFile);

export interface EvidenceCaptureRuntime extends BaseCommandRuntime {
  cwd: string;
  persist: boolean;
  runId?: string;
  decisionPacketChecksum?: string;
  intendedFiles?: readonly string[];
  commandOutcomes?: readonly EvidenceCommand[];
  targetEvidence?: TargetEvidenceInput;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
  evalCandidateProposals?: readonly EvalCandidateProposal[];
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

interface ChangedFilePathContext {
  repoRoot: string;
  statusCwd: string;
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
  feedbackMaintenanceQueueRecordId?: string;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
  decisionPacketEvidenceRef?: string;
  usefulnessAuthorizationReason?: string;
}

interface EvidencePersistenceConfig {
  databaseUrl: string;
  runId: string;
}

interface EvidencePersistenceCounts {
  changedFileCount: number;
  intendedChangedFileCount: number;
  unrelatedChangedFileCount: number;
  unknownChangedFileCount: number;
  targetEvidencePresent: boolean;
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

const normalizeGitStatusPath = (
  rawPath: string,
  context: ChangedFilePathContext
): string => {
  const trimmedPath = rawPath.trim();

  if (trimmedPath.length === 0) {
    return "";
  }

  const absolutePath = path.resolve(context.statusCwd, trimmedPath);
  const relativePath = path.relative(context.repoRoot, absolutePath);

  return normalizeChangedFilePath(relativePath);
};

const parseChangedFiles = (
  statusOutput: string,
  context: ChangedFilePathContext
): ChangedFile[] =>
  statusOutput
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => ({
      status: line.slice(0, 2).trim() || "changed",
      path: normalizeGitStatusPath(line.slice(3), context)
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
  const canonicalIntendedFiles = [
    ...new Set((intendedFiles ?? [])
      .map(normalizeChangedFilePath)
      .filter((path) => path.length > 0))
  ];

  if (canonicalIntendedFiles.length === 0) {
    return {
      intended: [],
      unrelated: [],
      unknown: [...changedFiles],
      intendedFiles: [],
      unmatchedIntendedFiles: []
    };
  }

  const intendedFileSet = new Set(canonicalIntendedFiles);
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
    intendedFiles: canonicalIntendedFiles,
    unmatchedIntendedFiles: canonicalIntendedFiles.filter((intendedPath) =>
      ![...changedFileSet].some((changedPath) =>
        changedFileMatchesIntendedFile(changedPath, intendedPath)
      )
    )
  };
};

const sourceDecisionSignal = (file: ChangedFile): boolean => {
  const path = file.path.toLowerCase();

  return (
    path === "agents.md" ||
    path === "krn_roadmap.md" ||
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
    kind: "procedure",
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
  const evidenceCommand = toEvidenceCommandReadback(command);

  return [
    `${evidenceCommand.command}: ${evidenceCommand.status}`,
    `provenance=${evidenceCommand.provenance}`,
    ...("exitCode" in evidenceCommand && evidenceCommand.exitCode !== undefined
      ? [`exitCode=${evidenceCommand.exitCode}`]
      : []),
    ...("outputRef" in evidenceCommand && evidenceCommand.outputRef !== undefined
      ? [`output=${evidenceCommand.outputRef}`]
      : []),
    `doesNotProve=${evidenceCommand.doesNotProve}`
  ].join(" | ");
};

const hasWeakCommandProvenance = (commands: readonly EvidenceCommandReadback[]): boolean =>
  commands.some((command) => command.kind === "default_template");

const normalizeCommands = (commands: readonly EvidenceCommand[]): EvidenceCommandReadback[] =>
  commands.map(toEvidenceCommandReadback);

const persistenceLabel = (runtime: EvidenceCaptureRuntime): string =>
  runtime.persist ? postgresPersistedLabel : "disabled (explicit printed-only preview; use --persist to write)";

const decisionPacketEvidenceRef = (
  decisionPacketChecksum: string | undefined
): string | undefined => {
  const checksum = decisionPacketChecksum?.trim();

  return checksum === undefined || checksum.length === 0
    ? undefined
    : `packet:${checksum}`;
};

const normalizeDecisionPacketChecksum = (
  decisionPacketChecksum: string | undefined
): string | undefined => {
  const checksum = decisionPacketChecksum?.trim();

  return checksum === undefined || checksum.length === 0 ? undefined : checksum;
};

const renderDecisionPacketBinding = (
  decisionPacketChecksum: string | undefined
): string => {
  const checksum = normalizeDecisionPacketChecksum(decisionPacketChecksum);
  const evidenceRef = decisionPacketEvidenceRef(checksum);

  return evidenceRef === undefined
    ? "DecisionPacket: unbound (no --decision-packet-checksum supplied)."
    : `DecisionPacket: checksum=${checksum} | evidenceRef=${evidenceRef}`;
};

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

const renderKnowledgeUsefulnessOutcomes = (
  outcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined
): string[] => {
  if (outcomes === undefined || outcomes.length === 0) {
    return ["- none"];
  }

  return outcomes.flatMap((outcome) => [
    `- outcome=${outcome.outcome} knowledge=${outcome.knowledgeId}`,
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

const resolveEvidencePersistenceConfig = (
  runtime: EvidenceCaptureRuntime
): EvidencePersistenceConfig => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();
  const runId = runtime.runId?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn evidence capture --persist");
  }

  if (runId === undefined || runId.length === 0) {
    throw new Error("--run-id is required for krn evidence capture --persist");
  }

  return { databaseUrl, runId };
};

const buildEvidencePersistenceCounts = (
  changedFiles: readonly ChangedFile[],
  classification: ChangedFileClassification,
  targetEvidence: TargetEvidence | undefined
): EvidencePersistenceCounts => ({
  changedFileCount: changedFiles.length,
  intendedChangedFileCount: classification.intended.length,
  unrelatedChangedFileCount: classification.unrelated.length,
  unknownChangedFileCount: classification.unknown.length,
  targetEvidencePresent: targetEvidence !== undefined
});

const nextEvidenceEventSequence = (aggregate: HarnessRunAggregate): number =>
  aggregate.runEvents.reduce(
    (max, event) => Math.max(max, event.sequence),
    0
  ) + 1;

const changedFileClassificationMetadata = (
  classification: ChangedFileClassification
): Record<string, string[]> => ({
  intended: classification.intended.map((file) => file.path),
  unrelated: classification.unrelated.map((file) => file.path),
  unknown: classification.unknown.map((file) => file.path),
  unmatchedIntendedFiles: classification.unmatchedIntendedFiles
});

const buildEvidenceBundleInput = (
  runId: string,
  changedFiles: readonly ChangedFile[],
  classification: ChangedFileClassification,
  commands: EvidenceCommandReadback[],
  diffRisk: DiffRisk,
  targetEvidence: TargetEvidence | undefined,
  counts: EvidencePersistenceCounts,
  eventSequence: number,
  decisionPacketChecksum: string | undefined,
  environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): CreateEvidenceBundleInput => ({
  executionRunId: runId,
  status: "captured",
  changedFiles: changedFiles.map((file) => file.path),
  commands,
  diffRisk,
  reviewBurden: reviewBurdenWithTargetEvidence(classification, targetEvidence),
  rollbackPath: "Revert the focused implementation commit or discard uncommitted changes.",
  event: {
    sequence: eventSequence,
    type: "evidence.captured",
    message: "Evidence captured from CLI",
    payload: {
      ...counts,
      commandCount: commands.length
    }
  },
  metadata: {
    command: "krn evidence capture --persist",
    runId,
    intendedFiles: classification.intendedFiles,
    changedFileClassification: changedFileClassificationMetadata(classification),
    dirtyContext: {
      hasUnrelatedFiles: classification.unrelated.length > 0,
      unrelatedFileCount: classification.unrelated.length
    },
    ...(decisionPacketChecksum === undefined ? {} : {
      decisionPacketChecksum,
      decisionPacketEvidenceRef: `packet:${decisionPacketChecksum}`
    }),
    ...(targetEvidence === undefined ? {} : { targetEvidence }),
    environmentFingerprint
  }
});

const buildReviewAssessmentInput = (
  evidenceBundleId: string,
  runId: string,
  counts: EvidencePersistenceCounts
): CreateReviewAssessmentInput => ({
  evidenceBundleId,
  status: "pending",
  reviewer: "krn-cli",
  summary: "Evidence captured; human review still required.",
  findings: [],
  metadata: {
    runId,
    ...counts
  }
});

const buildFeedbackDeltaInput = (
  reviewAssessmentId: string,
  runId: string,
  counts: EvidencePersistenceCounts,
  memoryCandidates: readonly MemoryCandidate[],
  sourceDecisionCandidates: readonly SourceDecision[],
  sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined,
  decisionPacketChecksum: string | undefined,
  evalCandidateProposals: readonly EvalCandidateProposal[],
  environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): CreateFeedbackDeltaInput => ({
  reviewAssessmentId,
  status: "candidate",
  memoryCandidates: [...memoryCandidates],
  sourceDecisions: [...sourceDecisionCandidates],
  evalCandidates: [...evalCandidateProposals],
  metadata: {
    runId,
    ...counts,
    memoryCandidateProposalCount: memoryCandidates.length,
    memoryCandidateRowCount: 0,
    sourceDecisionCandidateCount: sourceDecisionCandidates.length,
    ...(decisionPacketChecksum === undefined ? {} : {
      decisionPacketChecksum,
      decisionPacketEvidenceRef: `packet:${decisionPacketChecksum}`
    }),
    ...(sourceUsefulnessOutcomes === undefined || sourceUsefulnessOutcomes.length === 0
      ? {}
      : { sourceUsefulnessOutcomes: [...sourceUsefulnessOutcomes] }),
    ...(knowledgeUsefulnessOutcomes === undefined || knowledgeUsefulnessOutcomes.length === 0
      ? {}
      : { knowledgeUsefulnessOutcomes: [...knowledgeUsefulnessOutcomes] }),
    environmentFingerprint
  }
});

const outcomeHasCurrentEvidenceRef = (
  evidenceRefs: readonly string[],
  currentEvidenceRefs: ReadonlySet<string>
): boolean =>
  evidenceRefs.some((evidenceRef) => currentEvidenceRefs.has(evidenceRef));

interface UsefulnessEvidenceClass {
  applicationRefs: ReadonlySet<string>;
  verificationRefs: ReadonlySet<string>;
}

const evidenceCommandOutputRefs = (
  command: EvidenceCommandReadback
): string[] => "outputRef" in command && command.outputRef !== undefined
  ? [command.outputRef]
  : [];

const usefulnessEvidenceClassFor = (input: {
  readonly changedFiles: readonly ChangedFile[];
  readonly commands: readonly EvidenceCommandReadback[];
  readonly targetEvidence: TargetEvidence | undefined;
}): UsefulnessEvidenceClass => ({
  applicationRefs: new Set([
    ...input.changedFiles.map((file) => file.path),
    ...(input.targetEvidence?.changedFiles
      .filter((file) => file.ownership === "owned_by_current_krn_run" || file.ownership === "partial")
      .map((file) => file.path) ?? [])
  ]),
  verificationRefs: new Set(input.commands.flatMap((command) =>
    command.status === "passed"
      ? [command.command, ...evidenceCommandOutputRefs(command)]
      : []
  ))
});

const evidenceClassDowngradeReason = (
  requestedOutcome: "used" | "helped",
  provenOutcome: "selected" | "used" | "helped",
  reason: string
): string => {
  const requiredEvidence = requestedOutcome === "helped"
    ? "current application evidence and successful current verification/output proof"
    : "current application evidence";

  return `Downgraded: ${requestedOutcome} requires ${requiredEvidence}; current evidence supports ${provenOutcome} only. Original reason: ${reason}`;
};

const downgradeUsefulnessOutcomesWithoutApplicationProof = <T extends {
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
}>(
  outcomes: readonly T[] | undefined,
  evidenceClass: UsefulnessEvidenceClass
): readonly T[] | undefined => outcomes?.map((outcome) => {
  if (outcome.outcome !== "used" && outcome.outcome !== "helped") {
    return outcome;
  }

  const refs = new Set(outcome.evidenceRefs);
  const hasApplicationEvidence = [...refs].some((ref) => evidenceClass.applicationRefs.has(ref));
  const hasVerificationEvidence = [...refs].some((ref) => evidenceClass.verificationRefs.has(ref));
  const provenOutcome = outcome.outcome === "used"
    ? hasApplicationEvidence ? "used" : "selected"
    : hasApplicationEvidence && hasVerificationEvidence
      ? "helped"
      : hasApplicationEvidence
        ? "used"
        : "selected";

  return provenOutcome === outcome.outcome
    ? outcome
    : {
        ...outcome,
        outcome: provenOutcome,
        reason: evidenceClassDowngradeReason(outcome.outcome, provenOutcome, outcome.reason)
      };
});

const downgradeReason = (reason: string): string =>
  `Downgraded: no evidenceRef matched current evidence bundle, changed file, or command proof. Original reason: ${reason}`;

const downgradeSourceUsefulnessOutcomesWithoutCurrentEvidence = (
  outcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  currentEvidenceRefs: ReadonlySet<string>
): readonly SourceUsefulnessOutcomeFeedback[] | undefined =>
  outcomes?.map((outcome) =>
    outcome.outcome === "unknown" || outcomeHasCurrentEvidenceRef(outcome.evidenceRefs, currentEvidenceRefs)
      ? outcome
      : {
          ...outcome,
          outcome: "unknown",
          reason: downgradeReason(outcome.reason)
        }
  );

const downgradeKnowledgeUsefulnessOutcomesWithoutCurrentEvidence = (
  outcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined,
  currentEvidenceRefs: ReadonlySet<string>
): readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined =>
  outcomes?.map((outcome) =>
    outcome.outcome === "unknown" || outcomeHasCurrentEvidenceRef(outcome.evidenceRefs, currentEvidenceRefs)
      ? outcome
      : {
          ...outcome,
          outcome: "unknown",
          reason: downgradeReason(outcome.reason)
        }
  );

const currentEvidenceRefsForUsefulness = (
  evidenceBundleId: string,
  reviewAssessmentId: string,
  changedFiles: readonly ChangedFile[],
  commands: readonly EvidenceCommandReadback[],
  decisionPacketChecksum: string | undefined
): ReadonlySet<string> =>
  new Set([
    evidenceBundleId,
    reviewAssessmentId,
    ...(decisionPacketChecksum === undefined ? [] : [`packet:${decisionPacketChecksum}`]),
    ...changedFiles.map((file) => file.path),
  ...commands.flatMap((command) =>
      [
        command.command,
        ...("outputRef" in command && command.outputRef !== undefined ? [command.outputRef] : [])
      ]
    )
  ]);

const hasReviewableUsefulnessFeedback = (
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined
): boolean =>
  (sourceOutcomes ?? []).some((outcome) => isReviewableFeedbackOutcome(outcome.outcome)) ||
  (knowledgeOutcomes ?? []).some((outcome) => isReviewableFeedbackOutcome(outcome.outcome));

const enqueueFeedbackMaintenance = async (
  databaseRuntime: Awaited<ReturnType<CreateDatabaseRuntime>>,
  projectId: string,
  feedbackDeltaId: string,
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined
): Promise<string | undefined> => {
  if (!hasReviewableUsefulnessFeedback(sourceOutcomes, knowledgeOutcomes)) {
    return undefined;
  }

  if (databaseRuntime.maintenanceQueueRepository === undefined) {
    throw new Error("Maintenance queue repository is required to enqueue reviewable feedback");
  }

  const queueRecord = await databaseRuntime.maintenanceQueueRepository.enqueueMaintenanceQueue({
    jobType: "review_feedback_delta",
    payload: {
      projectId,
      feedbackDeltaId,
      reason: "Review source or knowledge usefulness feedback captured from persisted evidence."
    }
  });

  return queueRecord.id;
};

type UsefulnessAuthorization = ReturnType<typeof authorizePacketUsefulness>;

interface PreparedUsefulnessOutcomes {
  authorization: UsefulnessAuthorization | undefined;
  decisionPacketChecksum: string | undefined;
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
}

const prepareUsefulnessOutcomes = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly callerPacketChecksum: string | undefined;
  readonly knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly runId: string;
  readonly runtimeProjectId: string;
  readonly sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): PreparedUsefulnessOutcomes => {
  const usefulnessSubjects = [
    ...(input.sourceUsefulnessOutcomes ?? []).flatMap((outcome) => {
      const id = outcome.sourceDecisionId ?? outcome.sourceClaimId;

      return id === undefined
        ? []
        : [{
            kind: outcome.sourceDecisionId === undefined ? "source_claim" as const : "source_decision" as const,
            id,
            evidenceRefs: outcome.evidenceRefs
          }];
    }),
    ...(input.knowledgeUsefulnessOutcomes ?? []).map((outcome) => ({
      kind: "knowledge" as const,
      id: outcome.knowledgeId,
      evidenceRefs: outcome.evidenceRefs
    }))
  ];
  const authorization = usefulnessSubjects.length === 0
    ? undefined
    : authorizePacketUsefulness({
        aggregate: input.aggregate,
        runId: input.runId,
        runtimeProjectId: input.runtimeProjectId,
        ...(input.callerPacketChecksum === undefined
          ? {}
          : { callerPacketChecksum: input.callerPacketChecksum }),
        subjects: usefulnessSubjects
      });
  const downgradeUnauthorized = <T extends {
    readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
    readonly reason: string;
  }>(outcomes: readonly T[] | undefined): readonly T[] | undefined =>
    authorization?.authorized === false
      ? outcomes?.map((outcome) => ({
          ...outcome,
          outcome: "unknown" as const,
          reason: `${usefulnessAuthorizationDowngradeReason(authorization)} Original reason: ${outcome.reason}`
        }))
      : outcomes;

  return {
    authorization,
    decisionPacketChecksum: authorization?.authorized === true
      ? authorization.packetChecksum
      : undefined,
    sourceOutcomes: downgradeUnauthorized(input.sourceUsefulnessOutcomes),
    knowledgeOutcomes: downgradeUnauthorized(input.knowledgeUsefulnessOutcomes)
  };
};

interface EvidenceBackedUsefulnessOutcomes {
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
}

const evidenceBackedUsefulnessOutcomesFor = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly changedFiles: readonly ChangedFile[];
  readonly commands: readonly EvidenceCommandReadback[];
  readonly decisionPacketChecksum: string | undefined;
  readonly evidenceBundleId: string;
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly reviewAssessmentId: string;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  readonly targetEvidence: TargetEvidence | undefined;
}): EvidenceBackedUsefulnessOutcomes => {
  const currentEvidenceRefs = currentEvidenceRefsForUsefulness(
    input.evidenceBundleId,
    input.reviewAssessmentId,
    input.changedFiles,
    input.commands,
    input.decisionPacketChecksum
  );
  const existingUsefulnessKeys = new Set(
    input.aggregate.feedbackDeltas.flatMap((feedback) => {
      if (
        input.decisionPacketChecksum === undefined ||
        feedback.metadata["decisionPacketChecksum"] !== input.decisionPacketChecksum
      ) {
        return [];
      }

      return [
        ...sourceUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) =>
          `source:${outcome.sourceDecisionId ?? outcome.sourceClaimId}`
        ),
        ...knowledgeUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) =>
          `knowledge:${outcome.knowledgeId}`
        )
      ];
    })
  );
  const deduplicate = <T extends {
    readonly sourceClaimId?: string;
    readonly sourceDecisionId?: string;
    readonly knowledgeId?: string;
  }>(outcomes: readonly T[] | undefined, prefix: "source" | "knowledge"): readonly T[] | undefined =>
    outcomes?.filter((outcome) => {
      const id = prefix === "source"
        ? outcome.sourceDecisionId ?? outcome.sourceClaimId
        : outcome.knowledgeId;

      return id === undefined || !existingUsefulnessKeys.has(`${prefix}:${id}`);
    });
  const evidenceLinkedSourceOutcomes = downgradeSourceUsefulnessOutcomesWithoutCurrentEvidence(
    deduplicate(input.sourceOutcomes, "source"),
    currentEvidenceRefs
  );
  const evidenceLinkedKnowledgeOutcomes = downgradeKnowledgeUsefulnessOutcomesWithoutCurrentEvidence(
    deduplicate(input.knowledgeOutcomes, "knowledge"),
    currentEvidenceRefs
  );
  const evidenceClass = usefulnessEvidenceClassFor({
    changedFiles: input.changedFiles,
    commands: input.commands,
    targetEvidence: input.targetEvidence
  });

  return {
    sourceOutcomes: downgradeUsefulnessOutcomesWithoutApplicationProof(
      evidenceLinkedSourceOutcomes,
      evidenceClass
    ),
    knowledgeOutcomes: downgradeUsefulnessOutcomesWithoutApplicationProof(
      evidenceLinkedKnowledgeOutcomes,
      evidenceClass
    )
  };
};

const materializeFeedbackDeltaMemoryCandidates = (
  proposals: readonly MemoryCandidateProposal[],
  projectId: string | undefined,
  runId: string
): MemoryCandidate[] => projectId === undefined
  ? []
  : proposals.map((proposal) => materializeFeedbackDeltaMemoryCandidate(proposal, projectId, runId));

const enqueueAuthorizedFeedbackMaintenance = async (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly authorization: UsefulnessAuthorization | undefined;
  readonly databaseRuntime: Awaited<ReturnType<CreateDatabaseRuntime>>;
  readonly feedbackDeltaId: string;
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): Promise<string | undefined> => {
  if (input.authorization?.authorized !== true) {
    return undefined;
  }

  return enqueueFeedbackMaintenance(
    input.databaseRuntime,
    input.authorization.projectId ?? input.aggregate.taskContract.projectId ?? input.databaseRuntime.projectId,
    input.feedbackDeltaId,
    input.sourceOutcomes,
    input.knowledgeOutcomes
  );
};

const buildPersistedEvidenceIdentity = (input: {
  readonly authorization: UsefulnessAuthorization | undefined;
  readonly decisionPacketChecksum: string | undefined;
  readonly evidenceBundleId: string;
  readonly feedbackDeltaId: string;
  readonly feedbackMaintenanceQueueRecordId: string | undefined;
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly reviewAssessmentId: string;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): PersistedEvidenceIdentity => {
  const identity: PersistedEvidenceIdentity = {
    evidenceBundleId: input.evidenceBundleId,
    reviewAssessmentId: input.reviewAssessmentId,
    feedbackDeltaId: input.feedbackDeltaId
  };

  if (input.feedbackMaintenanceQueueRecordId !== undefined) {
    identity.feedbackMaintenanceQueueRecordId = input.feedbackMaintenanceQueueRecordId;
  }

  if (input.decisionPacketChecksum !== undefined) {
    identity.decisionPacketEvidenceRef = `packet:${input.decisionPacketChecksum}`;
  }

  if (input.authorization?.authorized === false && input.authorization.reason !== undefined) {
    identity.usefulnessAuthorizationReason = input.authorization.reason;
  }

  if (input.sourceOutcomes !== undefined) {
    identity.sourceUsefulnessOutcomes = input.sourceOutcomes;
  }

  if (input.knowledgeOutcomes !== undefined) {
    identity.knowledgeUsefulnessOutcomes = input.knowledgeOutcomes;
  }

  return identity;
};

const renderPersistedEvidenceIdentity = (
  identity: PersistedEvidenceIdentity | undefined
): string[] => {
  if (identity === undefined) {
    return [];
  }

  const lines = [
    "Persisted IDs:",
    `evidenceBundle: ${identity.evidenceBundleId}`,
    `reviewAssessment: ${identity.reviewAssessmentId}`,
    `feedbackDelta: ${identity.feedbackDeltaId}`
  ];

  if (identity.usefulnessAuthorizationReason !== undefined) {
    lines.push(`usefulnessAuthorization: ${identity.usefulnessAuthorizationReason}`);
  }

  if (identity.feedbackMaintenanceQueueRecordId !== undefined) {
    lines.push(
      `feedbackMaintenanceQueueRecord: ${identity.feedbackMaintenanceQueueRecordId}`,
      `feedbackMaintenanceRun: krn maintenance run --id ${identity.feedbackMaintenanceQueueRecordId}`
    );
  }

  if (identity.decisionPacketEvidenceRef !== undefined) {
    lines.push(`decisionPacketEvidenceRef: ${identity.decisionPacketEvidenceRef}`);
  }

  return lines;
};

const renderEvidenceCaptureOutput = (input: {
  readonly changedFileClassification: ChangedFileClassification;
  readonly commands: readonly EvidenceCommandReadback[];
  readonly decisionPacketChecksum: string | undefined;
  readonly diffRisk: DiffRisk;
  readonly feedbackCandidate: string;
  readonly memoryCandidateProposals: readonly MemoryCandidateProposal[];
  readonly persistedIdentity: PersistedEvidenceIdentity | undefined;
  readonly runtime: EvidenceCaptureRuntime;
  readonly evalCandidateProposals: readonly EvalCandidateProposal[];
  readonly sourceDecisionCandidates: readonly SourceDecision[];
  readonly sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  readonly targetEvidence: TargetEvidence | undefined;
  readonly knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>;
}): string => [
  "KRN Evidence Capture",
  `Captured at: ${input.runtime.now()}`,
  persistenceLine(persistenceLabel(input.runtime)),
  ...environmentFingerprintLines(input.environmentFingerprint),
  ...(input.runtime.runId === undefined ? [] : [`Run ID: ${input.runtime.runId}`]),
  renderDecisionPacketBinding(input.decisionPacketChecksum),
  commandInputHint,
  commandExecutionNotice,
  "Changed files:",
  ...renderChangedFiles(input.changedFileClassification),
  renderDirtyContext(input.changedFileClassification),
  "Commands:",
  ...input.commands.map(renderCommand),
  ...renderTargetEvidence(input.targetEvidence),
  ...(hasWeakCommandProvenance(input.commands)
    ? ["Command provenance is weak: default_template rows are not proof that commands ran."]
    : []),
  `Diff risk: ${input.diffRisk}`,
  `Review burden: ${reviewBurdenWithTargetEvidence(input.changedFileClassification, input.targetEvidence)}`,
  "Rollback path: revert the focused implementation commit or discard uncommitted changes.",
  "Memory mutation: none",
  "Feedback candidates:",
  `- ${input.feedbackCandidate}`,
  "memoryCandidates:",
  ...renderMemoryCandidateProposals(input.memoryCandidateProposals),
  "sourceDecisionCandidates:",
  ...renderSourceDecisionCandidates(input.sourceDecisionCandidates),
  `evalCandidateProposals: ${input.evalCandidateProposals.length}`,
  "sourceUsefulnessOutcomes:",
  ...renderSourceUsefulnessOutcomes(input.sourceUsefulnessOutcomes),
  "knowledgeUsefulnessOutcomes:",
  ...renderKnowledgeUsefulnessOutcomes(input.knowledgeUsefulnessOutcomes),
  ...renderPersistedEvidenceIdentity(input.persistedIdentity)
].join("\n") + "\n";

const persistEvidenceCapture = async (
  runtime: EvidenceCaptureRuntime,
  changedFiles: readonly ChangedFile[],
  classification: ChangedFileClassification,
  commands: EvidenceCommandReadback[],
  diffRisk: DiffRisk,
  targetEvidence: TargetEvidence | undefined,
  sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined,
  knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined,
  sourceDecisionCandidates: readonly SourceDecision[],
  memoryCandidateProposals: readonly MemoryCandidateProposal[],
  evalCandidateProposals: readonly EvalCandidateProposal[],
  environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): Promise<PersistedEvidenceIdentity> => {
  const { databaseUrl, runId } = resolveEvidencePersistenceConfig(runtime);
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

    const counts = buildEvidencePersistenceCounts(changedFiles, classification, targetEvidence);
    const usefulness = prepareUsefulnessOutcomes({
      aggregate,
      callerPacketChecksum: normalizeDecisionPacketChecksum(runtime.decisionPacketChecksum),
      knowledgeUsefulnessOutcomes,
      runId,
      runtimeProjectId: databaseRuntime.projectId,
      sourceUsefulnessOutcomes
    });
    const decisionPacketChecksum = usefulness.decisionPacketChecksum;
    const evidenceBundle = await databaseRuntime.harnessRunRepository.createEvidenceBundle(
      buildEvidenceBundleInput(
        runId,
        changedFiles,
        classification,
        commands,
        diffRisk,
        targetEvidence,
        counts,
        nextEvidenceEventSequence(aggregate),
        decisionPacketChecksum,
        environmentFingerprint
      )
    );
    const reviewAssessment = await databaseRuntime.harnessRunRepository.createReviewAssessment(
      buildReviewAssessmentInput(evidenceBundle.id, runId, counts)
    );
    const memoryCandidates = materializeFeedbackDeltaMemoryCandidates(
      memoryCandidateProposals,
      aggregate.taskContract.projectId,
      runId
    );
    const evidenceBackedUsefulness = evidenceBackedUsefulnessOutcomesFor({
      aggregate,
      changedFiles,
      commands,
      decisionPacketChecksum,
      evidenceBundleId: evidenceBundle.id,
      knowledgeOutcomes: usefulness.knowledgeOutcomes,
      reviewAssessmentId: reviewAssessment.id,
      sourceOutcomes: usefulness.sourceOutcomes,
      targetEvidence
    });
    const feedbackDelta = await databaseRuntime.harnessRunRepository.createFeedbackDelta(
      buildFeedbackDeltaInput(
        reviewAssessment.id,
        runId,
        counts,
        memoryCandidates,
        sourceDecisionCandidates,
        evidenceBackedUsefulness.sourceOutcomes,
        evidenceBackedUsefulness.knowledgeOutcomes,
        decisionPacketChecksum,
        evalCandidateProposals,
        environmentFingerprint
      )
    );
    const feedbackMaintenanceQueueRecordId = await enqueueAuthorizedFeedbackMaintenance({
      aggregate,
      authorization: usefulness.authorization,
      databaseRuntime,
      feedbackDeltaId: feedbackDelta.id,
      knowledgeOutcomes: evidenceBackedUsefulness.knowledgeOutcomes,
      sourceOutcomes: evidenceBackedUsefulness.sourceOutcomes
    });

    return buildPersistedEvidenceIdentity({
      authorization: usefulness.authorization,
      decisionPacketChecksum,
      evidenceBundleId: evidenceBundle.id,
      feedbackDeltaId: feedbackDelta.id,
      feedbackMaintenanceQueueRecordId,
      knowledgeOutcomes: evidenceBackedUsefulness.knowledgeOutcomes,
      reviewAssessmentId: reviewAssessment.id,
      sourceOutcomes: evidenceBackedUsefulness.sourceOutcomes
    });
  } finally {
    await databaseRuntime.close();
  }
};

export const runEvidenceCaptureCommand = async (
  runtime: EvidenceCaptureRuntime
): Promise<EvidenceCaptureResult> => {
  const repoRoot = await findRepoRoot(runtime.cwd);
  const environmentFingerprint = await collectEnvironmentFingerprint({
    repoRoot,
    databaseUrl: runtime.env.KRN_DATABASE_URL,
    evaluatorVersion: "evidence-capture.v1",
    checkerVersion: "evidence-capture-checker.v1"
  });
  const statusOutput = await readGitStatus(runtime);
  const changedFiles = parseChangedFiles(statusOutput, {
    repoRoot,
    statusCwd: runtime.cwd
  });
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
      runtime.knowledgeUsefulnessOutcomes,
      sourceDecisionCandidates,
      memoryCandidateProposals,
      runtime.evalCandidateProposals ?? [],
      environmentFingerprint
    )
    : undefined;
  const feedbackCandidate =
    changedFiles.length === 0
      ? "No changed files; no feedback candidate proposed."
      : "Review changed files and command evidence before promoting memory/source/eval candidates.";
  const renderedSourceUsefulnessOutcomes =
    persistedIdentity?.sourceUsefulnessOutcomes ?? runtime.sourceUsefulnessOutcomes;
  const renderedKnowledgeUsefulnessOutcomes =
    persistedIdentity?.knowledgeUsefulnessOutcomes ?? runtime.knowledgeUsefulnessOutcomes;

  return {
    stdout: renderEvidenceCaptureOutput({
      changedFileClassification,
      commands,
      decisionPacketChecksum: runtime.decisionPacketChecksum,
      diffRisk,
      feedbackCandidate,
      knowledgeUsefulnessOutcomes: renderedKnowledgeUsefulnessOutcomes,
      memoryCandidateProposals,
      persistedIdentity,
      runtime,
      sourceDecisionCandidates,
      sourceUsefulnessOutcomes: renderedSourceUsefulnessOutcomes,
      targetEvidence,
      evalCandidateProposals: runtime.evalCandidateProposals ?? [],
      environmentFingerprint
    })
  };
};
