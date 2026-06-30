import type {
  BrainKnowledgeSearchFilter
} from "@krn/harness";

import type {
  CliCommand
} from "./parseArgs.js";
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

export type BrainSearchCommand = Extract<CliCommand, { kind: "brainSearch" }>;

export interface BrainSearchCommandRuntime {
  cwd: string;
  env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  command: BrainSearchCommand;
  createDatabaseRuntime?: CreateSourceSearchDatabaseRuntime;
  runKnowledgeCards?: (runtime: KnowledgeCardsCommandRuntime) => Promise<KnowledgeCardsCommandResult>;
  runSourceSearch?: (runtime: SourceSearchCommandRuntime) => Promise<SourceSearchCommandResult>;
}

export interface BrainSearchCommandResult {
  stdout: string;
}

interface JsonRecord {
  readonly [key: string]: unknown;
}

interface BrainSearchPreviewResource {
  kind: "krn.brainSearch.preview.v1";
  access: "read_only";
  mutation: "none";
  query: string;
  knowledgeCards: {
    totalCards: number;
    returnedCards: number;
    cardIds: readonly string[];
    selectedKnowledge: readonly BrainSearchKnowledgePacket[];
    doesNotProve: readonly string[];
  };
  sourceSearch: {
    answerUsefulness: string;
    supportingClaims: number;
    supportingDocuments: number;
    relationSupport: number;
    graphReadback: {
      claimNodes: number;
      relationEdges: number;
      temporalEdges: number;
      contradictionEdges: number;
      duplicateEdges: number;
      invalidationEdges: number;
      graphAware: boolean;
      caveats: readonly string[];
    };
    includedCandidates: number;
    missingEvidence: readonly string[];
    doesNotProve: readonly string[];
  };
  recommendedNextAction: string;
  proof: {
    proves: readonly string[];
    doesNotProve: readonly string[];
  };
}

interface BrainSearchKnowledgePacket {
  id: string;
  title: string;
  summary: string;
  consumers: readonly string[];
  falsifier: string;
  doesNotProve: string;
  nextAction: string;
}

const defaultCatalogFile = "docs/brain-knowledge/catalog.json";

const parseJsonObject = (text: string, label: string): JsonRecord => {
  const parsed: unknown = JSON.parse(text);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} JSON output must be an object`);
  }

  return parsed as JsonRecord;
};

const recordValue = (
  value: unknown
): JsonRecord | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;

const stringValue = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const numberValue = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const arrayValue = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

const stringArrayValue = (value: unknown): readonly string[] =>
  arrayValue(value).filter((item): item is string => typeof item === "string");

const booleanValue = (value: unknown): boolean =>
  typeof value === "boolean" ? value : false;

const proofDoesNotProve = (value: unknown): readonly string[] => {
  const proof = recordValue(value);

  if (proof === undefined) {
    return [];
  }

  return stringArrayValue(proof["doesNotProve"]);
};

const knowledgeCardIds = (cards: readonly unknown[]): readonly string[] =>
  cards.flatMap((card) => {
    const record = recordValue(card);
    const id = record === undefined ? undefined : record["id"];

    return typeof id === "string" ? [id] : [];
  });

const knowledgePackets = (cards: readonly unknown[]): readonly BrainSearchKnowledgePacket[] =>
  cards.flatMap((card) => {
    const record = recordValue(card);

    if (record === undefined) {
      return [];
    }

    const id = record["id"];

    if (typeof id !== "string") {
      return [];
    }

    return [{
      id,
      title: stringValue(record["title"], ""),
      summary: stringValue(record["summary"], ""),
      consumers: stringArrayValue(record["consumers"]),
      falsifier: stringValue(record["falsifier"], ""),
      doesNotProve: stringValue(record["doesNotProve"], ""),
      nextAction: stringValue(record["nextAction"], "unknown")
    }];
  });

const buildRecommendedNextAction = (
  resource: Pick<BrainSearchPreviewResource, "knowledgeCards" | "sourceSearch">
): string => {
  if (
    resource.knowledgeCards.returnedCards > 0 &&
    resource.sourceSearch.supportingClaims + resource.sourceSearch.supportingDocuments > 0
  ) {
    return "Use the matching brain knowledge as pattern guidance and the source-search answer package as evidence before changing code.";
  }

  if (resource.sourceSearch.supportingClaims + resource.sourceSearch.supportingDocuments > 0) {
    return "Use source-search evidence cautiously and run a narrower knowledge-card query before retaining a pattern.";
  }

  if (resource.knowledgeCards.returnedCards > 0) {
    return "Use the matching brain knowledge as guidance, but gather source evidence before implementation claims.";
  }

  return "Do not infer product truth; narrow the query or ingest/review source evidence first.";
};

const buildResource = (
  input: {
    query: string;
    knowledgeJson: JsonRecord;
    sourceJson: JsonRecord;
  }
): BrainSearchPreviewResource => {
  const cards = arrayValue(input.knowledgeJson["cards"]);
  const answerPackage = recordValue(input.sourceJson["answerPackage"]) ?? {};
  const supportingClaims = arrayValue(answerPackage["supportingClaims"]);
  const supportingDocuments = arrayValue(answerPackage["supportingDocuments"]);
  const relationSupport = arrayValue(answerPackage["relationSupport"]);
  const graphReadback = recordValue(answerPackage["graphReadback"]) ?? {};
  const includedCandidates = arrayValue(input.sourceJson["includedCandidates"]);
  const resource: BrainSearchPreviewResource = {
    kind: "krn.brainSearch.preview.v1",
    access: "read_only",
    mutation: "none",
    query: input.query,
    knowledgeCards: {
      totalCards: numberValue(input.knowledgeJson["totalCards"]),
      returnedCards: numberValue(input.knowledgeJson["returnedCards"]),
      cardIds: knowledgeCardIds(cards),
      selectedKnowledge: knowledgePackets(cards),
      doesNotProve: proofDoesNotProve(input.knowledgeJson["proof"])
    },
    sourceSearch: {
      answerUsefulness: stringValue(answerPackage["answerUsefulness"], "unknown"),
      supportingClaims: supportingClaims.length,
      supportingDocuments: supportingDocuments.length,
      relationSupport: relationSupport.length,
      graphReadback: {
        claimNodes: numberValue(graphReadback["claimNodes"]),
        relationEdges: numberValue(graphReadback["relationEdges"]),
        temporalEdges: numberValue(graphReadback["temporalEdges"]),
        contradictionEdges: numberValue(graphReadback["contradictionEdges"]),
        duplicateEdges: numberValue(graphReadback["duplicateEdges"]),
        invalidationEdges: numberValue(graphReadback["invalidationEdges"]),
        graphAware: booleanValue(graphReadback["graphAware"]),
        caveats: stringArrayValue(graphReadback["caveats"])
      },
      includedCandidates: includedCandidates.length,
      missingEvidence: stringArrayValue(answerPackage["missingEvidence"]),
      doesNotProve: proofDoesNotProve(input.sourceJson["proof"])
    },
    recommendedNextAction: "",
    proof: {
      proves: [
        "existing brain-knowledge readback was executed for this query",
        "existing source-search answer package was executed for this query",
        "brain search combined both readbacks without mutating KRN state"
      ],
      doesNotProve: [
        "source truth",
        "knowledge-card completeness",
        "ranking quality",
        "semantic search quality",
        "product readiness",
        "Memory Core mutation"
      ]
    }
  };

  return {
    ...resource,
    recommendedNextAction: buildRecommendedNextAction(resource)
  };
};

const formatText = (resource: BrainSearchPreviewResource): string =>
  [
    "KRN Brain Search Preview",
    "Access: read-only",
    "Mutation: none",
    `Query: ${resource.query}`,
    "",
    "Brain knowledge:",
    `- returned: ${resource.knowledgeCards.returnedCards}`,
    `- total: ${resource.knowledgeCards.totalCards}`,
    ...(resource.knowledgeCards.cardIds.length === 0
      ? ["- cardIds: none"]
      : resource.knowledgeCards.cardIds.map((id) => `- cardId: ${id}`)),
    ...resource.knowledgeCards.selectedKnowledge.flatMap((card) => [
      `- selectedKnowledge: ${card.id}`,
      `  title: ${card.title}`,
      `  summary: ${card.summary}`,
      `  consumers: ${card.consumers.length === 0 ? "none" : card.consumers.join(", ")}`,
      `  falsifier: ${card.falsifier}`,
      `  doesNotProve: ${card.doesNotProve}`,
      `  nextAction: ${card.nextAction}`
    ]),
    "",
    "Source search:",
    `- answerUsefulness: ${resource.sourceSearch.answerUsefulness}`,
    `- supportingClaims: ${resource.sourceSearch.supportingClaims}`,
    `- supportingDocuments: ${resource.sourceSearch.supportingDocuments}`,
    `- relationSupport: ${resource.sourceSearch.relationSupport}`,
    `- graphAware: ${resource.sourceSearch.graphReadback.graphAware}`,
    `- graphRelationEdges: ${resource.sourceSearch.graphReadback.relationEdges}`,
    `- graphTemporalEdges: ${resource.sourceSearch.graphReadback.temporalEdges}`,
    `- graphContradictionEdges: ${resource.sourceSearch.graphReadback.contradictionEdges}`,
    `- graphDuplicateEdges: ${resource.sourceSearch.graphReadback.duplicateEdges}`,
    `- graphInvalidationEdges: ${resource.sourceSearch.graphReadback.invalidationEdges}`,
    ...(resource.sourceSearch.graphReadback.caveats.length === 0
      ? ["- graphCaveats: none"]
      : resource.sourceSearch.graphReadback.caveats.map((item) => `- graphCaveat: ${item}`)),
    `- includedCandidates: ${resource.sourceSearch.includedCandidates}`,
    ...(resource.sourceSearch.missingEvidence.length === 0
      ? ["- missingEvidence: none"]
      : resource.sourceSearch.missingEvidence.map((item) => `- missingEvidence: ${item}`)),
    "",
    `Recommended next action: ${resource.recommendedNextAction}`,
    "",
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n");

export const runBrainSearchCommand = async (
  runtime: BrainSearchCommandRuntime
): Promise<BrainSearchCommandResult> => {
  const query = runtime.command.query.trim();
  const catalogFiles =
    runtime.command.catalogFiles.length === 0
      ? [defaultCatalogFile]
      : runtime.command.catalogFiles;
  const knowledgeFilter: BrainKnowledgeSearchFilter = {
    text: query
  };
  const runKnowledge = runtime.runKnowledgeCards ?? runKnowledgeCardsCommand;
  const runSource = runtime.runSourceSearch ?? runSourceSearchCommand;
  const [knowledgeResult, sourceResult] = await Promise.all([
    runKnowledge({
      cwd: runtime.cwd,
      cardFiles: [],
      patternFiles: [],
      catalogFiles,
      filter: knowledgeFilter,
      format: "json",
      ...(runtime.command.limit === undefined ? {} : { limit: runtime.command.limit })
    }),
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
  const resource = buildResource({
    query,
    knowledgeJson: parseJsonObject(knowledgeResult.stdout, "knowledge cards"),
    sourceJson: parseJsonObject(sourceResult.stdout, "source search")
  });

  return {
    stdout:
      runtime.command.format === "json"
        ? `${JSON.stringify(resource, null, 2)}\n`
        : `${formatText(resource)}\n`
  };
};
