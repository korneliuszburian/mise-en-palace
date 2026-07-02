import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  runCli
} from "../runCli.js";
import {
  createNoStoreCompilerDependencies
} from "../noStoreRepositories.js";
import {
  commandResultDoesNotProve
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  MemoryRecord,
  ObservationItem,
  SourceClaim
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateExecutionRunInput,
  CreateFeedbackDeltaInput,
  CreateMemoryFeedbackEventInput,
  CreateMemoryCandidateInput,
  InvalidateMemoryRecordInput,
  PromoteAntiMemoryCandidateInput,
  PromoteMemoryCandidateInput,
  RejectAntiMemoryCandidateInput,
  RejectMemoryCandidateInput,
  RecordMemoryApplicationInput,
  CreateReviewAssessmentInput,
  HarnessRunAggregate,
  SearchDocumentSearchResult
} from "@krn/harness/repositories/internal";
import type {
  DatabaseRuntimeInput
} from "../databaseRuntime.js";
import {
  deriveBrainStoreReadiness,
  deriveHarnessPersistenceReadiness,
  deriveActivationReadiness,
  deriveCodexAdapterReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "../doctorReadiness.js";

const now = "2026-06-21T12:00:00.000Z";

describe("runCli", () => {
  it("prints brain knowledge readback help", async () => {
    const result = await runCli(["knowledge", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: krn brain knowledge [--card-file <path>|--pattern-file <path>|--catalog-file <path>]");
    expect(result.stdout).toContain("Legacy alias: krn knowledge cards [same options]");
    expect(result.stdout).toContain("Read-only preview commands:");
    expect(result.stdout).toContain("does not scan, rank, persist, or mutate Memory Core");
  });

  it("renders brain knowledge through the preferred CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "brain",
      "knowledge",
      "--card-file",
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Brain Knowledge Readback");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("keeps the legacy knowledge cards CLI alias working", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "knowledge",
      "cards",
      "--card-file",
      "tests/fixtures/brain-knowledge/cards/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Brain Knowledge Readback");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("renders retained pattern files through the brain knowledge CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "knowledge",
      "cards",
      "--pattern-file",
      "docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Pattern files: docs/patterns/retained-patterns/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("renders explicit catalog files through the brain knowledge CLI readback", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "knowledge",
      "cards",
      "--catalog-file",
      "docs/brain-knowledge/catalog.json",
      "--text",
      "unknown-first"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Catalog files: docs/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("renders brain knowledge as self-contained html", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const result = await runCli([
      "knowledge",
      "cards",
      "--catalog-file",
      "docs/brain-knowledge/catalog.json",
      "--text",
      "unknown-first",
      "--html"
    ], {
      cwd: repoRoot,
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("KRN Brain Knowledge Readback");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Proof Boundaries");
  });
});
