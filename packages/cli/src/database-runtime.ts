import postgres from "postgres";
import {
  createKrnDatabase,
  sql
} from "@krn/db";
import {
  DrizzleHarnessRunRepository,
  DrizzleMaintenanceQueueRepository,
  DrizzleMemoryRepository,
  DrizzleObservationRepository,
  DrizzleProjectRepository,
  DrizzleReflectionRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceDecisionImportRepository,
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
  FeedbackDeltaLookupRepository,
  HarnessRunRepository,
  MemoryRepository,
  ProjectRecord,
  ProjectKernelRecord,
  ProjectRepository,
  RepoInstallationRecord,
  RetrievalRepository,
  SearchDocumentRecord,
  SourceDecisionImportRepository,
  SourceRepository,
  WorkspaceRecord
} from "@krn/core/repositories/internal";
import type {
  ObservationGroup,
  ObservationItem,
  ReflectionRecord,
  SourceClaim,
  AntiMemoryRecord
} from "@krn/core";
import type {
  MaintenanceQueueRepository
} from "@krn/db/adapters";

type PostgresClient = ReturnType<typeof postgres>;

/**
 * CLI fallback project scope used when no explicit --project is given and no
 * connected repo path resolves. Single source of truth for the default
 * workspace/project slugs; command files must import these instead of
 * hardcoding the literals.
 */
export const defaultWorkspaceSlug = "local";
export const defaultProjectSlug = "mise-en-palace";

export interface DatabaseRuntimeInput {
  databaseUrl: string;
  workspaceSlug: string;
  projectSlug: string;
  projectId?: string;
  repoPathHint?: string;
  requireProjectKernelForExplicitProject?: boolean;
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

export interface ListSearchDocumentsForSourceLinksInput {
  projectId?: string;
  sourceArtifactIds?: readonly string[];
  sourceChunkIds?: readonly string[];
  sourceClaimIds?: readonly string[];
  limit?: number;
}

export type SourceDecisionImportReadSnapshotWork<T> = (
  repository: SourceDecisionImportRepository
) => Promise<T>;

export interface DatabaseRuntime {
  workspaceId: string;
  projectId: string;
  projectResolution?: ProjectResolution;
  projectKernel?: ProjectKernelRecord;
  repoInstallations?: RepoInstallationRecord[];
  sourceDecisionImportRepository?: SourceDecisionImportRepository;
  withTransaction?<T>(
    lockKey: string,
    work: (runtime: DatabaseRuntimeTransaction) => Promise<T>
  ): Promise<T>;
  withSourceDecisionImportReadSnapshot?<T>(
    work: SourceDecisionImportReadSnapshotWork<T>
  ): Promise<T>;
  compilerDependencies: HarnessCompilerDependencies;
  harnessRunRepository: Pick<
    HarnessRunRepository,
    | "createExecutionRun"
    | "getHarnessRunByExecutionRunId"
    | "createEvidenceBundle"
    | "createReviewAssessment"
    | "createFeedbackDelta"
  > & Partial<Pick<
    HarnessRunRepository,
    | "issueDecisionPacketForExecutionRun"
    | "getIssuedDecisionPacketForExecutionRun"
    | "createEvidenceFeedbackOnce"
    | "recordUsefulnessApplicationOnce"
    | "updateExecutionRunStatus"
    | "listFeedbackDeltasForProject"
    | "listFeedbackDeltasForSubjects"
    | "createEvalFeedbackDeltaOnce"
  >>;
  sourceRepository: Pick<
    SourceRepository,
    | "createSourceArtifact"
    | "createSourceClaim"
    | "getSourceClaimById"
    | "listClaimsForProject"
    | "createSourceClaimEdge"
    | "listSourceClaimEdgesForClaim"
    | "createSourceDecisionEdge"
    | "getSourceDecisionEdgeById"
    | "listSourceDecisionEdgesForClaim"
    | "createSourceRejection"
  > & Partial<Pick<
    SourceRepository,
    | "createSourceChunk"
    | "deprecateSourceClaim"
    | "createSourceDecision"
    | "getSourceDecisionById"
    | "getSourceDecisionForProject"
    | "listSourceDecisionKnowledgeSources"
    | "listRejectedSourceDecisionKnowledgeSources"
    | "listSourceRejectionsForClaim"
    | "getSourceClaimForProject"
    | "listSourceClaimEdgesForProject"
  >>;
  retrievalRepository?: Pick<
    RetrievalRepository,
    | "createSearchDocument"
    | "searchLexical"
  > & {
    listSearchDocumentsForSourceLinks?(
      input: ListSearchDocumentsForSourceLinksInput
    ): Promise<SearchDocumentRecord[]>;
  };
  memoryRepository: Pick<
    MemoryRepository,
    | "createMemoryCandidate"
    | "getMemoryCandidateById"
    | "promoteReviewedMemoryCandidate"
    | "rejectMemoryCandidate"
    | "getMemoryRecordById"
    | "listMemoryRecordsForProject"
    | "invalidateMemoryRecord"
    | "recordMemoryApplicationWithEffectsOnce"
    | "createMemoryFeedbackEvent"
    | "createAntiMemoryCandidate"
    | "getAntiMemoryCandidateById"
    | "promoteReviewedAntiMemoryCandidate"
    | "rejectAntiMemoryCandidate"
  > & Partial<Pick<
    MemoryRepository,
    | "listActiveMemory"
    | "listMemoryCandidates"
    | "listAntiMemoryCandidates"
    | "listAntiMemoryForProject"
  >>;
  maintenanceQueueRepository?: Pick<
    MaintenanceQueueRepository,
    "enqueueMaintenanceQueue"
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

export interface DatabaseRuntimeTransaction {
  sourceRepository: DatabaseRuntime["sourceRepository"];
  retrievalRepository: NonNullable<DatabaseRuntime["retrievalRepository"]>;
  sourceDecisionImportRepository?: SourceDecisionImportRepository;
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
    Required<HarnessRunRepository>,
    "createReviewFeedbackOnce"
  >;
  close(): Promise<void>;
}

export interface MaintenanceQueueDatabaseRuntimeInput {
  databaseUrl: string;
}

export interface MaintenanceQueueDatabaseRuntime {
  maintenanceQueueRepository: MaintenanceQueueRepository;
  harnessRunRepository: FeedbackDeltaLookupRepository;
  memoryRepository: Pick<
    MemoryRepository,
    | "listMemoryRecordsForProject"
    | "createAntiMemoryCandidate"
  >;
  sourceRepository: {
    getSourceClaimForProject: NonNullable<SourceRepository["getSourceClaimForProject"]>;
    getSourceDecisionForProject: NonNullable<SourceRepository["getSourceDecisionForProject"]>;
  };
  close(): Promise<void>;
}

interface ReflectRunSnapshot {
  executionRunId: string;
  projectId: string;
  taskContractId?: string;
}

interface ResolvedRuntimeProject {
  kind: "resolved";
  project: ProjectRecord;
  projectResolution: ProjectResolution;
  shouldLoadProjectScopedMetadata: boolean;
  explicitProjectId: string | undefined;
}

interface MissingExplicitProject {
  kind: "missing_explicit_project";
  explicitProjectId: string;
}

type RuntimeProjectResolution =
  | ResolvedRuntimeProject
  | MissingExplicitProject
  | {
      kind: "unresolved";
    };

type ExplicitProjectLookup =
  | {
      kind: "not_requested";
      explicitProjectId: undefined;
      project: undefined;
    }
  | {
      kind: "missing";
      explicitProjectId: string;
      project: undefined;
    }
  | {
      kind: "resolved";
      explicitProjectId: string;
      project: ProjectRecord;
    };

const closePostgresClient = (client: PostgresClient): (() => Promise<void>) => async (): Promise<void> => {
  await client.end();
};

const createObservationRuntimeRepositories = async (databaseUrl: string) => {
  const client = postgres(databaseUrl, { max: 1 });

  try {
    const db = createKrnDatabase(client);

    return {
      client,
      projectRepository: new DrizzleProjectRepository(db),
      harnessRunRepository: new DrizzleHarnessRunRepository(db),
      observationRepository: new DrizzleObservationRepository(db),
      db
    };
  } catch (error) {
    await client.end();
    throw error;
  }
};

const trimmedValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const projectResolutionFor = (input: {
  explicitProject: ProjectRecord | undefined;
  connectedProject: ProjectRecord | undefined;
  repoPathHint: string | undefined;
}): ProjectResolution => {
  if (input.explicitProject !== undefined) {
    return {
      kind: "explicit_project",
      reason: "Resolved from explicit --project.",
      doesNotProve:
        "Explicit project resolution does not prove the project read model is complete, current, or useful."
    };
  }

  if (input.connectedProject !== undefined) {
    return {
      kind: "connected_repo_path",
      reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
      doesNotProve:
        "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
      ...(input.repoPathHint === undefined ? {} : { repoPathHint: input.repoPathHint })
    };
  }

  return {
    kind: "workspace_project_slug",
    reason: "Resolved from workspace/project slug fallback.",
    doesNotProve:
      "Slug fallback resolution does not prove this is the intended connected repo project."
  };
};

const lookupExplicitProject = async (
  repository: ProjectRepository,
  projectId: string | undefined
): Promise<ExplicitProjectLookup> => {
  const explicitProjectId = trimmedValue(projectId);

  if (explicitProjectId === undefined) {
    return {
      kind: "not_requested",
      explicitProjectId: undefined,
      project: undefined
    };
  }

  const project = await repository.getProject(explicitProjectId);

  if (project === undefined) {
    return {
      kind: "missing",
      explicitProjectId,
      project: undefined
    };
  }

  return {
    kind: "resolved",
    explicitProjectId,
    project
  };
};

const resolveConnectedProject = async (
  repository: ProjectRepository,
  explicitProject: ProjectRecord | undefined,
  repoPathHint: string | undefined
): Promise<ProjectRecord | undefined> => {
  if (explicitProject !== undefined || repoPathHint === undefined) {
    return undefined;
  }

  return repository.getProjectByRepoPath(repoPathHint);
};

const findOrCreateWorkspace = async (
  repository: ProjectRepository,
  workspaceSlug: string
): Promise<WorkspaceRecord> =>
  (await repository.findWorkspaceBySlug(workspaceSlug)) ??
  (await repository.createWorkspace({
    slug: workspaceSlug,
    displayName: workspaceSlug
  }));

const findOrCreateProject = async (
  repository: ProjectRepository,
  workspaceId: string,
  projectSlug: string
): Promise<ProjectRecord> =>
  (await repository.findProjectBySlug(workspaceId, projectSlug)) ??
  (await repository.createProject({
    workspaceId,
    slug: projectSlug,
    displayName: projectSlug
  }));

const resolveWorkspaceSlugProject = async (
  repository: ProjectRepository,
  input: Pick<DatabaseRuntimeInput, "projectSlug" | "workspaceSlug">
): Promise<ProjectRecord> => {
  const workspace = await findOrCreateWorkspace(repository, input.workspaceSlug);

  return findOrCreateProject(repository, workspace.id, input.projectSlug);
};

const resolveRuntimeProject = async (
  repository: ProjectRepository,
  input: Pick<
    DatabaseRuntimeInput,
    | "projectId"
    | "projectSlug"
    | "repoPathHint"
    | "workspaceSlug"
  >,
  options: {
    readonly createSlugFallback: boolean;
  }
): Promise<RuntimeProjectResolution> => {
  const repoPathHint = trimmedValue(input.repoPathHint);
  const explicitLookup = await lookupExplicitProject(repository, input.projectId);

  if (explicitLookup.kind === "missing") {
    return {
      kind: "missing_explicit_project",
      explicitProjectId: explicitLookup.explicitProjectId
    };
  }

  const explicitProject = explicitLookup.project;
  const connectedProject = await resolveConnectedProject(
    repository,
    explicitProject,
    repoPathHint
  );
  const fallbackProject =
    !options.createSlugFallback ||
    explicitProject !== undefined ||
    connectedProject !== undefined
      ? undefined
      : await resolveWorkspaceSlugProject(repository, input);
  const project = explicitProject ?? connectedProject ?? fallbackProject;

  if (project === undefined) {
    return {
      kind: "unresolved"
    };
  }

  return {
    kind: "resolved",
    project,
    projectResolution: projectResolutionFor({
      explicitProject,
      connectedProject,
      repoPathHint
    }),
    shouldLoadProjectScopedMetadata:
      explicitLookup.explicitProjectId !== undefined || connectedProject !== undefined,
    explicitProjectId: explicitLookup.explicitProjectId
  };
};

const resolveRuntimeProjectWithFallbackLock = async (
  db: ReturnType<typeof createKrnDatabase>,
  repository: ProjectRepository,
  input: DatabaseRuntimeInput
): Promise<RuntimeProjectResolution> => {
  const existingResolution = await resolveRuntimeProject(repository, input, {
    createSlugFallback: false
  });

  if (existingResolution.kind !== "unresolved") {
    return existingResolution;
  }

  const fallbackWorkspaceIdentity = `workspace:${input.workspaceSlug}`;

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${fallbackWorkspaceIdentity}, 0))`
    );

    return resolveRuntimeProject(new DrizzleProjectRepository(tx), input, {
      createSlugFallback: true
    });
  });
};

const loadProjectKernel = async (
  repository: ProjectRepository,
  projectId: string,
  shouldLoadProjectScopedMetadata: boolean
): Promise<ProjectKernelRecord | undefined> =>
  shouldLoadProjectScopedMetadata
    ? repository.getLatestProjectKernel(projectId)
    : undefined;

const loadRepoInstallations = async (
  repository: ProjectRepository,
  projectId: string,
  shouldLoadProjectScopedMetadata: boolean
): Promise<RepoInstallationRecord[] | undefined> =>
  shouldLoadProjectScopedMetadata
    ? repository.listRepoInstallationsForProject(projectId)
    : undefined;

const createDatabaseRuntimeTransactionRepositories = (
  sourceRepository: DrizzleSourceRepository,
  retrievalRepository: DrizzleRetrievalRepository,
  sourceDecisionImportRepository: DrizzleSourceDecisionImportRepository
): DatabaseRuntimeTransaction => ({
  sourceRepository: {
    createSourceArtifact: (...args) => sourceRepository.createSourceArtifact(...args),
    createSourceChunk: (...args) => sourceRepository.createSourceChunk(...args),
    deprecateSourceClaim: (...args) => sourceRepository.deprecateSourceClaim(...args),
    createSourceClaim: (...args) => sourceRepository.createSourceClaim(...args),
    getSourceClaimById: (...args) => sourceRepository.getSourceClaimById(...args),
    getSourceClaimForProject: (...args) => sourceRepository.getSourceClaimForProject(...args),
    listClaimsForProject: (...args) => sourceRepository.listClaimsForProject(...args),
    createSourceClaimEdge: (...args) => sourceRepository.createSourceClaimEdge(...args),
    createSourceDecision: (...args) => sourceRepository.createSourceDecision(...args),
    getSourceDecisionById: (...args) => sourceRepository.getSourceDecisionById(...args),
    getSourceDecisionForProject: (...args) =>
      sourceRepository.getSourceDecisionForProject(...args),
    listSourceClaimEdgesForClaim: (...args) => sourceRepository.listSourceClaimEdgesForClaim(...args),
    listSourceClaimEdgesForProject: (...args) =>
      sourceRepository.listSourceClaimEdgesForProject(...args),
    createSourceDecisionEdge: (...args) => sourceRepository.createSourceDecisionEdge(...args),
    getSourceDecisionEdgeById: (...args) => sourceRepository.getSourceDecisionEdgeById(...args),
    listSourceDecisionEdgesForClaim: (...args) => sourceRepository.listSourceDecisionEdgesForClaim(...args),
    listSourceDecisionKnowledgeSources: (...args) =>
      sourceRepository.listSourceDecisionKnowledgeSources(...args),
    listRejectedSourceDecisionKnowledgeSources: (...args) =>
      sourceRepository.listRejectedSourceDecisionKnowledgeSources(...args),
    createSourceRejection: (...args) => sourceRepository.createSourceRejection(...args),
    listSourceRejectionsForClaim: (...args) =>
      sourceRepository.listSourceRejectionsForClaim(...args)
  },
  retrievalRepository: {
    createSearchDocument: (searchDocumentInput) =>
      retrievalRepository.createSearchDocument(searchDocumentInput),
    searchLexical: (searchInput) => retrievalRepository.searchLexical(searchInput),
    listSearchDocumentsForSourceLinks: (sourceLinksInput) =>
      retrievalRepository.listSearchDocumentsForSourceLinks(sourceLinksInput)
  },
  sourceDecisionImportRepository
});

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

const createDatabaseRuntimeForClient = async (
  input: DatabaseRuntimeInput,
  client: PostgresClient
): Promise<DatabaseRuntime> => {
  const db = createKrnDatabase(client);
  const projectRepository = new DrizzleProjectRepository(db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(db);
  const sourceRepository = new DrizzleSourceRepository(db);
  const sourceDecisionImportRepository = new DrizzleSourceDecisionImportRepository(db);
  const retrievalRepository = new DrizzleRetrievalRepository(db);
  const memoryRepository = new DrizzleMemoryRepository(db);
  const maintenanceQueueRepository = new DrizzleMaintenanceQueueRepository(db);
  const observationRepository = new DrizzleObservationRepository(db);
  const runtimeProject = await resolveRuntimeProjectWithFallbackLock(
    db,
    projectRepository,
    input
  );

  if (runtimeProject.kind === "missing_explicit_project") {
    throw new Error(`Project not found for --project ${runtimeProject.explicitProjectId}`);
  }

  if (runtimeProject.kind === "unresolved") {
    throw new Error("Unable to resolve project for database runtime");
  }

  const projectKernel = await loadProjectKernel(
    projectRepository,
    runtimeProject.project.id,
    runtimeProject.shouldLoadProjectScopedMetadata
  );

  const requireProjectKernelForExplicitProject =
    input.requireProjectKernelForExplicitProject ?? true;

  if (
    requireProjectKernelForExplicitProject &&
    runtimeProject.explicitProjectId !== undefined &&
    projectKernel === undefined
  ) {
    throw new Error(`ProjectKernel not found for --project ${runtimeProject.explicitProjectId}`);
  }

  const repoInstallations = await loadRepoInstallations(
    projectRepository,
    runtimeProject.project.id,
    runtimeProject.shouldLoadProjectScopedMetadata
  );
  const sourceSearchRepositories = createDatabaseRuntimeTransactionRepositories(
    sourceRepository,
    retrievalRepository,
    sourceDecisionImportRepository
  );
  const sourceSearchRetrievalRepository = sourceSearchRepositories.retrievalRepository;
  const sourceSearchSourceRepository = sourceSearchRepositories.sourceRepository;
  const readbackHarnessRunRepository: DatabaseRuntime["harnessRunRepository"] = {
    createExecutionRun: (...args) => harnessRunRepository.createExecutionRun(...args),
    updateExecutionRunStatus: (...args) => harnessRunRepository.updateExecutionRunStatus(...args),
    issueDecisionPacketForExecutionRun: (...args) =>
      harnessRunRepository.issueDecisionPacketForExecutionRun(...args),
    getIssuedDecisionPacketForExecutionRun: (...args) =>
      harnessRunRepository.getIssuedDecisionPacketForExecutionRun(...args),
    getHarnessRunByExecutionRunId: (...args) =>
      harnessRunRepository.getHarnessRunByExecutionRunId(...args),
    createEvidenceBundle: (...args) => harnessRunRepository.createEvidenceBundle(...args),
    createReviewAssessment: (...args) => harnessRunRepository.createReviewAssessment(...args),
    createFeedbackDelta: (...args) => harnessRunRepository.createFeedbackDelta(...args),
    ...(harnessRunRepository.createEvidenceFeedbackOnce === undefined
      ? {}
      : {
          createEvidenceFeedbackOnce: (...args: Parameters<
            NonNullable<HarnessRunRepository["createEvidenceFeedbackOnce"]>
          >) => harnessRunRepository.createEvidenceFeedbackOnce!(...args)
        }),
    ...(harnessRunRepository.recordUsefulnessApplicationOnce === undefined
      ? {}
      : {
          recordUsefulnessApplicationOnce: (...args: Parameters<
            NonNullable<HarnessRunRepository["recordUsefulnessApplicationOnce"]>
          >) => harnessRunRepository.recordUsefulnessApplicationOnce!(...args)
        }),
    ...(harnessRunRepository.createEvalFeedbackDeltaOnce === undefined
      ? {}
      : {
          createEvalFeedbackDeltaOnce: (...args: Parameters<
            NonNullable<HarnessRunRepository["createEvalFeedbackDeltaOnce"]>
          >) => harnessRunRepository.createEvalFeedbackDeltaOnce!(...args)
        }),
    listFeedbackDeltasForProject: (...args) =>
      harnessRunRepository.listFeedbackDeltasForProject(...args),
    ...(harnessRunRepository.listFeedbackDeltasForSubjects === undefined
      ? {}
      : {
          listFeedbackDeltasForSubjects: (...args: Parameters<
            NonNullable<HarnessRunRepository["listFeedbackDeltasForSubjects"]>
          >) => harnessRunRepository.listFeedbackDeltasForSubjects!(...args)
        })
  };

  return {
    workspaceId: runtimeProject.project.workspaceId,
    projectId: runtimeProject.project.id,
    projectResolution: runtimeProject.projectResolution,
    ...(projectKernel === undefined ? {} : { projectKernel }),
    ...(repoInstallations === undefined ? {} : { repoInstallations }),
    compilerDependencies: {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: input.now,
      createId: input.createId
    },
    harnessRunRepository: readbackHarnessRunRepository,
    sourceRepository: sourceSearchSourceRepository,
    retrievalRepository: sourceSearchRetrievalRepository,
    sourceDecisionImportRepository,
    withTransaction: async <T>(
      lockKey: string,
      work: (runtime: DatabaseRuntimeTransaction) => Promise<T>
    ) => db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`);
      return work(createDatabaseRuntimeTransactionRepositories(
        new DrizzleSourceRepository(tx),
        new DrizzleRetrievalRepository(tx),
        new DrizzleSourceDecisionImportRepository(tx)
      ));
    }),
    withSourceDecisionImportReadSnapshot: async <T>(
      work: SourceDecisionImportReadSnapshotWork<T>
    ) => db.transaction(
      async (tx) => {
        const settings = await tx.execute<{
          isolationLevel: string;
          readOnly: string;
        }>(sql`
          select
            current_setting('transaction_isolation') as "isolationLevel",
            current_setting('transaction_read_only') as "readOnly"
        `);
        const snapshot = settings[0];

        if (snapshot?.isolationLevel !== "repeatable read" || snapshot.readOnly !== "on") {
          throw new Error("source decision import read snapshot is not repeatable-read and read-only");
        }

        return work(new DrizzleSourceDecisionImportRepository(tx));
      },
      { isolationLevel: "repeatable read", accessMode: "read only" }
    ),
    memoryRepository,
    maintenanceQueueRepository,
    observationRepository,
    close: closePostgresClient(client)
  };
};

export const createDatabaseRuntime = async (
  input: DatabaseRuntimeInput
): Promise<DatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });

  try {
    return await createDatabaseRuntimeForClient(input, client);
  } catch (error) {
    await client.end();
    throw error;
  }
};

export const createObserveDatabaseRuntime = async (
  input: ObserveDatabaseRuntimeInput
): Promise<ObserveDatabaseRuntime> => {
  const {
    client,
    projectRepository,
    harnessRunRepository,
    observationRepository
  } = await createObservationRuntimeRepositories(input.databaseUrl);

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
    close: closePostgresClient(client)
  };
};

export const createReflectDatabaseRuntime = async (
  input: ReflectDatabaseRuntimeInput
): Promise<ReflectDatabaseRuntime> => {
  const {
    client,
    db,
    projectRepository,
    harnessRunRepository,
    observationRepository
  } = await createObservationRuntimeRepositories(input.databaseUrl);

  let sourceRepository: DrizzleSourceRepository;
  let memoryRepository: DrizzleMemoryRepository;
  let reflectionRepository: DrizzleReflectionRepository;

  try {
    sourceRepository = new DrizzleSourceRepository(db);
    memoryRepository = new DrizzleMemoryRepository(db);
    reflectionRepository = new DrizzleReflectionRepository(db);
  } catch (error) {
    await client.end();
    throw error;
  }

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
    close: closePostgresClient(client)
  };
};

export const createReviewAssessDatabaseRuntime = async (
  input: ReviewAssessDatabaseRuntimeInput
): Promise<ReviewAssessDatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });

  try {
    const db = createKrnDatabase(client);
    const harnessRunRepository = new DrizzleHarnessRunRepository(db);

    return {
      harnessRunRepository,
      close: closePostgresClient(client)
    };
  } catch (error) {
    await client.end();
    throw error;
  }
};

export const createMaintenanceQueueDatabaseRuntime = async (
  input: MaintenanceQueueDatabaseRuntimeInput
): Promise<MaintenanceQueueDatabaseRuntime> => {
  const client = postgres(input.databaseUrl, { max: 1 });

  try {
    const db = createKrnDatabase(client);
    const sourceRepository = new DrizzleSourceRepository(db);

    return {
      maintenanceQueueRepository: new DrizzleMaintenanceQueueRepository(db),
      harnessRunRepository: new DrizzleHarnessRunRepository(db),
      memoryRepository: new DrizzleMemoryRepository(db),
      sourceRepository: {
        getSourceClaimForProject: (...args) =>
          sourceRepository.getSourceClaimForProject(...args),
        getSourceDecisionForProject: (...args) =>
          sourceRepository.getSourceDecisionForProject(...args)
      },
      close: closePostgresClient(client)
    };
  } catch (error) {
    await client.end();
    throw error;
  }
};
