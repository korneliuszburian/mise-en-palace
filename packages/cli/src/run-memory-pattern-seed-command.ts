import path from "node:path";

import type { CreateMemoryCandidateInput } from "@krn/harness/repositories";
import type { BrainKnowledgeDecision } from "@krn/harness";
import { parseBrainKnowledgeDecision } from "@krn/harness";

import {
  noStorePreviewLabel,
  persistenceLine,
  postgresPersistedLabel
} from "./command-runtime-support.js";
import type { BaseCommandRuntime } from "./command-runtime-support.js";
import {
  readJsonObject,
  resolveRepoInputFile
} from "./cli-file-boundary.js";
import {
  createMemoryCommandDatabaseRuntime
} from "./memory-command-support.js";
import type { CreateMemoryCommandDatabaseRuntime } from "./memory-command-support.js";
import type { CliCommand } from "./parse-args.js";

type MemoryPatternSeedCommand = Extract<CliCommand, { kind: "memoryPatternSeed" }>;

export interface MemoryPatternSeedCommandRuntime extends BaseCommandRuntime {
  cwd?: string;
  command: MemoryPatternSeedCommand;
  createDatabaseRuntime?: CreateMemoryCommandDatabaseRuntime;
}

export interface MemoryPatternSeedCommandResult {
  stdout: string;
}

const SEED_PROPOSED_BY = "krn memory brain knowledge seed";
const SEED_REVIEWER = "krn memory brain knowledge seed";

const confidenceValue = (confidence: BrainKnowledgeDecision["confidence"]): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 60 : confidence === "low" ? 30 : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sourceLineageFromRefs = (
  sourceRefs: readonly string[]
): CreateMemoryCandidateInput["sourceLineage"] =>
  sourceRefs.map((sourceId) => ({ sourceId }));

/**
 * Map a parsed brain knowledge decision into the store-backed memory candidate
 * input. Pure + unit-testable; the seed command writes it via the proven
 * createMemoryCandidate + promoteReviewedMemoryCandidate path.
 */
export const brainKnowledgeDecisionToMemoryCandidateInput = (
  decision: BrainKnowledgeDecision,
  projectId: string,
  now: string
): CreateMemoryCandidateInput => ({
  projectId,
  proposedBy: SEED_PROPOSED_BY,
  kind: "pattern",
  summary: decision.name,
  body: decision.decision,
  owner: decision.consumers[0] ?? SEED_PROPOSED_BY,
  confidence: confidenceValue(decision.confidence),
  applicationGuidance: decision.decision,
  invalidationRule: decision.falsifier,
  sourceLineage: sourceLineageFromRefs(decision.sourceRefs),
  isUserPreference: false,
  validFrom: now,
  metadata: {
    knowledgeId: decision.knowledgeId,
    decisionStatus: decision.decisionStatus,
    reviewability: decision.reviewability,
    nextAction: decision.nextAction,
    doesNotProve: decision.doesNotProve,
    sourceRefs: decision.sourceRefs
  }
});

const recordKeyForKnowledge = (knowledgeId: string): string => `pattern:${knowledgeId}`;

interface LoadedBrainKnowledgeDecision {
  readonly decision: BrainKnowledgeDecision;
  readonly sourceFile: string;
}

const knowledgeFilesFromCatalog = (
  catalogFile: string,
  value: unknown
): string[] => {
  if (!isRecord(value)) {
    throw new Error(`Invalid brain knowledge catalog file: ${catalogFile}`);
  }

  const knowledgeFiles = value["knowledgeFiles"];

  if (
    !Array.isArray(knowledgeFiles) ||
    knowledgeFiles.length === 0 ||
    !knowledgeFiles.every((item) => typeof item === "string" && item.trim().length > 0)
  ) {
    throw new Error(`Invalid brain knowledge catalog file: ${catalogFile} (knowledgeFiles must be a non-empty string array)`);
  }

  return knowledgeFiles;
};

const loadBrainKnowledgeDecisionsFromCatalog = async (
  cwd: string,
  catalogFile: string
): Promise<LoadedBrainKnowledgeDecision[]> => {
  const resolvedCatalogFile = await resolveRepoInputFile(cwd, catalogFile);
  const catalog = await readJsonObject(resolvedCatalogFile);
  const knowledgeFiles = knowledgeFilesFromCatalog(catalogFile, catalog);
  const catalogDirectory = path.dirname(resolvedCatalogFile);
  const loaded: LoadedBrainKnowledgeDecision[] = [];

  for (const knowledgeFile of knowledgeFiles) {
    const resolvedKnowledgeFile = path.resolve(catalogDirectory, knowledgeFile);
    const parsed = await readJsonObject(resolvedKnowledgeFile);
    const decision = parseBrainKnowledgeDecision(parsed);

    if (decision === undefined) {
      throw new Error(`Invalid brain knowledge decision file: ${catalogFile}:${knowledgeFile}`);
    }

    loaded.push({ decision, sourceFile: `${catalogFile}:${knowledgeFile}` });
  }

  return loaded;
};

const existingKnowledgeIds = (records: readonly { metadata: Record<string, unknown> }[]): Set<string> => {
  const ids = new Set<string>();

  for (const record of records) {
    const knowledgeId = record.metadata?.knowledgeId;

    if (typeof knowledgeId === "string") {
      ids.add(knowledgeId);
    }
  }

  return ids;
};

export const runMemoryPatternSeedCommand = async (
  runtime: MemoryPatternSeedCommandRuntime
): Promise<MemoryPatternSeedCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const command = runtime.command;
  const loaded = await loadBrainKnowledgeDecisionsFromCatalog(cwd, command.catalogFile);

  if (!command.persist || command.dryRun) {
    return {
      stdout: formatSeedPreview(loaded, command, false)
    };
  }

  const db = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory brain knowledge seed --persist"
  );

  try {
    const projectId = db.projectId;
    const existing = existingKnowledgeIds(
      await db.memoryRepository.listMemoryRecordsForProject(projectId)
    );
    let createdCount = 0;
    let skippedCount = 0;

    for (const { decision } of loaded) {
      if (existing.has(decision.knowledgeId)) {
        skippedCount += 1;
        continue;
      }

      const candidate = await db.memoryRepository.createMemoryCandidate(
        brainKnowledgeDecisionToMemoryCandidateInput(decision, projectId, runtime.now())
      );
      await db.memoryRepository.promoteReviewedMemoryCandidate({
        candidateId: candidate.id,
        reviewer: SEED_REVIEWER,
        decision: "accepted",
        recordKey: recordKeyForKnowledge(decision.knowledgeId)
      });
      existing.add(decision.knowledgeId);
      createdCount += 1;
    }

    return {
      stdout: formatSeedPreview(loaded, command, true, createdCount, skippedCount)
    };
  } finally {
    await db.close();
  }
};

const formatSeedPreview = (
  loaded: LoadedBrainKnowledgeDecision[],
  command: MemoryPatternSeedCommand,
  persisted: boolean,
  createdCount?: number,
  skippedCount?: number
): string => {
  const lines = [
    "KRN Memory Brain Knowledge Seed",
    `Catalog file: ${command.catalogFile}`,
    `Brain knowledge decisions in catalog: ${loaded.length}`,
    ...(command.dryRun ? ["Mode: dry-run (no writes)"] : [])
  ];

  if (persisted) {
    lines.push(`Created: ${createdCount ?? 0}`);
    lines.push(`Skipped (already seeded): ${skippedCount ?? 0}`);
    lines.push(persistenceLine(postgresPersistedLabel));
  } else {
    lines.push(noStorePreviewLabel);
  }

  lines.push("", "Brain knowledge decisions:");

  for (const { decision, sourceFile } of loaded) {
    lines.push(`- ${decision.knowledgeId} (${decision.decisionStatus}) <- ${sourceFile}`);
  }

  return `${lines.join("\n")}\n`;
};
