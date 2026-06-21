import { describe, expect, test } from "vitest";

import {
  parseEvidenceCaptureInput,
  parseHarnessCompileInput,
  parseMemoryCandidateInput,
  parseOperatorIntentInput,
  parseSourceClaimInput,
  parseTaskContractInput
} from "./index.js";
import * as schemaExports from "./index.js";

const parser = (name: string): ((input: unknown) => unknown) => {
  const exportsByName = schemaExports as Record<string, unknown>;
  const value = exportsByName[name];

  expect(value).toBeTypeOf("function");

  return value as (input: unknown) => unknown;
};

describe("schema parse boundaries", () => {
  test("operator intent and task contract inputs parse unknown values with defaults", () => {
    const intent = parseOperatorIntentInput({
      rawIntent: "Improve KRN doctor brain store readiness",
      source: "goal"
    });

    expect(intent.rawIntent).toBe("Improve KRN doctor brain store readiness");
    expect(intent.metadata).toEqual({});

    const contract = parseTaskContractInput({
      title: "Doctor readiness",
      objective: "Report DB readiness honestly"
    });

    expect(contract.constraints).toEqual([]);
    expect(contract.nonGoals).toEqual([]);
    expect(contract.acceptance).toEqual([]);
  });

  test("source claims require decision-grade source mapping fields", () => {
    expect(() =>
      parseSourceClaimInput({
        claim: "Drizzle supports pgvector columns",
        mechanism: "Drizzle maps vector columns to PostgreSQL pgvector",
        krnImplication: "KRN can keep vector search in Postgres",
        trustTier: "high",
        supportType: "implementation-boundary",
        consumer: "db schema"
      })
    ).toThrow();

    expect(() =>
      parseSourceClaimInput({
        claim: "Drizzle supports pgvector columns",
        mechanism: "Drizzle maps vector columns to PostgreSQL pgvector",
        krnImplication: "KRN can keep vector search in Postgres",
        doesNotProve: "The vector extension exists in every database",
        trustTier: "high",
        supportType: "supports",
        consumer: "db schema"
      })
    ).toThrow();

    const claim = parseSourceClaimInput({
      claim: "Drizzle supports pgvector columns",
      mechanism: "Drizzle maps vector columns to PostgreSQL pgvector",
      krnImplication: "KRN can keep vector search in Postgres",
      doesNotProve: "The vector extension exists in every database",
      trustTier: "project-decision",
      supportType: "implementation-boundary",
      consumer: "db schema"
    });

    expect(claim.doesNotProve).toContain("extension");
  });

  test("source artifact inputs default operator-local artifact fields", () => {
    const parseSourceArtifactInput = parser("parseSourceArtifactInput");

    const artifact = parseSourceArtifactInput({
      title: "  Matt Pocock source mapping note  ",
      trustTier: "practitioner"
    });

    expect(artifact).toMatchObject({
      title: "Matt Pocock source mapping note",
      kind: "operator_input",
      uri: "operator://source",
      trustTier: "practitioner",
      metadata: {}
    });
  });

  test("source decision edge inputs require typed target and M22 support", () => {
    const parseSourceDecisionEdgeInput = parser("parseSourceDecisionEdgeInput");

    expect(() =>
      parseSourceDecisionEdgeInput({
        sourceClaimId: "claim-1",
        targetType: "dashboard",
        targetId: "target-1",
        supportType: "supports",
        confidence: "medium",
        notes: "Decorative target"
      })
    ).toThrow();

    const edge = parseSourceDecisionEdgeInput({
      sourceClaimId: "claim-1",
      targetType: "harness_run",
      targetId: "run-1",
      supportType: "implementation-boundary",
      confidence: "medium",
      notes: "Justifies keeping source graph inside Postgres"
    });

    expect(edge).toMatchObject({
      targetType: "harness_run",
      supportType: "implementation-boundary",
      confidence: "medium"
    });
  });

  test("source rejection inputs persist rejected decorative sources explicitly", () => {
    const parseSourceRejectionInput = parser("parseSourceRejectionInput");

    expect(() =>
      parseSourceRejectionInput({
        title: "Interesting link",
        reason: "No mechanism or consumer",
        rejectedBecause: "interesting",
        consumer: "M22"
      })
    ).toThrow();

    const rejection = parseSourceRejectionInput({
      title: "Interesting link",
      attemptedClaim: "This AI link is relevant",
      rejectedBecause: "decorative",
      reason: "No mechanism, consumer, or decision support",
      doesNotProve: "The link should influence KRN behavior",
      consumer: "M22 source graph persistence"
    });

    expect(rejection).toMatchObject({
      rejectedBecause: "decorative",
      attemptedClaim: "This AI link is relevant",
      metadata: {}
    });
  });

  test("memory candidates require source grounding unless explicitly user preference", () => {
    expect(() =>
      parseMemoryCandidateInput({
        executionRunId: "run-1",
        proposedBy: "codex",
        kind: "pattern",
        summary: "Use PLAN.md as execution map",
        body: "Complex KRN implementation should keep PLAN.md current.",
        owner: "operator",
        confidence: 90,
        applicationGuidance: "Apply during long-running KRN work",
        invalidationRule: "Revisit when GOAL.md replaces PLAN.md"
      })
    ).toThrow();

    const preference = parseMemoryCandidateInput({
      proposedBy: "operator",
      kind: "preference",
      summary: "Keep Polish plans Polish",
      body: "Polish plans should keep prose Polish and commands in English.",
      owner: "operator",
      confidence: 90,
      applicationGuidance: "Apply to Polish handoff and plan docs",
      isUserPreference: true
    });

    expect(preference.status).toBe("proposed");
    expect(preference.sourceLineage).toEqual([]);
  });

  test("memory governance inputs constrain review, application, feedback, and anti-memory", () => {
    const parseMemoryPromotionInput = parser("parseMemoryPromotionInput");
    const parseMemoryApplicationInput = parser("parseMemoryApplicationInput");
    const parseMemoryFeedbackEventInput = parser("parseMemoryFeedbackEventInput");
    const parseAntiMemoryInput = parser("parseAntiMemoryInput");

    expect(() =>
      parseMemoryPromotionInput({
        candidateId: "candidate-1",
        reviewer: "operator",
        decision: "maybe"
      })
    ).toThrow();

    expect(
      parseMemoryPromotionInput({
        candidateId: "candidate-1",
        reviewer: "operator",
        decision: "accepted"
      })
    ).toMatchObject({
      candidateId: "candidate-1",
      decision: "accepted",
      metadata: {}
    });

    expect(() =>
      parseMemoryApplicationInput({
        memoryRecordId: "memory-1",
        executionRunId: "run-1",
        expectedUse: "Guide storage decisions",
        outcome: "great"
      })
    ).toThrow();

    expect(
      parseMemoryApplicationInput({
        memoryRecordId: "memory-1",
        executionRunId: "run-1",
        expectedUse: "Guide storage decisions",
        outcome: "helped",
        notes: "Prevented adding a separate memory store"
      })
    ).toMatchObject({
      outcome: "helped",
      metadata: {}
    });

    expect(
      parseMemoryFeedbackEventInput({
        memoryRecordId: "memory-1",
        executionRunId: "run-1",
        eventType: "invalidated",
        direction: "negative",
        note: "Course source contradicted this rule",
        reason: "newer source with concrete mechanism",
        evidenceRef: "source-claim-1"
      })
    ).toMatchObject({
      eventType: "invalidated",
      direction: "negative"
    });

    expect(() =>
      parseAntiMemoryInput({
        executionRunId: "run-1",
        rejectedClaim: "Markdown files are runtime memory",
        owner: "operator",
        confidence: 95
      })
    ).toThrow();

    expect(
      parseAntiMemoryInput({
        executionRunId: "run-1",
        rejectedClaim: "Markdown files are runtime memory",
        reason: "Files can be audit/source/export, but Memory Core is store-backed",
        invalidatedBySourceClaimId: "source-claim-1",
        owner: "operator",
        confidence: 95
      })
    ).toMatchObject({
      rejectedClaim: "Markdown files are runtime memory",
      reason: "Files can be audit/source/export, but Memory Core is store-backed",
      invalidatedBySourceClaimIds: [],
      metadata: {}
    });
  });

  test("harness compile and evidence capture inputs keep command evidence structured", () => {
    const compile = parseHarnessCompileInput({
      operatorIntent: {
        rawIntent: "Improve KRN doctor brain store readiness",
        source: "cli"
      },
      tokenBudget: 4000
    });

    expect(compile.operatorIntent.source).toBe("cli");

    const evidence = parseEvidenceCaptureInput({
      changedFiles: ["packages/schema/src/index.ts"],
      commands: [
        {
          command: "pnpm typecheck",
          status: "passed"
        }
      ],
      diffRisk: "low",
      reviewBurden: "small",
      rollbackPath: "Revert schema commit"
    });

    expect(evidence.commands[0]?.status).toBe("passed");
  });
});
