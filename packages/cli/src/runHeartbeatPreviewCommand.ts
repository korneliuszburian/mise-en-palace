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
  KnowledgeAcquisitionRequest,
  ConsensusCandidateEvaluationInput
} from "@krn/workers";

import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
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
  formatHeartbeatPreview,
  jsonHeartbeatPreviewOutput
} from "./heartbeatPreviewFormat.js";
import {
  loadConsensusCandidateInputs,
  loadKnowledgeAcquisitionRequests
} from "./heartbeatPreviewReadback.js";
import type {
  BaseCommandRuntime
} from "./commandRuntimeSupport.js";
import type {
  CliCommand
} from "./parseArgs.js";

export type HeartbeatPreviewCommand = Extract<CliCommand, { kind: "heartbeatPreview" }>;
type HeartbeatCandidateKind = NonNullable<HeartbeatPreviewCommand["candidateKinds"]>[number];

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

export interface HeartbeatPreviewCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: HeartbeatPreviewCommand;
  createDatabaseRuntime?: CreateHeartbeatPreviewDatabaseRuntime;
}

export interface HeartbeatPreviewCommandResult {
  stdout: string;
}

const defaultMemoryLimit = 50;
const defaultSourceClaimLimit = 50;
const defaultMaxCandidates = 10;
const defaultEvidenceRef =
  "krn heartbeat preview operator readback";
const defaultCandidateKinds = [
  "memory_staleness",
  "source_relation",
  "knowledge_acquisition",
  "consensus_evaluation"
] as const satisfies readonly HeartbeatCandidateKind[];

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

const includesCandidateKind = (
  candidateKinds: readonly HeartbeatCandidateKind[],
  candidateKind: HeartbeatCandidateKind
): boolean => candidateKinds.includes(candidateKind);

const selectedCandidateKinds = (
  command: HeartbeatPreviewCommand
): readonly HeartbeatCandidateKind[] =>
  command.candidateKinds ?? defaultCandidateKinds;

const loadMemoryRecordsForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    projectId: ProjectId;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<MemoryRecord[]> =>
  includesCandidateKind(input.candidateKinds, "memory_staleness")
    ? input.databaseRuntime.memoryRepository.listMemoryRecordsForProject(
      input.projectId,
      input.command.memoryLimit ?? defaultMemoryLimit
    )
    : [];

const loadSourceClaimsForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    projectId: ProjectId;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<SourceClaim[]> =>
  includesCandidateKind(input.candidateKinds, "source_relation")
    ? input.databaseRuntime.sourceRepository.listClaimsForProject(
      input.projectId,
      input.command.sourceClaimLimit ?? defaultSourceClaimLimit
    )
    : [];

const loadSourceClaimEdgesForPreview = async (
  input: {
    databaseRuntime: HeartbeatPreviewDatabaseRuntime;
    sourceClaims: readonly SourceClaim[];
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<SourceClaimEdge[]> =>
  includesCandidateKind(input.candidateKinds, "source_relation")
    ? loadSourceClaimEdges(input.databaseRuntime.sourceRepository, input.sourceClaims)
    : [];

const loadKnowledgeAcquisitionRequestsForPreview = async (
  input: {
    cwd: string;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<KnowledgeAcquisitionRequest[]> =>
  includesCandidateKind(input.candidateKinds, "knowledge_acquisition")
    ? loadKnowledgeAcquisitionRequests(
      input.cwd,
      input.command.acquisitionReadbackFile
    )
    : [];

const loadConsensusCandidatesForPreview = async (
  input: {
    cwd: string;
    command: HeartbeatPreviewCommand;
    candidateKinds: readonly HeartbeatCandidateKind[];
  }
): Promise<ConsensusCandidateEvaluationInput[]> =>
  includesCandidateKind(input.candidateKinds, "consensus_evaluation")
    ? loadConsensusCandidateInputs(
      input.cwd,
      input.command.consensusCandidateFile
    )
    : [];

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
    const candidateKinds = selectedCandidateKinds(runtime.command);
    const memoryRecords = await loadMemoryRecordsForPreview({
      databaseRuntime,
      projectId,
      command: runtime.command,
      candidateKinds
    });
    const sourceClaims = await loadSourceClaimsForPreview({
      databaseRuntime,
      projectId,
      command: runtime.command,
      candidateKinds
    });
    const sourceClaimEdges = await loadSourceClaimEdgesForPreview({
      databaseRuntime,
      sourceClaims,
      candidateKinds
    });
    const knowledgeAcquisitionRequests = await loadKnowledgeAcquisitionRequestsForPreview({
      cwd: runtime.cwd,
      command: runtime.command,
      candidateKinds
    });
    const consensusCandidates = await loadConsensusCandidatesForPreview({
      cwd: runtime.cwd,
      command: runtime.command,
      candidateKinds
    });
    const preview = buildBrainHeartbeatPreview({
      now: runtime.now(),
      evidenceRef: runtime.command.evidenceRef ?? defaultEvidenceRef,
      memoryRecords,
      sourceClaims,
      sourceClaimEdges,
      ...(knowledgeAcquisitionRequests.length === 0
        ? {}
        : { knowledgeAcquisitionRequests }),
      ...(consensusCandidates.length === 0
        ? {}
        : { consensusCandidates }),
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
      candidateKinds,
      preview
    };

    return {
      stdout:
        runtime.command.format === "json"
          ? jsonHeartbeatPreviewOutput(output)
          : formatHeartbeatPreview(output)
    };
  } finally {
    await databaseRuntime.close();
  }
};
