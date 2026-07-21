import {
  eq,
  sql
} from "drizzle-orm";
import type {
  SQL
} from "drizzle-orm";
import type {
  AnyPgTable
} from "drizzle-orm/pg-core";
import postgres from "postgres";
import type { Sql } from "postgres";
import type { EvidenceContract } from "@krn/core";
import {
  compileHarnessPlan
} from "@krn/harness";
import type {
  assembleContext
} from "@krn/harness";

import type { KrnDatabase } from "../../database.js";
import { createKrnDatabase } from "../../database.js";
import { inspectMigrationReadiness } from "../../migration-readiness.js";
import {
  DrizzleHarnessRunRepository,
  DrizzleMemoryRepository,
  DrizzleProjectRepository,
  DrizzleRetrievalRepository,
  DrizzleSourceRepository
} from "../../repositories/index.js";
import {
  antiMemoryRecords,
  antiMemoryCandidates,
  contextAssemblies,
  contextExclusions,
  contextItems,
  evidenceBundles,
  executionRuns,
  feedbackDeltas,
  memoryApplications,
  memoryCandidates,
  memoryFeedbackEvents,
  memoryRecords,
  memoryRecordVersions,
  outboxEvents,
  retrievalRuns,
  reviewAssessments,
  runEvents,
  searchDocuments,
  sourceArtifacts,
  sourceClaimEdges,
  sourceClaims,
  sourceDecisions,
  sourceDecisionEdges,
  sourceRejections,
  workspaces
} from "../../schema/index.js";

type SmokeWorkspaceRecord = Awaited<
  ReturnType<DrizzleProjectRepository["createWorkspace"]>
>;
type SmokeProjectRecord = Awaited<
  ReturnType<DrizzleProjectRepository["createProject"]>
>;
type SmokeOperatorIntentRecord = Awaited<
  ReturnType<DrizzleHarnessRunRepository["createOperatorIntent"]>
>;
type SmokeTaskContractRecord = Awaited<
  ReturnType<DrizzleHarnessRunRepository["createTaskContract"]>
>;
type SmokeHarnessPlanRecord = Awaited<
  ReturnType<DrizzleHarnessRunRepository["createHarnessPlan"]>
>;
type SmokeContextAssemblyRecord = Awaited<
  ReturnType<DrizzleHarnessRunRepository["createContextAssembly"]>
>;
type SmokeExecutionRunRecord = Awaited<
  ReturnType<DrizzleHarnessRunRepository["createExecutionRun"]>
>;
type SmokeHarnessCompileResult = Awaited<ReturnType<typeof compileHarnessPlan>>;
type SmokeContextAssemblyDraft = ReturnType<typeof assembleContext>;

interface SmokeContextRevisionCandidate {
  readonly metadata: Record<string, unknown>;
}

interface SmokeContextRevisionInclusion {
  readonly subjectId: string;
  readonly subjectType: string;
}

export interface SmokeDatabase {
  client: Sql;
  db: KrnDatabase;
}

export interface SmokeProjectRecords {
  workspace: SmokeWorkspaceRecord;
  project: SmokeProjectRecord;
}

export interface HarnessCompilerSmokeRuntimeInput {
  databaseUrl: string;
  migrationsFolder: string;
  projectSlug: string;
  smokeId: string;
  smokeName: string;
  taskPrefix: string;
  workspacePrefix: string;
}

export interface HarnessCompilerSmokeRuntime extends SmokeDatabase {
  marker: string;
  projectSlug: string;
  task: string;
  workspaceSlug: string;
}

export interface SmokeHarnessCompileInput {
  acceptance: string;
  command: string;
  constraints?: readonly string[];
  db: KrnDatabase;
  marker: string;
  nonGoals?: readonly string[];
  prepare?: (input: SmokeHarnessPreparationInput) => Promise<void>;
  projectSlug: string;
  task: string;
  workspaceSlug: string;
}

export interface SmokeHarnessCompileOutput extends SmokeProjectRecords {
  harnessRunRepository: DrizzleHarnessRunRepository;
  memoryRepository: DrizzleMemoryRepository;
  retrievalRepository: DrizzleRetrievalRepository;
  result: SmokeHarnessCompileResult;
  sourceRepository: DrizzleSourceRepository;
}

export interface SmokeCompiledExecutionInput extends SmokeHarnessCompileInput {
  includeEvidenceContract?: boolean;
}

export interface SmokeCompiledExecutionOutput extends SmokeHarnessCompileOutput {
  executionRun: SmokeExecutionRunRecord;
  retrievalRunId: string | undefined;
}

export const createRunningSmokeExecutionRun = async (
  harnessRunRepository: DrizzleHarnessRunRepository,
  harnessPlanId: string,
  marker: string,
  startedAt: string
): Promise<SmokeExecutionRunRecord> => {
  const plannedRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId,
    adapter: "smoke",
    metadata: { smokeId: marker }
  });
  const transition = await harnessRunRepository.updateExecutionRunStatus({
    executionRunId: plannedRun.id,
    expectedStatus: "planned",
    status: "running",
    startedAt
  });
  if (transition.kind !== "transitioned") {
    throw new Error("smoke ExecutionRun planned-to-running transition was not persisted");
  }
  return transition.executionRun;
};

const includedSmokeContextRevisionTokens = (
  candidates: readonly SmokeContextRevisionCandidate[],
  inclusions: readonly SmokeContextRevisionInclusion[]
): Record<string, unknown>[] => candidates.flatMap((candidate) => {
  const revision = candidate.metadata.canonicalRevision;

  if (typeof revision !== "object" || revision === null || Array.isArray(revision)) {
    return [];
  }

  const token = revision as Record<string, unknown>;
  return inclusions.some((inclusion) => (
    inclusion.subjectType === token.subjectType && inclusion.subjectId === token.subjectId
  ))
    ? [token]
    : [];
});

export const createSmokeContextAssembly = (
  harnessRunRepository: DrizzleHarnessRunRepository,
  draft: SmokeContextAssemblyDraft,
  candidates: readonly SmokeContextRevisionCandidate[],
  metadata: Record<string, unknown> = {}
): Promise<SmokeContextAssemblyRecord> => harnessRunRepository.createContextAssembly({
  harnessPlanId: draft.harnessPlanId,
  status: draft.status,
  ...(draft.tokenBudget === undefined ? {} : { tokenBudget: draft.tokenBudget }),
  inclusions: draft.inclusions,
  exclusions: draft.exclusions,
  metadata: {
    ...draft.metadata,
    ...metadata,
    canonicalRevisionTokens: includedSmokeContextRevisionTokens(
      candidates,
      draft.inclusions
    )
  }
});

export interface SmokeHarnessPreparationInput {
  db: KrnDatabase;
  harnessRunRepository: DrizzleHarnessRunRepository;
  marker: string;
  memoryRepository: DrizzleMemoryRepository;
  project: SmokeProjectRecords["project"];
  retrievalRepository: DrizzleRetrievalRepository;
  sourceRepository: DrizzleSourceRepository;
  workspace: SmokeProjectRecords["workspace"];
}

export interface SmokeCoreRepositories {
  harnessRunRepository: DrizzleHarnessRunRepository;
  memoryRepository: DrizzleMemoryRepository;
  projectRepository: DrizzleProjectRepository;
  retrievalRepository: DrizzleRetrievalRepository;
  sourceRepository: DrizzleSourceRepository;
}

export interface SmokeTaskContractSeed {
  acceptance: readonly string[];
  constraints: readonly string[];
  nonGoals: readonly string[];
  objective: string;
  title: string;
}

export interface SmokeHarnessPlanSeed {
  evidenceContract?: Omit<EvidenceContract, "taskContractId">;
  nextAction: string;
  status?: "ready" | "draft" | "running" | "blocked" | "completed";
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface SmokeContextAssemblySeed {
  status: "assembled" | "abstained";
  tokenBudget: number;
}

interface SmokeHarnessRecordsInput {
  contextAssembly?: SmokeContextAssemblySeed;
  harnessPlan: SmokeHarnessPlanSeed;
  harnessRunRepository: DrizzleHarnessRunRepository;
  marker: string;
  projectRepository: DrizzleProjectRepository;
  projectSlug: string;
  rawIntent: string;
  taskContract: SmokeTaskContractSeed;
  workspaceSlug: string;
}

export interface SmokeHarnessRecords extends SmokeProjectRecords {
  contextAssembly?: SmokeContextAssemblyRecord;
  harnessPlan: SmokeHarnessPlanRecord;
  operatorIntent: SmokeOperatorIntentRecord;
  taskContract: SmokeTaskContractRecord;
}

export interface SmokeHarnessScaffoldInput extends SmokeRuntimeInput {
  cleanupRows: (input: SmokeCleanupInput) => Promise<void>;
  contextAssembly?: SmokeContextAssemblySeed;
  countMarkerRows: (input: SmokeMarkerRowInput) => Promise<number>;
  harnessPlan: SmokeHarnessPlanSeed;
  rawIntent: string;
  taskContract: SmokeTaskContractSeed;
}

export interface SmokeHarnessScaffold
  extends SmokeRuntime, SmokeCoreRepositories, SmokeHarnessRecords {
  cleanup: () => Promise<number>;
  setContextAssemblyId: (contextAssemblyId: string | undefined) => void;
}

export interface SmokeRuntimeInput {
  databaseUrl: string;
  migrationsFolder: string;
  projectSlug: string;
  smokeId: string;
  smokeName: string;
  workspacePrefix: string;
}

export interface SmokeRuntime {
  client: Sql;
  db: KrnDatabase;
  marker: string;
  projectSlug: string;
  workspaceSlug: string;
}

export interface SmokeContextSelectionCounts {
  contextExclusionCount: number;
  contextItemCount: number;
}

export interface SmokeReadbackCheck {
  label: string;
  passed: boolean;
}

type SmokeCountTask = () => Promise<number>;
type SmokeCleanupTask = () => Promise<void>;

interface SmokeBaseMarkerInput {
  db: KrnDatabase;
  marker: string;
  workspaceSlug: string;
}

interface SmokeBaseMarkerCountInput {
  contextAssemblyId: string | undefined;
  db: KrnDatabase;
  extraTasks?: readonly SmokeCountTask[];
  marker: string;
  workspaceSlug: string;
}

export interface SmokeCleanupInput {
  beforeSourceClaimDeleteTasks?: readonly SmokeCleanupTask[];
  db: KrnDatabase;
  marker: string;
  workspaceSlug: string;
}

export interface SmokeMarkerRowInput {
  contextAssemblyId: string | undefined;
  db: KrnDatabase;
  marker: string;
  workspaceSlug: string;
}

export interface SmokeRetrievalRunMarkerRowInput {
  db: KrnDatabase;
  marker: string;
  retrievalRunId: string | undefined;
  workspaceSlug: string;
}

export interface SmokeRetrievalRunCleanupInput extends SmokeCleanupInput {
  retrievalRunId: string | undefined;
}

export interface HarnessCompilerSmokeRowInput extends SmokeBaseMarkerInput {
  feedbackDeltaId: string | undefined;
  retrievalRunId: string | undefined;
}

export interface BrainLoopSmokeRowInput extends SmokeMarkerRowInput {
  consolidationContextAssemblyId: string | undefined;
  consolidationRetrievalRunId: string | undefined;
  downgradedContextAssemblyId: string | undefined;
  downgradedRetrievalRunId: string | undefined;
  feedbackDeltaId: string | undefined;
  nextContextAssemblyId: string | undefined;
  nextRetrievalRunId: string | undefined;
  revisionContextAssemblyId: string | undefined;
  revisionRetrievalRunId: string | undefined;
  retrievalRunId: string | undefined;
}

export interface BrainLoopSmokeCleanupInput extends SmokeCleanupInput {
  consolidationRetrievalRunId: string | undefined;
  downgradedRetrievalRunId: string | undefined;
  feedbackDeltaId: string | undefined;
  nextRetrievalRunId: string | undefined;
  revisionRetrievalRunId: string | undefined;
  retrievalRunId: string | undefined;
}

const smokeSlugPartLimit = 48;

export const normalizeSmokeSlugPart = (value: string): string => {
  const slug = Array.from(value.trim().toLowerCase())
    .map((character) => (
      /[a-z0-9-]/.test(character) ? character : "-"
    ))
    .join("")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, smokeSlugPartLimit);

  return slug || "local";
};

const smokeMetadata = (marker: string): Record<string, unknown> => ({
  smoke: true,
  smokeId: marker
});

export const ensureSmokeBrainStoreReady = async (
  databaseUrl: string,
  migrationsFolder: string,
  smokeName: string
): Promise<void> => {
  const readiness = await inspectMigrationReadiness({
    databaseUrl,
    migrationsFolder
  });

  if (!readiness.migrationsVerified || !readiness.pgvectorAvailable) {
    throw new Error(`Memory store is not ready for ${smokeName}`);
  }
};

export const createSmokeDatabase = (databaseUrl: string): SmokeDatabase => {
  const client = postgres(databaseUrl, {
    max: 1,
    onnotice: () => undefined
  });

  return {
    client,
    db: createKrnDatabase(client)
  };
};

export const createHarnessCompilerSmokeRuntime = async (
  input: HarnessCompilerSmokeRuntimeInput
): Promise<HarnessCompilerSmokeRuntime> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    input.smokeName
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);

  return {
    ...createSmokeDatabase(input.databaseUrl),
    marker,
    projectSlug: input.projectSlug,
    task: `${input.taskPrefix} ${marker}`,
    workspaceSlug: `${input.workspacePrefix}-${marker}`
  };
};

const createSmokeIdFactory = (
  marker: string
): (prefix: string) => string => {
  let idCounter = 0;

  return (prefix) => {
    idCounter += 1;

    return `${prefix}-${marker}-${idCounter}`;
  };
};

const compileSmokeHarnessPlan = async (
  input: SmokeHarnessCompileInput
): Promise<SmokeHarnessCompileOutput> => {
  const projectRepository = new DrizzleProjectRepository(input.db);
  const harnessRunRepository = new DrizzleHarnessRunRepository(input.db);
  const memoryRepository = new DrizzleMemoryRepository(input.db);
  const retrievalRepository = new DrizzleRetrievalRepository(input.db);
  const sourceRepository = new DrizzleSourceRepository(input.db);
  const { workspace, project } = await createSmokeProjectRecords(
    projectRepository,
    input.workspaceSlug,
    input.projectSlug,
    input.marker
  );
  await input.prepare?.({
    db: input.db,
    harnessRunRepository,
    marker: input.marker,
    memoryRepository,
    project,
    retrievalRepository,
    sourceRepository,
    workspace
  });
  const result = await compileHarnessPlan(
    {
      workspaceId: workspace.id,
      projectId: project.id,
      operatorIntent: {
        rawIntent: input.task,
        source: "cli",
        metadata: {
          smokeId: input.marker
        }
      },
      taskContract: {
          title: input.task,
          objective: input.task,
          constraints: [...(input.constraints ?? ["preserve strict TypeScript boundaries"])],
          nonGoals: [...(input.nonGoals ?? ["do not mutate memory"])],
          acceptance: [input.acceptance],
          metadata: {
            smokeId: input.marker
          }
      },
      verificationCommands: ["pnpm typecheck", "pnpm test", "git diff --check"],
      tokenBudget: 1200,
      metadata: {
        command: input.command,
        smokeId: input.marker
      }
    },
    {
      harnessRunRepository,
      memoryRepository,
      sourceRepository,
      retrievalRepository,
      now: () => new Date().toISOString(),
      createId: createSmokeIdFactory(input.marker)
    }
  );

  return {
    harnessRunRepository,
    memoryRepository,
    project,
    result,
    retrievalRepository,
    sourceRepository,
    workspace
  };
};

export const createCompiledSmokeExecution = async (
  input: SmokeCompiledExecutionInput
): Promise<SmokeCompiledExecutionOutput> => {
  const compileOutput = await compileSmokeHarnessPlan(input);
  const { harnessRunRepository, result } = compileOutput;
  const maybeRetrievalRunId = result.contextAssembly.metadata.retrievalRunId;
  const retrievalRunId = typeof maybeRetrievalRunId === "string"
    ? maybeRetrievalRunId
    : undefined;
  const executionRun = await harnessRunRepository.createExecutionRun({
    harnessPlanId: result.harnessPlan.id,
    adapter: "codex",
    metadata: {
      smokeId: input.marker,
      ...(input.includeEvidenceContract === false ? {} : {
        evidenceContract: result.evidenceContract
      })
    }
  });

  return {
    ...compileOutput,
    executionRun,
    retrievalRunId
  };
};

const createSmokeCoreRepositories = (
  db: KrnDatabase
): SmokeCoreRepositories => ({
  harnessRunRepository: new DrizzleHarnessRunRepository(db),
  memoryRepository: new DrizzleMemoryRepository(db),
  projectRepository: new DrizzleProjectRepository(db),
  retrievalRepository: new DrizzleRetrievalRepository(db),
  sourceRepository: new DrizzleSourceRepository(db)
});

export const createSmokeRuntime = async (
  input: SmokeRuntimeInput
): Promise<SmokeRuntime> => {
  await ensureSmokeBrainStoreReady(
    input.databaseUrl,
    input.migrationsFolder,
    input.smokeName
  );

  const marker = normalizeSmokeSlugPart(input.smokeId);
  const { client, db } = createSmokeDatabase(input.databaseUrl);

  return {
    client,
    db,
    marker,
    projectSlug: input.projectSlug,
    workspaceSlug: `${input.workspacePrefix}-${marker}`
  };
};

const createSmokeProjectRecords = async (
  projectRepository: DrizzleProjectRepository,
  workspaceSlug: string,
  projectSlug: string,
  marker: string
): Promise<SmokeProjectRecords> => {
  const workspace = await projectRepository.createWorkspace({
    slug: workspaceSlug,
    displayName: workspaceSlug,
    metadata: smokeMetadata(marker)
  });
  const project = await projectRepository.createProject({
    workspaceId: workspace.id,
    slug: projectSlug,
    displayName: projectSlug,
    metadata: smokeMetadata(marker)
  });

  return {
    workspace,
    project
  };
};

const createSmokeHarnessRecords = async (
  input: SmokeHarnessRecordsInput
): Promise<SmokeHarnessRecords> => {
  const { workspace, project } = await createSmokeProjectRecords(
    input.projectRepository,
    input.workspaceSlug,
    input.projectSlug,
    input.marker
  );
  const operatorIntent = await input.harnessRunRepository.createOperatorIntent({
    workspaceId: workspace.id,
    projectId: project.id,
    source: "cli",
    rawIntent: input.rawIntent,
    metadata: {
      smokeId: input.marker
    }
  });
  const taskContract = await input.harnessRunRepository.createTaskContract({
    operatorIntentId: operatorIntent.id,
    projectId: project.id,
    title: input.taskContract.title,
    objective: input.taskContract.objective,
    constraints: [...input.taskContract.constraints],
    nonGoals: [...input.taskContract.nonGoals],
    acceptance: [...input.taskContract.acceptance],
    metadata: {
      smokeId: input.marker
    }
  });
  const harnessPlan = await input.harnessRunRepository.createHarnessPlan({
    taskContractId: taskContract.id,
    version: 1,
    status: input.harnessPlan.status ?? "running",
    summary: input.harnessPlan.summary,
    nextAction: input.harnessPlan.nextAction,
    metadata: {
      smokeId: input.marker,
      ...(input.harnessPlan.metadata ?? {}),
      ...(input.harnessPlan.evidenceContract === undefined
        ? {}
        : {
            evidenceContract: {
              ...input.harnessPlan.evidenceContract,
              taskContractId: taskContract.id
            }
          })
    }
  });
  const contextAssembly = input.contextAssembly === undefined ? undefined :
    await input.harnessRunRepository.createContextAssembly({
      harnessPlanId: harnessPlan.id,
      status: input.contextAssembly.status,
      tokenBudget: input.contextAssembly.tokenBudget,
      inclusions: [],
      exclusions: [],
      metadata: {
        smokeId: input.marker
      }
    });

  return {
    workspace,
    project,
    operatorIntent,
    taskContract,
    harnessPlan,
    ...(contextAssembly === undefined ? {} : { contextAssembly })
  };
};

export const createSmokeHarnessScaffold = async (
  input: SmokeHarnessScaffoldInput
): Promise<SmokeHarnessScaffold> => {
  const runtime = await createSmokeRuntime(input);
  const repositories = createSmokeCoreRepositories(runtime.db);
  let contextAssemblyId: string | undefined;
  const cleanup = async (): Promise<number> => {
    await repositories.retrievalRepository.cleanupTestRetrievalRecords({
      smokeId: runtime.marker
    });
    await input.cleanupRows({
      db: runtime.db,
      marker: runtime.marker,
      workspaceSlug: runtime.workspaceSlug
    });

    return input.countMarkerRows({
      contextAssemblyId,
      db: runtime.db,
      marker: runtime.marker,
      workspaceSlug: runtime.workspaceSlug
    });
  };

  await cleanup();

  const recordsInput = {
    harnessPlan: input.harnessPlan,
    harnessRunRepository: repositories.harnessRunRepository,
    marker: runtime.marker,
    projectRepository: repositories.projectRepository,
    projectSlug: runtime.projectSlug,
    rawIntent: input.rawIntent,
    taskContract: input.taskContract,
    workspaceSlug: runtime.workspaceSlug
  };
  const records = await createSmokeHarnessRecords(
    input.contextAssembly === undefined ?
      recordsInput :
      { ...recordsInput, contextAssembly: input.contextAssembly }
  );
  contextAssemblyId = records.contextAssembly?.id;

  return {
    ...runtime,
    ...repositories,
    ...records,
    cleanup,
    setContextAssemblyId: (id) => {
      contextAssemblyId = id;
    }
  };
};


const countMemoryRecordVersionsForSmoke = async (
  db: KrnDatabase,
  marker: string
): Promise<number> => {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memoryRecordVersions)
    .innerJoin(memoryRecords, eq(memoryRecordVersions.memoryRecordId, memoryRecords.id))
    .where(sql`${memoryRecords.metadata}->>'smokeId' = ${marker}`);

  return rows[0]?.count ?? 0;
};

export const countActivationSmokeMarkerRows = async (
  input: SmokeMarkerRowInput
): Promise<number> => countSmokeBaseMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, outboxEvents, sql`${outboxEvents.payload}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countMemoryRecordVersionsForSmoke(input.db, input.marker),
    () => countSmokeRows(input.db, antiMemoryRecords, sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, searchDocuments, sql`${searchDocuments.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, retrievalRuns, sql`${retrievalRuns.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

export const countRetrievalSubstrateSmokeMarkerRows = async (
  input: SmokeMarkerRowInput
): Promise<number> => countSmokeBaseMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecordVersions, sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

const countSmokeRetrievalRunMarkerRows = async (
  input: SmokeRetrievalRunMarkerRowInput & { extraTasks?: readonly SmokeCountTask[] }
): Promise<number> => sumSmokeCountTasks([
  ...smokeBaseMarkerCountTasks(input),
  () => countSmokeRows(input.db, outboxEvents, sql`${outboxEvents.payload}->>'smokeId' = ${input.marker}`),
  optionalSmokeCount(
    input.retrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  ...(input.extraTasks ?? [])
]);

export const countMemoryGovernanceSmokeMarkerRows = async (
  input: SmokeRetrievalRunMarkerRowInput
): Promise<number> => countSmokeRetrievalRunMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, memoryCandidates, sql`${memoryCandidates.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryRecordVersions, sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryApplications, sql`${memoryApplications.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, memoryFeedbackEvents, sql`${memoryFeedbackEvents.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, antiMemoryRecords, sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, antiMemoryCandidates, sql`${antiMemoryCandidates.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

export const countBrainLoopSmokeMarkerRows = async (
  input: BrainLoopSmokeRowInput
): Promise<number> => sumSmokeCountTasks([
  () => countMemoryGovernanceSmokeMarkerRows(input),
  countOptionalSmokeContextSelectionRows(input.db, input.contextAssemblyId),
  countOptionalSmokeContextSelectionRows(input.db, input.consolidationContextAssemblyId),
  countOptionalSmokeContextSelectionRows(input.db, input.nextContextAssemblyId),
  countOptionalSmokeContextSelectionRows(input.db, input.downgradedContextAssemblyId),
  countOptionalSmokeContextSelectionRows(input.db, input.revisionContextAssemblyId),
  optionalSmokeCount(
    input.consolidationRetrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  optionalSmokeCount(
    input.nextRetrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  optionalSmokeCount(
    input.downgradedRetrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  optionalSmokeCount(
    input.revisionRetrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  () => countSmokeRows(input.db, evidenceBundles, sql`${evidenceBundles.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, reviewAssessments, sql`${reviewAssessments.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, feedbackDeltas, sql`${feedbackDeltas.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, sourceDecisionEdges, sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`),
  optionalSmokeCount(
    input.feedbackDeltaId,
    (id) => countSmokeRows(input.db, outboxEvents, sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${id}`)
  )
]);

export const countSourceGraphSmokeMarkerRows = async (
  input: SmokeRetrievalRunMarkerRowInput
): Promise<number> => countSmokeRetrievalRunMarkerRows({
  ...input,
  extraTasks: [
    () => countSmokeRows(input.db, sourceClaimEdges, sql`${sourceClaimEdges.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, sourceDecisionEdges, sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${input.marker}`),
    () => countSmokeRows(input.db, sourceRejections, sql`${sourceRejections.metadata}->>'smokeId' = ${input.marker}`)
  ]
});

const countSmokeRows = async (
  db: KrnDatabase,
  table: AnyPgTable,
  where: SQL
): Promise<number> => {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(where);

  return rows[0]?.count ?? 0;
};

const smokeRunEventPredicate = (
  input: SmokeBaseMarkerInput
): SQL => sql`(
  ${runEvents.payload}->>'smokeId' = ${input.marker}
  or ${runEvents.executionRunId} in (
    select ${executionRuns.id}
    from ${executionRuns}
    where ${executionRuns.metadata}->>'smokeId' = ${input.marker}
  )
)`;

const countSmokeBaseMarkerRows = async (
  input: SmokeBaseMarkerCountInput
): Promise<number> => sumSmokeCountTasks([
  ...smokeBaseMarkerCountTasks(input),
  countOptionalSmokeContextSelectionRows(input.db, input.contextAssemblyId),
  ...(input.extraTasks ?? [])
]);

const smokeBaseMarkerCountTasks = (
  input: SmokeBaseMarkerInput
): readonly SmokeCountTask[] => [
  () => countSmokeRows(input.db, workspaces, eq(workspaces.slug, input.workspaceSlug)),
  () => countSmokeRows(input.db, sourceArtifacts, sql`${sourceArtifacts.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, sourceClaims, sql`${sourceClaims.metadata}->>'smokeId' = ${input.marker}`),
  () => countSmokeRows(input.db, runEvents, smokeRunEventPredicate(input))
];

const optionalSmokeCount = <Value>(
  value: Value | undefined,
  task: (value: Value) => Promise<number>
): SmokeCountTask => async () => (
  value === undefined ? 0 : task(value)
);

const countHarnessCompilerSmokeRows = async (
  input: HarnessCompilerSmokeRowInput
): Promise<number> => sumSmokeCountTasks([
  () => countSmokeRows(input.db, workspaces, eq(workspaces.slug, input.workspaceSlug)),
  () => countSmokeRows(input.db, runEvents, smokeRunEventPredicate(input)),
  optionalSmokeCount(
    input.retrievalRunId,
    (id) => countSmokeRows(input.db, retrievalRuns, eq(retrievalRuns.id, id))
  ),
  optionalSmokeCount(
    input.feedbackDeltaId,
    (id) => countSmokeRows(input.db, outboxEvents, sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${id}`)
  )
]);

export const cleanupHarnessCompilerSmokeRows = async (
  input: HarnessCompilerSmokeRowInput
): Promise<number> => {
  await input.db
    .delete(runEvents)
    .where(smokeRunEventPredicate(input));

  if (input.feedbackDeltaId !== undefined) {
    await input.db
      .delete(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${input.feedbackDeltaId}`);
  }

  if (input.retrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.retrievalRunId));
  }

  await input.db
    .delete(retrievalRuns)
    .where(sql`${retrievalRuns.metadata}->>'smokeId' = ${input.marker}`);

  await input.db
    .delete(contextAssemblies)
    .where(sql`${contextAssemblies.metadata}->>'smokeId' = ${input.marker}`);

  await input.db
    .delete(workspaces)
    .where(eq(workspaces.slug, input.workspaceSlug));

  return countHarnessCompilerSmokeRows(input);
};

export const countSmokeContextSelectionRows = async (
  db: KrnDatabase,
  contextAssemblyId: string
): Promise<SmokeContextSelectionCounts> => {
  const contextItemRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contextItems)
    .where(eq(contextItems.contextAssemblyId, contextAssemblyId));
  const contextExclusionRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contextExclusions)
    .where(eq(contextExclusions.contextAssemblyId, contextAssemblyId));

  return {
    contextItemCount: contextItemRows[0]?.count ?? 0,
    contextExclusionCount: contextExclusionRows[0]?.count ?? 0
  };
};

const countOptionalSmokeContextSelectionRows = (
  db: KrnDatabase,
  contextAssemblyId: string | undefined
): SmokeCountTask => optionalSmokeCount(
  contextAssemblyId,
  async (id) => {
    const counts = await countSmokeContextSelectionRows(db, id);

    return counts.contextItemCount + counts.contextExclusionCount;
  }
);

export const assertSmokeReadbackChecks = (
  checks: readonly SmokeReadbackCheck[],
  message: string
): void => {
  const failedCheck = checks.find((check) => !check.passed);

  if (failedCheck !== undefined) {
    throw new Error(`${message}: ${failedCheck.label}`);
  }
};

export const requireSmokeReadbackValue = <Value>(
  value: Value | undefined,
  label: string,
  message: string
): Value => {
  if (value === undefined) {
    throw new Error(`${message}: ${label}`);
  }

  return value;
};

const cleanupSmokeBaseRows = async (
  input: SmokeCleanupInput
): Promise<void> => {
  for (const task of input.beforeSourceClaimDeleteTasks ?? []) {
    await task();
  }

  await input.db
    .delete(sourceClaims)
    .where(sql`${sourceClaims.metadata}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(sourceArtifacts)
    .where(sql`${sourceArtifacts.metadata}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(runEvents)
    .where(smokeRunEventPredicate(input));
  await input.db
    .delete(workspaces)
    .where(eq(workspaces.slug, input.workspaceSlug));
};

export const cleanupActivationSmokeRows = async (
  input: Omit<SmokeCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeBaseRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      deleteSmokeOutboxEventsTask(input),
      async () => {
        await input.db
          .delete(sourceDecisionEdges)
          .where(sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(sourceDecisions)
          .where(sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(antiMemoryRecords)
          .where(sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(memoryRecords)
          .where(sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      }
    ]
  });
};

export const cleanupRetrievalSubstrateSmokeRows = async (
  input: Omit<SmokeCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeBaseRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      async () => {
        await input.db
          .delete(memoryRecordVersions)
          .where(sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(memoryRecords)
          .where(sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`);
      },
      async () => {
        await input.db
          .delete(sourceDecisions)
          .where(sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`);
      }
    ]
  });
};

const cleanupSmokeRetrievalRunRows = async (
  input: SmokeRetrievalRunCleanupInput
): Promise<void> => {
  await cleanupSmokeBaseRows(input);

  if (input.retrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.retrievalRunId));
  }
};

const deleteSmokeRowsTask = (
  input: SmokeBaseMarkerInput,
  table: AnyPgTable,
  where: SQL
): SmokeCleanupTask => async () => {
  await input.db
    .delete(table)
    .where(where);
};

const deleteSmokeOutboxEventsTask = (
  input: SmokeBaseMarkerInput
): SmokeCleanupTask => deleteSmokeRowsTask(
  input,
  outboxEvents,
  sql`${outboxEvents.payload}->>'smokeId' = ${input.marker}`
);

export const cleanupMemoryGovernanceSmokeRows = async (
  input: Omit<SmokeRetrievalRunCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeRetrievalRunRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      deleteSmokeOutboxEventsTask(input),
      deleteSmokeRowsTask(input, memoryApplications, sql`${memoryApplications.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, memoryFeedbackEvents, sql`${memoryFeedbackEvents.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, memoryRecordVersions, sql`${memoryRecordVersions.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, antiMemoryRecords, sql`${antiMemoryRecords.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, antiMemoryCandidates, sql`${antiMemoryCandidates.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, memoryRecords, sql`${memoryRecords.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, memoryCandidates, sql`${memoryCandidates.metadata}->>'smokeId' = ${input.marker}`)
    ]
  });
};

export const cleanupBrainLoopSmokeRows = async (
  input: Omit<BrainLoopSmokeCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  const feedbackDeltaRows = await input.db
    .select({ id: feedbackDeltas.id })
    .from(feedbackDeltas)
    .where(sql`${feedbackDeltas.metadata}->>'smokeId' = ${input.marker}`);

  for (const row of feedbackDeltaRows) {
    await input.db
      .delete(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${row.id}`);
  }

  if (input.feedbackDeltaId !== undefined) {
    await input.db
      .delete(outboxEvents)
      .where(sql`${outboxEvents.payload}->>'feedbackDeltaId' = ${input.feedbackDeltaId}`);
  }

  await input.db
    .delete(sourceDecisionEdges)
    .where(sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${input.marker}`);
  await input.db
    .delete(sourceDecisions)
    .where(sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`);

  await cleanupMemoryGovernanceSmokeRows(input);

  if (input.consolidationRetrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.consolidationRetrievalRunId));
  }

  if (input.nextRetrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.nextRetrievalRunId));
  }

  if (input.downgradedRetrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.downgradedRetrievalRunId));
  }

  if (input.revisionRetrievalRunId !== undefined) {
    await input.db
      .delete(retrievalRuns)
      .where(eq(retrievalRuns.id, input.revisionRetrievalRunId));
  }
};

export const cleanupSourceGraphSmokeRows = async (
  input: Omit<SmokeRetrievalRunCleanupInput, "beforeSourceClaimDeleteTasks">
): Promise<void> => {
  await cleanupSmokeRetrievalRunRows({
    ...input,
    beforeSourceClaimDeleteTasks: [
      deleteSmokeOutboxEventsTask(input),
      deleteSmokeRowsTask(input, sourceRejections, sql`${sourceRejections.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, sourceDecisionEdges, sql`${sourceDecisionEdges.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, sourceDecisions, sql`${sourceDecisions.metadata}->>'smokeId' = ${input.marker}`),
      deleteSmokeRowsTask(input, sourceClaimEdges, sql`${sourceClaimEdges.metadata}->>'smokeId' = ${input.marker}`)
    ]
  });
};

const sumSmokeCountTasks = async (
  tasks: readonly SmokeCountTask[]
): Promise<number> => {
  let total = 0;

  for (const task of tasks) {
    total += await task();
  }

  return total;
};
