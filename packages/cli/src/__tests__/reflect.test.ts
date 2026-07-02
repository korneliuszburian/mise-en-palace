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
  it("routes reflect scope commands through the CLI parser", async () => {
    const result = await runCli(["reflect", "--scope", "run:run-1"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("KRN_DATABASE_URL is required for krn reflect");
  });
});
