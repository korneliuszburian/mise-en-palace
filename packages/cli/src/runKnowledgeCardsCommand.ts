import path from "node:path";

import type {
  BrainKnowledgeReadModel,
  BrainKnowledgeSearchFilter
} from "@krn/harness";
import {
  brainKnowledgeCardFromRetainedPatternDecision,
  parseBrainKnowledgeReadModel,
  parseRetainedPatternDecision,
  searchBrainKnowledgeCards
} from "@krn/harness";
import {
  readJsonObject
} from "./cliFileBoundary.js";

export type KnowledgeCardsOutputFormat = "text" | "json";

export interface KnowledgeCardsCommandRuntime {
  cwd?: string;
  cardFiles: readonly string[];
  patternFiles: readonly string[];
  catalogFiles: readonly string[];
  filter: BrainKnowledgeSearchFilter;
  format: KnowledgeCardsOutputFormat;
}

export interface KnowledgeCardsCommandResult {
  stdout: string;
}

export interface KnowledgeCardsPreviewResource {
  kind: "krn.brainKnowledge.cards.preview.v1";
  access: "read_only";
  mutation: "none";
  source: "explicit_files";
  filter: BrainKnowledgeSearchFilter;
  cardFiles: string[];
  patternFiles: string[];
  catalogFiles: string[];
  cards: BrainKnowledgeReadModel[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

const proof = {
  proves: [
    "supplied files parse as BrainKnowledgeReadModel or retained pattern decisions",
    "local readback filters were applied deterministically"
  ],
  doesNotProve: [
    "knowledge cards were produced from live DB state",
    "search ranking quality is good",
    "retained patterns are complete",
    "Memory Core, SourceDecision, candidates, or evidence were mutated",
    "KRN is product-ready"
  ]
} as const;

export const runKnowledgeCardsCommand = async (
  runtime: KnowledgeCardsCommandRuntime
): Promise<KnowledgeCardsCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const loadedCards: BrainKnowledgeReadModel[] = [];
  const resolvedFiles: string[] = [];
  const resolvedPatternFiles: string[] = [];
  const resolvedCatalogFiles: string[] = [];

  for (const cardFile of runtime.cardFiles) {
    await loadCardFile(cardFile, path.resolve(cwd, cardFile), loadedCards);
    resolvedFiles.push(cardFile);
  }

  for (const patternFile of runtime.patternFiles) {
    await loadPatternFile(patternFile, path.resolve(cwd, patternFile), loadedCards);
    resolvedPatternFiles.push(patternFile);
  }

  for (const catalogFile of runtime.catalogFiles) {
    const resolvedCatalogFile = path.resolve(cwd, catalogFile);
    const catalog = parseKnowledgeCatalog(await readJsonObject(resolvedCatalogFile));

    if (catalog === undefined) {
      throw new Error(`Invalid brain knowledge catalog file: ${catalogFile}`);
    }

    const catalogDirectory = path.dirname(resolvedCatalogFile);

    for (const cardFile of catalog.cardFiles) {
      const resolvedCardFile = path.resolve(catalogDirectory, cardFile);
      await loadCardFile(`${catalogFile}:${cardFile}`, resolvedCardFile, loadedCards);
      resolvedFiles.push(`${catalogFile}:${cardFile}`);
    }

    for (const patternFile of catalog.patternFiles) {
      const resolvedPatternFile = path.resolve(catalogDirectory, patternFile);
      await loadPatternFile(`${catalogFile}:${patternFile}`, resolvedPatternFile, loadedCards);
      resolvedPatternFiles.push(`${catalogFile}:${patternFile}`);
    }

    resolvedCatalogFiles.push(catalogFile);
  }

  const resource: KnowledgeCardsPreviewResource = {
    kind: "krn.brainKnowledge.cards.preview.v1",
    access: "read_only",
    mutation: "none",
    source: "explicit_files",
    filter: runtime.filter,
    cardFiles: resolvedFiles,
    patternFiles: resolvedPatternFiles,
    catalogFiles: resolvedCatalogFiles,
    cards: searchBrainKnowledgeCards(loadedCards, runtime.filter),
    proof: {
      proves: [...proof.proves],
      doesNotProve: [...proof.doesNotProve]
    }
  };

  return {
    stdout: runtime.format === "json"
      ? `${JSON.stringify(resource, null, 2)}\n`
      : formatKnowledgeCardsPreview(resource)
  };
};

const formatKnowledgeCardsPreview = (resource: KnowledgeCardsPreviewResource): string =>
  [
    "KRN Brain Knowledge Cards Preview",
    "Access: read-only",
    "Mutation: none",
    "Source: explicit files",
    `Catalog files: ${formatList(resource.catalogFiles)}`,
    `Card files: ${formatList(resource.cardFiles)}`,
    `Pattern files: ${formatList(resource.patternFiles)}`,
    `Results: ${resource.cards.length}`,
    "",
    ...resource.cards.flatMap(formatCard),
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n") + "\n";

const formatCard = (card: BrainKnowledgeReadModel): string[] => [
  `- ${card.id}`,
  `  title: ${card.title}`,
  `  kind: ${card.kind}`,
  `  status: ${card.status}`,
  `  confidence: ${card.confidence}`,
  `  reviewability: ${card.reviewability}`,
  `  nextAction: ${card.nextAction}`,
  `  summary: ${card.summary}`,
  `  sourceRefs: ${card.sourceRefs.join(", ")}`,
  `  evidenceRefs: ${card.evidenceRefs.join(", ")}`,
  `  consumers: ${card.consumers.join(", ")}`,
  `  falsifier: ${card.falsifier}`,
  `  doesNotProve: ${card.doesNotProve}`,
  ""
];

const formatList = (items: readonly string[]): string =>
  items.length === 0 ? "none" : items.join(", ");

type KnowledgeCatalogInput = {
  cardFiles: string[];
  patternFiles: string[];
};

const parseKnowledgeCatalog = (value: unknown): KnowledgeCatalogInput | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardFiles = parseStringArray(value["cardFiles"]);
  const patternFiles = parseStringArray(value["patternFiles"]);

  if (
    cardFiles === undefined ||
    patternFiles === undefined ||
    (cardFiles.length === 0 && patternFiles.length === 0)
  ) {
    return undefined;
  }

  return {
    cardFiles,
    patternFiles
  };
};

const loadCardFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const card = parseBrainKnowledgeReadModel(parsed);

  if (card === undefined) {
    throw new Error(`Invalid BrainKnowledgeReadModel card file: ${label}`);
  }

  cards.push(card);
};

const loadPatternFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const pattern = parseRetainedPatternDecision(parsed);

  if (pattern === undefined) {
    throw new Error(`Invalid retained pattern decision file: ${label}`);
  }

  cards.push(brainKnowledgeCardFromRetainedPatternDecision(pattern));
};

const parseStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0)
    ? value
    : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
