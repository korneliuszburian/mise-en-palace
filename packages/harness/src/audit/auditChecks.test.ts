import { describe, expect, it } from "vitest";
import {
  runArchitectureDriftAudit,
  runBoundaryAudit,
  runEvalTheaterAudit,
  runHandoffCompactAudit,
  runMemorySemanticsAudit,
  runRepoSurfaceAudit,
  runSourceGroundingAudit,
  runTypeSafetyAudit
} from "./auditChecks.js";
import type {
  AuditRepoSnapshot
} from "./auditChecks.js";

const baseSnapshot = (overrides: Partial<AuditRepoSnapshot>): AuditRepoSnapshot => ({
  sliceId: "MM-05",
  capturedAt: "2026-06-22T18:00:00.000Z",
  files: [],
  changedFiles: [],
  intendedFiles: [],
  verificationCommands: [],
  ...overrides
});

describe("audit checks", () => {
  it("detects forbidden repo surfaces", () => {
    const findings = runRepoSurfaceAudit(baseSnapshot({
      files: [
        {
          path: "packages/research-foundry/src/index.ts",
          content: "export const researchFoundry = true;"
        },
        {
          path: "packages/cli/src/runSourceCrawlerCommand.ts",
          content: "export const sourceCrawler = true;"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "architecture",
        severity: "blocking",
        title: "Forbidden Research Foundry surface"
      }),
      expect.objectContaining({
        category: "architecture",
        severity: "blocking",
        title: "Forbidden source crawler surface"
      })
    ]));
  });

  it("detects architecture drift in docs or source content", () => {
    const findings = runArchitectureDriftAudit(baseSnapshot({
      files: [
        {
          path: "docs/plans/memory-ideal-state/MM-ROADMAP.md",
          content: "Next we add Pattern Vault as a required product subsystem."
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "architecture",
      severity: "blocking",
      title: "Architecture drift toward rejected subsystem"
    })]);
  });

  it("detects package boundary violations", () => {
    const findings = runBoundaryAudit(baseSnapshot({
      files: [
        {
          path: "packages/core/src/badRuntime.ts",
          content: "import { readFileSync } from 'node:fs';"
        },
        {
          path: "packages/core/src/badSchema.ts",
          content: "import { z } from 'zod';"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "boundary",
        severity: "blocking",
        title: "Core imports forbidden runtime boundary"
      }),
      expect.objectContaining({
        category: "boundary",
        severity: "blocking",
        title: "Core imports schema validation dependency"
      })
    ]));
  });

  it("detects type-safety shortcuts", () => {
    const findings = runTypeSafetyAudit(baseSnapshot({
      files: [
        {
          path: "packages/schema/src/input.ts",
          content: "export const unsafe = (value: any) => value as any;"
        },
        {
          path: "packages/cli/src/config.ts",
          content: "const parsed = JSON.parse(rawConfig);"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "type_safety",
        severity: "warning",
        title: "Unchecked any usage"
      }),
      expect.objectContaining({
        category: "type_safety",
        severity: "warning",
        title: "Unchecked JSON.parse boundary"
      })
    ]));
  });

  it("detects memory semantic violations", () => {
    const findings = runMemorySemanticsAudit(baseSnapshot({
      memoryCandidates: [
        {
          id: "candidate-1",
          summary: "Autopromote memory",
          sourceLineageCount: 0,
          sourceClaimCount: 0,
          hasApplicationGuidance: false,
          hasInvalidationStrategy: false,
          isTemporal: true,
          autoPromotesToMemory: true
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "memory_semantics",
        severity: "blocking",
        title: "Memory candidate can auto-promote"
      }),
      expect.objectContaining({
        category: "memory_semantics",
        severity: "warning",
        title: "Memory candidate lacks lineage"
      })
    ]));
  });

  it("detects active memory with unresolved negative feedback", () => {
    const findings = runMemorySemanticsAudit(baseSnapshot({
      memoryRecords: [
        {
          id: "memory-1",
          summary: "Use stale graph DB guidance",
          status: "active",
          positiveFeedbackCount: 0,
          negativeFeedbackCount: 3,
          hasInvalidationStrategy: true
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "memory_semantics",
      severity: "blocking",
      title: "Active memory has unresolved negative feedback"
    })]);
  });

  it("detects weak source grounding", () => {
    const findings = runSourceGroundingAudit(baseSnapshot({
      sourceClaims: [
        {
          id: "source-1",
          claim: "Mastra proves KRN should clone observational memory.",
          mechanism: "",
          krnImplication: "Use it.",
          doesNotProve: "",
          consumer: "",
          status: "accepted"
        }
      ],
      sourceDecisions: [
        {
          id: "decision-1",
          decision: "Adopt a source crawler.",
          sourceClaimId: undefined,
          falsifier: "",
          consumer: "MM-05"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "source_grounding",
        severity: "blocking",
        title: "Source claim lacks source-to-decision fields"
      }),
      expect.objectContaining({
        category: "source_grounding",
        severity: "blocking",
        title: "Source decision lacks source claim"
      })
    ]));
  });

  it("detects eval theater", () => {
    const findings = runEvalTheaterAudit(baseSnapshot({
      evalCandidates: [
        {
          id: "eval-1",
          title: "Big benchmark pass",
          expectedSignal: "Looks good",
          sourceEvidenceCount: 0,
          protectsRealBehavior: false
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "eval",
      severity: "warning",
      title: "Eval candidate lacks protected behavior"
    })]);
  });

  it("detects incomplete handoff compact data", () => {
    const findings = runHandoffCompactAudit(baseSnapshot({
      handoff: {
        exists: true,
        includesLastGoodCommit: true,
        includesChangedFiles: false,
        includesVerification: true,
        includesRollbackPath: false,
        includesNextAction: true
      }
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "handoff",
        severity: "warning",
        title: "Handoff omits changed files"
      }),
      expect.objectContaining({
        category: "handoff",
        severity: "warning",
        title: "Handoff omits rollback path"
      })
    ]));
  });
});
