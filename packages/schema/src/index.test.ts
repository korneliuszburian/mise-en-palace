import { describe, expect, test } from "vitest";

import {
  parseEvidenceCaptureInput,
  parseHarnessCompileInput,
  parseMemoryCandidateInput,
  parseOperatorIntentInput,
  parseSourceClaimInput,
  parseTaskContractInput
} from "./index.js";

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
        supportType: "supports",
        consumer: "db schema"
      })
    ).toThrow();

    const claim = parseSourceClaimInput({
      claim: "Drizzle supports pgvector columns",
      mechanism: "Drizzle maps vector columns to PostgreSQL pgvector",
      krnImplication: "KRN can keep vector search in Postgres",
      doesNotProve: "The vector extension exists in every database",
      trustTier: "high",
      supportType: "supports",
      consumer: "db schema"
    });

    expect(claim.doesNotProve).toContain("extension");
  });

  test("memory candidates require source lineage unless explicitly user preference", () => {
    expect(() =>
      parseMemoryCandidateInput({
        summary: "Use PLAN.md as execution map",
        body: "Complex KRN implementation should keep PLAN.md current.",
        owner: "operator",
        confidence: 90,
        applicationGuidance: "Apply during long-running KRN work"
      })
    ).toThrow();

    const preference = parseMemoryCandidateInput({
      summary: "Keep Polish plans Polish",
      body: "Polish plans should keep prose Polish and commands in English.",
      owner: "operator",
      confidence: 90,
      applicationGuidance: "Apply to Polish handoff and plan docs",
      isUserPreference: true
    });

    expect(preference.sourceLineage).toEqual([]);
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
