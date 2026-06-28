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

  for (const cardFile of runtime.cardFiles) {
    const resolvedFile = path.resolve(cwd, cardFile);
    const parsed = await readJsonObject(resolvedFile);
    const card = parseBrainKnowledgeReadModel(parsed);

    if (card === undefined) {
      throw new Error(`Invalid BrainKnowledgeReadModel card file: ${cardFile}`);
    }

    loadedCards.push(card);
    resolvedFiles.push(cardFile);
  }

  for (const patternFile of runtime.patternFiles) {
    const resolvedFile = path.resolve(cwd, patternFile);
    const parsed = await readJsonObject(resolvedFile);
    const pattern = parseRetainedPatternDecision(parsed);

    if (pattern === undefined) {
      throw new Error(`Invalid retained pattern decision file: ${patternFile}`);
    }

    loadedCards.push(brainKnowledgeCardFromRetainedPatternDecision(pattern));
    resolvedPatternFiles.push(patternFile);
  }

  const resource: KnowledgeCardsPreviewResource = {
    kind: "krn.brainKnowledge.cards.preview.v1",
    access: "read_only",
    mutation: "none",
    source: "explicit_files",
    filter: runtime.filter,
    cardFiles: resolvedFiles,
    patternFiles: resolvedPatternFiles,
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
