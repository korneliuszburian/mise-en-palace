import type {
  MemoryRecord,
  ProjectId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeId
} from "@krn/core";
import {
  buildBrainHeartbeatPreview
} from "@krn/workers";
import type {
  BrainHeartbeatCandidate,
  BrainHeartbeatPreview
} from "@krn/workers";

import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import type {
  DatabaseRuntimeInput,
  ProjectResolution
} from "./databaseRuntime.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";
import {
  formatProjectResolutionKind
} from "./projectResolutionReadback.js";
import type {
  CliCommand
} from "./parseArgs.js";

export type HeartbeatPreviewCommand = Extract<CliCommand, { kind: "heartbeatPreview" }>;

interface HeartbeatPreviewDatabaseRuntime {
  projectId: string;
  projectResolution?: ProjectResolution;
  memoryRepository: {
    listMemoryRecordsForProject(projectId: ProjectId, limit?: number): Promise<MemoryRecord[]>;
  };
  sourceRepository: {
    listClaimsForProject(projectId: ProjectId, limit: number): Promise<SourceClaim[]>;
    listSourceClaimEdgesForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceClaimEdge[]>;
  };
  close(): Promise<void>;
}

export type CreateHeartbeatPreviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<HeartbeatPreviewDatabaseRuntime>;

export interface HeartbeatPreviewCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: HeartbeatPreviewCommand;
  createDatabaseRuntime?: CreateHeartbeatPreviewDatabaseRuntime;
}

export interface HeartbeatPreviewCommandResult {
  stdout: string;
}

const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const defaultMemoryLimit = 50;
const defaultSourceClaimLimit = 50;
const defaultMaxCandidates = 10;
const defaultEvidenceRef =
  "krn heartbeat preview operator readback";

const uniqueSourceClaimEdges = (
  edges: readonly SourceClaimEdge[]
): SourceClaimEdge[] => {
  const deduped = new Map<SourceClaimEdgeId, SourceClaimEdge>();

  for (const edge of edges) {
    deduped.set(edge.id, edge);
  }

  return Array.from(deduped.values());
};

const loadSourceClaimEdges = async (
  sourceRepository: HeartbeatPreviewDatabaseRuntime["sourceRepository"],
  sourceClaims: readonly SourceClaim[]
): Promise<SourceClaimEdge[]> => {
  const edges = await Promise.all(sourceClaims.map((sourceClaim) =>
    sourceRepository.listSourceClaimEdgesForClaim(sourceClaim.id)
  ));

  return uniqueSourceClaimEdges(edges.flat());
};

const formatList = (values: readonly string[]): string[] =>
  values.length === 0 ? ["  - none"] : values.map((value) => `  - ${value}`);

const formatProjectResolutionLines = (
  projectResolution: ProjectResolution | undefined
): string[] => {
  if (projectResolution === undefined) {
    return [
      "Project resolution: unavailable",
      "Project resolution doesNotProve: missing resolution metadata does not prove the wrong project was used."
    ];
  }

  return [
    `Project resolution: ${formatProjectResolutionKind(projectResolution.kind)}`,
    `Project resolution reason: ${projectResolution.reason}`,
    ...(projectResolution.repoPathHint === undefined
      ? []
      : [`Project resolution repoPathHint: ${projectResolution.repoPathHint}`]),
    `Project resolution doesNotProve: ${projectResolution.doesNotProve}`
  ];
};

const candidateTargetLines = (candidate: BrainHeartbeatCandidate): string[] => {
  if (candidate.kind === "memory_staleness_maintenance_candidate") {
    return [
      `  memoryRecordId: ${candidate.memoryRecordId}`,
      `  memoryKey: ${candidate.memoryKey}`,
      `  memoryKind: ${candidate.memoryKind}`,
      `  memoryStatus: ${candidate.memoryStatus}`,
      `  invalidationIntent: ${candidate.invalidationIntent}`,
      "  sourceLineageRefs:",
      ...formatList(candidate.sourceLineageRefs)
    ];
  }

  return [
    `  sourceClaimEdgeId: ${candidate.sourceClaimEdgeId}`,
    `  fromSourceClaimId: ${candidate.fromSourceClaimId}`,
    `  toSourceClaimId: ${candidate.toSourceClaimId}`,
    `  edgeKind: ${candidate.edgeKind}`,
    "  relationEvidenceRefs:",
    ...formatList(candidate.relationEvidenceRefs)
  ];
};

const formatCandidate = (candidate: BrainHeartbeatCandidate): string[] => [
  `- candidate: ${candidate.id}`,
  `  kind: ${candidate.kind}`,
  `  action: ${candidate.action}`,
  `  nextAction: ${candidate.action}`,
  `  reason: ${candidate.reason}`,
  `  reviewability: ${candidate.reviewability}`,
  "  reviewabilityReasons:",
  ...formatList(candidate.reviewabilityReasons),
  `  summary: ${candidate.summary}`,
  `  applicationGuidance: ${candidate.applicationGuidance}`,
  ...candidateTargetLines(candidate),
  "  evidenceRefs:",
  ...formatList(candidate.evidenceRefs),
  `  doesNotProve: ${candidate.doesNotProve}`,
  `  mutation: ${candidate.mutation}`,
  "  forbiddenWrites:",
  ...formatList(candidate.forbiddenWrites)
];

const formatReviewEvalClosure = (preview: BrainHeartbeatPreview): string[] => [
  "Review/eval closure:",
  `decision: ${preview.reviewEvalClosure.decision}`,
  `nextAction: ${preview.reviewEvalClosure.nextAction}`,
  `summary: ${preview.reviewEvalClosure.summary}`,
  "candidateIds:",
  ...formatList(preview.reviewEvalClosure.candidateIds),
  "evidenceRefs:",
  ...formatList(preview.reviewEvalClosure.evidenceRefs),
  `doesNotProve: ${preview.reviewEvalClosure.doesNotProve}`,
  `mutation: ${preview.reviewEvalClosure.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.reviewEvalClosure.forbiddenWrites)
];

const formatHeartbeatPreview = (
  input: {
    projectId: string;
    memoryRecordCount: number;
    sourceClaimCount: number;
    sourceClaimEdgeCount: number;
    projectResolution: ProjectResolution | undefined;
    preview: BrainHeartbeatPreview;
  }
): string =>
  [
    "KRN Brain Heartbeat Preview",
    "Persistence: read-only (Postgres)",
    "DB writes: none",
    `Project: ${input.projectId}`,
    ...formatProjectResolutionLines(input.projectResolution),
    `Generated at: ${input.preview.generatedAt}`,
    "",
    ...formatReviewEvalClosure(input.preview),
    "",
    "Input readback:",
    `memoryRecords: ${input.memoryRecordCount}`,
    `sourceClaims: ${input.sourceClaimCount}`,
    `sourceClaimEdges: ${input.sourceClaimEdgeCount}`,
    "",
    "Candidate counts:",
    `memoryStaleness: ${input.preview.candidateCounts.memoryStaleness}`,
    `sourceRelation: ${input.preview.candidateCounts.sourceRelation}`,
    `skippedMemoryRecords: ${input.preview.skippedCounts.memoryRecords}`,
    `skippedSourceClaimEdges: ${input.preview.skippedCounts.sourceClaimEdges}`,
    "",
    "Candidates:",
    ...(input.preview.candidates.length === 0
      ? ["- none"]
      : input.preview.candidates.flatMap(formatCandidate)),
    "",
    "Mutation boundary:",
    `mutation: ${input.preview.mutation}`,
    "forbiddenWrites:",
    ...formatList(input.preview.forbiddenWrites),
    "",
    "Proof:",
    `- proves: ${input.preview.proof}`,
    `- doesNotProve: ${input.preview.doesNotProve}`
  ].join("\n");

const jsonOutput = (
  input: {
    projectId: string;
    projectResolution: ProjectResolution | undefined;
    memoryRecordCount: number;
    sourceClaimCount: number;
    sourceClaimEdgeCount: number;
    preview: BrainHeartbeatPreview;
  }
): string => JSON.stringify({
  ...input,
  preview: {
    ...input.preview,
    candidates: input.preview.candidates.map((candidate) => ({
      ...candidate,
      nextAction: candidate.action
    }))
  }
}, null, 2);

export const runHeartbeatPreviewCommand = async (
  runtime: HeartbeatPreviewCommandRuntime
): Promise<HeartbeatPreviewCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn heartbeat preview");
  }

  const createRuntime = runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  const repoPathHint =
    runtime.command.projectId === undefined
      ? await findRepoRoot(runtime.cwd)
      : undefined;
  const databaseRuntime = await createRuntime({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(runtime.command.projectId === undefined ? {} : { projectId: runtime.command.projectId }),
    ...(repoPathHint === undefined ? {} : { repoPathHint }),
    now: runtime.now,
    createId: runtime.createId
  });

  try {
    const projectId = databaseRuntime.projectId as ProjectId;
    const memoryLimit = runtime.command.memoryLimit ?? defaultMemoryLimit;
    const sourceClaimLimit = runtime.command.sourceClaimLimit ?? defaultSourceClaimLimit;
    const memoryRecords =
      await databaseRuntime.memoryRepository.listMemoryRecordsForProject(projectId, memoryLimit);
    const sourceClaims =
      await databaseRuntime.sourceRepository.listClaimsForProject(projectId, sourceClaimLimit);
    const sourceClaimEdges =
      await loadSourceClaimEdges(databaseRuntime.sourceRepository, sourceClaims);
    const preview = buildBrainHeartbeatPreview({
      now: runtime.now(),
      evidenceRef: runtime.command.evidenceRef ?? defaultEvidenceRef,
      memoryRecords,
      sourceClaims,
      sourceClaimEdges,
      ...(runtime.command.nearExpiryDays === undefined
        ? {}
        : { nearExpiryDays: runtime.command.nearExpiryDays }),
      maxCandidates: runtime.command.maxCandidates ?? defaultMaxCandidates
    });
    const output = {
      projectId: databaseRuntime.projectId,
      projectResolution: databaseRuntime.projectResolution,
      memoryRecordCount: memoryRecords.length,
      sourceClaimCount: sourceClaims.length,
      sourceClaimEdgeCount: sourceClaimEdges.length,
      preview
    };

    return {
      stdout:
        runtime.command.format === "json"
          ? jsonOutput(output)
          : formatHeartbeatPreview(output)
    };
  } finally {
    await databaseRuntime.close();
  }
};
