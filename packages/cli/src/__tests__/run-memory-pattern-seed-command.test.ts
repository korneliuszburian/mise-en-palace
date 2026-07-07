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
import type { BrainKnowledgeDecision } from "@krn/harness";
import type {
  CreateMemoryCandidateInput,
  PromoteMemoryCandidateInput
} from "@krn/harness/repositories/internal";

import type { DatabaseRuntime } from "../database-runtime.js";
import { createNoStoreCompilerDependencies } from "../no-store-repositories.js";
import {
  brainKnowledgeDecisionToMemoryCandidateInput,
  runMemoryPatternSeedCommand
} from "../run-memory-pattern-seed-command.js";
import {
  unusedMemoryRepository
} from "./helpers/test-runtime.js";

const now = "2026-07-06T00:00:00.000Z";

const fixturePattern = (overrides: Partial<BrainKnowledgeDecision> = {}): BrainKnowledgeDecision => ({
  knowledgeId: "ts-boundary-unknown-first-result-state",
  name: "Unknown-first result state",
  decisionStatus: "adopt_now",
  confidence: "high",
  reviewability: "ready",
  decision: "Keep JSON.parse results unknown until validated.",
  sourceRefs: ["packages/core/src/metadata.ts"],
  evidenceRefs: ["tests/fixtures/ts-boundary.json"],
  consumers: ["@krn/core"],
  falsifier: "A JSON.parse result assigned to a non-unknown type.",
  doesNotProve: "Seed import does not prove the pattern is current or applied.",
  nextAction: "use",
  ...overrides
});

const writePatternCatalog = async (
  directory: string,
  pattern: BrainKnowledgeDecision
): Promise<void> => {
  await mkdir(path.join(directory, "patterns"), { recursive: true });
  await writeFile(
    path.join(directory, "catalog.json"),
    JSON.stringify({ knowledgeFiles: ["patterns/pattern.json"] }),
    "utf8"
  );
  await writeFile(
    path.join(directory, "patterns", "pattern.json"),
    JSON.stringify(pattern),
    "utf8"
  );
};

const memoryRecordWithPatternId = (knowledgeId: string): MemoryRecord => ({
  id: `memory-record-${knowledgeId}`,
  projectId: "project-1",
  key: `pattern:${knowledgeId}`,
  kind: "pattern",
  status: "active",
  summary: knowledgeId,
  body: knowledgeId,
  owner: "krn memory brain knowledge seed",
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
  const seededPatternIds = new Set<string>();
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
        return [...seededPatternIds].map(memoryRecordWithPatternId);
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
          seededPatternIds.add(input.recordKey.slice("pattern:".length));
        }

        return memoryRecordWithPatternId(input.recordKey ?? input.candidateId);
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
        kind: "memoryPatternSeed",
        persist: true,
        dryRun: false,
        catalogFile: "catalog.json"
      } as const,
      createDatabaseRuntime
    }
  };
};

describe("brainKnowledgeDecisionToMemoryCandidateInput", () => {
  it("maps a brain knowledge to a kind=pattern memory candidate", () => {
    const input = brainKnowledgeDecisionToMemoryCandidateInput(fixturePattern(), "project-1", now);

    expect(input.kind).toBe("pattern");
    expect(input.projectId).toBe("project-1");
    expect(input.summary).toBe("Unknown-first result state");
    expect(input.body).toBe("Keep JSON.parse results unknown until validated.");
    expect(input.invalidationRule).toBe("A JSON.parse result assigned to a non-unknown type.");
    expect(input.confidence).toBe(90);
    expect(input.owner).toBe("@krn/core");
    expect(input.proposedBy).toBe("krn memory brain knowledge seed");
    expect(input.isUserPreference).toBe(false);
    expect(input.validFrom).toBe(now);
    expect(input.sourceLineage).toEqual([{ sourceId: "packages/core/src/metadata.ts" }]);
    const metadata = input.metadata ?? {};

    expect(metadata.knowledgeId).toBe("ts-boundary-unknown-first-result-state");
    expect(metadata.decisionStatus).toBe("adopt_now");
    expect(metadata.reviewability).toBe("ready");
    expect(metadata.nextAction).toBe("use");
    expect(metadata.doesNotProve).toBe("Seed import does not prove the pattern is current or applied.");
    expect(metadata.sourceRefs).toEqual(["packages/core/src/metadata.ts"]);
  });
});

describe("runMemoryPatternSeedCommand", () => {
  it("previews brain knowledge decisions without opening the database", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-pattern-seed-"));

    try {
      await writePatternCatalog(directory, fixturePattern());

      const result = await runMemoryPatternSeedCommand({
        cwd: directory,
        env: {},
        now: () => now,
        createId: (prefix) => `${prefix}-1`,
        command: {
          kind: "memoryPatternSeed",
          persist: false,
          dryRun: true,
          catalogFile: "catalog.json"
        },
        async createDatabaseRuntime(): Promise<never> {
          throw new Error("createDatabaseRuntime should not be called");
        }
      });

      expect(result.stdout).toContain("Mode: dry-run (no writes)");
      expect(result.stdout).toContain("Brain knowledge decisions in catalog: 1");
      expect(result.stdout).toContain(
        "- ts-boundary-unknown-first-result-state (adopt_now) <- catalog.json:patterns/pattern.json"
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("persists brain knowledge decisions once and skips already seeded knowledge ids", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-pattern-seed-"));

    try {
      await writePatternCatalog(directory, fixturePattern());

      const {
        capturedCandidates,
        capturedPromotions,
        closeCount,
        runtime
      } = createSeedTestRuntime(directory);

      const firstRun = await runMemoryPatternSeedCommand(runtime);
      const secondRun = await runMemoryPatternSeedCommand(runtime);

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
        sourceLineage: [{ sourceId: "packages/core/src/metadata.ts" }],
        metadata: {
          knowledgeId: "ts-boundary-unknown-first-result-state"
        }
      });
      expect(capturedPromotions).toEqual([
        {
          candidateId: "memory-candidate-1",
          reviewer: "krn memory brain knowledge seed",
          decision: "accepted",
          recordKey: "pattern:ts-boundary-unknown-first-result-state"
        }
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
