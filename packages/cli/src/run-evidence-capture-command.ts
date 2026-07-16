import {
  createHash
} from "node:crypto";
import {
  execFile
} from "node:child_process";
import path from "node:path";
import {
  promisify
} from "node:util";
import type {
  DecisionPacketAuthorization,
  DecisionPacketBinding,
  CommandOutputArtifact,
  DiffRisk,
  EvalCandidateProposal,
  EvidenceCommand,
  EvidenceBundleHelpedProofAssessment,
  EvidenceCommandReadback,
  MemoryCandidate,
  KnowledgeUsefulnessOutcomeFeedback,
  SourceDecision,
  SourceUsefulnessOutcomeFeedback,
  TargetEvidence,
  TargetEvidenceInput,
  TargetStateSnapshot,
  UsefulnessApplicationEvidence,
  UsefulnessApplicationEvidenceIdentity
} from "@krn/core";
import {
  authorizeDecisionPacketBinding,
  authorizeDecisionPacketUsefulness,
  assessCurrentDecisionPacketHelpedProof,
  assessCandidateReviewability,
  canonicalTargetRepoPath,
  collectTargetStateSnapshot,
  decideEvidenceContractActivation,
  decisionPacketBindingReadbackFromMetadata,
  decisionPacketUsefulnessAuthorizationDowngradeReason,
  isReviewableFeedbackOutcome,
  knowledgeUsefulnessOutcomesFromMetadata,
  projectDecisionPacketUsefulnessSubjects,
  sourceUsefulnessOutcomesFromMetadata,
  targetEvidenceClaimsFreshOwnedPatch,
  toEvidenceCommandReadback,
  normalizeTargetEvidence
} from "@krn/core";
import type {
  CreateEvidenceBundleInput,
  CreateEvidenceFeedbackOnceInput,
  CreateEvidenceFeedbackOnceResult,
  CreateFeedbackDeltaInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate
} from "@krn/core/repositories";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  postgresPersistedLabel,
  persistenceLine
} from "./command-runtime-support.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  EvidenceCommandCaptureInput
} from "./evidence-command-artifacts.js";
import {
  prepareEvidenceCommandArtifacts
} from "./evidence-command-artifacts.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  collectEnvironmentFingerprint,
  environmentFingerprintLines
} from "./environment-fingerprint.js";
import type {
  CreateDatabaseRuntime
} from "./run-plan-command.js";

const execFileAsync = promisify(execFile);

const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

export interface EvidenceCaptureRuntime extends BaseCommandRuntime {
  cwd: string;
  persist: boolean;
  runId?: string;
  decisionPacketChecksum?: string;
  decisionPacketGeneratedAt?: string;
  intendedFiles?: readonly string[];
  commandOutcomes?: readonly EvidenceCommandCaptureInput[];
  commandOutputArtifacts?: readonly CommandOutputArtifact[];
  targetEvidence?: TargetEvidenceInput;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
  evalCandidateProposals?: readonly EvalCandidateProposal[];
  readGitStatus?(): Promise<string>;
  readTargetStateSnapshot?(targetRepo: string): Promise<TargetStateSnapshot>;
  createDatabaseRuntime?: CreateDatabaseRuntime;
}

export interface EvidenceCaptureResult {
  stdout: string;
  persistence?: {
    feedbackDeltaId: string;
    sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
    usefulnessApplications?: readonly Pick<
      UsefulnessApplicationEvidence,
      "applicationId" | "appliedAt"
    >[];
  };
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
  captureIdentity: string;
  evidenceBundleId: string;
  reviewAssessmentId: string;
  feedbackDeltaId: string;
  feedbackMaintenanceQueueRecordId?: string;
  sourceUsefulnessOutcomes?: readonly SourceUsefulnessOutcomeFeedback[];
  knowledgeUsefulnessOutcomes?: readonly KnowledgeUsefulnessOutcomeFeedback[];
  decisionPacketChecksum?: string;
  decisionPacketEvidenceRef?: string;
  decisionPacketGeneratedAt?: string;
  packetBindingRejectionReason?: string;
  usefulnessAuthorizationReason?: string;
  usefulnessApplications?: readonly Pick<
    UsefulnessApplicationEvidence,
    "applicationId" | "appliedAt"
  >[];
  memoryCandidates?: readonly MemoryCandidate[];
  sourceDecisionCandidates?: readonly SourceDecision[];
  evalCandidateProposals?: readonly EvalCandidateProposal[];
}

interface EvidencePersistenceConfig {
  databaseUrl: string;
  runId: string;
}

const canonicalCaptureIdentityJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalCaptureIdentityJson).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalCaptureIdentityJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const sourceDecisionCandidateSemanticInput = (
  candidate: SourceDecision
): Omit<SourceDecision, "id" | "createdAt" | "updatedAt"> => {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...semanticInput } = candidate;

  return semanticInput;
};

const memoryCandidateProposalSemanticInput = (
  proposal: MemoryCandidateProposal
): Omit<MemoryCandidateProposal, "id" | "createdAt" | "updatedAt"> => {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...semanticInput } = proposal;

  return semanticInput;
};

const evidenceCaptureIdentityFor = (input: {
  readonly runId: string;
  readonly projectId: string;
  readonly decisionPacketChecksum: string | undefined;
  readonly environmentFingerprintId: string;
  readonly changedFiles: readonly ChangedFile[];
  readonly commands: readonly EvidenceCommandReadback[];
  readonly targetEvidence: TargetEvidence | undefined;
  readonly sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  readonly knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly sourceDecisionCandidates: readonly SourceDecision[];
  readonly memoryCandidateProposals: readonly MemoryCandidateProposal[];
  readonly evalCandidateProposals: readonly EvalCandidateProposal[];
}): string => createHash("sha256").update(canonicalCaptureIdentityJson({
  version: 1,
  ...input,
  sourceDecisionCandidates: input.sourceDecisionCandidates.map(sourceDecisionCandidateSemanticInput),
  memoryCandidateProposals: input.memoryCandidateProposals.map(memoryCandidateProposalSemanticInput)
})).digest("hex");

const sourceDecisionCandidatesForCapture = (
  candidates: readonly SourceDecision[],
  captureIdentity: string,
  stableTimestamp: string
): SourceDecision[] => candidates.map((candidate, index) => ({
  ...candidate,
  id: `source-decision-candidate-${captureIdentity}-${index + 1}`,
  createdAt: stableTimestamp,
  updatedAt: stableTimestamp
}));

const memoryCandidateProposalsForCapture = (
  proposals: readonly MemoryCandidateProposal[],
  captureIdentity: string,
  stableTimestamp: string
): MemoryCandidateProposal[] => proposals.map((proposal, index) => ({
  ...proposal,
  id: `memory-candidate-proposal-${captureIdentity}-${index + 1}`,
  createdAt: stableTimestamp,
  updatedAt: stableTimestamp
}));

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

const normalizeDecisionPacketGeneratedAt = (
  decisionPacketGeneratedAt: string | undefined
): string | undefined => {
  const generatedAt = decisionPacketGeneratedAt?.trim();

  return generatedAt === undefined || generatedAt.length === 0 || !Number.isFinite(Date.parse(generatedAt))
    ? undefined
    : generatedAt;
};

const renderDecisionPacketBinding = (input: {
  readonly decisionPacketChecksum: string | undefined;
  readonly rejectionReason?: string;
}): string => {
  const checksum = normalizeDecisionPacketChecksum(input.decisionPacketChecksum);
  const evidenceRef = decisionPacketEvidenceRef(checksum);

  if (evidenceRef !== undefined) {
    return `DecisionPacket: checksum=${checksum} | evidenceRef=${evidenceRef}`;
  }

  return input.rejectionReason === undefined
    ? "DecisionPacket: unbound (no --decision-packet-checksum supplied)."
    : `DecisionPacket: unbound (${input.rejectionReason}).`;
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
    `- treeIdentity: ${targetEvidence.treeIdentity ?? "none"}`,
    `- patchIdentity: ${targetEvidence.patchIdentity ?? "none"}`,
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
  proposals: readonly (MemoryCandidateProposal | MemoryCandidate)[]
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
    const missingFields = "missingFields" in proposal
      ? proposal.missingFields
      : Array.isArray(proposal.metadata.missingFields)
        ? proposal.metadata.missingFields.filter(
            (value): value is string => typeof value === "string"
          )
        : [];
    const reviewability = assessCandidateReviewability({
      summary: proposal.summary,
      body: proposal.body,
      evidenceRefs: metadataEvidenceRefs,
      sourceLineage: proposal.sourceLineage,
      ...(applicationGuidance === undefined ? {} : { applicationGuidance }),
      doesNotProve: candidateReviewabilityDoesNotProve,
      missingFields
    });

    return [
      `- ${proposal.id}: ${proposal.summary}`,
      `  status: ${proposal.status}`,
      `  kind: ${proposal.kind}`,
      `  reviewability: ${reviewability.reviewability}`,
      "  reviewability reasons:",
      ...reviewability.reasons.map((reason) => `  - ${reason}`),
      "  completeness: incomplete",
      `  missing: ${missingFields.join(", ")}`,
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
  commandOutputArtifacts: CommandOutputArtifact[],
  diffRisk: DiffRisk,
  targetEvidence: TargetEvidence | undefined,
  counts: EvidencePersistenceCounts,
  environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): CreateEvidenceBundleInput => ({
  executionRunId: runId,
  status: "captured",
  changedFiles: changedFiles.map((file) => file.path),
  commands,
  ...(commandOutputArtifacts.length === 0 ? {} : { commandOutputArtifacts }),
  diffRisk,
  reviewBurden: reviewBurdenWithTargetEvidence(classification, targetEvidence),
  rollbackPath: "Revert the focused implementation commit or discard uncommitted changes.",
  event: {
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
    ...(targetEvidence === undefined ? {} : { targetEvidence }),
    environmentFingerprint
  }
});

const buildReviewAssessmentInput = (
  runId: string,
  counts: EvidencePersistenceCounts
): Omit<CreateReviewAssessmentInput, "evidenceBundleId"> => ({
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
  captureIdentity: string,
  runId: string,
  counts: EvidencePersistenceCounts,
  memoryCandidates: readonly MemoryCandidate[],
  sourceDecisionCandidates: readonly SourceDecision[],
  evalCandidateProposals: readonly EvalCandidateProposal[],
  environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>
): Omit<CreateFeedbackDeltaInput, "reviewAssessmentId"> => ({
  status: "candidate",
  memoryCandidates: [...memoryCandidates],
  sourceDecisions: [...sourceDecisionCandidates],
  evalCandidates: [...evalCandidateProposals],
  metadata: {
    runId,
    captureIdentity,
    ...counts,
    memoryCandidateProposalCount: memoryCandidates.length,
    memoryCandidateRowCount: 0,
    sourceDecisionCandidateCount: sourceDecisionCandidates.length,
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
  verificationCommands: readonly EvidenceCommandReadback[];
  verificationArtifactsByRef: ReadonlyMap<string, CommandOutputArtifact>;
}

type UsefulnessOutcomeProofFailureReason =
  | "missing_current_application_reference"
  | "missing_strict_verification_reference";

const evidenceCommandOutputRefs = (
  command: EvidenceCommandReadback
): string[] => "outputRef" in command && command.outputRef !== undefined
  ? [command.outputRef]
  : [];

const usefulnessEvidenceClassFor = (input: {
  readonly commands: readonly EvidenceCommandReadback[];
  readonly commandOutputArtifacts: readonly CommandOutputArtifact[];
  readonly strictVerificationRefs: readonly string[];
  readonly targetEvidence: TargetEvidence | undefined;
}): UsefulnessEvidenceClass => {
  const target = input.targetEvidence;
  const ownsExactCurrentPatch = targetEvidenceClaimsFreshOwnedPatch(target);

  return {
    applicationRefs: new Set(ownsExactCurrentPatch
      ? target.changedFiles.map((file) => file.path)
      : []),
    verificationRefs: new Set(input.strictVerificationRefs),
    verificationArtifactsByRef: new Map(
      input.commandOutputArtifacts.map((artifact) => [artifact.outputRef, artifact])
    ),
    verificationCommands: input.commands.filter((command) =>
      command.kind === "command_runner" && target?.commands.includes(command.command) === true
    )
  };
};

const verificationFollowsApplication = (input: {
  readonly appliedAt: string | undefined;
  readonly evidenceRefs: ReadonlySet<string>;
  readonly evidenceClass: UsefulnessEvidenceClass;
}): boolean => {
  const appliedAt = input.appliedAt;

  return appliedAt !== undefined && input.evidenceClass.verificationCommands.some((command) =>
    command.kind === "command_runner" &&
    command.outputRef !== undefined &&
    Date.parse(
      input.evidenceClass.verificationArtifactsByRef.get(command.outputRef)?.startedAt ?? ""
    ) > Date.parse(appliedAt) &&
    Date.parse(command.capturedAt) > Date.parse(appliedAt) &&
    [command.command, ...evidenceCommandOutputRefs(command)].some((ref) =>
      input.evidenceRefs.has(ref) && input.evidenceClass.verificationRefs.has(ref)
    )
  );
};

const evidenceClassDowngradeReason = (
  requestedOutcome: "used" | "helped",
  provenOutcome: "selected" | "used" | "helped",
  reason: string,
  helpedProofAssessment: EvidenceBundleHelpedProofAssessment,
  outcomeProofFailureReason: UsefulnessOutcomeProofFailureReason | undefined
): string => {
  const requiredEvidence = requestedOutcome === "helped"
    ? "current application evidence and successful current verification/output proof"
    : "current application evidence";

  const helpedProofReason = requestedOutcome === "helped" && helpedProofAssessment.status === "ineligible"
    ? ` Helped proof reason: ${helpedProofAssessment.reason}.`
    : "";
  const outcomeProofReason = outcomeProofFailureReason === undefined
    ? ""
    : ` Outcome proof reason: ${outcomeProofFailureReason}.`;

  return `Downgraded: ${requestedOutcome} requires ${requiredEvidence}; current evidence supports ${provenOutcome} only.${helpedProofReason}${outcomeProofReason} Original reason: ${reason}`;
};

const usefulnessOutcomeProofFailureReason = (input: {
  readonly hasApplicationEvidence: boolean;
  readonly hasVerificationEvidence: boolean;
  readonly requestedOutcome: "used" | "helped";
}): UsefulnessOutcomeProofFailureReason | undefined => {
  if (!input.hasApplicationEvidence) {
    return "missing_current_application_reference";
  }

  return input.requestedOutcome === "helped" && !input.hasVerificationEvidence
    ? "missing_strict_verification_reference"
    : undefined;
};

const provenUsefulnessOutcome = (input: {
  readonly hasApplicationEvidence: boolean;
  readonly hasVerificationEvidence: boolean;
  readonly helpedProofAssessment: EvidenceBundleHelpedProofAssessment;
  readonly requestedOutcome: "used" | "helped";
}): "selected" | "used" | "helped" => {
  if (!input.hasApplicationEvidence) {
    return "selected";
  }
  if (input.requestedOutcome === "used") {
    return "used";
  }

  return input.hasVerificationEvidence && input.helpedProofAssessment.status === "eligible"
    ? "helped"
    : "used";
};

const downgradeUsefulnessOutcomesWithoutApplicationProof = <T extends {
  readonly applicationId?: string;
  readonly appliedAt?: string;
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
}>(
  outcomes: readonly T[] | undefined,
  evidenceClass: UsefulnessEvidenceClass,
  helpedProofAssessment: EvidenceBundleHelpedProofAssessment
): readonly T[] | undefined => outcomes?.map((outcome) => {
  if (outcome.outcome !== "used" && outcome.outcome !== "helped") {
    return outcome;
  }

  const refs = new Set(outcome.evidenceRefs);
  const hasApplicationEvidence = outcome.applicationId !== undefined &&
    outcome.appliedAt !== undefined &&
    [...refs].some((ref) => evidenceClass.applicationRefs.has(ref));
  const hasVerificationEvidence = verificationFollowsApplication({
    appliedAt: outcome.appliedAt,
    evidenceRefs: refs,
    evidenceClass
  });
  const provenOutcome = provenUsefulnessOutcome({
    requestedOutcome: outcome.outcome,
    hasApplicationEvidence,
    hasVerificationEvidence,
    helpedProofAssessment
  });
  const outcomeProofFailureReason = usefulnessOutcomeProofFailureReason({
    requestedOutcome: outcome.outcome,
    hasApplicationEvidence,
    hasVerificationEvidence
  });

  return provenOutcome === outcome.outcome
    ? outcome
    : {
        ...outcome,
        outcome: provenOutcome,
        reason: evidenceClassDowngradeReason(
          outcome.outcome,
          provenOutcome,
          outcome.reason,
          helpedProofAssessment,
          outcomeProofFailureReason
        )
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
  captureIdentity: string,
  changedFiles: readonly ChangedFile[],
  commands: readonly EvidenceCommandReadback[],
  decisionPacketChecksum: string | undefined
): ReadonlySet<string> =>
  new Set([
    `capture:${captureIdentity}`,
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

type UsefulnessAuthorization = ReturnType<typeof authorizeDecisionPacketUsefulness>;

interface PreparedUsefulnessOutcomes {
  authorization: UsefulnessAuthorization | undefined;
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
}

const callerPacketBinding = (input: {
  readonly callerPacketChecksum: string | undefined;
  readonly callerPacketGeneratedAt: string | undefined;
}) => ({
  ...(input.callerPacketChecksum === undefined
    ? {}
    : { callerPacketChecksum: input.callerPacketChecksum }),
  ...(input.callerPacketGeneratedAt === undefined
    ? {}
    : { callerPacketGeneratedAt: input.callerPacketGeneratedAt })
});

const packetAuthorizationForEvidenceCapture = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly callerPacketChecksum: string | undefined;
  readonly callerPacketGeneratedAt: string | undefined;
  readonly runId: string;
  readonly runtimeProjectId: string;
}): DecisionPacketAuthorization | undefined => {
  if (input.callerPacketChecksum === undefined && input.callerPacketGeneratedAt === undefined) {
    return undefined;
  }

  return authorizeDecisionPacketBinding({
    aggregate: input.aggregate,
    runId: input.runId,
    runtimeProjectId: input.runtimeProjectId,
    sha256Hex,
    ...callerPacketBinding(input)
  });
};

interface EvidenceCapturePacketBinding {
  readonly authorization: DecisionPacketAuthorization | undefined;
  readonly binding: DecisionPacketBinding | undefined;
  readonly callerPacketChecksum: string | undefined;
  readonly callerPacketGeneratedAt: string | undefined;
}

const packetBindingForEvidenceCapture = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly decisionPacketChecksum: string | undefined;
  readonly decisionPacketGeneratedAt: string | undefined;
  readonly runId: string;
  readonly runtimeProjectId: string;
}): EvidenceCapturePacketBinding => {
  const callerPacketChecksum = normalizeDecisionPacketChecksum(input.decisionPacketChecksum);
  const callerPacketGeneratedAt = normalizeDecisionPacketGeneratedAt(
    input.decisionPacketGeneratedAt
  );
  const authorization = packetAuthorizationForEvidenceCapture({
    aggregate: input.aggregate,
    callerPacketChecksum,
    callerPacketGeneratedAt,
    runId: input.runId,
    runtimeProjectId: input.runtimeProjectId
  });

  return {
    authorization,
    binding: authorization?.authorized === true ? authorization : undefined,
    callerPacketChecksum,
    callerPacketGeneratedAt
  };
};

const evidenceCaptureProjectIdFor = (
  aggregate: HarnessRunAggregate,
  runtimeProjectId: string | undefined
): string => {
  const projectId = aggregate.taskContract.projectId ?? runtimeProjectId;

  if (projectId === undefined) {
    throw new Error(`No project identity found for --run-id ${aggregate.executionRun.id}`);
  }

  return projectId;
};

const requireEvidenceFeedbackPersistence = (
  createEvidenceFeedbackOnce:
    | ((input: CreateEvidenceFeedbackOnceInput) => Promise<CreateEvidenceFeedbackOnceResult>)
    | undefined
): (input: CreateEvidenceFeedbackOnceInput) => Promise<CreateEvidenceFeedbackOnceResult> => {
  if (createEvidenceFeedbackOnce === undefined) {
    throw new Error("Evidence feedback atomic persistence is unavailable");
  }

  return createEvidenceFeedbackOnce;
};

const requireEvidenceCaptureAggregate = async (
  harnessRunRepository: {
    getHarnessRunByExecutionRunId(runId: string): Promise<HarnessRunAggregate | undefined>;
  },
  runId: string
): Promise<HarnessRunAggregate> => {
  const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(runId);

  if (aggregate === undefined) {
    throw new Error(`No persisted harness run found for --run-id ${runId}`);
  }

  return aggregate;
};

const evidenceFeedbackMaintenanceFor = (input: {
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): Pick<CreateEvidenceFeedbackOnceInput, "maintenance"> =>
  hasReviewableUsefulnessFeedback(input.sourceOutcomes, input.knowledgeOutcomes)
    ? {
        maintenance: {
          reason: "Review source or knowledge usefulness feedback captured from persisted evidence."
        }
      }
    : {};

const prepareUsefulnessOutcomes = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly callerPacketChecksum: string | undefined;
  readonly callerPacketGeneratedAt: string | undefined;
  readonly knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly packetAuthorization: DecisionPacketAuthorization | undefined;
  readonly runId: string;
  readonly runtimeProjectId: string;
  readonly sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): PreparedUsefulnessOutcomes => {
  const usefulnessSubjects = projectDecisionPacketUsefulnessSubjects({
    sourceUsefulnessOutcomes: input.sourceUsefulnessOutcomes,
    knowledgeUsefulnessOutcomes: input.knowledgeUsefulnessOutcomes
  });
  const authorization = input.packetAuthorization?.authorized === false || usefulnessSubjects.length === 0
    ? input.packetAuthorization
    : authorizeDecisionPacketUsefulness({
        aggregate: input.aggregate,
        runId: input.runId,
        runtimeProjectId: input.runtimeProjectId,
        sha256Hex,
        ...callerPacketBinding(input),
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
          reason: `${decisionPacketUsefulnessAuthorizationDowngradeReason(authorization)} Original reason: ${outcome.reason}`
        }))
      : outcomes;

  return {
    authorization,
    sourceOutcomes: downgradeUnauthorized(input.sourceUsefulnessOutcomes),
    knowledgeOutcomes: downgradeUnauthorized(input.knowledgeUsefulnessOutcomes)
  };
};

interface EvidenceBackedUsefulnessOutcomes {
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
}

const applicationTargetState = (
  target: TargetEvidence | undefined
): UsefulnessApplicationEvidenceIdentity["targetState"] =>
  !targetEvidenceClaimsFreshOwnedPatch(target)
    ? undefined
    : {
        targetRepo: target.targetRepo,
        treeIdentity: target.treeIdentity,
        patchIdentity: target.patchIdentity,
        changedFiles: target.changedFiles.map((file) => file.path).sort()
      };

const explicitUsefulnessApplications = (input: {
  aggregate: HarnessRunAggregate;
  binding: DecisionPacketBinding;
  projectId: string;
  runId: string;
  targetEvidence: TargetEvidence | undefined;
  sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
}): UsefulnessApplicationEvidenceIdentity[] => {
  const targetState = applicationTargetState(input.targetEvidence);

  return [
    ...(input.sourceOutcomes ?? []).flatMap((outcome) => {
      if (
        (outcome.sourceClaimId === undefined && outcome.sourceDecisionId === undefined) ||
        outcome.applicationId === undefined ||
        outcome.appliedAt !== undefined
      ) {
        return [];
      }
      return [{
        applicationId: outcome.applicationId,
        subjectKind: outcome.sourceDecisionId === undefined
          ? "source_claim" as const
          : "source_decision" as const,
        subjectId: outcome.sourceDecisionId ?? outcome.sourceClaimId,
        projectId: input.projectId,
        executionRunId: input.runId,
        taskContractId: input.aggregate.taskContract.id,
        packetChecksum: input.binding.packetChecksum,
        packetGeneratedAt: input.binding.packetGeneratedAt,
        sourceRunLifecycleRevision: input.binding.sourceRunLifecycleRevision,
        ...(targetState === undefined ? {} : { targetState })
      }];
    }),
    ...(input.knowledgeOutcomes ?? []).flatMap((outcome) =>
    outcome.applicationId === undefined || outcome.appliedAt !== undefined
      ? []
      : [{
          applicationId: outcome.applicationId,
          subjectKind: "knowledge" as const,
          subjectId: outcome.knowledgeId,
          projectId: input.projectId,
          executionRunId: input.runId,
          taskContractId: input.aggregate.taskContract.id,
          packetChecksum: input.binding.packetChecksum,
          packetGeneratedAt: input.binding.packetGeneratedAt,
          sourceRunLifecycleRevision: input.binding.sourceRunLifecycleRevision,
          ...(targetState === undefined ? {} : { targetState })
        }]
    )
  ];
};

const persistExplicitUsefulnessApplications = async (
  repository: DatabaseRuntime["harnessRunRepository"],
  applications: readonly UsefulnessApplicationEvidenceIdentity[]
): Promise<UsefulnessApplicationEvidence[]> => {
  if (applications.length === 0) {
    return [];
  }
  const recordOnce = repository.recordUsefulnessApplicationOnce;
  if (recordOnce === undefined) {
    throw new Error("Packet-bound usefulness application persistence is required");
  }
  return Promise.all(applications.map(async (application) =>
    (await recordOnce.call(repository, application)).application
  ));
};

const admitEvidenceBackedUsefulness = (
  authorization: UsefulnessAuthorization | undefined,
  usefulness: EvidenceBackedUsefulnessOutcomes
): EvidenceBackedUsefulnessOutcomes => authorization?.authorized === true
  ? usefulness
  : {
      sourceOutcomes: undefined,
      knowledgeOutcomes: undefined
    };

const usefulnessApplicationsForPersistence = (input: {
  aggregate: HarnessRunAggregate;
  binding: DecisionPacketBinding | undefined;
  projectId: string;
  runId: string;
  usefulness: EvidenceBackedUsefulnessOutcomes;
  targetEvidence: TargetEvidence | undefined;
}): UsefulnessApplicationEvidenceIdentity[] => {
  if (input.binding === undefined) {
    return [];
  }

  return explicitUsefulnessApplications({
    aggregate: input.aggregate,
    binding: input.binding,
    projectId: input.projectId,
    runId: input.runId,
    targetEvidence: input.targetEvidence,
    sourceOutcomes: input.usefulness.sourceOutcomes,
    knowledgeOutcomes: input.usefulness.knowledgeOutcomes
  });
};

const evidenceBackedUsefulnessOutcomesFor = (input: {
  readonly captureIdentity: string;
  readonly changedFiles: readonly ChangedFile[];
  readonly commands: readonly EvidenceCommandReadback[];
  readonly commandOutputArtifacts: readonly CommandOutputArtifact[];
  readonly decisionPacketChecksum: string | undefined;
  readonly helpedProof: CaptureHelpedProof;
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  readonly targetEvidence: TargetEvidence | undefined;
}): EvidenceBackedUsefulnessOutcomes => {
  const currentEvidenceRefs = currentEvidenceRefsForUsefulness(
    input.captureIdentity,
    input.changedFiles,
    input.commands,
    input.decisionPacketChecksum
  );
  const evidenceLinkedSourceOutcomes = downgradeSourceUsefulnessOutcomesWithoutCurrentEvidence(
    input.sourceOutcomes,
    currentEvidenceRefs
  );
  const evidenceLinkedKnowledgeOutcomes = downgradeKnowledgeUsefulnessOutcomesWithoutCurrentEvidence(
    input.knowledgeOutcomes,
    currentEvidenceRefs
  );
  const evidenceClass = usefulnessEvidenceClassFor({
    commands: input.commands,
    commandOutputArtifacts: input.commandOutputArtifacts,
    strictVerificationRefs: input.helpedProof.verificationRefs,
    targetEvidence: input.targetEvidence
  });

  return {
    sourceOutcomes: downgradeUsefulnessOutcomesWithoutApplicationProof(
      evidenceLinkedSourceOutcomes,
      evidenceClass,
      input.helpedProof.assessment
    ),
    knowledgeOutcomes: downgradeUsefulnessOutcomesWithoutApplicationProof(
      evidenceLinkedKnowledgeOutcomes,
      evidenceClass,
      input.helpedProof.assessment
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

const feedbackMaintenanceQueueIdentityFor = (
  feedbackMaintenanceQueueRecordId: string | undefined
): Pick<PersistedEvidenceIdentity, "feedbackMaintenanceQueueRecordId"> =>
  feedbackMaintenanceQueueRecordId === undefined
    ? {}
    : { feedbackMaintenanceQueueRecordId };

const packetBindingIdentityFor = (
  evidenceMetadata: Record<string, unknown>,
  authorization: DecisionPacketAuthorization | undefined
): Pick<
  PersistedEvidenceIdentity,
  | "decisionPacketChecksum"
  | "decisionPacketEvidenceRef"
  | "decisionPacketGeneratedAt"
  | "packetBindingRejectionReason"
> => {
  const binding = decisionPacketBindingReadbackFromMetadata(evidenceMetadata);

  if (
    binding.status === "bound_current" &&
    binding.checksum !== undefined &&
    binding.evidenceRef !== undefined &&
    binding.generatedAt !== undefined
  ) {
    return {
      decisionPacketChecksum: binding.checksum,
      decisionPacketEvidenceRef: binding.evidenceRef,
      decisionPacketGeneratedAt: binding.generatedAt
    };
  }

  return {
    packetBindingRejectionReason: authorization?.authorized === false
      ? authorization.reason
      : binding.reason ?? "Persisted evidence has no admitted DecisionPacket binding."
  };
};

const usefulnessAuthorizationIdentityFor = (
  authorization: UsefulnessAuthorization | undefined,
  packetBindingRejectionReason: string | undefined
): Pick<PersistedEvidenceIdentity, "usefulnessAuthorizationReason"> => {
  if (
    authorization === undefined ||
    authorization.authorized ||
    authorization.reason === packetBindingRejectionReason
  ) {
    return {};
  }

  return { usefulnessAuthorizationReason: authorization.reason };
};

const usefulnessOutcomesIdentityFor = (input: {
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
}): Pick<
  PersistedEvidenceIdentity,
  "knowledgeUsefulnessOutcomes" | "sourceUsefulnessOutcomes"
> => {
  const identity: Pick<
    PersistedEvidenceIdentity,
    "knowledgeUsefulnessOutcomes" | "sourceUsefulnessOutcomes"
  > = {};

  if (input.sourceOutcomes !== undefined) {
    identity.sourceUsefulnessOutcomes = input.sourceOutcomes;
  }

  if (input.knowledgeOutcomes !== undefined) {
    identity.knowledgeUsefulnessOutcomes = input.knowledgeOutcomes;
  }

  return identity;
};

const usefulnessApplicationsFromPersistedOutcomes = (input: {
  readonly knowledgeOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[];
  readonly sourceOutcomes: readonly SourceUsefulnessOutcomeFeedback[];
}): Pick<UsefulnessApplicationEvidence, "applicationId" | "appliedAt">[] => [
  ...input.sourceOutcomes,
  ...input.knowledgeOutcomes
].flatMap((outcome) =>
  outcome.applicationId === undefined || outcome.appliedAt === undefined
    ? []
    : [{
        applicationId: outcome.applicationId,
        appliedAt: outcome.appliedAt
      }]
);

const buildPersistedEvidenceIdentity = (input: {
  readonly atomicResult: CreateEvidenceFeedbackOnceResult;
  readonly applications: readonly UsefulnessApplicationEvidence[];
  readonly authorization: UsefulnessAuthorization | undefined;
  readonly packetAuthorization: DecisionPacketAuthorization | undefined;
  readonly captureIdentity: string;
}): PersistedEvidenceIdentity => {
  const packetBindingIdentity = packetBindingIdentityFor(
    input.atomicResult.evidenceBundle.metadata,
    input.atomicResult.created ? input.packetAuthorization : undefined
  );
  const sourceOutcomes = sourceUsefulnessOutcomesFromMetadata(
    input.atomicResult.feedbackDelta.metadata
  );
  const knowledgeOutcomes = knowledgeUsefulnessOutcomesFromMetadata(
    input.atomicResult.feedbackDelta.metadata
  );
  const persistedOutcomeApplications = usefulnessApplicationsFromPersistedOutcomes({
    sourceOutcomes,
    knowledgeOutcomes
  });
  const applications = input.atomicResult.created
    ? [
        ...input.applications,
        ...persistedOutcomeApplications.filter((outcomeApplication) =>
          !input.applications.some((application) =>
            application.applicationId === outcomeApplication.applicationId &&
            application.appliedAt === outcomeApplication.appliedAt
          )
        )
      ]
    : persistedOutcomeApplications;

  return {
    captureIdentity: input.captureIdentity,
    evidenceBundleId: input.atomicResult.evidenceBundle.id,
    reviewAssessmentId: input.atomicResult.reviewAssessment.id,
    feedbackDeltaId: input.atomicResult.feedbackDelta.id,
    memoryCandidates: input.atomicResult.feedbackDelta.memoryCandidates,
    sourceDecisionCandidates: input.atomicResult.feedbackDelta.sourceDecisions,
    evalCandidateProposals: input.atomicResult.feedbackDelta.evalCandidates,
    ...(applications.length === 0
      ? {}
      : { usefulnessApplications: applications }),
    ...feedbackMaintenanceQueueIdentityFor(
      input.atomicResult.feedbackMaintenanceQueueRecordId
    ),
    ...packetBindingIdentity,
    ...usefulnessAuthorizationIdentityFor(
      input.atomicResult.created ? input.authorization : undefined,
      packetBindingIdentity.packetBindingRejectionReason
    ),
    ...usefulnessOutcomesIdentityFor({
      sourceOutcomes: sourceOutcomes.length === 0 ? undefined : sourceOutcomes,
      knowledgeOutcomes: knowledgeOutcomes.length === 0 ? undefined : knowledgeOutcomes
    })
  };
};

const renderPersistedEvidenceIdentity = (
  identity: PersistedEvidenceIdentity | undefined
): string[] => {
  if (identity === undefined) {
    return [];
  }

  const lines = [
    "Persisted IDs:",
    `captureIdentity: ${identity.captureIdentity}`,
    `evidenceBundle: ${identity.evidenceBundleId}`,
    `reviewAssessment: ${identity.reviewAssessmentId}`,
    `feedbackDelta: ${identity.feedbackDeltaId}`
  ];

  if (identity.usefulnessAuthorizationReason !== undefined) {
    lines.push(`usefulnessAuthorization: ${identity.usefulnessAuthorizationReason}`);
  }

  if (identity.packetBindingRejectionReason !== undefined) {
    lines.push(`packetBinding: unbound (${identity.packetBindingRejectionReason})`);
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

  if (identity.decisionPacketGeneratedAt !== undefined) {
    lines.push(`decisionPacketGeneratedAt: ${identity.decisionPacketGeneratedAt}`);
  }

  for (const application of identity.usefulnessApplications ?? []) {
    lines.push(
      `usefulnessApplication: ${application.applicationId}|${application.appliedAt}`
    );
  }

  return lines;
};

const renderEvidenceCaptureOutput = (input: {
  readonly changedFileClassification: ChangedFileClassification;
  readonly commands: readonly EvidenceCommandReadback[];
  readonly decisionPacketChecksum: string | undefined;
  readonly packetBindingRejectionReason?: string;
  readonly diffRisk: DiffRisk;
  readonly feedbackCandidate: string;
  readonly memoryCandidateProposals: readonly (MemoryCandidateProposal | MemoryCandidate)[];
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
  renderDecisionPacketBinding({
    decisionPacketChecksum: input.decisionPacketChecksum,
    ...(input.packetBindingRejectionReason === undefined
      ? {}
      : { rejectionReason: input.packetBindingRejectionReason })
  }),
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

interface CaptureHelpedProof {
  assessment: EvidenceBundleHelpedProofAssessment;
  verificationRefs: string[];
}

const strictVerificationRefs = (
  evidence: CreateEvidenceBundleInput,
  requiredCommands: ReadonlySet<string>
): string[] => evidence.commands
  .map(toEvidenceCommandReadback)
  .filter((command) => command.kind === "command_runner" && requiredCommands.has(command.command))
  .flatMap((command) => [command.command, ...evidenceCommandOutputRefs(command)]);

const captureHelpedProof = (input: {
  readonly aggregate: HarnessRunAggregate;
  readonly createdAt: string;
  readonly evidence: CreateEvidenceBundleInput;
  readonly packetBinding: DecisionPacketBinding | undefined;
}): CaptureHelpedProof => {
  if (input.packetBinding === undefined) {
    return {
      assessment: { status: "ineligible", reason: "packet_not_bound_current" },
      verificationRefs: []
    };
  }

  const activation = decideEvidenceContractActivation({
    evidenceContract: input.aggregate.harnessPlan.metadata.evidenceContract,
    taskContract: input.aggregate.taskContract,
    harnessPlan: input.aggregate.harnessPlan,
    executionRun: input.aggregate.executionRun
  });
  const binding = input.packetBinding;

  const evidenceContract = activation.status === "active"
    ? activation.evidenceContract
    : undefined;
  const assessment = assessCurrentDecisionPacketHelpedProof({
    evidence: input.evidence,
    evidenceContract,
    authority: {
      checksum: binding.packetChecksum,
      generatedAt: binding.packetGeneratedAt,
      sourceRunLifecycleRevision: binding.sourceRunLifecycleRevision
    },
    createdAt: input.createdAt,
    sha256Hex
  });

  return {
    assessment,
    verificationRefs: assessment.status === "eligible" && evidenceContract !== undefined
      ? strictVerificationRefs(
        input.evidence,
        new Set(evidenceContract.commands
          .filter((command) => command.required)
          .map((command) => command.command))
      )
      : []
  };
};

const evidenceFeedbackOnceInputForCapture = (input: {
  readonly admittedUsefulness: ReturnType<typeof admitEvidenceBackedUsefulness>;
  readonly captureIdentity: string;
  readonly counts: EvidencePersistenceCounts;
  readonly evidence: CreateEvidenceBundleInput;
  readonly evalCandidateProposals: readonly EvalCandidateProposal[];
  readonly memoryCandidates: readonly MemoryCandidate[];
  readonly packet: ReturnType<typeof packetBindingForEvidenceCapture>;
  readonly persistedSourceDecisionCandidates: readonly SourceDecision[];
  readonly projectId: string;
  readonly runId: string;
  readonly sourceRunLifecycleRevision: number;
  readonly sourceUsefulnessOutcomes: readonly SourceUsefulnessOutcomeFeedback[] | undefined;
  readonly knowledgeUsefulnessOutcomes: readonly KnowledgeUsefulnessOutcomeFeedback[] | undefined;
  readonly environmentFingerprint: Awaited<ReturnType<typeof collectEnvironmentFingerprint>>;
}): CreateEvidenceFeedbackOnceInput => ({
  executionRunId: input.runId,
  sourceRunLifecycleRevision: input.sourceRunLifecycleRevision,
  projectId: input.projectId,
  captureIdentity: input.captureIdentity,
  semanticRequest: {
    ...(input.packet.callerPacketChecksum === undefined ||
      input.packet.callerPacketGeneratedAt === undefined
      ? {}
      : {
          decisionPacketClaim: {
            checksum: input.packet.callerPacketChecksum,
            generatedAt: input.packet.callerPacketGeneratedAt
          }
        }),
    ...(input.sourceUsefulnessOutcomes === undefined
      ? {}
      : { sourceUsefulnessOutcomes: input.sourceUsefulnessOutcomes }),
    ...(input.knowledgeUsefulnessOutcomes === undefined
      ? {}
      : { knowledgeUsefulnessOutcomes: input.knowledgeUsefulnessOutcomes }),
    ...evidenceFeedbackMaintenanceFor({
      sourceOutcomes: input.sourceUsefulnessOutcomes,
      knowledgeOutcomes: input.knowledgeUsefulnessOutcomes
    })
  },
  ...(input.packet.binding === undefined
    ? {}
    : {
        decisionPacketClaim: {
          checksum: input.packet.binding.packetChecksum,
          generatedAt: input.packet.binding.packetGeneratedAt
        }
      }),
  ...(input.admittedUsefulness.sourceOutcomes === undefined
    ? {}
    : { sourceUsefulnessOutcomes: input.admittedUsefulness.sourceOutcomes }),
  ...(input.admittedUsefulness.knowledgeOutcomes === undefined
    ? {}
    : { knowledgeUsefulnessOutcomes: input.admittedUsefulness.knowledgeOutcomes }),
  ...evidenceFeedbackMaintenanceFor({
    sourceOutcomes: input.admittedUsefulness.sourceOutcomes,
    knowledgeOutcomes: input.admittedUsefulness.knowledgeOutcomes
  }),
  evidence: input.evidence,
  review: buildReviewAssessmentInput(input.runId, input.counts),
  feedback: buildFeedbackDeltaInput(
    input.captureIdentity,
    input.runId,
    input.counts,
    input.memoryCandidates,
    input.persistedSourceDecisionCandidates,
    input.evalCandidateProposals,
    input.environmentFingerprint
  )
});

const persistEvidenceCapture = async (
  runtime: EvidenceCaptureRuntime,
  changedFiles: readonly ChangedFile[],
  classification: ChangedFileClassification,
  commands: EvidenceCommandReadback[],
  commandOutputArtifacts: CommandOutputArtifact[],
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
    const aggregate = await requireEvidenceCaptureAggregate(
      databaseRuntime.harnessRunRepository,
      runId
    );

    const counts = buildEvidencePersistenceCounts(changedFiles, classification, targetEvidence);
    const projectId = evidenceCaptureProjectIdFor(aggregate, databaseRuntime.projectId);
    const packet = packetBindingForEvidenceCapture({
      aggregate,
      decisionPacketChecksum: runtime.decisionPacketChecksum,
      decisionPacketGeneratedAt: runtime.decisionPacketGeneratedAt,
      runId,
      runtimeProjectId: databaseRuntime.projectId
    });
    const captureIdentity = evidenceCaptureIdentityFor({
      runId,
      projectId,
      decisionPacketChecksum: packet.callerPacketChecksum,
      environmentFingerprintId: environmentFingerprint.id,
      changedFiles,
      commands,
      targetEvidence,
      sourceUsefulnessOutcomes,
      knowledgeUsefulnessOutcomes,
      sourceDecisionCandidates,
      memoryCandidateProposals,
      evalCandidateProposals
    });
    const persistedSourceDecisionCandidates = sourceDecisionCandidatesForCapture(
      sourceDecisionCandidates,
      captureIdentity,
      packet.callerPacketGeneratedAt ?? aggregate.executionRun.createdAt
    );
    const persistedMemoryCandidateProposals = memoryCandidateProposalsForCapture(
      memoryCandidateProposals,
      captureIdentity,
      packet.callerPacketGeneratedAt ?? aggregate.executionRun.createdAt
    );
    const usefulness = prepareUsefulnessOutcomes({
      aggregate,
      callerPacketChecksum: packet.callerPacketChecksum,
      callerPacketGeneratedAt: packet.callerPacketGeneratedAt,
      knowledgeUsefulnessOutcomes,
      packetAuthorization: packet.authorization,
      runId,
      runtimeProjectId: databaseRuntime.projectId,
      sourceUsefulnessOutcomes
    });
    const memoryCandidates = materializeFeedbackDeltaMemoryCandidates(
      persistedMemoryCandidateProposals,
      projectId,
      runId
    );
    const evidence = buildEvidenceBundleInput(
      runId,
      changedFiles,
      classification,
      commands,
      commandOutputArtifacts,
      diffRisk,
      targetEvidence,
      counts,
      environmentFingerprint
    );
    const helpedProof = captureHelpedProof({
      aggregate,
      createdAt: runtime.now(),
      evidence,
      packetBinding: packet.binding
    });
    const evidenceBackedUsefulness = evidenceBackedUsefulnessOutcomesFor({
      captureIdentity,
      changedFiles,
      commands,
      commandOutputArtifacts: evidence.commandOutputArtifacts ?? [],
      decisionPacketChecksum: packet.binding?.packetChecksum,
      helpedProof,
      knowledgeOutcomes: usefulness.knowledgeOutcomes,
      sourceOutcomes: usefulness.sourceOutcomes,
      targetEvidence
    });
    const admittedUsefulness = admitEvidenceBackedUsefulness(
      usefulness.authorization,
      evidenceBackedUsefulness
    );
    const applications = usefulnessApplicationsForPersistence({
      aggregate,
      binding: packet.binding,
      projectId,
      runId,
      usefulness: admittedUsefulness,
      targetEvidence
    });
    const persistedApplications = await persistExplicitUsefulnessApplications(
      databaseRuntime.harnessRunRepository,
      applications
    );
    const createEvidenceFeedbackOnce = requireEvidenceFeedbackPersistence(
      databaseRuntime.harnessRunRepository.createEvidenceFeedbackOnce
    );
    const atomicResult = await createEvidenceFeedbackOnce.call(
      databaseRuntime.harnessRunRepository,
      evidenceFeedbackOnceInputForCapture({
        admittedUsefulness,
        captureIdentity,
        counts,
        evidence,
        evalCandidateProposals,
        memoryCandidates,
        packet,
        persistedSourceDecisionCandidates,
        projectId,
        runId,
        sourceRunLifecycleRevision: aggregate.executionRun.lifecycleRevision,
        sourceUsefulnessOutcomes,
        knowledgeUsefulnessOutcomes,
        environmentFingerprint
      })
    );

    return buildPersistedEvidenceIdentity({
      atomicResult,
      applications: persistedApplications,
      captureIdentity,
      authorization: usefulness.authorization,
      packetAuthorization: packet.authorization
    });
  } finally {
    await databaseRuntime.close();
  }
};

const hasApplicationBoundOutcome = (runtime: EvidenceCaptureRuntime): boolean => [
    ...(runtime.sourceUsefulnessOutcomes ?? []),
    ...(runtime.knowledgeUsefulnessOutcomes ?? [])
  ].some((outcome) => outcome.applicationId !== undefined);

const applicationTargetEvidence = async (
  runtime: EvidenceCaptureRuntime,
  targetEvidence: TargetEvidenceInput
): Promise<TargetEvidence> => {
  const targetRepo = await canonicalTargetRepoPath(
    path.resolve(runtime.cwd, targetEvidence.targetRepo)
  );
  const snapshot = await (runtime.readTargetStateSnapshot ?? collectTargetStateSnapshot)(
    targetRepo
  );

  const claimedFiles = new Map(
    targetEvidence.changedFiles?.map((file) => [file.path, file]) ?? []
  );
  const changedFiles = snapshot.changedPaths.map((changedPath) => ({
    status: claimedFiles.get(changedPath)?.status ?? "??",
    path: changedPath,
    ownership: claimedFiles.get(changedPath)?.ownership ?? "unknown"
  }));

  return normalizeTargetEvidence({
    ...targetEvidence,
    targetRepo,
    ...snapshot,
    changedFiles
  });
};

const targetEvidenceForCapture = async (
  runtime: EvidenceCaptureRuntime
): Promise<TargetEvidence | undefined> => runtime.targetEvidence === undefined
  ? undefined
  : hasApplicationBoundOutcome(runtime)
    ? applicationTargetEvidence(runtime, runtime.targetEvidence)
    : normalizeTargetEvidence(runtime.targetEvidence);

const evidenceCapturePersistence = (
  persistedIdentity: Awaited<ReturnType<typeof persistEvidenceCapture>> | undefined
): EvidenceCaptureResult["persistence"] | undefined => {
  if (persistedIdentity === undefined) return undefined;
  return {
    feedbackDeltaId: persistedIdentity.feedbackDeltaId,
    ...(persistedIdentity.sourceUsefulnessOutcomes === undefined
      ? {}
      : { sourceUsefulnessOutcomes: persistedIdentity.sourceUsefulnessOutcomes }),
    ...(persistedIdentity.usefulnessApplications === undefined
      ? {}
      : { usefulnessApplications: persistedIdentity.usefulnessApplications })
  };
};

const feedbackCandidateFor = (changedFiles: readonly ChangedFile[]): string =>
  changedFiles.length === 0
    ? "No changed files; no feedback candidate proposed."
    : "Review changed files and command evidence before promoting memory/source/eval candidates.";

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
  const commandInputs =
    runtime.commandOutcomes === undefined || runtime.commandOutcomes.length === 0
      ? defaultCommands()
      : runtime.commandOutcomes;
  const preparedCommandEvidence = await prepareEvidenceCommandArtifacts({
    cwd: runtime.cwd,
    commands: commandInputs,
    ...(runtime.commandOutputArtifacts === undefined
      ? {}
      : { commandOutputArtifacts: runtime.commandOutputArtifacts })
  });
  const commands = preparedCommandEvidence.commands;
  const targetEvidence = await targetEvidenceForCapture(runtime);
  const diffRisk = diffRiskFromChangedFiles(changedFiles);
  const sourceDecisionCandidates = buildSourceDecisionCandidates(runtime, changedFiles);
  const memoryCandidateProposals = buildMemoryCandidateProposals(runtime, changedFiles);
  const persistedIdentity = runtime.persist
    ? await persistEvidenceCapture(
      runtime,
      changedFiles,
      changedFileClassification,
      commands,
      preparedCommandEvidence.commandOutputArtifacts,
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
  const feedbackCandidate = feedbackCandidateFor(changedFiles);
  const renderedSourceUsefulnessOutcomes = persistedIdentity === undefined
    ? runtime.sourceUsefulnessOutcomes
    : persistedIdentity.sourceUsefulnessOutcomes;
  const renderedKnowledgeUsefulnessOutcomes = persistedIdentity === undefined
    ? runtime.knowledgeUsefulnessOutcomes
    : persistedIdentity.knowledgeUsefulnessOutcomes;
  const persistence = evidenceCapturePersistence(persistedIdentity);

  return {
    stdout: renderEvidenceCaptureOutput({
      changedFileClassification,
      commands,
      decisionPacketChecksum: runtime.persist
        ? persistedIdentity?.decisionPacketChecksum
        : runtime.decisionPacketChecksum,
      ...(persistedIdentity?.packetBindingRejectionReason === undefined
        ? {}
        : { packetBindingRejectionReason: persistedIdentity.packetBindingRejectionReason }),
      diffRisk,
      feedbackCandidate,
      knowledgeUsefulnessOutcomes: renderedKnowledgeUsefulnessOutcomes,
      memoryCandidateProposals:
        persistedIdentity?.memoryCandidates ?? memoryCandidateProposals,
      persistedIdentity,
      runtime,
      sourceDecisionCandidates:
        persistedIdentity?.sourceDecisionCandidates ?? sourceDecisionCandidates,
      sourceUsefulnessOutcomes: renderedSourceUsefulnessOutcomes,
      targetEvidence,
      evalCandidateProposals:
        persistedIdentity?.evalCandidateProposals ?? runtime.evalCandidateProposals ?? [],
      environmentFingerprint
    }),
    ...(persistence === undefined ? {} : { persistence })
  };
};
