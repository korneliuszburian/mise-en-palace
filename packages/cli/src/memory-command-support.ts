import type {
  ReflectionCandidateEvidence,
  ReflectionCandidateEvidenceProvenance,
  SourceLineageRef
} from "@krn/core";
import {
  parseMemoryPromotionInput
} from "@krn/core";
import {
  openMemoryLifecycleStore,
  parseBackendKind,
  resolveBackendConfig
} from "@krn/db";
import type {
  MemoryLifecycleStore
} from "@krn/db";
import type {
  MemoryRepository
} from "@krn/core/repositories/internal";

import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput
} from "./database-runtime.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  resolveTargetWorkspace
} from "./target-workspace.js";

export type CreateMemoryCommandDatabaseRuntime = (
  input: DatabaseRuntimeInput
) => Promise<DatabaseRuntime>;

export interface MemoryCommandDatabaseRuntimeInput extends BaseCommandRuntime {
  cwd?: string;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryLifecycleCommandRuntime {
  readonly backend: "sqlite" | "postgres";
  readonly persistenceLabel: string;
  readonly projectId?: string;
  readonly memoryRepository: Pick<MemoryRepository,
    "createMemoryCandidate" | "getMemoryCandidateById" | "promoteReviewedMemoryCandidate"
  > & Partial<Pick<
    MemoryRepository,
    "applyReviewedMemoryRevision"
  >>;
  readonly sourceRepository: Pick<MemoryLifecycleStore["sourceRepository"], "getSourceClaimById"> & {
    getSourceClaimForProject?: MemoryLifecycleStore["sourceRepository"]["getSourceClaimForProject"];
  };
  resolveExecutionRunProjectId(executionRunId: string): Promise<string | undefined>;
  close(): Promise<void>;
}

interface CandidateEvidenceInput {
  provenance: string | undefined;
  evidenceRefs: readonly string[];
  doesNotProve: string | undefined;
}

interface SourceLineageInput {
  sourceId: string;
  note?: string | undefined;
}

interface ReviewedSourceClaim {
  id: string;
}

interface RejectedMemoryReviewInput {
  candidateId?: string | undefined;
  reviewer?: string | undefined;
  reason?: string | undefined;
  metadata: Record<string, string>;
}

interface MemoryReviewWithOptionalRejectionReason {
  rejectionReason?: string | undefined;
}


const candidateEvidenceProvenances = new Set<string>([
  "default_template",
  "operator_reported",
  "captured_output_file",
  "command_runner",
  "external_log",
  "run_event",
  "source_chunk",
  "tool_trace",
  "diff",
  "evidence_bundle",
  "review_assessment",
  "feedback_delta",
  "user_correction",
  "user_preference",
  "local_operator_note",
  "source_claim"
]);

const isCandidateEvidenceProvenance = (
  value: string
): value is ReflectionCandidateEvidenceProvenance =>
  candidateEvidenceProvenances.has(value);

export const buildReflectionCandidateEvidence = (
  input: CandidateEvidenceInput
): ReflectionCandidateEvidence | undefined => {
  const provenance = input.provenance?.trim();
  const evidenceRefs = input.evidenceRefs
    .map((evidenceRef) => evidenceRef.trim())
    .filter((evidenceRef) => evidenceRef.length > 0);
  const doesNotProve = input.doesNotProve?.trim();
  const evidenceInputProvided =
    provenance !== undefined ||
    input.evidenceRefs.length > 0 ||
    doesNotProve !== undefined;

  if (!evidenceInputProvided) {
    return undefined;
  }

  if (provenance === undefined || provenance.length === 0) {
    throw new Error("--candidate-evidence-provenance is required when candidate evidence is supplied");
  }

  if (!isCandidateEvidenceProvenance(provenance)) {
    throw new Error(`Unsupported candidate evidence provenance: ${provenance}`);
  }

  if (evidenceRefs.length === 0) {
    throw new Error("--candidate-evidence-ref is required when candidate evidence is supplied");
  }

  if (doesNotProve === undefined || doesNotProve.length === 0) {
    throw new Error("--candidate-evidence-does-not-prove is required when candidate evidence is supplied");
  }

  return {
    provenance,
    evidenceRefs,
    doesNotProve
  };
};

export const toSourceLineageRefs = (
  sourceLineageItems: readonly SourceLineageInput[]
): SourceLineageRef[] =>
  sourceLineageItems.map((item) => ({
    sourceId: item.sourceId,
    ...(item.note === undefined ? {} : { note: item.note })
  }));

export const toReviewedSourceClaimIds = (
  sourceClaims: readonly ReviewedSourceClaim[]
): string[] => sourceClaims.map((sourceClaim) => sourceClaim.id);

export const buildRejectedMemoryPromotionInput = (
  input: RejectedMemoryReviewInput
): ReturnType<typeof parseMemoryPromotionInput> =>
  parseMemoryPromotionInput({
    candidateId: input.candidateId,
    reviewer: input.reviewer,
    decision: "rejected",
    rejectionReason: input.reason,
    metadata: input.metadata
  });

export const requireMemoryReviewRejectionReason = (
  review: MemoryReviewWithOptionalRejectionReason
): string => {
  if (review.rejectionReason === undefined) {
    throw new Error("rejectionReason is required when decision is rejected");
  }

  return review.rejectionReason;
};

export const createMemoryCommandDatabaseRuntime = async (
  runtime: MemoryCommandDatabaseRuntimeInput,
  missingDatabaseUrlMessage: string,
  projectId?: string
): Promise<DatabaseRuntime> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDatabaseUrlMessage);
  }

  const createDatabase = runtime.createDatabaseRuntime ?? createDatabaseRuntime;

  return createDatabase({
    databaseUrl,
    workspaceSlug: defaultWorkspaceSlug,
    projectSlug: defaultProjectSlug,
    ...(projectId === undefined ? {} : { projectId }),
    now: runtime.now,
    createId: runtime.createId
  });
};

const legacyMemoryLifecycleRuntime = async (
  runtime: MemoryCommandDatabaseRuntimeInput,
  missingDatabaseUrlMessage: string
): Promise<MemoryLifecycleCommandRuntime> => {
  const databaseRuntime = await createMemoryCommandDatabaseRuntime(
    runtime,
    missingDatabaseUrlMessage
  );
  const sourceRepository = databaseRuntime.sourceRepository;
  const scopedReader = sourceRepository.getSourceClaimForProject;

  return {
    backend: "postgres",
    persistenceLabel: "Postgres",
    projectId: databaseRuntime.projectId,
    memoryRepository: databaseRuntime.memoryRepository,
    sourceRepository: {
      getSourceClaimById: sourceRepository.getSourceClaimById.bind(sourceRepository),
      ...(scopedReader === undefined
        ? {}
        : { getSourceClaimForProject: scopedReader.bind(sourceRepository) })
    },
    async resolveExecutionRunProjectId(executionRunId: string): Promise<string | undefined> {
      const run = await databaseRuntime.harnessRunRepository.getHarnessRunByExecutionRunId(
        executionRunId
      );
      return run?.taskContract.projectId ?? run?.operatorIntent.projectId ?? databaseRuntime.projectId;
    },
    close: databaseRuntime.close
  };
};

export const createMemoryLifecycleCommandRuntime = async (
  runtime: MemoryCommandDatabaseRuntimeInput,
  missingDatabaseUrlMessage: string,
  options: { readonly requireConnectedProject?: boolean } = {}
): Promise<MemoryLifecycleCommandRuntime> => {
  // Runtime injection is the established PostgreSQL test seam and remains behavior-compatible.
  if (runtime.createDatabaseRuntime !== undefined) {
    return legacyMemoryLifecycleRuntime(runtime, missingDatabaseUrlMessage);
  }

  const selectedBackend = parseBackendKind(runtime.env.KRN_DB_BACKEND) ?? "sqlite";
  if (selectedBackend === "postgres") {
    return legacyMemoryLifecycleRuntime(runtime, missingDatabaseUrlMessage);
  }

  const targetWorkspace = await resolveTargetWorkspace({
    cwd: runtime.cwd ?? process.cwd(),
    env: runtime.env
  });
  const config = resolveBackendConfig({
    backend: "sqlite",
    env: runtime.env,
    targetWorkspace
  });
  if (config.kind !== "sqlite") {
    throw new Error("SQLite memory command resolved a non-SQLite backend");
  }

  const store = await openMemoryLifecycleStore(config);
  const project = await store.projectRepository.getProjectByRepoPath(targetWorkspace);

  if (options.requireConnectedProject === true && project === undefined) {
    await store.close();
    throw new Error(
      `No SQLite project is connected for target workspace ${targetWorkspace}; run krn init --connect --repo ${targetWorkspace} --persist first`
    );
  }

  return {
    backend: store.backend,
    persistenceLabel: store.persistenceLabel,
    ...(project === undefined ? {} : { projectId: project.id }),
    memoryRepository: store.memoryRepository,
    sourceRepository: store.sourceRepository,
    resolveExecutionRunProjectId: store.resolveExecutionRunProjectId,
    close: store.close
  };
};

export const assertSourceClaimExists = async (
  runtime: DatabaseRuntime,
  sourceClaimId: string,
  projectId?: string
): Promise<void> => {
  const sourceClaim = projectId !== undefined && runtime.sourceRepository.getSourceClaimForProject !== undefined
    ? await runtime.sourceRepository.getSourceClaimForProject(projectId, sourceClaimId)
    : await runtime.sourceRepository.getSourceClaimById(sourceClaimId);

  if (sourceClaim === undefined) {
    throw new Error(`SourceClaim not found: ${sourceClaimId}`);
  }
};

export const assertAntiMemoryCandidateProject = async (
  runtime: DatabaseRuntime,
  candidateId: string,
  projectId: string | undefined
) => {
  const candidate = await runtime.memoryRepository.getAntiMemoryCandidateById(candidateId);

  if (candidate === undefined) {
    throw new Error(`Anti-memory candidate not found: ${candidateId}`);
  }
  if (projectId !== undefined && candidate.projectId !== projectId) {
    throw new Error(`--project ${projectId} does not match candidate project ${candidate.projectId}`);
  }

  return candidate;
};
