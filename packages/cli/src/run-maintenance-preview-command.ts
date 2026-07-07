import type {
  MemoryRecord,
  ProjectId,
  SourceClaim,
  SourceClaimEdge,
  SourceClaimEdgeId
} from "@krn/core";
import {
  buildMaintenancePreview
} from "@krn/maintenance-preview";
import type {
  KnowledgeAcquisitionRequest,
  ConsensusCandidateEvaluationInput
} from "@krn/maintenance-preview";

import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntimeInput,
  ProjectResolution
} from "./database-runtime.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  formatMaintenancePreview,
  jsonMaintenancePreviewOutput
} from "./maintenance-preview-format.js";
import {
  loadConsensusCandidateInputs,
  loadKnowledgeAcquisitionRequests
} from "./maintenance-preview-readback.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import type {
  CliCommand
} from "./parse-args.js";

export type MaintenancePreviewCommand = Extract<CliCommand, { kind: "maintenancePreview" }>;
type MaintenanceCandidateKind = NonNullable<MaintenancePreviewCommand["candidateKinds"]>[number];

interface MaintenancePreviewDatabaseRuntime {
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

export type CreateMaintenancePreviewDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<MaintenancePreviewDatabaseRuntime>;

export interface MaintenancePreviewCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: MaintenancePreviewCommand;
  createDatabaseRuntime?: CreateMaintenancePreviewDatabaseRuntime;
}

export interface MaintenancePreviewCommandResult {
  stdout: string;
}

const defaultMemoryLimit = 50;
const defaultSourceClaimLimit = 50;
const defaultMaxCandidates = 10;
const defaultEvidenceRef =
  "krn maintenance preview operator readback";
const defaultCandidateKinds = [
  "memory_staleness",
  "source_relation",
  "knowledge_acquisition",
  "consensus_evaluation"
] as const satisfies readonly MaintenanceCandidateKind[];

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
  sourceRepository: MaintenancePreviewDatabaseRuntime["sourceRepository"],
  sourceClaims: readonly SourceClaim[]
): Promise<SourceClaimEdge[]> => {
  const edges = await Promise.all(sourceClaims.map((sourceClaim) =>
    sourceRepository.listSourceClaimEdgesForClaim(sourceClaim.id)
  ));

  return uniqueSourceClaimEdges(edges.flat());
};

const includesCandidateKind = (
  candidateKinds: readonly MaintenanceCandidateKind[],
  candidateKind: MaintenanceCandidateKind
): boolean => candidateKinds.includes(candidateKind);

const selectedCandidateKinds = (
  command: MaintenancePreviewCommand
): readonly MaintenanceCandidateKind[] =>
  command.candidateKinds ?? defaultCandidateKinds;

const loadMemoryRecordsForPreview = async (
  input: {
    databaseRuntime: MaintenancePreviewDatabaseRuntime;
    projectId: ProjectId;
    command: MaintenancePreviewCommand;
    candidateKinds: readonly MaintenanceCandidateKind[];
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
    databaseRuntime: MaintenancePreviewDatabaseRuntime;
    projectId: ProjectId;
    command: MaintenancePreviewCommand;
    candidateKinds: readonly MaintenanceCandidateKind[];
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
    databaseRuntime: MaintenancePreviewDatabaseRuntime;
    sourceClaims: readonly SourceClaim[];
    candidateKinds: readonly MaintenanceCandidateKind[];
  }
): Promise<SourceClaimEdge[]> =>
  includesCandidateKind(input.candidateKinds, "source_relation")
    ? loadSourceClaimEdges(input.databaseRuntime.sourceRepository, input.sourceClaims)
    : [];

const loadKnowledgeAcquisitionRequestsForPreview = async (
  input: {
    cwd: string;
    command: MaintenancePreviewCommand;
    candidateKinds: readonly MaintenanceCandidateKind[];
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
    command: MaintenancePreviewCommand;
    candidateKinds: readonly MaintenanceCandidateKind[];
  }
): Promise<ConsensusCandidateEvaluationInput[]> =>
  includesCandidateKind(input.candidateKinds, "consensus_evaluation")
    ? loadConsensusCandidateInputs(
      input.cwd,
      input.command.consensusCandidateFile
    )
    : [];

export const runMaintenancePreviewCommand = async (
  runtime: MaintenancePreviewCommandRuntime
): Promise<MaintenancePreviewCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error("KRN_DATABASE_URL is required for krn maintenance preview");
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
    const preview = buildMaintenancePreview({
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
          ? jsonMaintenancePreviewOutput(output)
          : formatMaintenancePreview(output)
    };
  } finally {
    await databaseRuntime.close();
  }
};
