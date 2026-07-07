import path from "node:path";

import type { CreateMemoryCandidateInput } from "@krn/harness/repositories";
import type { RetainedPatternDecision } from "@krn/harness";
import { parseRetainedPatternDecision } from "@krn/harness";

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

const SEED_PROPOSED_BY = "krn memory pattern seed";
const SEED_REVIEWER = "krn memory pattern seed";

const confidenceValue = (confidence: RetainedPatternDecision["confidence"]): number =>
  confidence === "high" ? 90 : confidence === "medium" ? 60 : confidence === "low" ? 30 : 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sourceLineageFromRefs = (
  sourceRefs: readonly string[]
): CreateMemoryCandidateInput["sourceLineage"] =>
  sourceRefs.map((sourceId) => ({ sourceId }));

/**
 * Map a parsed retained-pattern decision into the store-backed memory candidate
 * input. Pure + unit-testable; the seed command writes it via the proven
 * createMemoryCandidate + promoteReviewedMemoryCandidate path.
 */
export const retainedPatternToMemoryCandidateInput = (
  pattern: RetainedPatternDecision,
  projectId: string,
  now: string
): CreateMemoryCandidateInput => ({
  projectId,
  proposedBy: SEED_PROPOSED_BY,
  kind: "pattern",
  summary: pattern.name,
  body: pattern.decision,
  owner: pattern.consumers[0] ?? SEED_PROPOSED_BY,
  confidence: confidenceValue(pattern.confidence),
  applicationGuidance: pattern.decision,
  invalidationRule: pattern.falsifier,
  sourceLineage: sourceLineageFromRefs(pattern.sourceRefs),
  isUserPreference: false,
  validFrom: now,
  metadata: {
    patternId: pattern.patternId,
    adoptionStatus: pattern.adoptionStatus,
    reviewability: pattern.reviewability,
    nextAction: pattern.nextAction,
    doesNotProve: pattern.doesNotProve,
    sourceRefs: pattern.sourceRefs
  }
});

const recordKeyForPattern = (patternId: string): string => `pattern:${patternId}`;

interface LoadedPattern {
  readonly pattern: RetainedPatternDecision;
  readonly sourceFile: string;
}

const patternFilesFromCatalog = (
  catalogFile: string,
  value: unknown
): string[] => {
  if (!isRecord(value)) {
    throw new Error(`Invalid brain knowledge catalog file: ${catalogFile}`);
  }

  const patternFiles = value["patternFiles"];

  if (
    !Array.isArray(patternFiles) ||
    patternFiles.length === 0 ||
    !patternFiles.every((item) => typeof item === "string" && item.trim().length > 0)
  ) {
    throw new Error(`Invalid brain knowledge catalog file: ${catalogFile} (patternFiles must be a non-empty string array)`);
  }

  return patternFiles;
};

const loadPatternsFromCatalog = async (
  cwd: string,
  catalogFile: string
): Promise<LoadedPattern[]> => {
  const resolvedCatalogFile = await resolveRepoInputFile(cwd, catalogFile);
  const catalog = await readJsonObject(resolvedCatalogFile);
  const patternFiles = patternFilesFromCatalog(catalogFile, catalog);
  const catalogDirectory = path.dirname(resolvedCatalogFile);
  const loaded: LoadedPattern[] = [];

  for (const patternFile of patternFiles) {
    const resolvedPatternFile = path.resolve(catalogDirectory, patternFile);
    const parsed = await readJsonObject(resolvedPatternFile);
    const pattern = parseRetainedPatternDecision(parsed);

    if (pattern === undefined) {
      throw new Error(`Invalid retained pattern decision file: ${catalogFile}:${patternFile}`);
    }

    loaded.push({ pattern, sourceFile: `${catalogFile}:${patternFile}` });
  }

  return loaded;
};

const existingPatternIds = (records: readonly { metadata: Record<string, unknown> }[]): Set<string> => {
  const ids = new Set<string>();

  for (const record of records) {
    const patternId = record.metadata?.patternId;

    if (typeof patternId === "string") {
      ids.add(patternId);
    }
  }

  return ids;
};

export const runMemoryPatternSeedCommand = async (
  runtime: MemoryPatternSeedCommandRuntime
): Promise<MemoryPatternSeedCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const command = runtime.command;
  const loaded = await loadPatternsFromCatalog(cwd, command.catalogFile);

  if (!command.persist || command.dryRun) {
    return {
      stdout: formatSeedPreview(loaded, command, false)
    };
  }

  const db = await createMemoryCommandDatabaseRuntime(
    runtime,
    "KRN_DATABASE_URL is required for krn memory pattern seed --persist"
  );

  try {
    const projectId = db.projectId;
    const existing = existingPatternIds(
      await db.memoryRepository.listMemoryRecordsForProject(projectId)
    );
    let createdCount = 0;
    let skippedCount = 0;

    for (const { pattern } of loaded) {
      if (existing.has(pattern.patternId)) {
        skippedCount += 1;
        continue;
      }

      const candidate = await db.memoryRepository.createMemoryCandidate(
        retainedPatternToMemoryCandidateInput(pattern, projectId, runtime.now())
      );
      await db.memoryRepository.promoteReviewedMemoryCandidate({
        candidateId: candidate.id,
        reviewer: SEED_REVIEWER,
        decision: "accepted",
        recordKey: recordKeyForPattern(pattern.patternId)
      });
      existing.add(pattern.patternId);
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
  loaded: LoadedPattern[],
  command: MemoryPatternSeedCommand,
  persisted: boolean,
  createdCount?: number,
  skippedCount?: number
): string => {
  const lines = [
    "KRN Memory Pattern Seed",
    `Catalog file: ${command.catalogFile}`,
    `Patterns in catalog: ${loaded.length}`,
    ...(command.dryRun ? ["Mode: dry-run (no writes)"] : [])
  ];

  if (persisted) {
    lines.push(`Created: ${createdCount ?? 0}`);
    lines.push(`Skipped (already seeded): ${skippedCount ?? 0}`);
    lines.push(persistenceLine(postgresPersistedLabel));
  } else {
    lines.push(noStorePreviewLabel);
  }

  lines.push("", "Patterns:");

  for (const { pattern, sourceFile } of loaded) {
    lines.push(`- ${pattern.patternId} (${pattern.adoptionStatus}) <- ${sourceFile}`);
  }

  return `${lines.join("\n")}\n`;
};
