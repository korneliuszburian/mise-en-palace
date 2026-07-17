import { describe, expect, it } from "vitest";
import {
  assertCandidateBatchProjectScope,
  type MemoryCandidateProposal
} from "../run-evidence-capture-command.js";
import type { EvalCandidateProposal, SourceDecision } from "@krn/core";

const projectId = "project-a";
const sourceDecision = (candidateProjectId: string): SourceDecision => ({
  id: "source-decision-1",
  projectId: candidateProjectId,
  status: "adopt",
  decision: "Use the bounded source decision.",
  rationale: "The source is current.",
  falsifier: "A newer source supersedes it.",
  consumer: "scope test",
  metadata: {},
  createdAt: "2026-07-17T00:00:00.000Z",
  updatedAt: "2026-07-17T00:00:00.000Z"
});

const memoryCandidate = (candidateProjectId: string): MemoryCandidateProposal => ({
  id: "memory-candidate-1",
  projectId: candidateProjectId,
  kind: "procedure",
  status: "proposed",
  summary: "Bounded memory candidate",
  body: "Candidate body",
  owner: "scope-test",
  confidence: 50,
  sourceLineage: [],
  missingFields: [],
  createdAt: "2026-07-17T00:00:00.000Z",
  updatedAt: "2026-07-17T00:00:00.000Z",
  metadata: {}
});

const evalCandidate = (candidateProjectId: string): EvalCandidateProposal => ({
  id: "eval-candidate-1",
  projectId: candidateProjectId,
  status: "candidate",
  title: "Bounded eval candidate",
  scenario: "scope test",
  expectedSignal: "candidate remains project scoped",
  sourceEvidence: [],
  metadata: {},
  createdAt: "2026-07-17T00:00:00.000Z"
});

describe("candidate batch project scope", () => {
  it("accepts an all-same-project batch", () => {
    expect(() => assertCandidateBatchProjectScope({
      projectId,
      sourceDecisionCandidates: [sourceDecision(projectId)],
      memoryCandidateProposals: [memoryCandidate(projectId)],
      evalCandidateProposals: [evalCandidate(projectId)]
    })).not.toThrow();
  });

  it.each([
    ["source decision", [sourceDecision("project-b")] as SourceDecision[], [], []],
    ["memory candidate", [], [memoryCandidate("project-b")] as MemoryCandidateProposal[], []],
    ["eval candidate", [], [], [evalCandidate("project-b")] as EvalCandidateProposal[]]
  ])("rejects a foreign %s", (_label, source, memory, evaluation) => {
    expect(() => assertCandidateBatchProjectScope({
      projectId,
      sourceDecisionCandidates: source,
      memoryCandidateProposals: memory,
      evalCandidateProposals: evaluation
    })).toThrow(/project scope/);
  });

  it("rejects a mixed batch before any family can pass", () => {
    expect(() => assertCandidateBatchProjectScope({
      projectId,
      sourceDecisionCandidates: [sourceDecision(projectId)],
      memoryCandidateProposals: [memoryCandidate(projectId)],
      evalCandidateProposals: [evalCandidate("project-b")]
    })).toThrow(/eval candidate/);
  });

  it("reports scope safely without leaking candidate metadata", () => {
    const secret = "do-not-render-this-payload";
    let message = "";
    try {
      assertCandidateBatchProjectScope({
        projectId,
        sourceDecisionCandidates: [],
        memoryCandidateProposals: [],
        evalCandidateProposals: [{ ...evalCandidate("project-b"), metadata: { secret } }]
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("eval candidate eval-candidate-1");
    expect(message).not.toContain(secret);
  });
});
