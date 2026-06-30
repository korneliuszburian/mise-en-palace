import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import {
  normalizeEvidenceCommand,
  sourceUsefulnessOutcomesFromMetadata,
  summarizeFeedbackCandidateProposals,
  targetEvidenceFromMetadata
} from "@krn/core";
import type {
  CandidateReviewability,
  ContextAssembly,
  ContextExclusion,
  ContextInclusion,
  ContextSubjectType,
  EvidenceCommand,
  FeedbackDelta,
  FeedbackCandidateProposalKind,
  NormalizedEvidenceCommand,
  SourceTrustTier,
  SourceUsefulnessOutcome,
  TargetEvidence
} from "@krn/core";
import type {
  HarnessRunAggregate,
  ActivationDecisionRecord,
  RetrievalCandidateRecord,
  HarnessRunRepository
} from "@krn/harness/repositories";
import {
  activationRetrievalDiagnosticsFromMetadata,
  formatActivationRetrievalDiagnostics
} from "@krn/harness";
import type {
  ActivationRetrievalDiagnostics
} from "@krn/harness";

import type {
  DatabaseRuntimeInput,
  ProjectResolution,
  ProjectResolutionKind
} from "./databaseRuntime.js";
import {
  formatProjectResolutionKind
} from "./projectResolutionReadback.js";

export interface RunShowCommandRuntime {
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  runId: string;
  format: RunReadbackOutputFormat;
  createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface RunShowCommandResult {
  stdout: string;
}

export type RunReadbackOutputFormat = "text" | "json";

export interface RunReadbackCommandResource {
  command: string;
  status: EvidenceCommand["status"];
  provenance: NormalizedEvidenceCommand["provenance"];
  doesNotProve: string;
}

export interface RunReadbackChangedFilesResource {
  all: string[];
  classification: {
    source: "metadata" | "not_recorded";
    intended: string[];
    unrelated: string[];
    unknown: string[];
  };
}

export interface RunReadbackContextInclusionResource {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  trustTier: SourceTrustTier;
  tokenEstimate?: number;
}

export interface RunReadbackContextExclusionResource {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  trustTier: SourceTrustTier;
  score?: number;
}

export interface RunReadbackSourceClaimEdgeInfluenceResource {
  edgeIds: string[];
  edgeKinds: string[];
  seedSourceClaimIds: string[];
  doesNotProve: string;
}

export interface RunReadbackActivationCandidateResource {
  id: string;
  kind: string;
  status: string;
  subjectType: string;
  subjectId: string;
  trustTier: SourceTrustTier;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
  sourceClaimEdgeInfluence?: RunReadbackSourceClaimEdgeInfluenceResource;
}

export interface RunReadbackActivationDecisionResource {
  id: string;
  subjectType: string;
  subjectId: string;
  decision: string;
  reason: string;
  score?: number;
  expectedDecisionImpact?: string;
  retrievalCandidateId?: string;
}

export interface RunReadbackActivationTraceResource {
  retrievalRunId: string;
  candidates: RunReadbackActivationCandidateResource[];
  decisions: RunReadbackActivationDecisionResource[];
}

export interface RunReadbackResource {
  kind: "krn.run.readback.v1";
  access: "read_only";
  mutation: "none";
  run: {
    id: string;
    status: string;
    adapter: string;
    createdAt: string;
    updatedAt: string;
    projectResolution?: ProjectResolution;
  };
  task: {
    id: string;
    title: string;
    objective: string;
    status: string;
  };
  context: {
    status: string;
    inclusions: number;
    exclusions: number;
    inclusionDetails: RunReadbackContextInclusionResource[];
    exclusionDetails: RunReadbackContextExclusionResource[];
    activationDiagnostics?: ActivationRetrievalDiagnostics;
    activationTrace?: RunReadbackActivationTraceResource;
  };
  evidenceBundles: {
    id: string;
    status: string;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    changedFiles: RunReadbackChangedFilesResource;
    commands: RunReadbackCommandResource[];
    targetEvidence?: TargetEvidence;
  }[];
  reviewAssessments: {
    id: string;
    status: string;
    reviewer: string;
  }[];
  feedbackDeltas: {
    id: string;
    status: string;
    memoryRecordMutation: "none";
    candidateCounts: {
      memory: number;
      source: number;
      sourceClaim: number;
      sourceDecision: number;
      antiMemory: number;
      eval: number;
      observation: number;
    };
    candidates: RunReadbackCandidateResource[];
    sourceUsefulnessOutcomes: RunReadbackSourceUsefulnessOutcomeResource[];
  }[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export interface RunReadbackCandidateResource {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string;
  summary: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: string[];
}

export interface RunReadbackSourceUsefulnessOutcomeResource {
  sourceClaimId?: string;
  sourceDecisionId?: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

interface ReadOnlyHarnessRuntime {
  harnessRunRepository: Pick<HarnessRunRepository, "getHarnessRunByExecutionRunId">;
  close(): Promise<void>;
}

type RunReadbackRunResource = RunReadbackResource["run"];
type RunReadbackTaskResource = RunReadbackResource["task"];
type RunReadbackContextResource = RunReadbackResource["context"];
type RunReadbackEvidenceBundleResource = RunReadbackResource["evidenceBundles"][number];
type RunReadbackReviewAssessmentResource = RunReadbackResource["reviewAssessments"][number];
type RunReadbackFeedbackDeltaResource = RunReadbackResource["feedbackDeltas"][number];
type RunReadbackProofResource = RunReadbackResource["proof"];

export type CreateRunShowDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<ReadOnlyHarnessRuntime>;

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingRunShowDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn run show",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const runReadbackProves = [
  "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
  "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
  "this readback surface exposes no write action"
];

const runReadbackDoesNotProve = [
  "commands were executed by this readback command",
  "activation scoring quality or production graph retrieval quality",
  "memory quality, source truth, review correctness, or product readiness",
  "Memory Core mutation"
];

const createReadOnlyHarnessRuntime = async (
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  const client = postgres(databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);

  return {
    harnessRunRepository: new DrizzleHarnessRunRepository(db),
    async close(): Promise<void> {
      await client.end();
    }
  };
};

const resolveReadOnlyRuntime = async (
  runtime: RunShowCommandRuntime,
  databaseUrl: string
): Promise<ReadOnlyHarnessRuntime> => {
  if (runtime.createDatabaseRuntime === undefined) {
    return createReadOnlyHarnessRuntime(databaseUrl);
  }

  return runtime.createDatabaseRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    now: runtime.now,
    createId: runtime.createId
  });
};

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const projectResolutionKinds = new Set<ProjectResolutionKind>([
  "explicit_project",
  "connected_repo_path",
  "workspace_project_slug"
]);

const projectResolutionFromMetadata = (
  metadata: Record<string, unknown>
): ProjectResolution | undefined => {
  const value = metadata.projectResolution;

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const kind = metadataString(record, "kind");
  const reason = metadataString(record, "reason");
  const doesNotProve = metadataString(record, "doesNotProve");

  if (
    kind === undefined ||
    !projectResolutionKinds.has(kind as ProjectResolutionKind) ||
    reason === undefined ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  const repoPathHint = metadataString(record, "repoPathHint");

  return {
    kind: kind as ProjectResolutionKind,
    reason,
    doesNotProve,
    ...(repoPathHint === undefined ? {} : { repoPathHint })
  };
};

const metadataStringList = (
  metadata: Record<string, unknown>,
  key: string
): string[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0
  );
};

const changedFileClassification = (
  bundle: HarnessRunAggregate["evidenceBundles"][number]
): RunReadbackChangedFilesResource["classification"] => {
  const group = bundle.metadata.changedFileClassification;

  if (
    typeof group !== "object" ||
    group === null ||
    Array.isArray(group)
  ) {
    return {
      source: "not_recorded",
      intended: [],
      unrelated: [],
      unknown: bundle.changedFiles
    };
  }

  const record = group as Record<string, unknown>;

  return {
    source: "metadata",
    intended: metadataStringList(record, "intended"),
    unrelated: metadataStringList(record, "unrelated"),
    unknown: metadataStringList(record, "unknown")
  };
};

const metadataArrayLength = (
  metadata: Record<string, unknown>,
  groupKey: string,
  key: string
): string => {
  const group = metadata[groupKey];

  if (
    typeof group !== "object" ||
    group === null ||
    Array.isArray(group)
  ) {
    return "unknown";
  }

  const value = (group as Record<string, unknown>)[key];

  return Array.isArray(value) ? String(value.length) : "unknown";
};

const renderCommand = (command: EvidenceCommand): string[] => {
  const normalized = normalizeEvidenceCommand(command) as NormalizedEvidenceCommand;

  return [
    `- ${normalized.command}: ${normalized.status} | provenance=${normalized.provenance}`,
    `  doesNotProve: ${normalized.doesNotProve}`
  ];
};

const renderCommands = (commands: readonly EvidenceCommand[]): string[] =>
  commands.length === 0
    ? ["- none"]
    : commands.flatMap(renderCommand);

const contextSubjectRef = (item: { subjectType: string; subjectId: string }): string =>
  `${item.subjectType}:${item.subjectId}`;

const renderContextInclusion = (inclusion: ContextInclusion): string[] => [
  `  - ${contextSubjectRef(inclusion)}`,
  `    reason: ${inclusion.reason}`,
  `    expectedUse: ${inclusion.expectedUse}`,
  `    trustTier: ${inclusion.trustTier}`,
  ...(inclusion.tokenEstimate === undefined ? [] : [`    tokenEstimate: ${inclusion.tokenEstimate}`])
];

const renderContextExclusion = (exclusion: ContextExclusion): string[] => [
  `  - ${contextSubjectRef(exclusion)}`,
  `    reason: ${exclusion.reason}`,
  `    explanation: ${exclusion.explanation}`,
  `    trustTier: ${exclusion.trustTier}`,
  ...(exclusion.score === undefined ? [] : [`    score: ${exclusion.score}`])
];

const renderContextDetails = (
  contextAssembly: ContextAssembly | undefined
): string[] => {
  const inclusions = contextAssembly?.inclusions ?? [];
  const exclusions = contextAssembly?.exclusions ?? [];

  return [
    "Context inclusion details:",
    ...(inclusions.length === 0 ? ["  - none"] : inclusions.flatMap(renderContextInclusion)),
    "Context exclusion details:",
    ...(exclusions.length === 0 ? ["  - none"] : exclusions.flatMap(renderContextExclusion))
  ];
};

const renderList = (values: readonly string[]): string[] =>
  values.length === 0
    ? ["    - none"]
    : values.map((value) => `    - ${value}`);

const renderTargetEvidence = (targetEvidence: TargetEvidence | undefined): string[] => {
  if (targetEvidence === undefined) {
    return [
      "  targetEvidence:",
      "  - none"
    ];
  }

  return [
    "  targetEvidence:",
    `  - repo: ${targetEvidence.targetRepo}`,
    `  - mode: ${targetEvidence.mode}`,
    `  - dirtyBefore: ${targetEvidence.dirtyBefore}`,
    `  - dirtyAfter: ${targetEvidence.dirtyAfter}`,
    `  - ownedChanges: ${targetEvidence.ownedChanges}`,
    `  - targetStatusFreshness: ${targetEvidence.targetStatusFreshness}`,
    `  - targetPatchLifecycle: ${targetEvidence.targetPatchLifecycle}`,
    `  - handoffArtifact: ${targetEvidence.handoffArtifact ?? "none"}`,
    `  - targetOwnerDecision: ${targetEvidence.targetOwnerDecision ?? "none"}`,
    "  - allowedWrites:",
    ...renderList(targetEvidence.allowedWrites),
    "  - forbiddenWrites:",
    ...renderList(targetEvidence.forbiddenWrites),
    "  - changedFiles:",
    ...(targetEvidence.changedFiles.length === 0
      ? ["    - none"]
      : targetEvidence.changedFiles.map((file) =>
          `    - ${file.status} ${file.path} | ownership=${file.ownership}`
        )),
    "  - commands:",
    ...renderList(targetEvidence.commands),
    "  - doesNotProve:",
    ...renderList(targetEvidence.doesNotProve)
  ];
};

const commandResource = (command: EvidenceCommand): RunReadbackCommandResource => {
  const normalized = normalizeEvidenceCommand(command) as NormalizedEvidenceCommand;

  return {
    command: normalized.command,
    status: normalized.status,
    provenance: normalized.provenance,
    doesNotProve: normalized.doesNotProve
  };
};

const contextInclusionResource = (
  inclusion: ContextInclusion
): RunReadbackContextInclusionResource => ({
  subjectType: inclusion.subjectType,
  subjectId: inclusion.subjectId,
  reason: inclusion.reason,
  expectedUse: inclusion.expectedUse,
  trustTier: inclusion.trustTier,
  ...(inclusion.tokenEstimate === undefined ? {} : { tokenEstimate: inclusion.tokenEstimate })
});

const contextExclusionResource = (
  exclusion: ContextExclusion
): RunReadbackContextExclusionResource => ({
  subjectType: exclusion.subjectType,
  subjectId: exclusion.subjectId,
  reason: exclusion.reason,
  explanation: exclusion.explanation,
  trustTier: exclusion.trustTier,
  ...(exclusion.score === undefined ? {} : { score: exclusion.score })
});

const sourceClaimEdgeInfluenceFromMetadata = (
  metadata: Record<string, unknown>
): RunReadbackSourceClaimEdgeInfluenceResource | undefined => {
  const value = metadata.sourceClaimEdgeInfluence;

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const edgeIds = metadataStringList(record, "edgeIds");
  const edgeKinds = metadataStringList(record, "edgeKinds");
  const seedSourceClaimIds = metadataStringList(record, "seedSourceClaimIds");
  const doesNotProve = metadataString(record, "doesNotProve");

  if (
    edgeIds.length === 0 ||
    edgeKinds.length === 0 ||
    seedSourceClaimIds.length === 0 ||
    doesNotProve === undefined
  ) {
    return undefined;
  }

  return {
    edgeIds,
    edgeKinds,
    seedSourceClaimIds,
    doesNotProve
  };
};

const activationCandidateResource = (
  candidate: RetrievalCandidateRecord
): RunReadbackActivationCandidateResource => {
  const sourceClaimEdgeInfluence = sourceClaimEdgeInfluenceFromMetadata(candidate.metadata);

  return {
    id: candidate.id,
    kind: candidate.kind,
    status: candidate.status,
    subjectType: candidate.subjectType,
    subjectId: candidate.subjectId,
    trustTier: candidate.trustTier,
    ...(candidate.lexicalScore === undefined ? {} : { lexicalScore: candidate.lexicalScore }),
    ...(candidate.vectorScore === undefined ? {} : { vectorScore: candidate.vectorScore }),
    ...(candidate.graphScore === undefined ? {} : { graphScore: candidate.graphScore }),
    ...(candidate.temporalScore === undefined ? {} : { temporalScore: candidate.temporalScore }),
    ...(candidate.contextRoiScore === undefined ? {} : { contextRoiScore: candidate.contextRoiScore }),
    ...(candidate.totalScore === undefined ? {} : { totalScore: candidate.totalScore }),
    ...(candidate.score === undefined ? {} : { score: candidate.score }),
    reason: candidate.reason,
    ...(sourceClaimEdgeInfluence === undefined ? {} : { sourceClaimEdgeInfluence })
  };
};

const activationDecisionResource = (
  decision: ActivationDecisionRecord
): RunReadbackActivationDecisionResource => ({
  id: decision.id,
  subjectType: decision.subjectType,
  subjectId: decision.subjectId,
  decision: decision.decision,
  reason: decision.reason,
  ...(decision.score === undefined ? {} : { score: decision.score }),
  ...(decision.expectedDecisionImpact === undefined
    ? {}
    : { expectedDecisionImpact: decision.expectedDecisionImpact }),
  ...(decision.retrievalCandidateId === undefined
    ? {}
    : { retrievalCandidateId: decision.retrievalCandidateId })
});

const activationTraceResource = (
  aggregate: HarnessRunAggregate
): RunReadbackActivationTraceResource | undefined =>
  aggregate.activationTrace === undefined
    ? undefined
    : {
        retrievalRunId: aggregate.activationTrace.retrievalRunId,
        candidates: aggregate.activationTrace.candidates.map(activationCandidateResource),
        decisions: aggregate.activationTrace.decisions.map(activationDecisionResource)
      };

const renderActivationTrace = (
  aggregate: HarnessRunAggregate
): string[] => {
  const trace = activationTraceResource(aggregate);

  if (trace === undefined) {
    return [
      "Activation trace:",
      "- none"
    ];
  }

  return [
    "Activation trace:",
    `- retrievalRunId: ${trace.retrievalRunId}`,
    `- candidates: ${trace.candidates.length}`,
    ...trace.candidates.flatMap((candidate) => [
      `  - ${candidate.subjectType}:${candidate.subjectId} | status=${candidate.status} | kind=${candidate.kind}`,
      `    scores: lexical=${candidate.lexicalScore ?? 0} vector=${candidate.vectorScore ?? 0} graph=${candidate.graphScore ?? 0} temporal=${candidate.temporalScore ?? 0} contextRoi=${candidate.contextRoiScore ?? 0} total=${candidate.totalScore ?? "unknown"}`,
      `    reason: ${candidate.reason}`,
      ...(candidate.sourceClaimEdgeInfluence === undefined
        ? []
        : [
            "    sourceClaimEdgeInfluence:",
            `      edgeIds: ${candidate.sourceClaimEdgeInfluence.edgeIds.join(", ")}`,
            `      edgeKinds: ${candidate.sourceClaimEdgeInfluence.edgeKinds.join(", ")}`,
            `      seedSourceClaimIds: ${candidate.sourceClaimEdgeInfluence.seedSourceClaimIds.join(", ")}`,
            `      doesNotProve: ${candidate.sourceClaimEdgeInfluence.doesNotProve}`
          ])
    ]),
    `- decisions: ${trace.decisions.length}`,
    ...trace.decisions.map((decision) =>
      `  - ${decision.subjectType}:${decision.subjectId} | decision=${decision.decision} | reason=${decision.reason}`
    )
  ];
};

const candidateReviewabilityReasons = (
  metadata: Record<string, unknown>
): string[] => metadataStringList(metadata, "reviewabilityReasons");

const candidateReviewabilityLabels = new Set<CandidateReviewability>([
  "ready",
  "needs_more_evidence",
  "too_vague",
  "duplicate",
  "not_useful",
  "unknown"
]);

const candidateReviewability = (
  metadata: Record<string, unknown>
): CandidateReviewability => {
  const value = metadataString(metadata, "reviewability");

  return value !== undefined && candidateReviewabilityLabels.has(value as CandidateReviewability)
    ? value as CandidateReviewability
    : "unknown";
};

const objectListMetadata = (
  metadata: Record<string, unknown>,
  key: string
): Record<string, unknown>[] => {
  const value = metadata[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item)
  );
};

const candidateResource = (input: {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string | undefined;
  summary: string;
  metadata: Record<string, unknown>;
}): RunReadbackCandidateResource => {
  const reviewability = candidateReviewability(input.metadata);
  const reviewabilityReasons = candidateReviewabilityReasons(input.metadata);

  return {
    kind: input.kind,
    id: input.id,
    status: input.status ?? "unknown",
    summary: input.summary,
    reviewability,
    reviewabilityReasons:
      reviewabilityReasons.length > 0
        ? reviewabilityReasons
        : ["Reviewability reasons were not present in candidate metadata."]
  };
};

const metadataCandidateResources = (
  metadata: Record<string, unknown>,
  key: string,
  kind: FeedbackCandidateProposalKind,
  summaryField: string
): RunReadbackCandidateResource[] =>
  objectListMetadata(metadata, key).flatMap((item) => {
    const id = metadataString(item, "id");
    const summary = metadataString(item, summaryField) ?? metadataString(item, "summary");

    if (id === undefined || summary === undefined) {
      return [];
    }

    return [candidateResource({
      kind,
      id,
      status: metadataString(item, "status"),
      summary,
      metadata: item
    })];
  });

const runReadbackCandidateResources = (
  feedback: FeedbackDelta
): RunReadbackCandidateResource[] => [
  ...feedback.memoryCandidates.map((candidate) => candidateResource({
    kind: "memory_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.summary,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "sourceClaimCandidates",
    "source_claim_candidate",
    "claim"
  ),
  ...feedback.sourceDecisions.map((decision) => candidateResource({
    kind: "source_decision_candidate",
    id: decision.id,
    status: decision.status,
    summary: decision.decision,
    metadata: decision.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "antiMemoryCandidates",
    "anti_memory_candidate",
    "rejectedClaim"
  ),
  ...feedback.evalCandidates.map((candidate) => candidateResource({
    kind: "eval_candidate",
    id: candidate.id,
    status: candidate.status,
    summary: candidate.title,
    metadata: candidate.metadata
  })),
  ...metadataCandidateResources(
    feedback.metadata,
    "observationCandidates",
    "observation_candidate",
    "summary"
  )
];

const runReadbackSourceUsefulnessOutcomes = (
  feedback: FeedbackDelta
): RunReadbackSourceUsefulnessOutcomeResource[] =>
  sourceUsefulnessOutcomesFromMetadata(feedback.metadata).map((outcome) => ({
    ...(outcome.sourceClaimId === undefined ? {} : { sourceClaimId: outcome.sourceClaimId }),
    ...(outcome.sourceDecisionId === undefined ? {} : { sourceDecisionId: outcome.sourceDecisionId }),
    outcome: outcome.outcome,
    reason: outcome.reason,
    evidenceRefs: outcome.evidenceRefs,
    doesNotProve: outcome.doesNotProve
  }));

const renderSourceUsefulnessOutcomes = (
  feedback: FeedbackDelta
): string[] => {
  const outcomes = runReadbackSourceUsefulnessOutcomes(feedback);

  if (outcomes.length === 0) {
    return ["  source usefulness outcomes: none"];
  }

  return [
    "  source usefulness outcomes:",
    ...outcomes.flatMap((outcome) => [
      `  - outcome=${outcome.outcome} sourceClaim=${outcome.sourceClaimId ?? "none"} sourceDecision=${outcome.sourceDecisionId ?? "none"}`,
      `    reason: ${outcome.reason}`,
      ...(outcome.evidenceRefs.length === 0
        ? ["    evidenceRef: none"]
        : outcome.evidenceRefs.map((evidenceRef) => `    evidenceRef: ${evidenceRef}`)),
      `    doesNotProve: ${outcome.doesNotProve}`
    ])
  ];
};

const renderFeedbackDelta = (feedback: FeedbackDelta): string[] => {
  const summary = summarizeFeedbackCandidateProposals(feedback);
  const candidateDetails = runReadbackCandidateResources(feedback).flatMap((candidate) => [
    `  - ${candidate.kind}:${candidate.id} | status=${candidate.status} | ${candidate.summary}`,
    `    reviewability: ${candidate.reviewability}`,
    ...candidate.reviewabilityReasons.map((reason) => `    reviewabilityReason: ${reason}`)
  ]);

  return [
    `- ${feedback.id}: status=${feedback.status}`,
    `  memoryRecordMutation: ${summary.memoryRecordMutation}`,
    `  candidates: memory=${summary.counts.memoryCandidates}, source=${summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates}, source_claim=${summary.counts.sourceClaimCandidates}, source_decision=${summary.counts.sourceDecisionCandidates}, anti_memory=${summary.counts.antiMemoryCandidates}, eval=${summary.counts.evalCandidates}, observation=${summary.counts.observationCandidates}`,
    ...renderSourceUsefulnessOutcomes(feedback),
    ...(
      candidateDetails.length === 0
        ? ["  candidate details: none"]
        : candidateDetails
    )
  ];
};

const renderEvidenceBundle = (
  aggregate: HarnessRunAggregate
): string[] => {
  if (aggregate.evidenceBundles.length === 0) {
    return ["Evidence Bundles:", "- none"];
  }

  return [
    "Evidence Bundles:",
    ...aggregate.evidenceBundles.flatMap((bundle) => {
      const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

      return [
        `- ${bundle.id}: status=${bundle.status} diffRisk=${bundle.diffRisk}`,
        `  changedFiles: ${bundle.changedFiles.length}`,
        "  changed file classification:",
        `  - intended=${metadataArrayLength(bundle.metadata, "changedFileClassification", "intended")}`,
        `  - unrelated=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unrelated")}`,
        `  - unknown=${metadataArrayLength(bundle.metadata, "changedFileClassification", "unknown")}`,
        `  reviewBurden: ${bundle.reviewBurden}`,
        `  rollbackPath: ${bundle.rollbackPath}`,
        "  commands:",
        ...renderCommands(bundle.commands).map((line) => `  ${line}`),
        ...renderTargetEvidence(targetEvidence)
      ];
    })
  ];
};

const renderFeedbackDeltas = (feedbackDeltas: readonly FeedbackDelta[]): string[] => [
  "Feedback Deltas:",
  ...(feedbackDeltas.length === 0
    ? ["- none"]
    : feedbackDeltas.flatMap(renderFeedbackDelta))
];

const runResource = (
  aggregate: HarnessRunAggregate,
  projectResolution: ProjectResolution | undefined
): RunReadbackRunResource => ({
  id: aggregate.executionRun.id,
  status: aggregate.executionRun.status,
  adapter: aggregate.executionRun.adapter,
  createdAt: aggregate.executionRun.createdAt,
  updatedAt: aggregate.executionRun.updatedAt,
  ...(projectResolution === undefined ? {} : { projectResolution })
});

const taskResource = (
  aggregate: HarnessRunAggregate
): RunReadbackTaskResource => ({
  id: aggregate.taskContract.id,
  title: aggregate.taskContract.title,
  objective: aggregate.taskContract.objective,
  status: aggregate.taskContract.status
});

const activationDiagnosticsResource = (
  contextAssembly: ContextAssembly | undefined
): ActivationRetrievalDiagnostics | undefined =>
  contextAssembly === undefined
    ? undefined
    : activationRetrievalDiagnosticsFromMetadata(contextAssembly.metadata);

const contextResource = (
  aggregate: HarnessRunAggregate,
  activationTrace: RunReadbackActivationTraceResource | undefined
): RunReadbackContextResource => {
  const contextAssembly = aggregate.contextAssembly;
  const activationDiagnostics = activationDiagnosticsResource(contextAssembly);

  return {
    status: contextAssembly?.status ?? "missing",
    inclusions: contextAssembly?.inclusions.length ?? 0,
    exclusions: contextAssembly?.exclusions.length ?? 0,
    inclusionDetails: contextAssembly?.inclusions.map(contextInclusionResource) ?? [],
    exclusionDetails: contextAssembly?.exclusions.map(contextExclusionResource) ?? [],
    ...(activationDiagnostics === undefined ? {} : { activationDiagnostics }),
    ...(activationTrace === undefined ? {} : { activationTrace })
  };
};

const evidenceBundleResource = (
  bundle: HarnessRunAggregate["evidenceBundles"][number]
): RunReadbackEvidenceBundleResource => {
  const targetEvidence = targetEvidenceFromMetadata(bundle.metadata.targetEvidence);

  return {
    id: bundle.id,
    status: bundle.status,
    diffRisk: bundle.diffRisk,
    reviewBurden: bundle.reviewBurden,
    rollbackPath: bundle.rollbackPath,
    changedFiles: {
      all: bundle.changedFiles,
      classification: changedFileClassification(bundle)
    },
    commands: bundle.commands.map(commandResource),
    ...(targetEvidence === undefined ? {} : { targetEvidence })
  };
};

const reviewAssessmentResource = (
  assessment: HarnessRunAggregate["reviewAssessments"][number]
): RunReadbackReviewAssessmentResource => ({
  id: assessment.id,
  status: assessment.status,
  reviewer: assessment.reviewer
});

const feedbackDeltaResource = (
  feedback: FeedbackDelta
): RunReadbackFeedbackDeltaResource => {
  const summary = summarizeFeedbackCandidateProposals(feedback);

  return {
    id: feedback.id,
    status: feedback.status,
    memoryRecordMutation: summary.memoryRecordMutation,
    candidateCounts: {
      memory: summary.counts.memoryCandidates,
      source: summary.counts.sourceClaimCandidates + summary.counts.sourceDecisionCandidates,
      sourceClaim: summary.counts.sourceClaimCandidates,
      sourceDecision: summary.counts.sourceDecisionCandidates,
      antiMemory: summary.counts.antiMemoryCandidates,
      eval: summary.counts.evalCandidates,
      observation: summary.counts.observationCandidates
    },
    candidates: runReadbackCandidateResources(feedback),
    sourceUsefulnessOutcomes: runReadbackSourceUsefulnessOutcomes(feedback)
  };
};

const proofResource = (): RunReadbackProofResource => ({
  proves: [...runReadbackProves],
  doesNotProve: [...runReadbackDoesNotProve]
});

const buildRunReadbackResource = (
  aggregate: HarnessRunAggregate
): RunReadbackResource => {
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);
  const activationTrace = activationTraceResource(aggregate);

  return {
    kind: "krn.run.readback.v1",
    access: "read_only",
    mutation: "none",
    run: runResource(aggregate, projectResolution),
    task: taskResource(aggregate),
    context: contextResource(aggregate, activationTrace),
    evidenceBundles: aggregate.evidenceBundles.map(evidenceBundleResource),
    reviewAssessments: aggregate.reviewAssessments.map(reviewAssessmentResource),
    feedbackDeltas: aggregate.feedbackDeltas.map(feedbackDeltaResource),
    proof: proofResource()
  };
};

const renderProjectResolution = (
  projectResolution: ProjectResolution | undefined
): string[] => {
  if (projectResolution === undefined) {
    return [];
  }

  const lines = [
    `- project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
    `- project resolution reason: ${projectResolution.reason}`
  ];

  if (projectResolution.repoPathHint !== undefined) {
    lines.push(`- project resolution repoPathHint: ${projectResolution.repoPathHint}`);
  }

  lines.push(`- project resolution does not prove: ${projectResolution.doesNotProve}`);

  return lines;
};

const renderTaskSection = (
  aggregate: HarnessRunAggregate,
  projectResolution: ProjectResolution | undefined
): string[] => [
  "Task:",
  `- id: ${aggregate.taskContract.id}`,
  `- title: ${aggregate.taskContract.title}`,
  `- objective: ${aggregate.taskContract.objective}`,
  `- run status: ${aggregate.executionRun.status}`,
  `- adapter: ${aggregate.executionRun.adapter}`,
  ...renderProjectResolution(projectResolution)
];

const renderContextSection = (
  aggregate: HarnessRunAggregate,
  activationDiagnostics: ActivationRetrievalDiagnostics | undefined
): string[] => [
  "Context:",
  `- status: ${aggregate.contextAssembly?.status ?? "missing"}`,
  `- inclusions: ${aggregate.contextAssembly?.inclusions.length ?? 0}`,
  `- exclusions: ${aggregate.contextAssembly?.exclusions.length ?? 0}`,
  ...renderContextDetails(aggregate.contextAssembly),
  ...(activationDiagnostics === undefined
    ? []
    : formatActivationRetrievalDiagnostics(activationDiagnostics)),
  ...renderActivationTrace(aggregate)
];

const renderReviewAssessments = (
  aggregate: HarnessRunAggregate
): string[] => [
  "Review Assessments:",
  ...(aggregate.reviewAssessments.length === 0
    ? ["- none"]
    : aggregate.reviewAssessments.map((assessment) =>
        `- ${assessment.id}: status=${assessment.status} reviewer=${assessment.reviewer}`
      ))
];

const renderProofSections = (): string[] => [
  "What This Proves:",
  ...runReadbackProves.map((proof) => `- ${proof}`),
  "",
  "What This Does Not Prove:",
  ...runReadbackDoesNotProve.map((proof) => `- ${proof}`),
  ""
];

const renderAggregate = (
  aggregate: HarnessRunAggregate
): string => {
  const activationDiagnostics = activationDiagnosticsResource(aggregate.contextAssembly);
  const projectResolution = projectResolutionFromMetadata(aggregate.executionRun.metadata);

  return [
    "KRN Run Readback",
    `Run ID: ${aggregate.executionRun.id}`,
    "Persistence: read-only (Postgres)",
    "Mutation: none",
    "",
    ...renderTaskSection(aggregate, projectResolution),
    "",
    ...renderContextSection(aggregate, activationDiagnostics),
    "",
    ...renderEvidenceBundle(aggregate),
    "",
    ...renderReviewAssessments(aggregate),
    "",
    ...renderFeedbackDeltas(aggregate.feedbackDeltas),
    "",
    ...renderProofSections()
  ].join("\n");
};

export const runRunShowCommand = async (
  runtime: RunShowCommandRuntime
): Promise<RunShowCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingRunShowDatabaseUrlMessage);
  }

  const readRuntime = await resolveReadOnlyRuntime(runtime, databaseUrl);

  try {
    const aggregate = await readRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
      runtime.runId
    );

    if (aggregate === undefined) {
      throw new Error(`Execution run not found: ${runtime.runId}`);
    }

    if (runtime.format === "json") {
      return {
        stdout: `${JSON.stringify(buildRunReadbackResource(aggregate), null, 2)}\n`
      };
    }

    return {
      stdout: `${renderAggregate(aggregate)}\n`
    };
  } finally {
    await readRuntime.close();
  }
};
