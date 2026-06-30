import {
  readFile
} from "node:fs/promises";

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
  KnowledgeAcquisitionRequest,
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
  findRepoRoot,
  resolveRepoInputFile
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
const defaultAcquisitionConsumer =
  "heartbeat knowledge acquisition preview";
const defaultAcquisitionFalsifier =
  "A source/brain search missing-evidence readback should produce a candidate-only acquisition request without mutating Memory Core.";
const defaultAcquisitionDoesNotProve =
  "Missing-evidence readback does not prove source truth, acquired knowledge quality, ranking quality, crawler readiness, autonomous worker execution, or Memory Core mutation.";

type JsonRecord = Record<string, unknown>;

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseJsonRecord = (raw: string, filePath: string): JsonRecord => {
  let parsed: unknown;

  try {
    const parsedValue: unknown = JSON.parse(raw);

    parsed = parsedValue;
  } catch (error) {
    throw new Error(
      `${filePath} must be valid JSON: ${error instanceof Error ? error.message : "unknown parse error"}`
    );
  }

  if (!isJsonRecord(parsed)) {
    throw new Error(`${filePath} JSON must be an object`);
  }

  return parsed;
};

const recordValue = (value: unknown): JsonRecord | undefined =>
  isJsonRecord(value) ? value : undefined;

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const stringArrayValue = (value: unknown): readonly string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const safeSlug = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug.length === 0 ? "readback" : slug;
};

const uniqueStrings = (values: readonly string[]): readonly string[] =>
  Array.from(new Set(values));

const joinedDoesNotProve = (values: readonly string[]): string =>
  uniqueStrings(values).join(" ") || defaultAcquisitionDoesNotProve;

const buildAcquisitionRequestFromReadback = (
  input: {
    filePath: string;
    readback: JsonRecord;
  }
): KnowledgeAcquisitionRequest[] => {
  const query = stringValue(input.readback["query"]) ?? "unknown query";
  const sourceSearch = recordValue(input.readback["sourceSearch"]);
  const answerPackage = recordValue(input.readback["answerPackage"]);

  if (sourceSearch !== undefined) {
    const missingEvidence = stringArrayValue(sourceSearch["missingEvidence"]);

    if (missingEvidence.length === 0) {
      return [];
    }

    return [
      {
        id: `readback-brain-search-${safeSlug(query)}`,
        source: "brain_search",
        query,
        missingEvidence,
        evidenceRefs: [input.filePath],
        consumer: defaultAcquisitionConsumer,
        falsifier: defaultAcquisitionFalsifier,
        doesNotProve: joinedDoesNotProve([
          ...stringArrayValue(sourceSearch["doesNotProve"]),
          ...stringArrayValue(recordValue(input.readback["proof"])?.["doesNotProve"])
        ])
      }
    ];
  }

  if (answerPackage !== undefined) {
    const missingEvidence = stringArrayValue(answerPackage["missingEvidence"]);

    if (missingEvidence.length === 0) {
      return [];
    }

    return [
      {
        id: `readback-source-search-${safeSlug(query)}`,
        source: "source_search",
        query,
        missingEvidence,
        evidenceRefs: [input.filePath],
        consumer: defaultAcquisitionConsumer,
        falsifier: defaultAcquisitionFalsifier,
        doesNotProve: joinedDoesNotProve([
          ...stringArrayValue(answerPackage["doesNotProve"]),
          ...stringArrayValue(recordValue(input.readback["proof"])?.["doesNotProve"])
        ])
      }
    ];
  }

  return [];
};

const loadKnowledgeAcquisitionRequests = async (
  cwd: string,
  acquisitionReadbackFile: string | undefined
): Promise<KnowledgeAcquisitionRequest[]> => {
  if (acquisitionReadbackFile === undefined) {
    return [];
  }

  const resolvedPath = await resolveRepoInputFile(cwd, acquisitionReadbackFile);
  const raw = await readFile(resolvedPath, "utf8");
  const readback = parseJsonRecord(raw, acquisitionReadbackFile);

  return buildAcquisitionRequestFromReadback({
    filePath: acquisitionReadbackFile,
    readback
  });
};

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

  if (candidate.kind === "source_relation_maintenance_candidate") {
    return [
    `  sourceClaimEdgeId: ${candidate.sourceClaimEdgeId}`,
    `  fromSourceClaimId: ${candidate.fromSourceClaimId}`,
    `  toSourceClaimId: ${candidate.toSourceClaimId}`,
    `  edgeKind: ${candidate.edgeKind}`,
    "  relationEvidenceRefs:",
    ...formatList(candidate.relationEvidenceRefs),
    `  relationEvidenceRequest: ${candidate.relationEvidenceRequest}`
    ];
  }

  return [
    `  requestId: ${candidate.requestId}`,
    `  source: ${candidate.source}`,
    `  query: ${candidate.query}`,
    "  missingEvidence:",
    ...formatList(candidate.missingEvidence),
    `  acquisitionEvidenceRequest: ${candidate.acquisitionEvidenceRequest}`,
    `  consumer: ${candidate.consumer}`,
    `  falsifier: ${candidate.falsifier}`
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

const formatRuntimeLoop = (preview: BrainHeartbeatPreview): string[] => [
  "Runtime loop:",
  `mode: ${preview.runtimeLoop.mode}`,
  `status: ${preview.runtimeLoop.status}`,
  `nextAction: ${preview.runtimeLoop.nextAction}`,
  `summary: ${preview.runtimeLoop.summary}`,
  `inspectedCandidates: ${preview.runtimeLoop.inspectedCandidates}`,
  `reviewableCandidates: ${preview.runtimeLoop.reviewableCandidates}`,
  `doesNotProve: ${preview.runtimeLoop.doesNotProve}`,
  `mutation: ${preview.runtimeLoop.mutation}`,
  "forbiddenWrites:",
  ...formatList(preview.runtimeLoop.forbiddenWrites)
];

const formatCandidateReviewResult = (preview: BrainHeartbeatPreview): string[] => {
  if (preview.candidateReviewResult === undefined) {
    return [];
  }

  return [
    "Candidate review result:",
    `candidateId: ${preview.candidateReviewResult.candidateId}`,
    `candidateFound: ${preview.candidateReviewResult.candidateFound}`,
    `decision: ${preview.candidateReviewResult.decision}`,
    `nextAction: ${preview.candidateReviewResult.nextAction}`,
    `reason: ${preview.candidateReviewResult.reason}`,
    ...(preview.candidateReviewResult.reviewer === undefined
      ? []
      : [`reviewer: ${preview.candidateReviewResult.reviewer}`]),
    ...(preview.candidateReviewResult.candidateReviewability === undefined
      ? []
      : [`candidateReviewability: ${preview.candidateReviewResult.candidateReviewability}`]),
    "evidenceRefs:",
    ...formatList(preview.candidateReviewResult.evidenceRefs),
    `doesNotProve: ${preview.candidateReviewResult.doesNotProve}`,
    `mutation: ${preview.candidateReviewResult.mutation}`,
    "forbiddenWrites:",
    ...formatList(preview.candidateReviewResult.forbiddenWrites)
  ];
};

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
    ...formatRuntimeLoop(input.preview),
    ...(input.preview.candidateReviewResult === undefined
      ? []
      : ["", ...formatCandidateReviewResult(input.preview)]),
    "",
    "Input readback:",
    `memoryRecords: ${input.memoryRecordCount}`,
    `sourceClaims: ${input.sourceClaimCount}`,
    `sourceClaimEdges: ${input.sourceClaimEdgeCount}`,
    "",
    "Candidate counts:",
    `memoryStaleness: ${input.preview.candidateCounts.memoryStaleness}`,
    `sourceRelation: ${input.preview.candidateCounts.sourceRelation}`,
    `knowledgeAcquisition: ${input.preview.candidateCounts.knowledgeAcquisition}`,
    `skippedMemoryRecords: ${input.preview.skippedCounts.memoryRecords}`,
    `skippedSourceClaimEdges: ${input.preview.skippedCounts.sourceClaimEdges}`,
    `skippedKnowledgeAcquisitionRequests: ${input.preview.skippedCounts.knowledgeAcquisitionRequests}`,
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
    const knowledgeAcquisitionRequests = await loadKnowledgeAcquisitionRequests(
      runtime.cwd,
      runtime.command.acquisitionReadbackFile
    );
    const preview = buildBrainHeartbeatPreview({
      now: runtime.now(),
      evidenceRef: runtime.command.evidenceRef ?? defaultEvidenceRef,
      memoryRecords,
      sourceClaims,
      sourceClaimEdges,
      ...(knowledgeAcquisitionRequests.length === 0
        ? {}
        : { knowledgeAcquisitionRequests }),
      ...(runtime.command.candidateReview === undefined
        ? {}
        : { candidateReview: runtime.command.candidateReview }),
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
