import type {
  CliCommand
} from "./parseArgs.js";
import {
  compactBrainKnowledgeBridgeQueries
} from "./brainKnowledgeQuery.js";
import {
  buildBrainSearchPreviewResource,
  formatBrainSearchPreviewText,
  parseJsonObject,
  returnedBrainKnowledgeCardCount
} from "./brainSearchReadback.js";
import {
  runKnowledgeCardsCommand
} from "./runKnowledgeCardsCommand.js";
import type {
  KnowledgeCardsCommandRuntime,
  KnowledgeCardsCommandResult
} from "./runKnowledgeCardsCommand.js";
import {
  runSourceSearchCommand
} from "./runSourceSearchCommand.js";
import type {
  CreateSourceSearchDatabaseRuntime,
  SourceSearchCommandRuntime,
  SourceSearchCommandResult
} from "./runSourceSearchCommand.js";
import type {
  BaseCommandRuntime
} from "./commandRuntimeSupport.js";

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

const defaultCatalogFile = "docs/brain-knowledge/catalog.json";

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
  }
): Promise<BrainKnowledgeReadback> => {
  if (input.runtime.command.storeOnly) {
    return {
      result: {
        stdout: JSON.stringify({
          totalCards: 0,
          returnedCards: 0,
          cards: [],
          proof: {
            doesNotProve: [
              "brain knowledge catalog readback was explicitly skipped by --store-only"
            ]
          }
        })
      },
      queries: []
    };
  }

  const primaryResult = await runCatalogKnowledgeReadback(input);
  const primaryJson = parseJsonObject(primaryResult.stdout, "brain knowledge");

  if (returnedBrainKnowledgeCardCount(primaryJson) > 0) {
    return {
      result: primaryResult,
      queries: [input.query]
    };
  }

  const compactQueries = compactBrainKnowledgeBridgeQueries(input.query);
  const attemptedQueries = [input.query, ...compactQueries];

  for (const compactQuery of compactQueries) {
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
  const catalogFiles =
    runtime.command.catalogFiles.length === 0
      ? [defaultCatalogFile]
      : runtime.command.catalogFiles;
  const runKnowledge = runtime.runKnowledgeCards ?? runKnowledgeCardsCommand;
  const runSource = runtime.runSourceSearch ?? runSourceSearchCommand;
  const knowledgeResultPromise = runBrainKnowledgeReadback({
    runtime,
    runKnowledge,
    catalogFiles,
    query
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
    brainKnowledgeReadback: runtime.command.storeOnly ? "store_only" : "catalog_files",
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
