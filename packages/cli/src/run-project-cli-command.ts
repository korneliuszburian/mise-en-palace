import type {
  KnowledgeReadModel
} from "@krn/harness";
import {
  openMemoryLifecycleStore,
  parseBackendKind,
  resolveBackendConfig
} from "@krn/db";
import type {
  CliCommand
} from "./parse-args.js";
import type {
  CliResult,
  CliRuntime
} from "./run-cli.js";
import {
  runInitCommand
} from "./run-init-command.js";
import type {
  CreateInitConnectRuntime
} from "./run-init-command.js";
import {
  defaultProjectSlug,
  defaultWorkspaceSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  memoryRecordToKnowledgeReadModel
} from "./memory-record-knowledge-read-model.js";
import {
  applyStoreKnowledgeUsefulnessFeedback,
  listStoreKnowledgeUsefulnessFeedback
} from "./store-knowledge-usefulness-selection.js";
import {
  runBrainRecallCommand
} from "./run-brain-recall-command.js";
import type {
  BrainRecallCommandRuntime
} from "./run-brain-recall-command.js";
import {
  resolveTargetWorkspace
} from "./target-workspace.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";

type ProjectCliCommand = Extract<
  CliCommand,
  | { kind: "init" }
  | { kind: "brainRecall" }
>;

interface ProjectCliCommandContext {
  cwd: string;
  env: CliRuntime["env"];
  now: () => string;
  createId: (prefix: string) => string;
  createDatabaseRuntime?: CliRuntime["createDatabaseRuntime"];
  createInitConnectRuntime?: CreateInitConnectRuntime;
  formatCliError(message: string): string;
}

type ProjectCommandOutput = {
  stdout: string;
};

const projectCommandResult = (stdout: string): CliResult => ({
  exitCode: 0,
  stdout,
  stderr: ""
});

const projectCommandError = (
  error: unknown,
  fallbackMessage: string,
  context: ProjectCliCommandContext
): CliResult => {
  const message = error instanceof Error ? error.message : fallbackMessage;

  return {
    exitCode: 1,
    stdout: "",
    stderr: context.formatCliError(message)
  };
};

const isProjectCliCommand = (command: CliCommand): command is ProjectCliCommand => (
  command.kind === "init" ||
  command.kind === "brainRecall"
);

const trimmedEnvValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const storeRecallRepositoryLimit = (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>
): number => Object.keys(command.filter).length === 0
  ? command.limit ?? 100
  // Read-model filters include projected metadata and usefulness that the
  // repository contract cannot express. Apply the user limit only after that projection.
  : 2_147_483_647;

type KnowledgeStoreProviders = Pick<
  BrainRecallCommandRuntime,
  "readModelProvider" | "usefulnessProvider"
>;

const hasExplicitRecallSource = (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>
): boolean => command.readModelFiles.length > 0 ||
  command.decisionFiles.length > 0 ||
  command.catalogFiles.length > 0;

const readSqliteStoreModels = async (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>,
  context: ProjectCliCommandContext,
  targetWorkspace: string
): Promise<KnowledgeReadModel[]> => {
  const config = resolveBackendConfig({
    backend: "sqlite",
    env: context.env,
    targetWorkspace
  });
  if (config.kind !== "sqlite") {
    throw new Error("SQLite recall resolved a non-SQLite backend");
  }

  let store;
  try {
    store = await openMemoryLifecycleStore(config, { readonly: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown SQLite open error";
    throw new Error(
      `SQLite memory store is unavailable at ${config.dbPath}: ${detail}. ` +
      "No fixture source defaults to the store path; run persisted init first or pass an explicit fixture source."
    );
  }

  try {
    const connectedProject = await store.projectRepository.getProjectByRepoPath(targetWorkspace);
    const projectId = command.projectId ?? connectedProject?.id;
    if (projectId === undefined) {
      throw new Error(`No SQLite project is connected for target workspace ${targetWorkspace}`);
    }

    const records = await store.memoryRepository.listActiveMemory(
      projectId,
      storeRecallRepositoryLimit(command)
    );
    return records.map(memoryRecordToKnowledgeReadModel);
  } finally {
    await store.close();
  }
};

const createSqliteKnowledgeStoreProviders = async (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>,
  context: ProjectCliCommandContext
): Promise<KnowledgeStoreProviders> => {
  if (hasExplicitRecallSource(command) && !command.storeOnly) {
    return {};
  }
  if (!command.storeOnly) {
    return {};
  }
  const targetWorkspace = await resolveTargetWorkspace({
    cwd: context.cwd,
    env: context.env
  });

  return {
    readModelProvider: () => readSqliteStoreModels(command, context, targetWorkspace)
  };
};

const createPostgresKnowledgeStoreProviders = async (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>,
  context: ProjectCliCommandContext
): Promise<KnowledgeStoreProviders> => {
  const databaseUrl = trimmedEnvValue(context.env.KRN_DATABASE_URL);

  if (databaseUrl === undefined) {
    if (command.storeOnly) {
      throw new Error(
        "KRN_DATABASE_URL is required for krn memory recall store-backed readback. " +
        "No fixture source defaults to the store path; pass --fixture-read-model-file, --fixture-decision-file, or --fixture-catalog-file for an explicit test/import readback."
      );
    }

    return {};
  }

  const createRuntime = context.createDatabaseRuntime ?? createDatabaseRuntime;

  const withRuntime = async <T>(
    read: (runtime: DatabaseRuntime) => Promise<T>
  ): Promise<T> => {
    const databaseRuntime = await createRuntime({
      databaseUrl,
      workspaceSlug: defaultWorkspaceSlug,
      projectSlug: defaultProjectSlug,
      ...(command.projectId === undefined ? {} : { projectId: command.projectId }),
      requireProjectKernelForExplicitProject: false,
      repoPathHint: await findRepoRoot(context.cwd),
      now: context.now,
      createId: context.createId
    });

    try {
      return await read(databaseRuntime);
    } finally {
      await databaseRuntime.close();
    }
  };

  const usefulnessProvider = async (readModels: readonly KnowledgeReadModel[]) =>
    withRuntime(async (runtime) => {
      const feedbackDeltas = await listStoreKnowledgeUsefulnessFeedback({
        projectId: runtime.projectId,
        readModels,
        harnessRunRepository: runtime.harnessRunRepository
      });

      return applyStoreKnowledgeUsefulnessFeedback([...readModels], feedbackDeltas);
    });

  if (!command.storeOnly) {
    return { usefulnessProvider };
  }

  return {
    readModelProvider: async () =>
      withRuntime(async (runtime) => {
        const records = await runtime.memoryRepository.listActiveMemory?.(
          runtime.projectId,
          storeRecallRepositoryLimit(command)
        );

        return (records ?? []).map(memoryRecordToKnowledgeReadModel);
      }),
    usefulnessProvider
  };
};

const createKnowledgeStoreProviders = async (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>,
  context: ProjectCliCommandContext
): Promise<KnowledgeStoreProviders> => {
  const selectedBackend = parseBackendKind(context.env.KRN_DB_BACKEND) ?? "sqlite";
  const useNativeSqliteStore = context.createDatabaseRuntime === undefined &&
    selectedBackend === "sqlite";

  return useNativeSqliteStore
    ? createSqliteKnowledgeStoreProviders(command, context)
    : createPostgresKnowledgeStoreProviders(command, context);
};

const projectFallbackMessages = {
  init: "Unknown init error",
  brainRecall: "Unknown memory recall error"
} satisfies Record<ProjectCliCommand["kind"], string>;

const runBrainRecallProjectCommand = async (
  command: Extract<ProjectCliCommand, { kind: "brainRecall" }>,
  context: ProjectCliCommandContext
): Promise<ProjectCommandOutput> => {
  const storeProviders = await createKnowledgeStoreProviders(command, context);

  return runBrainRecallCommand({
    cwd: context.cwd,
    readModelFiles: command.readModelFiles,
    decisionFiles: command.decisionFiles,
    catalogFiles: command.catalogFiles,
    filter: command.filter,
    format: command.format,
    ...(command.limit === undefined ? {} : { limit: command.limit }),
    ...storeProviders
  });
};

const runSelectedProjectCommand = async (
  command: ProjectCliCommand,
  context: ProjectCliCommandContext
): Promise<ProjectCommandOutput> => {
  if (command.kind === "init") {
    return runInitCommand({
      cwd: context.cwd,
      env: context.env,
      mode: command.mode,
      repo: command.repo,
      ...(command.backend === undefined ? {} : { backend: command.backend }),
      ...(command.dbPath === undefined ? {} : { dbPath: command.dbPath }),
      ...(command.ownerFiles === undefined ? {} : { ownerFiles: command.ownerFiles }),
      ...(command.mode === "connect" ? { persist: command.persist } : {}),
      ...(context.createInitConnectRuntime === undefined
        ? {}
        : { createInitConnectRuntime: context.createInitConnectRuntime })
    });
  }

  return runBrainRecallProjectCommand(command, context);
};

export const runProjectCliCommand = async (
  command: CliCommand,
  context: ProjectCliCommandContext
): Promise<CliResult | undefined> => {
  if (!isProjectCliCommand(command)) {
    return undefined;
  }

  try {
    const result = await runSelectedProjectCommand(command, context);
    return projectCommandResult(result.stdout);
  } catch (error) {
    return projectCommandError(error, projectFallbackMessages[command.kind], context);
  }
};
