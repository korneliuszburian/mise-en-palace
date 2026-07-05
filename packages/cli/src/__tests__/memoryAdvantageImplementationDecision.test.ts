import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  loadMemoryAdvantageEvalFixture,
  runMemoryAdvantageEval
} from "../runMemoryAdvantageEval.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/memory-advantage/company-pattern-memory-advantage.json", import.meta.url)
);

describe("memory advantage implementation decision readback", () => {
  it("reports win, neutral, and rejection-protection implementation decisions", async () => {
    const result = await runMemoryAdvantageEval(loadMemoryAdvantageEvalFixture(fixturePath));
    const caseById = new Map(result.cases.map((testCase) => [testCase.caseId, testCase]));

    expect(result.metrics.implementationDecisionCaseCount).toBe(25);
    expect(result.metrics.implementationDecisionWinCount).toBe(9);
    expect(result.metrics.implementationDecisionNeutralCount).toBe(6);
    expect(result.metrics.implementationDecisionRejectionProtectionCount).toBe(10);
    expect(result.metrics.implementationDecisionRegressionCount).toBe(0);
    expect(caseById.get("heldout-coding-task-json-boundary")?.["implementation_decision"]).toMatchObject({
      decision_before_memory: "select:pattern:cast-json-record-in-command-runner",
      decision_after_krn: "select:source:unknown-first-json-metadata-boundary",
      selectedEvidenceRefs: [
        "evidence:unknown-first-json-metadata-boundary",
        "review:unknown-first-json-metadata-boundary",
        "feedback:unknown-first-json-metadata-boundary-helped"
      ],
      selectedEvidenceIds: [
        "memory:pattern:cast-json-record-in-command-runner",
        "source:unknown-first-json-metadata-boundary"
      ],
      decisionChanged: true,
      decisionChangeClass: "win",
      reason: "Memory changed the implementation decision: KRN selected or refused the expected knowledge where simple lexical retrieval did not",
      doesNotProve:
        "This deterministic proxy does not prove live Codex would follow the decision without an execution-output evidence check."
    });
    expect(caseById.get("heldout-coding-decision-idempotency-key")?.["implementation_decision"]).toMatchObject({
      decision_before_memory: "select:pattern:fire-and-forget-write-no-key",
      decision_after_krn: "select:source:idempotency-key-on-writes",
      selectedEvidenceRefs: [
        "evidence:idempotency-key-on-writes",
        "review:idempotency-key-on-writes",
        "feedback:idempotency-key-on-writes-helped"
      ],
      selectedEvidenceIds: [
        "memory:pattern:fire-and-forget-write-no-key",
        "source:idempotency-key-on-writes"
      ],
      decisionChanged: true,
      decisionChangeClass: "win",
      reason: "Memory changed the implementation decision: KRN selected or refused the expected knowledge where simple lexical retrieval did not",
      doesNotProve:
        "This deterministic proxy does not prove live Codex would follow the decision without an execution-output evidence check."
    });
    expect(caseById.get("heldout-coding-decision-retry-backoff")?.["implementation_decision"]).toMatchObject({
      decision_before_memory: "select:pattern:naive-tight-retry-loop",
      decision_after_krn: "select:source:bounded-exponential-backoff-jitter",
      decisionChanged: true,
      decisionChangeClass: "win"
    });
    expect(caseById.get("neutral-single-turn-typecheck")?.["implementation_decision"]).toMatchObject({
      decision_before_memory: "select:pattern:neutral-run-typecheck",
      decision_after_krn: "select:pattern:neutral-run-typecheck",
      selectedEvidenceRefs: [
        "evidence:neutral-single-turn-typecheck",
        "review:neutral-single-turn-typecheck",
        "feedback:neutral-single-turn-typecheck-neutral"
      ],
      selectedEvidenceIds: [
        "memory:pattern:neutral-run-typecheck",
        "source:neutral-run-typecheck"
      ],
      decisionChanged: false,
      decisionChangeClass: "neutral",
      reason:
        "Memory did not change the implementation decision: single_turn_no_memory_needed: simple lexical retrieval already selected the expected knowledge id",
      doesNotProve:
        "This deterministic proxy does not prove live Codex would follow the decision without an execution-output evidence check."
    });
    expect(caseById.get("temporal-stale-source-claim-decision-link")?.["implementation_decision"]).toMatchObject({
      decision_before_memory: "select:source:old-crawler-first-without-decision-edge",
      decision_after_krn: "select:source:current-source-decision-edge-ranking",
      selectedEvidenceRefs: [
        "evidence:temporal-stale-source-claim-decision-link",
        "review:temporal-stale-source-claim-decision-link",
        "feedback:temporal-stale-source-claim-decision-link-helped"
      ],
      selectedEvidenceIds: [
        "memory:pattern:source-decision-edge-ranking-current",
        "source:current-source-decision-edge-ranking",
        "excluded-source:source:old-crawler-first-without-decision-edge"
      ],
      decisionChanged: true,
      decisionChangeClass: "rejection_protection",
      reason:
        "KRN rejected stale or unsafe evidence before selecting authority for source:current-source-decision-edge-ranking.",
      doesNotProve:
        "This deterministic proxy does not prove live Codex would follow the decision without an execution-output evidence check."
    });
  });
});
