import { describe, expect, it } from "vitest";
import type {
  EvalCandidate,
  MemoryCandidate,
  SourceDecision
} from "@krn/core";

import {
  mapFeedbackDelta,
  mapSourceClaim
} from "./mappers.js";
import * as mapperExports from "./mappers.js";

const createdAt = new Date("2026-06-21T12:00:00.000Z");
const updatedAt = new Date("2026-06-21T12:30:00.000Z");

const mapper = (name: string): ((row: unknown) => unknown) => {
  const exportsByName = mapperExports as Record<string, unknown>;
  const value = exportsByName[name];

  expect(value).toBeTypeOf("function");

  return value as (row: unknown) => unknown;
};

const memoryCandidate: MemoryCandidate = {
  id: "memory-candidate-1",
  projectId: "project-1",
  proposedBy: "review",
  kind: "constraint",
  status: "candidate",
  summary: "Persist run identities",
  body: "Persisted evidence must link back to an execution run.",
  owner: "kernel",
  confidence: 90,
  applicationGuidance: "Use when implementing persisted evidence capture.",
  sourceLineage: [{ sourceId: "source-1" }],
  isUserPreference: false,
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const sourceDecision: SourceDecision = {
  id: "source-decision-1",
  projectId: "project-1",
  sourceClaimId: "source-claim-1",
  status: "adopt",
  decision: "Use the existing harness tables.",
  rationale: "The schema already has the primary run spine tables.",
  falsifier: "Readback cannot link evidence to a run.",
  consumer: "M21",
  metadata: {},
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString()
};

const evalCandidate: EvalCandidate = {
  id: "eval-candidate-1",
  projectId: "project-1",
  status: "candidate",
  title: "Persisted evidence readback",
  scenario: "Capture evidence for a persisted run.",
  expectedSignal: "Run aggregate includes evidence and feedback.",
  sourceEvidence: ["source-1"],
  metadata: {},
  createdAt: createdAt.toISOString()
};

describe("mapFeedbackDelta", () => {
  it("preserves persisted memory, source, and eval candidates", () => {
    const result = mapFeedbackDelta({
      id: "feedback-delta-1",
      reviewAssessmentId: "review-1",
      status: "candidate",
      memoryCandidates: [memoryCandidate],
      sourceDecisions: [sourceDecision],
      evalCandidates: [evalCandidate],
      metadata: { persisted: true },
      createdAt,
      updatedAt
    });

    expect(result.memoryCandidates).toEqual([memoryCandidate]);
    expect(result.sourceDecisions).toEqual([sourceDecision]);
    expect(result.evalCandidates).toEqual([evalCandidate]);
  });
});

describe("source graph mappers", () => {
  it("maps M22 source claims with run linkage and review status", () => {
    const result = mapSourceClaim({
      id: "source-claim-1",
      sourceArtifactId: "artifact-1",
      sourceChunkId: null,
      executionRunId: "run-1",
      claim: "Source claims should link to runs.",
      mechanism: "Run linkage makes source decisions auditable.",
      krnImplication: "KRN can show why a run used a source pattern.",
      doesNotProve: "This does not prove retrieval quality.",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "M22",
      falsifier: null,
      revisitWhen: "Repository smoke fails",
      status: "proposed",
      metadata: {},
      createdAt,
      updatedAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      status: "proposed",
      revisitWhen: "Repository smoke fails"
    });
  });

  it("maps typed source decision edges", () => {
    const mapSourceDecisionEdge = mapper("mapSourceDecisionEdge");

    const result = mapSourceDecisionEdge({
      id: "source-decision-edge-1",
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      targetId: "run-1",
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Used to justify Postgres-backed source graph edges.",
      metadata: { slice: "M22.04" },
      createdAt
    });

    expect(result).toMatchObject({
      id: "source-decision-edge-1",
      sourceClaimId: "source-claim-1",
      targetType: "harness_run",
      supportType: "implementation-boundary",
      confidence: "medium"
    });
  });

  it("maps source rejections without promoting them to trusted claims", () => {
    const mapSourceRejection = mapper("mapSourceRejection");

    const result = mapSourceRejection({
      id: "source-rejection-1",
      projectId: null,
      executionRunId: "run-1",
      sourceArtifactId: null,
      sourceClaimId: null,
      title: "Decorative AI engineering link",
      attemptedClaim: "Interesting AI link should influence KRN.",
      rejectedBecause: "decorative",
      reason: "No mechanism, consumer, or decision support.",
      doesNotProve: "The link should change KRN behavior.",
      consumer: "M22",
      metadata: {},
      rejectedAt: createdAt
    });

    expect(result).toMatchObject({
      executionRunId: "run-1",
      rejectedBecause: "decorative",
      attemptedClaim: "Interesting AI link should influence KRN."
    });
  });
});
