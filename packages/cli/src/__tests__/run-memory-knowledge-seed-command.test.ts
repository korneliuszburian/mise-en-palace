import {
  mkdir,
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type {
  MemoryCandidate,
  MemoryRecord
} from "@krn/core";
import type { KnowledgeDecision } from "@krn/harness";
import type {
  CreateMemoryCandidateInput,
  PromoteMemoryCandidateInput
} from "@krn/core/repositories/internal";

import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import {
  brainRecallDecisionToMemoryCandidateInput,
  runMemoryKnowledgeSeedCommand
} from "../run-memory-knowledge-seed-command.js";
import {
  runBrainSearchCommand
} from "../run-brain-search-command.js";
import {
  unusedMemoryRepository
} from "./helpers/test-runtime.js";

const now = "2026-07-06T00:00:00.000Z";

const fixtureKnowledge = (overrides: Partial<KnowledgeDecision> = {}): KnowledgeDecision => ({
  knowledgeId: "ts-boundary-unknown-first-result-state",
  name: "Unknown-first result state",
  decisionStatus: "adopt_now",
  confidence: "high",
  reviewability: "ready",
  decision: "Keep JSON.parse results unknown until validated.",
  mechanism: "Unknown-first parsing prevents external JSON from entering domain code unchecked.",
  krnImplication: "Seeded knowledge must retain the parser boundary through DB-backed memory readback.",
  sourceRefs: ["packages/core/src/metadata.ts"],
  evidenceRefs: ["tests/fixtures/ts-boundary.json"],
  consumers: ["@krn/core", "@krn/cli"],
  falsifier: "A JSON.parse result assigned to a non-unknown type.",
  doesNotProve: "Seed import does not prove the pattern is current or applied.",
  nextAction: "use",
  ...overrides
});

const writeKnowledgeCatalog = async (
  directory: string,
  pattern: KnowledgeDecision
): Promise<void> => {
  await mkdir(path.join(directory, "knowledge"), { recursive: true });
  await writeFile(
    path.join(directory, "catalog.json"),
    JSON.stringify({ knowledgeFiles: ["knowledge/knowledge.json"] }),
    "utf8"
  );
  await writeFile(
    path.join(directory, "knowledge", "knowledge.json"),
    JSON.stringify(pattern),
    "utf8"
  );
};

const memoryRecordWithKnowledgeId = (knowledgeId: string): MemoryRecord => ({
  id: `memory-record-${knowledgeId}`,
  projectId: "project-1",
  key: `pattern:${knowledgeId}`,
  kind: "pattern",
  status: "active",
  summary: knowledgeId,
  body: knowledgeId,
  owner: "krn memory knowledge seed",
  confidence: 90,
  applicationGuidance: knowledgeId,
  sourceLineage: [{ sourceId: "fixture" }],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: { knowledgeId },
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const createSeedTestRuntime = (directory: string) => {
  const dependencies = createNoStoreCompilerDependencies({
    now: () => now,
    createId: (prefix) => `${prefix}-1`
  });
  const seededKnowledgeIds = new Set<string>();
  const capturedCandidates: CreateMemoryCandidateInput[] = [];
  const capturedPromotions: PromoteMemoryCandidateInput[] = [];
  let closeCount = 0;

  const createDatabaseRuntime = async (): Promise<DatabaseRuntime> => ({
    workspaceId: "workspace-1",
    projectId: "project-1",
    compilerDependencies: dependencies,
    harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
    sourceRepository: {} as DatabaseRuntime["sourceRepository"],
    memoryRepository: {
      ...unusedMemoryRepository,
      async listMemoryRecordsForProject() {
        return [...seededKnowledgeIds].map(memoryRecordWithKnowledgeId);
      },
      async createMemoryCandidate(input) {
        capturedCandidates.push(input);

        return {
          id: `memory-candidate-${capturedCandidates.length}`,
          metadata: input.metadata ?? {}
        } as MemoryCandidate;
      },
      async promoteReviewedMemoryCandidate(input) {
        capturedPromotions.push(input);

        if (input.recordKey?.startsWith("pattern:") === true) {
          seededKnowledgeIds.add(input.recordKey.slice("pattern:".length));
        }

        return memoryRecordWithKnowledgeId(input.recordKey ?? input.candidateId);
      }
    } as DatabaseRuntime["memoryRepository"],
    async close() {
      closeCount += 1;
    }
  });

  return {
    capturedCandidates,
    capturedPromotions,
    closeCount: () => closeCount,
    runtime: {
      cwd: directory,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      command: {
        kind: "memoryKnowledgeSeed",
        persist: true,
        dryRun: false,
        catalogFile: "catalog.json"
      } as const,
      createDatabaseRuntime
    }
  };
};

const memoryRecordFromCandidate = (
  candidateId: string,
  input: CreateMemoryCandidateInput,
  recordKey: string | undefined
): MemoryRecord => ({
  id: `memory-record-${candidateId}`,
  projectId: input.projectId,
  key: recordKey ?? candidateId,
  kind: input.kind,
  status: "active",
  summary: input.summary,
  body: input.body,
  owner: input.owner,
  confidence: input.confidence,
  applicationGuidance: input.applicationGuidance,
  ...(input.invalidationRule === undefined ? {} : { invalidationRule: input.invalidationRule }),
  sourceLineage: input.sourceLineage,
  isUserPreference: input.isUserPreference,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: input.metadata ?? {},
  validFrom: input.validFrom ?? now,
  ...(input.validUntil === undefined ? {} : { validUntil: input.validUntil }),
  createdAt: now,
  updatedAt: now
});

const createStoreBackedSeedRuntime = (directory: string) => {
  const dependencies = createNoStoreCompilerDependencies({
    now: () => now,
    createId: (prefix) => `${prefix}-1`
  });
  const candidates = new Map<string, CreateMemoryCandidateInput>();
  const records: MemoryRecord[] = [];

  const createDatabaseRuntime = async (): Promise<DatabaseRuntime> => ({
    workspaceId: "workspace-1",
    projectId: "project-1",
    compilerDependencies: dependencies,
    harnessRunRepository: {} as DatabaseRuntime["harnessRunRepository"],
    sourceRepository: {} as DatabaseRuntime["sourceRepository"],
    memoryRepository: {
      ...unusedMemoryRepository,
      async listMemoryRecordsForProject() {
        return records;
      },
      async listActiveMemory() {
        return records;
      },
      async createMemoryCandidate(input) {
        const id = `memory-candidate-${candidates.size + 1}`;
        candidates.set(id, input);

        return {
          id,
          metadata: input.metadata ?? {}
        } as MemoryCandidate;
      },
      async promoteReviewedMemoryCandidate(input) {
        const candidate = candidates.get(input.candidateId);

        if (candidate === undefined) {
          throw new Error(`Missing candidate ${input.candidateId}`);
        }
        const record = memoryRecordFromCandidate(
          input.candidateId,
          {
            ...candidate,
            metadata: {
              ...(candidate.metadata ?? {}),
              ...(input.metadata ?? {})
            }
          },
          input.recordKey
        );
        records.push(record);

        return record;
      }
    } as DatabaseRuntime["memoryRepository"],
    async close() {}
  });

  return {
    createDatabaseRuntime,
    seedRuntime: {
      cwd: directory,
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix: string) => `${prefix}-1`,
      command: {
        kind: "memoryKnowledgeSeed",
        persist: true,
        dryRun: false,
        catalogFile: "catalog.json"
      } as const,
      createDatabaseRuntime
    }
  };
};

describe("brainRecallDecisionToMemoryCandidateInput", () => {
  it("maps a brain recall to a kind=pattern memory candidate", () => {
    const input = brainRecallDecisionToMemoryCandidateInput(fixtureKnowledge(), "project-1", now);

    expect(input.kind).toBe("pattern");
    expect(input.projectId).toBe("project-1");
    expect(input.summary).toBe("Unknown-first result state");
    expect(input.body).toBe("Keep JSON.parse results unknown until validated.");
    expect(input.invalidationRule).toBe("A JSON.parse result assigned to a non-unknown type.");
    expect(input.confidence).toBe(90);
    expect(input.owner).toBe("@krn/core");
    expect(input.proposedBy).toBe("krn memory knowledge seed");
    expect(input.isUserPreference).toBe(false);
    expect(input.validFrom).toBe(now);
    expect(input.sourceLineage).toEqual([{
      sourceId: "packages/core/src/metadata.ts",
      note: "tests/fixtures/ts-boundary.json"
    }]);
    const metadata = input.metadata ?? {};

    expect(metadata.knowledgeId).toBe("ts-boundary-unknown-first-result-state");
    expect(metadata.decisionStatus).toBe("adopt_now");
    expect(metadata.reviewability).toBe("ready");
    expect(metadata.mechanism).toBe("Unknown-first parsing prevents external JSON from entering domain code unchecked.");
    expect(metadata.krnImplication).toBe("Seeded knowledge must retain the parser boundary through DB-backed memory readback.");
    expect(metadata.nextAction).toBe("use");
    expect(metadata.falsifier).toBe("A JSON.parse result assigned to a non-unknown type.");
    expect(metadata.doesNotProve).toBe("Seed import does not prove the pattern is current or applied.");
    expect(metadata.sourceRefs).toEqual(["packages/core/src/metadata.ts"]);
    expect(metadata.evidenceRefs).toEqual(["tests/fixtures/ts-boundary.json"]);
    expect(metadata.consumers).toEqual(["@krn/core", "@krn/cli"]);
  });
});

describe("runMemoryKnowledgeSeedCommand", () => {
  it("previews knowledge decisions without opening the database", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-seed-"));

    try {
      await writeKnowledgeCatalog(directory, fixtureKnowledge());

      const result = await runMemoryKnowledgeSeedCommand({
        cwd: directory,
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        command: {
          kind: "memoryKnowledgeSeed",
          persist: false,
          dryRun: true,
          catalogFile: "catalog.json"
        },
        async createDatabaseRuntime(): Promise<never> {
          throw new Error("createDatabaseRuntime should not be called");
        }
      });

      expect(result.stdout).toContain("Mode: dry-run (no writes)");
      expect(result.stdout).toContain("Knowledge decisions in catalog: 1");
      expect(result.stdout).toContain(
        "- ts-boundary-unknown-first-result-state (adopt_now) <- catalog.json:knowledge/knowledge.json"
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("persists knowledge decisions once and skips already seeded knowledge ids", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-seed-"));

    try {
      await writeKnowledgeCatalog(directory, fixtureKnowledge());

      const {
        capturedCandidates,
        capturedPromotions,
        closeCount,
        runtime
      } = createSeedTestRuntime(directory);

      const firstRun = await runMemoryKnowledgeSeedCommand(runtime);
      const secondRun = await runMemoryKnowledgeSeedCommand(runtime);

      expect(firstRun.stdout).toContain("Created: 1");
      expect(firstRun.stdout).toContain("Skipped (already seeded): 0");
      expect(secondRun.stdout).toContain("Created: 0");
      expect(secondRun.stdout).toContain("Skipped (already seeded): 1");
      expect(closeCount()).toBe(2);
      expect(capturedCandidates).toHaveLength(1);
      expect(capturedCandidates[0]?.metadata).toBeDefined();
      expect(capturedCandidates[0]).toMatchObject({
        projectId: "project-1",
        kind: "pattern",
        sourceLineage: [{
          sourceId: "packages/core/src/metadata.ts",
          note: "tests/fixtures/ts-boundary.json"
        }],
        metadata: {
          knowledgeId: "ts-boundary-unknown-first-result-state",
          evidenceRefs: ["tests/fixtures/ts-boundary.json"],
          consumers: ["@krn/core", "@krn/cli"]
        }
      });
      expect(capturedPromotions).toEqual([
        {
          candidateId: "memory-candidate-1",
          reviewer: "krn memory knowledge seed",
          decision: "accepted",
          recordKey: "pattern:ts-boundary-unknown-first-result-state"
        }
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("feeds seeded corpus knowledge back through store-only brain search", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-seed-"));

    try {
      await writeKnowledgeCatalog(directory, fixtureKnowledge());

      const {
        createDatabaseRuntime,
        seedRuntime
      } = createStoreBackedSeedRuntime(directory);

      await runMemoryKnowledgeSeedCommand(seedRuntime);

      const search = await runBrainSearchCommand({
        cwd: directory,
        env: {
          KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
        },
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        createDatabaseRuntime,
        command: {
          kind: "brainSearch",
          query: "db backed memory readback",
          catalogFiles: [],
          storeOnly: true,
          format: "json"
        },
        async runBrainRecall(): Promise<never> {
          throw new Error("store-only brain search should not read file catalogs");
        },
        async runSourceSearch() {
          return {
            stdout: JSON.stringify({
              answerPackage: {
                answerUsefulness: "not_useful",
                supportingClaims: [],
                supportingDocuments: [],
                relationSupport: [],
                sourceDecisionSupport: [],
                graphReadback: {
                  claimNodes: 0,
                  relationEdges: 0,
                  temporalEdges: 0,
                  contradictionEdges: 0,
                  duplicateEdges: 0,
                  invalidationEdges: 0,
                  graphAware: false,
                  caveats: []
                },
                missingEvidence: []
              },
              includedCandidates: [],
              proof: {
                doesNotProve: ["source truth"]
              }
            })
          };
        }
      });
      const parsed: unknown = JSON.parse(search.stdout);

      expect(parsed).toMatchObject({
        brainRecallReadback: "store_only",
        brainRecallQueries: ["db backed memory readback"],
        knowledgeReadModels: {
          readModelIds: ["pattern:ts-boundary-unknown-first-result-state"],
          selectedKnowledge: [{
            id: "pattern:ts-boundary-unknown-first-result-state",
            source: "memory_store",
            mechanism: "Unknown-first parsing prevents external JSON from entering domain code unchecked.",
            krnImplication: "Seeded knowledge must retain the parser boundary through DB-backed memory readback.",
            consumers: ["@krn/core", "@krn/cli"],
            falsifier: "A JSON.parse result assigned to a non-unknown type.",
            doesNotProve: "Seed import does not prove the pattern is current or applied."
          }]
        }
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
