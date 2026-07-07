import type {
  CliCommand
} from "./parse-args.js";
import {
  compactBrainKnowledgeBridgeQueries
} from "./brain-knowledge-query.js";
import {
  buildBrainSearchPreviewResource,
  formatBrainSearchPreviewText,
  parseJsonObject,
  returnedBrainKnowledgeCardCount
} from "./brain-search-readback.js";
import {
  runKnowledgeCardsCommand
} from "./run-knowledge-cards-command.js";
import type {
  KnowledgeCardsCommandRuntime,
  KnowledgeCardsCommandResult
} from "./run-knowledge-cards-command.js";
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
  defaultWorkspaceSlug,
  defaultProjectSlug,
  createDatabaseRuntime
} from "./database-runtime.js";
import {
  findRepoRoot
} from "./cli-file-boundary.js";
import {
  memoryRecordToKnowledgeCard
} from "./memory-knowledge-card.js";

export type BrainSearchCommand = Extract<CliCommand, { kind: "brainSearch" }>;

export interface BrainSearchCommandRuntime extends BaseCommandRuntime {
  cwd: string;
  command: BrainSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
  runKnowledgeCards?: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
  runSourceSearch?: (runtime: SourceSearchCommandRuntime) => Promise<SourceSearchCommandResult>;
}

export interface BrainSearchCommandResult {
  stdout: string;
}

type BrainKnowledgeReadback = {
  result: KnowledgeCardsCommandResult;
  queries: readonly string[];
};

const maxBrainSearchCompactQueryRetries = 6;

const skippedStoreOnlyReadback = (reason?: string): BrainKnowledgeReadback => ({
  result: {
    stdout: JSON.stringify({
      totalCards: 0,
      returnedCards: 0,
      cards: [],
      proof: {
        doesNotProve: [
          "brain knowledge catalog readback was explicitly skipped by --store-only",
          ...(reason === undefined ? [] : [reason])
        ]
      }
    })
  },
  queries: []
});

const runStoreMemoryReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    query: string;
  }
): Promise<BrainKnowledgeReadback> => {
  const databaseUrl = input.runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    return skippedStoreOnlyReadback();
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

    if (typeof databaseRuntime.memoryRepository.listActiveMemory !== "function") {
      return skippedStoreOnlyReadback(
        "DB memory-store readback was unavailable because the runtime did not expose active MemoryRecord listing."
      );
    }

    const records = await databaseRuntime.memoryRepository.listActiveMemory(
      databaseRuntime.projectId,
      limit
    );
    const cards = records.map(memoryRecordToKnowledgeCard);

    return {
      result: {
        stdout: JSON.stringify({
          kind: "krn.brainKnowledge.cards.preview.v1",
          access: "read_only",
          mutation: "none",
          source: "memory_store",
          filter: {
            text: input.query
          },
          totalCards: cards.length,
          returnedCards: cards.length,
          cards,
          proof: {
            proves: [
              "store-only brain search read active MemoryRecord rows from the configured DB project",
              "MemoryRecords were converted to BrainKnowledgeReadModel packets before brain-search selection"
            ],
            doesNotProve: [
              "DB-backed memory selection proves source truth",
              "Codex used the selected memory",
              "memory ranking quality is broad or production-ready",
              "catalog-file brain knowledge was consulted"
            ]
          }
        })
      },
      queries: [input.query]
    };
  } catch (error) {
    return skippedStoreOnlyReadback(
      `DB memory-store readback was unavailable: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  } finally {
    await databaseRuntime?.close();
  }
};

const runCatalogKnowledgeReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runKnowledge: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
    catalogFiles: readonly string[];
    query: string;
  }
): Promise<KnowledgeCardsCommandResult> =>
  input.runKnowledge({
    cwd: input.runtime.cwd,
    cardFiles: [],
    patternFiles: [],
    catalogFiles: input.catalogFiles,
    filter: {
      text: input.query
    },
    format: "json",
    ...(input.runtime.command.limit === undefined
      ? {}
      : { limit: input.runtime.command.limit })
  });

const runBrainKnowledgeReadback = async (
  input: {
    runtime: BrainSearchCommandRuntime;
    runKnowledge: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
    catalogFiles: readonly string[];
    query: string;
    useStoreReadback: boolean;
    readStoreMemory: boolean;
  }
): Promise<BrainKnowledgeReadback> => {
  if (input.useStoreReadback) {
    return input.readStoreMemory
      ? runStoreMemoryReadback({
          runtime: input.runtime,
          query: input.query
        })
      : skippedStoreOnlyReadback();
  }

  const primaryResult = await runCatalogKnowledgeReadback(input);
  const primaryJson = parseJsonObject(primaryResult.stdout, "brain knowledge");

  if (returnedBrainKnowledgeCardCount(primaryJson) > 0) {
    return {
      result: primaryResult,
      queries: [input.query]
    };
  }

  const compactQueries = compactBrainKnowledgeBridgeQueries(input.query)
    .slice(0, maxBrainSearchCompactQueryRetries);
  const attemptedQueries = [input.query];

  for (const compactQuery of compactQueries) {
    attemptedQueries.push(compactQuery);
    const compactResult = await runCatalogKnowledgeReadback({
      ...input,
      query: compactQuery
    });
    const compactJson = parseJsonObject(compactResult.stdout, "brain knowledge compact retry");

    if (returnedBrainKnowledgeCardCount(compactJson) > 0) {
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
  const runKnowledge = runtime.runKnowledgeCards ?? runKnowledgeCardsCommand;
  const runSource = runtime.runSourceSearch ?? runSourceSearchCommand;
  const knowledgeResultPromise = runBrainKnowledgeReadback({
    runtime,
    runKnowledge,
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
    brainKnowledgeReadback: useStoreReadback ? "store_only" : "catalog_files",
    brainKnowledgeQueries: knowledgeResult.queries,
    knowledgeJson: parseJsonObject(knowledgeResult.result.stdout, "brain knowledge"),
    sourceJson: parseJsonObject(sourceResult.stdout, "source search")
  });

  return {
    stdout:
      runtime.command.format === "json"
        ? `${JSON.stringify(resource, null, 2)}\n`
        : `${formatBrainSearchPreviewText(resource)}\n`
  };
};
