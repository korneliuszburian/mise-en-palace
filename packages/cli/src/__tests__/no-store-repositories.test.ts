import { describe, expect, it } from "vitest";

import {
  createNoStoreCompilerDependencies
} from "../no-store-repositories.js";

const now = "2026-07-07T14:50:00.000Z";

describe("createNoStoreCompilerDependencies", () => {
  it("keeps retrieval aliases callable after destructuring", async () => {
    const dependencies = createNoStoreCompilerDependencies({
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });
    const {
      createRetrievalRun,
      createRetrievalCandidate,
      createActivationDecision
    } = dependencies.retrievalRepository;

    const retrievalRun = await createRetrievalRun({
      projectId: "project-1",
      query: "governed memory recall",
      mode: "mixed"
    });
    const candidate = await createRetrievalCandidate({
      retrievalRunId: retrievalRun.id,
      kind: "memory",
      subjectType: "memory_record",
      subjectId: "memory-1",
      trustTier: "project-decision",
      reason: "No-store preview selected retained memory."
    });
    const decision = await createActivationDecision({
      retrievalRunId: retrievalRun.id,
      retrievalCandidateId: candidate.id,
      subjectType: "memory_record",
      subjectId: "memory-1",
      decision: "deferred",
      reason: "No-store preview does not mutate activation state."
    });

    expect(retrievalRun).toMatchObject({
      id: "retrieval-run-1",
      projectId: "project-1",
      status: "running",
      query: "governed memory recall",
      mode: "mixed",
      startedAt: now,
      createdAt: now
    });
    expect(candidate).toMatchObject({
      id: "retrieval-candidate-1",
      retrievalRunId: "retrieval-run-1",
      kind: "memory",
      status: "candidate",
      subjectType: "memory_record",
      subjectId: "memory-1"
    });
    expect(decision).toMatchObject({
      id: "activation-decision-1",
      retrievalRunId: "retrieval-run-1",
      retrievalCandidateId: "retrieval-candidate-1",
      decision: "deferred",
      reason: "No-store preview does not mutate activation state."
    });
  });
});
