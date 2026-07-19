import { describe, expect, it } from "vitest";
import {
  assertCandidateBatchProjectScope,
  CandidateProjectScopeError,
  classifyEvidenceCaptureError,
  formatEvidenceCaptureError,
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
    const privatePayload = "do-not-render-this-payload";
    let message = "";
    try {
      assertCandidateBatchProjectScope({
        projectId,
        sourceDecisionCandidates: [],
        memoryCandidateProposals: [],
        evalCandidateProposals: [{ ...evalCandidate("project-b"), metadata: { privatePayload } }]
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("eval candidate eval-candidate-1");
    expect(message).not.toContain(privatePayload);
  });

  it("marks scope rejection as non-retryable and stable", () => {
    const run = () => {
      try {
        assertCandidateBatchProjectScope({
          projectId,
          sourceDecisionCandidates: [],
          memoryCandidateProposals: [],
          evalCandidateProposals: [evalCandidate("project-b")]
        });
      } catch (error) {
        return error;
      }
      throw new Error("expected scope rejection");
    };
    const first = run();
    const second = run();
    expect(first).toBeInstanceOf(CandidateProjectScopeError);
    expect(first).toMatchObject({
      code: "candidate_project_scope",
      retryable: false,
      handoff: {
        kind: "krn.candidateScopeFailure.v1",
        candidateLabels: ["eval candidate eval-candidate-1"],
        remediation: expect.stringContaining("submit a new capture"),
        doesNotProve: expect.arrayContaining(["source truth"])
      }
    });
    expect((first as Error).message).toBe((second as Error).message);
  });

  it("separates permanent scope failures from transient infrastructure failures", () => {
    expect(classifyEvidenceCaptureError(new CandidateProjectScopeError(["eval candidate 1"]))).toBe("permanent");
    expect(classifyEvidenceCaptureError(new Error("postgres connection timeout"))).toBe("transient");
    expect(classifyEvidenceCaptureError(Object.assign(new Error("connect refused"), { code: "ECONNREFUSED" }))).toBe("transient");
    expect(classifyEvidenceCaptureError(Object.assign(new Error("write CONNECT_TIMEOUT localhost:5432"), { code: "CONNECT_TIMEOUT" }))).toBe("transient");
    expect(classifyEvidenceCaptureError(Object.assign(new Error("write CONNECTION_CLOSED localhost:5432"), { code: "CONNECTION_CLOSED" }))).toBe("transient");
    expect(classifyEvidenceCaptureError(new Error("invalid postgres connection string"))).toBe("unknown");
    expect(classifyEvidenceCaptureError(new Error("validation failed"))).toBe("unknown");
  });

  it("renders a retryable transient handoff without changing the capture input", () => {
    const handoff = formatEvidenceCaptureError(new Error("postgres connection timeout"));
    expect(handoff).toContain("evidence_capture (disposition=transient, retryable)");
    expect(handoff).toContain("Retry the capture after the infrastructure recovers");
    expect(handoff).toContain("keep candidate input unchanged");
    expect(handoff).toContain("Does not prove: source truth");
    expect(handoff).not.toContain("disposition=permanent");
  });

  it("keeps retry policy undetermined for unknown capture failures", () => {
    const handoff = formatEvidenceCaptureError(new Error("validation failed"));
    expect(handoff).toContain("evidence_capture (disposition=unknown, retryable=undetermined)");
    expect(handoff).toContain("Inspect and classify the failure before retrying");
    expect(handoff).toContain("keep candidate input unchanged");
    expect(handoff).not.toContain("retryable):");
    expect(handoff).not.toContain("disposition=permanent");
  });
});
