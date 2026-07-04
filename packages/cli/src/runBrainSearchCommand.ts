import type {
  MemoryRecord
} from "@krn/core";
import type {
  BrainKnowledgeReadModel
} from "@krn/harness";
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
import {
  createDatabaseRuntime
} from "./databaseRuntime.js";
import {
  findRepoRoot
} from "./cliFileBoundary.js";

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
const defaultWorkspaceSlug = "local";
const defaultProjectSlug = "mise-en-palace";
const maxBrainSearchCompactQueryRetries = 6;

const memoryConfidence = (confidence: number): BrainKnowledgeReadModel["confidence"] => {
  if (confidence >= 80) {
    return "high";
  }

  if (confidence >= 50) {
    return "medium";
  }

  return confidence > 0 ? "low" : "unknown";
};

const memoryStatus = (status: MemoryRecord["status"]): BrainKnowledgeReadModel["status"] => {
  switch (status) {
    case "active":
      return "active";
    case "stale":
      return "stale";
    case "superseded":
      return "superseded";
    case "deprecated":
    case "invalidated":
      return "rejected";
  }
};

const metadataString = (
  metadata: Record<string, unknown>,
  key: string
): string | undefined => {
  const value = metadata[key];

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const sourceLineageEvidenceRefs = (
  memory: MemoryRecord
): string[] =>
  memory.sourceLineage.flatMap((source) =>
    source.note === undefined || source.note.trim().length === 0
      ? []
      : [source.note]
  );

const memoryRecordToKnowledgeCard = (
  memory: MemoryRecord
): BrainKnowledgeReadModel => {
  const evidenceRefs = sourceLineageEvidenceRefs(memory);

  return {
    id: memory.id,
    kind: "memory",
    status: memoryStatus(memory.status),
    title: memory.summary,
    summary: `${memory.body}\n\nApplication guidance: ${memory.applicationGuidance}`,
    confidence: memoryConfidence(memory.confidence),
    reviewability: "ready",
    sourceRefs: memory.sourceLineage.map((source) => source.sourceId),
    evidenceRefs: evidenceRefs.length > 0 ? evidenceRefs : [`memory:${memory.id}`],
    consumers: [memory.owner],
    falsifier:
      metadataString(memory.metadata, "falsifier") ??
      memory.invalidationRule ??
      "The memory no longer matches the operator task or is invalidated by newer source evidence.",
    doesNotProve:
      metadataString(memory.metadata, "doesNotProve") ??
      "DB-backed MemoryRecord selection does not prove source truth, Codex used it, or broad memory ranking quality.",
    temporal: memory.validUntil === undefined
      ? {
          kind: "current",
          observedAt: memory.validFrom
        }
      : {
          kind: "historical",
          validFrom: memory.validFrom,
          validUntil: memory.validUntil
        },
    dissent: {
      kind: "none"
    },
    nextAction: "use"
  };
};

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
    readStoreMemory: boolean;
  }
): Promise<BrainKnowledgeReadback> => {
  if (input.runtime.command.storeOnly) {
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
    query,
    readStoreMemory: runtime.runSourceSearch === undefined || runtime.createDatabaseRuntime !== undefined
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
