import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleObservationRepository,
  DrizzleProjectRepository,
  DrizzleReflectionRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "@krn/db/adapters";
import type {
  CreateObservationGroupInput,
  CreateObservationItemInput,
  CreateReflectionRecordInput
} from "@krn/db/adapters";
import type {
  HarnessCompilerDependencies
} from "@krn/harness";
import type {
  HarnessRunRepository,
  MemoryRepository,
  ProjectKernelRecord,
  RepoInstallationRecord,
  SourceRepository
} from "@krn/harness/repositories/internal";
import type {
  ObservationGroup,
  ObservationItem,
  ReflectionRecord,
  SourceClaim,
  AntiMemoryRecord
} from "@krn/core";

export interface DatabaseRuntimeInput {
  databaseUrl: string;
  workspaceSlug: string;
  projectSlug: string;
  projectId?: string;
  repoPathHint?: string;
  now(): string;
  createId(prefix: string): string;
}

export type ProjectResolutionKind =
  | "explicit_project"
  | "connected_repo_path"
  | "workspace_project_slug";

export interface ProjectResolution {
  kind: ProjectResolutionKind;
  reason: string;
  doesNotProve: string;
  repoPathHint?: string;
}

export interface DatabaseRuntime {
  workspaceId: string;
  projectId: string;
  projectResolution?: ProjectResolution;
  projectKernel?: ProjectKernelRecord;
  repoInstallations?: RepoInstallationRecord[];
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository: Pick<
    HarnessRunRepository,
    | "createExecutionRun"
    | "getHarnessRunByExecutionRunId"
    | "createEvidenceBundle"
    | "createReviewAssessment"
    | "createFeedbackDelta"
  >;
  sourceRepository: Pick<
    SourceRepository,
    | "createSourceArtifact"
    | "createSourceClaim"
    | "getSourceClaimById"
    | "createSourceDecisionEdge"
    | "createSourceRejection"
  >;
  memoryRepository: Pick<
    MemoryRepository,
    | "createMemoryCandidate"
    | "getMemoryCandidateById"
    | "promoteReviewedMemoryCandidate"
    | "rejectMemoryCandidate"
    | "getMemoryRecordById"
    | "invalidateMemoryRecord"
    | "recordMemoryApplication"
    | "createMemoryFeedbackEvent"
    | "createAntiMemoryCandidate"
    | "getAntiMemoryCandidateById"
    | "promoteReviewedAntiMemoryCandidate"
    | "rejectAntiMemoryCandidate"
  >;
  observationRepository?: {
    createGroup(input: CreateObservationGroupInput): Promise<ObservationGroup>;
    addItems(
      groupId: string,
      inputs: CreateObservationItemInput[]
    ): Promise<ObservationItem[]>;
  };
  close(): Promise<void>;
}

export interface ObserveDatabaseRuntimeInput {
  databaseUrl: string;
}

interface ObserveProjectRuntime {
  workspaceId: string;
  projectId: string;
  observationRepository: {
    createGroup(input: CreateObservationGroupInput): Promise<ObservationGroup>;
    addItems(
      groupId: string,
      inputs: CreateObservationItemInput[]
    ): Promise<ObservationItem[]>;
  };
}

export interface ObserveDatabaseRuntime {
  harnessRunRepository: Pick<
    HarnessRunRepository,
    "getHarnessRunByExecutionRunId"
  >;
  resolveProjectRuntime(input: { projectId: string }): Promise<ObserveProjectRuntime>;
  close(): Promise<void>;
}

export interface ReflectDatabaseRuntimeInput {
  databaseUrl: string;
}

export interface ReviewAssessDatabaseRuntimeInput {
  databaseUrl: string;
}

export interface ReviewAssessDatabaseRuntime {
  harnessRunRepository: Pick<
    HarnessRunRepository,
    | "createReviewAssessment"
    | "createFeedbackDelta"
  >;
  close(): Promise<void>;
}

interface ReflectRunSnapshot {
  executionRunId: string;
  projectId: string;
  taskContractId?: string;
}

export interface ReflectDatabaseRuntime {
  getRunSnapshot(executionRunId: string): Promise<ReflectRunSnapshot | undefined>;
  projectExists(projectId: string): Promise<boolean>;
  observationRepository: {
    findByRun(executionRunId: string, options?: { projectId?: string; limit?: number }): Promise<ObservationItem[]>;
    findByScope(input: { projectId?: string; executionRunId?: string; taskContractId?: string; limit?: number }): Promise<ObservationItem[]>;
  };
  sourceRepository: {
    listClaimsForProject(projectId: string, limit: number): Promise<SourceClaim[]>;
    listSourceClaimsForRun(executionRunId: string): Promise<SourceClaim[]>;
  };
  memoryRepository: {
    listAntiMemoryForProject(projectId: string, limit: number): Promise<AntiMemoryRecord[]>;
    listAntiMemoryForRun(executionRunId: string): Promise<AntiMemoryRecord[]>;
  };
  reflectionRepository: {
    createReflectionRecord(input: CreateReflectionRecordInput): Promise<ReflectionRecord>;
  };
  close(): Promise<void>;
}

export const createDatabaseRuntime = async (
  input: DatabaseRuntimeInput
): Promise<DatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const sourceRepository = new DrizzleSourceRepository(db);
  const memoryRepository = new DrizzleMemoryRepository(db);
  const observationRepository = new DrizzleObservationRepository(db);
  const explicitProjectId = input.projectId?.trim();
  const repoPathHint = input.repoPathHint?.trim();
  const project =
    explicitProjectId === undefined || explicitProjectId.length === 0
      ? undefined
      : await projectRepository.getProject(explicitProjectId);
  const connectedProject =
    project === undefined && repoPathHint !== undefined && repoPathHint.length > 0
      ? await projectRepository.getProjectByRepoPath(repoPathHint)
      : undefined;

  if (explicitProjectId !== undefined && explicitProjectId.length > 0 && project === undefined) {
    await client.end();
    throw new Error(`Project not found for --project ${explicitProjectId}`);
  }

  const existingWorkspace =
    project === undefined && connectedProject === undefined
      ? await projectRepository.findWorkspaceBySlug(input.workspaceSlug)
      : undefined;
  const workspace =
    project === undefined && connectedProject === undefined
      ? existingWorkspace ??
        (await projectRepository.createWorkspace({
          slug: input.workspaceSlug,
          displayName: input.workspaceSlug
        }))
      : undefined;
  const defaultProject =
    project ?? connectedProject ??
    (workspace !== undefined
      ? (await projectRepository.findProjectBySlug(workspace.id, input.projectSlug)) ??
        (await projectRepository.createProject({
          workspaceId: workspace.id,
          slug: input.projectSlug,
          displayName: input.projectSlug
        }))
      : undefined);

  if (defaultProject === undefined) {
    await client.end();
    throw new Error("Unable to resolve project for database runtime");
  }

  const projectResolution: ProjectResolution =
    project !== undefined
      ? {
          kind: "explicit_project",
          reason: "Resolved from explicit --project.",
          doesNotProve:
            "Explicit project resolution does not prove the project read model is complete, current, or useful."
        }
      : connectedProject !== undefined
        ? {
            kind: "connected_repo_path",
            reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
            doesNotProve:
              "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
            ...(repoPathHint === undefined ? {} : { repoPathHint })
          }
        : {
            kind: "workspace_project_slug",
            reason: "Resolved from workspace/project slug fallback.",
            doesNotProve:
              "Slug fallback resolution does not prove this is the intended connected repo project."
          };

  const shouldLoadProjectScopedMetadata =
    explicitProjectId !== undefined && explicitProjectId.length > 0 ||
    connectedProject !== undefined;
  const projectKernel =
    shouldLoadProjectScopedMetadata
      ? await projectRepository.getLatestProjectKernel(defaultProject.id)
      : undefined;

  if (explicitProjectId !== undefined && explicitProjectId.length > 0 && projectKernel === undefined) {
    await client.end();
    throw new Error(`ProjectKernel not found for --project ${explicitProjectId}`);
  }

  const repoInstallations =
    shouldLoadProjectScopedMetadata
      ? await projectRepository.listRepoInstallationsForProject(defaultProject.id)
      : undefined;

  return {
    workspaceId: defaultProject.workspaceId,
    projectId: defaultProject.id,
    projectResolution,
    ...(projectKernel === undefined ? {} : { projectKernel }),
    ...(repoInstallations === undefined ? {} : { repoInstallations }),
    compilerDependencies: {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository: new DrizzleRetrievalRepository(db),
      now: input.now,
      createId: input.createId
    },
    harnessRunRepository,
    sourceRepository,
    memoryRepository,
    observationRepository,
    async close(): Promise<void> {
      await client.end();
    }
  };
};

export const createObserveDatabaseRuntime = async (
  input: ObserveDatabaseRuntimeInput
): Promise<ObserveDatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const observationRepository = new DrizzleObservationRepository(db);

  return {
    harnessRunRepository,
    async resolveProjectRuntime(projectInput: { projectId: string }): Promise<ObserveProjectRuntime> {
      const projectId = projectInput.projectId.trim();

      if (projectId.length === 0) {
        throw new Error("Project ID is required for krn observe --run");
      }

      const project = await projectRepository.getProject(projectId);

      if (project === undefined) {
        throw new Error(`Project not found for --project ${projectId}`);
      }

      return {
        workspaceId: project.workspaceId,
        projectId: project.id,
        observationRepository
      };
    },
    async close(): Promise<void> {
      await client.end();
    }
  };
};

export const createReflectDatabaseRuntime = async (
  input: ReflectDatabaseRuntimeInput
): Promise<ReflectDatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const observationRepository = new DrizzleObservationRepository(db);
  const sourceRepository = new DrizzleSourceRepository(db);
  const memoryRepository = new DrizzleMemoryRepository(db);
  const reflectionRepository = new DrizzleReflectionRepository(db);

  return {
    async getRunSnapshot(executionRunId: string): Promise<ReflectRunSnapshot | undefined> {
      const aggregate = await harnessRunRepository.getHarnessRunByExecutionRunId(executionRunId);

      if (aggregate === undefined) {
        return undefined;
      }

      const projectId = aggregate.taskContract.projectId ?? aggregate.operatorIntent.projectId;

      if (projectId === undefined) {
        throw new Error(
          `Persisted run ${executionRunId} has no project scope; use project:<project-id> reflect scope`
        );
      }

      return {
        executionRunId: aggregate.executionRun.id,
        projectId,
        taskContractId: aggregate.taskContract.id
      };
    },
    async projectExists(projectId: string): Promise<boolean> {
      return (await projectRepository.getProject(projectId)) !== undefined;
    },
    observationRepository: {
      findByRun: (...args) => observationRepository.findByRun(...args),
      findByScope: (...args) => observationRepository.findByScope(...args)
    },
    sourceRepository: {
      listClaimsForProject: (...args) => sourceRepository.listClaimsForProject(...args),
      listSourceClaimsForRun: (...args) => sourceRepository.listSourceClaimsForRun(...args)
    },
    memoryRepository: {
      listAntiMemoryForProject: (...args) => memoryRepository.listAntiMemoryForProject(...args),
      listAntiMemoryForRun: (...args) => memoryRepository.listAntiMemoryForRun(...args)
    },
    reflectionRepository: {
      createReflectionRecord: (...args) => reflectionRepository.createReflectionRecord(...args)
    },
    async close(): Promise<void> {
      await client.end();
    }
  };
};

export const createReviewAssessDatabaseRuntime = async (
  input: ReviewAssessDatabaseRuntimeInput
): Promise<ReviewAssessDatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });
  const db = createKrnDatabase(client);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);

  return {
    harnessRunRepository,
    async close(): Promise<void> {
      await client.end();
    }
  };
};
