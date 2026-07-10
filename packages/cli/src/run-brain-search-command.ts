import type {
  CliCommand
} from "./parse-args.js";
import {
  compactBrainRecallBridgeQueries
} from "./brain-recall-query.js";
import {
  buildBrainSearchPreviewResource,
  formatBrainSearchPreviewText,
  parseJsonObject,
  returnedKnowledgeReadModelCount
} from "./brain-search-readback.js";
import {
  runBrainRecallCommand
} from "./run-brain-recall-command.js";
import type {
  BrainRecallCommandRuntime,
  BrainRecallCommandResult
} from "./run-brain-recall-command.js";
import {
  runSourceSearchCommand
} from "./run-source-search-command.js";
import type {
  CreateSourceSearchDatabaseRuntime,
  SourceSearchCommandRuntime,
  SourceSearchCommandResult
} from "./run-source-search-command.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";
import {
  tokenizeActivationText
} from "@krn/harness";
import {
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import type {
  DatabaseRuntime
} from "./database-runtime.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  memoryRecordToKnowledgeReadModel
} from "./memory-record-knowledge-read-model.js";
import {
  applyStoreKnowledgeUsefulnessFeedback,
  listStoreKnowledgeUsefulnessFeedback
} from "./store-knowledge-usefulness-selection.js";

export type BrainSearchCommand = Extract<CliCommand, { kind: "brainSearch" }>;

export interface BrainSearchCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: BrainSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
  runBrainRecall?: (runtime: BrainRecallCommandRuntime) => Promise<BrainRecallCommandResult>;
  runSourceSearch?: (runtime: SourceSearchCommandRuntime) => Promise<SourceSearchCommandResult>;
}

export interface BrainSearchCommandResult {
  stdout: string;
}

type BrainRecallReadback = {
  result: BrainRecallCommandResult;
  queries: readonly string[];
};

const maxBrainSearchCompactQueryRetries = 6;

const emptyStoreMemoryReadback = (reason?: string): BrainRecallReadback => ({
  result: {
    stdout: JSON.stringify({
      totalReadModels: 0,
      returnedReadModels: 0,
      readModels: [],
      proof: {
        doesNotProve: [
          "memory recall fixture catalog readback is unavailable in product memory search",
          ...(reason === undefined ? [] : [reason])
        ]
      }
    })
  },
  queries: []
});

const buildStoreMemoryReadback = (
  input: {
    query: string;
    usefulnessSelection: ReturnType<typeof applyStoreKnowledgeUsefulnessFeedback>;
  }
): BrainRecallReadback => ({
  result: {
    stdout: JSON.stringify({
      kind: "krn.memory.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "memory_store",
      filter: {
        text: input.query
      },
      totalReadModels: input.usefulnessSelection.readModels.length,
      returnedReadModels: input.usefulnessSelection.readModels.length,
      readModels: input.usefulnessSelection.readModels,
      proof: {
        proves: [
          "store-backed memory search read active MemoryRecord rows from the configured DB project",
          "MemoryRecords were converted to KnowledgeReadModel packets before brain-search selection",
          ...(input.usefulnessSelection.appliedUsefulnessFeedback
            ? ["store-backed memory search applied usefulness feedback before selecting knowledge"]
            : [])
        ],
        doesNotProve: [
          "DB-backed memory selection proves source truth",
          "Codex used the selected memory",
          "memory ranking quality is broad or production-ready",
          ...(input.usefulnessSelection.appliedUsefulnessFeedback
            ? ["store-backed usefulness feedback proves broad ranking quality"]
            : ["store-backed usefulness feedback was available"]),
          "fixture catalog knowledge was consulted"
        ]
      }
    })
  },
  queries: [input.query]
});

const readStoreMemoryFromDatabase = async (
  input: {
    databaseRuntime: DatabaseRuntime;
    query: string;
    limit: number;
  }
): Promise<BrainRecallReadback> => {
  if (typeof input.databaseRuntime.memoryRepository.listActiveMemory !== "function") {
    return emptyStoreMemoryReadback(
      "DB memory-store readback was unavailable because the runtime did not expose active MemoryRecord listing."
    );
  }

  const records = await input.databaseRuntime.memoryRepository.listActiveMemory(
    input.databaseRuntime.projectId,
    input.limit,
    { terms: tokenizeActivationText(input.query) }
  );
  const readModels = records.map(memoryRecordToKnowledgeReadModel);
  const feedbackDeltas = await listStoreKnowledgeUsefulnessFeedback({
    projectId: input.databaseRuntime.projectId,
    readModels,
    harnessRunRepository: input.databaseRuntime.harnessRunRepository
  });
  const usefulnessSelection = applyStoreKnowledgeUsefulnessFeedback(
    readModels,
    feedbackDeltas
  );

  return buildStoreMemoryReadback({
    query: input.query,
    usefulnessSelection
  });
};

const runStoreMemoryReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    query: string;
  }
): Promise<BrainRecallReadback> => {
  const databaseUrl = input.runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return emptyStoreMemoryReadback();
  }

  const createRuntime = input.runtime.createDatabaseRuntime ?? createDatabaseRuntime;
  let databaseRuntime: Awaited<ReturnType<typeof createRuntime>> | undefined;

  try {
    databaseRuntime = await createRuntime({
      databaseUrl,
      workspaceSlug: defaultWorkspaceSlug,
      projectSlug: defaultProjectSlug,
      ...(input.runtime.command.projectId === undefined
        ? {}
        : { projectId: input.runtime.command.projectId }),
      requireProjectKernelForExplicitProject: false,
      repoPathHint: await findRepoRoot(input.runtime.cwd),
      now: input.runtime.now,
      createId: input.runtime.createId
    });
    const limit = input.runtime.command.limit ?? 20;

    return await readStoreMemoryFromDatabase({
      databaseRuntime,
      query: input.query,
      limit
    });
  } catch (error) {
    return emptyStoreMemoryReadback(
      `DB memory-store readback was unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  } finally {
    await databaseRuntime?.close();
  }
};

const runCatalogBrainRecallReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runBrainRecall: (runtime: BrainRecallCommandRuntime) => Promise<BrainRecallCommandResult>;
    catalogFiles: readonly string[];
    query: string;
  }
): Promise<BrainRecallCommandResult> =>
  input.runBrainRecall({
    cwd: input.runtime.cwd,
    readModelFiles: [],
    decisionFiles: [],
    catalogFiles: input.catalogFiles,
    filter: {
      text: input.query
    },
    format: "json",
    ...(input.runtime.command.limit === undefined
      ? {}
      : { limit: input.runtime.command.limit })
  });

const runBrainRecallReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runBrainRecall: (runtime: BrainRecallCommandRuntime) => Promise<BrainRecallCommandResult>;
    catalogFiles: readonly string[];
    query: string;
    useStoreReadback: boolean;
    readStoreMemory: boolean;
  }
): Promise<BrainRecallReadback> => {
  if (input.useStoreReadback) {
    return input.readStoreMemory
      ? runStoreMemoryReadback({
          runtime: input.runtime,
          query: input.query
        })
      : emptyStoreMemoryReadback();
  }

  const primaryResult = await runCatalogBrainRecallReadback(input);
  const primaryJson = parseJsonObject(primaryResult.stdout, "memory recall");

  if (returnedKnowledgeReadModelCount(primaryJson) > 0) {
    return {
      result: primaryResult,
      queries: [input.query]
    };
  }

  const compactQueries = compactBrainRecallBridgeQueries(input.query)
    .slice(0, maxBrainSearchCompactQueryRetries);
  const attemptedQueries = [input.query];

  for (const compactQuery of compactQueries) {
    attemptedQueries.push(compactQuery);
    const compactResult = await runCatalogBrainRecallReadback({
      ...input,
      query: compactQuery
    });
    const compactJson = parseJsonObject(compactResult.stdout, "memory recall compact retry");

    if (returnedKnowledgeReadModelCount(compactJson) > 0) {
      return {
        result: compactResult,
        queries: attemptedQueries
      };
    }
  }

  return {
    result: primaryResult,
    queries: attemptedQueries
  };
};

export const runBrainSearchCommand = async (
  runtime: BrainSearchCommandRuntime
): Promise<BrainSearchCommandResult> => {
  const query = runtime.command.query.trim();
  const catalogFiles = runtime.command.catalogFiles;
  const useStoreReadback = runtime.command.storeOnly || catalogFiles.length === 0;
  const readStoreMemory =
    useStoreReadback && (runtime.runSourceSearch === undefined || runtime.createDatabaseRuntime !== undefined);
  const runBrainRecall = runtime.runBrainRecall ?? runBrainRecallCommand;
  const runSource = runtime.runSourceSearch ?? runSourceSearchCommand;
  const knowledgeResultPromise = runBrainRecallReadback({
    runtime,
    runBrainRecall,
    catalogFiles,
    query,
    useStoreReadback,
    readStoreMemory
  });
  const [knowledgeResult, sourceResult] = await Promise.all([
    knowledgeResultPromise,
    runSource({
      cwd: runtime.cwd,
      env: runtime.env,
      now: runtime.now,
      createId: runtime.createId,
      command: {
        kind: "sourceSearch",
        query,
        json: true,
        ...(runtime.command.projectId === undefined
          ? {}
          : { projectId: runtime.command.projectId }),
        ...(runtime.command.limit === undefined ? {} : { limit: runtime.command.limit }),
        ...(runtime.command.maxInclusions === undefined
          ? {}
          : { maxInclusions: runtime.command.maxInclusions })
      },
      ...(runtime.createDatabaseRuntime === undefined
        ? {}
        : { createDatabaseRuntime: runtime.createDatabaseRuntime })
    })
  ]);
  const resource = buildBrainSearchPreviewResource({
    query,
    memoryRecallReadback: useStoreReadback ? "store_backed" : "fixture_catalog",
    memoryRecallQueries: knowledgeResult.queries,
    knowledgeJson: parseJsonObject(knowledgeResult.result.stdout, "memory recall"),
    sourceJson: parseJsonObject(sourceResult.stdout, "source search")
  });

  return {
    stdout:
      runtime.command.format === "json"
        ? `${JSON.stringify(resource, null, 2)}\n`
        : `${formatBrainSearchPreviewText(resource)}\n`
  };
};
