import type {
  FeedbackDelta
} from "@krn/core";
import {
  brainKnowledgeUsefulnessOutcomesFromMetadata
} from "@krn/core";
import {
  brainKnowledgeUsefulnessFromKnowledgeOutcomes
} from "@krn/harness";
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
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  memoryRecordToKnowledgeCard
} from "./memory-knowledge-card.js";
import {
  runBrainKnowledgeCommand
} from "./run-brain-knowledge-command.js";
import type {
  BrainKnowledgeCommandRuntime
} from "./run-brain-knowledge-command.js";

type ProjectCliCommand = Extract<
  CliCommand,
  | { kind: "init" }
  | { kind: "brainKnowledge" }
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
  command.kind === "brainKnowledge"
);

const trimmedEnvValue = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
};

const feedbackDeltasToBrainKnowledgeUsefulness = (
  feedbackDeltas: readonly FeedbackDelta[]
) =>
  feedbackDeltas.flatMap((feedback) =>
    brainKnowledgeUsefulnessFromKnowledgeOutcomes(
      brainKnowledgeUsefulnessOutcomesFromMetadata(feedback.metadata),
      feedback.createdAt
    )
  );

const createBrainKnowledgeStoreProviders = async (
  command: Extract<ProjectCliCommand, { kind: "brainKnowledge" }>,
  context: ProjectCliCommandContext
): Promise<Pick<BrainKnowledgeCommandRuntime, "cardProvider" | "usefulnessProvider">> => {
  const databaseUrl = trimmedEnvValue(context.env.KRN_DATABASE_URL);

  if (databaseUrl === undefined) {
    if (command.storeOnly) {
      throw new Error(
        "KRN_DATABASE_URL is required for krn brain knowledge store-backed readback. " +
        "No file source defaults to the store path; pass --card-file, --knowledge-file, or --catalog-file for an explicit fixture/seed preview."
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

  const usefulnessProvider = async () =>
    withRuntime(async (runtime) => {
      const listFeedbackDeltasForProject =
        runtime.harnessRunRepository.listFeedbackDeltasForProject;

      if (listFeedbackDeltasForProject === undefined) {
        return [];
      }

      const feedbackDeltas = await listFeedbackDeltasForProject(
        runtime.projectId
      );

      return feedbackDeltasToBrainKnowledgeUsefulness(feedbackDeltas);
    });

  if (!command.storeOnly) {
    return { usefulnessProvider };
  }

  return {
    cardProvider: async () =>
      withRuntime(async (runtime) => {
        const records = await runtime.memoryRepository.listActiveMemory?.(
          runtime.projectId,
          command.limit ?? 100
        );

        return (records ?? []).map(memoryRecordToKnowledgeCard);
      }),
    usefulnessProvider
  };
};

const projectFallbackMessages = {
  init: "Unknown init error",
  brainKnowledge: "Unknown brain knowledge error"
} satisfies Record<ProjectCliCommand["kind"], string>;

const runBrainKnowledgeProjectCommand = async (
  command: Extract<ProjectCliCommand, { kind: "brainKnowledge" }>,
  context: ProjectCliCommandContext
): Promise<ProjectCommandOutput> => {
  const storeProviders = await createBrainKnowledgeStoreProviders(command, context);

  return runBrainKnowledgeCommand({
    cwd: context.cwd,
    cardFiles: command.cardFiles,
    knowledgeFiles: command.knowledgeFiles,
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
      ...(command.ownerFiles === undefined ? {} : { ownerFiles: command.ownerFiles }),
      ...(command.mode === "connect" ? { persist: command.persist } : {}),
      ...(context.createInitConnectRuntime === undefined
        ? {}
        : { createInitConnectRuntime: context.createInitConnectRuntime })
    });
  }

  return runBrainKnowledgeProjectCommand(command, context);
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
