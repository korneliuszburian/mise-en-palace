import { describe, expect, it } from "vitest";
import {
  runArchitectureDriftAudit,
  runBoundaryAudit,
  runEvalTheaterAudit,
  runHandoffCompactAudit,
  runMemorySemanticsAudit,
  runSliceEvidenceAudit,
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

  it("detects production imports from colocated test files", () => {
    const findings = runBoundaryAudit(baseSnapshot({
      files: [
        {
          path: "packages/harness/src/activation/activationEngine.ts",
          content: "import { buildActivationFixture } from './activationEngine.test.js';"
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "boundary",
      severity: "blocking",
      title: "Production imports colocated test file"
    })]);
  });

  it("detects public package barrels that export test helpers", () => {
    const findings = runBoundaryAudit(baseSnapshot({
      files: [
        {
          path: "packages/core/src/index.ts",
          content: "export * from './memoryTestHelper.js';"
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "boundary",
      severity: "blocking",
      title: "Package barrel exports test helper"
    })]);
  });

  it("detects production imports from repo fixture paths", () => {
    const findings = runBoundaryAudit(baseSnapshot({
      files: [
        {
          path: "packages/cli/src/runGoldenCommand.ts",
          content: "import fixture from '../../../tests/fixtures/golden-tasks/memory-behavior.json';"
        }
      ]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "boundary",
      severity: "blocking",
      title: "Production imports fixture path"
    })]);
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

  it("detects TypeScript suppression and double assertion shortcuts", () => {
    const findings = runTypeSafetyAudit(baseSnapshot({
      files: [
        {
          path: "packages/cli/src/unsafeConfig.ts",
          content: "const config = value as unknown as RuntimeConfig;"
        },
        {
          path: "packages/core/src/ignored.ts",
          content: "// @ts-ignore\nexport const ignored = buildUnsafeThing();"
        },
        {
          path: "packages/harness/src/expectError.ts",
          content: "// @ts-expect-error\nexport const forced = value;"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "type_safety",
        severity: "warning",
        title: "Double assertion shortcut"
      }),
      expect.objectContaining({
        category: "type_safety",
        severity: "blocking",
        title: "Unchecked ts-ignore suppression"
      }),
      expect.objectContaining({
        category: "type_safety",
        severity: "warning",
        title: "Undocumented ts-expect-error suppression"
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

  it("detects unhealthy memory records", () => {
    const findings = runMemorySemanticsAudit(baseSnapshot({
      memoryRecords: [
        {
          id: "memory-stale",
          summary: "Use the old markdown memory folder",
          status: "stale",
          confidence: 95,
          positiveFeedbackCount: 0,
          negativeFeedbackCount: 0,
          hasInvalidationStrategy: false,
          hasApplicationGuidance: false,
          isTemporal: true,
          sourceLineageCount: 0,
          sourceClaimCount: 0
        },
        {
          id: "memory-unproven",
          summary: "Always use a separate vector DB",
          status: "active",
          confidence: 80,
          positiveFeedbackCount: 0,
          negativeFeedbackCount: 0,
          hasInvalidationStrategy: true,
          hasApplicationGuidance: true,
          isTemporal: false,
          sourceLineageCount: 0,
          sourceClaimCount: 0
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "memory_semantics",
        severity: "blocking",
        title: "Stale high-confidence memory remains reviewable"
      }),
      expect.objectContaining({
        category: "memory_semantics",
        severity: "blocking",
        title: "Active memory lacks lineage"
      }),
      expect.objectContaining({
        category: "memory_semantics",
        severity: "warning",
        title: "Active memory has no application feedback"
      }),
      expect.objectContaining({
        category: "memory_semantics",
        severity: "warning",
        title: "Memory record lacks application guidance"
      }),
      expect.objectContaining({
        category: "memory_semantics",
        severity: "warning",
        title: "Temporal memory record lacks invalidation strategy"
      })
    ]));
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

  it("detects unhealthy source graph snapshots", () => {
    const findings = runSourceGroundingAudit(baseSnapshot({
      capturedAt: "2026-06-23T12:00:00.000Z",
      sourceClaims: [
        {
          id: "source-decorative",
          claim: "Dashboard screenshots are enough evidence.",
          mechanism: "A screenshot can show a UI state.",
          krnImplication: "Use screenshots as decision evidence.",
          doesNotProve: "This does not prove runtime memory behavior.",
          consumer: "MM-37 source graph health audit",
          supportType: "background",
          status: "accepted"
        },
        {
          id: "source-stale",
          claim: "Old source crawler direction is still current.",
          mechanism: "The old plan mentioned crawler behavior.",
          krnImplication: "Treat crawler guidance as active.",
          doesNotProve: "This does not prove current plan acceptance.",
          consumer: "MM-37 source graph health audit",
          supportType: "risk",
          revisitWhen: "2026-06-01T00:00:00.000Z",
          status: "accepted"
        },
        {
          id: "source-orphan",
          claim: "A source claim exists but has no decision edge.",
          mechanism: "Unreferenced claims do not change behavior.",
          krnImplication: "Audit should flag source hoarding.",
          doesNotProve: "This does not prove all source graph usage.",
          consumer: "MM-37 source graph health audit",
          supportType: "mechanism",
          status: "accepted"
        },
        {
          id: "source-rejected",
          claim: "Rejected source should not support decisions.",
          mechanism: "Rejected evidence is not decision support.",
          krnImplication: "Audit should catch legacy bad rows.",
          doesNotProve: "This does not prove repository write guards.",
          consumer: "MM-37 source graph health audit",
          supportType: "rejection",
          status: "rejected"
        }
      ],
      sourceDecisions: [
        {
          id: "decision-bad-support",
          decision: "Adopt rejected source guidance.",
          sourceClaimId: "source-rejected",
          falsifier: "Rejected sources still support decisions.",
          consumer: "MM-37 source graph health audit"
        }
      ]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "source_grounding",
        severity: "blocking",
        title: "Source claim has decorative support type"
      }),
      expect.objectContaining({
        category: "source_grounding",
        severity: "warning",
        title: "Accepted source claim is stale"
      }),
      expect.objectContaining({
        category: "source_grounding",
        severity: "warning",
        title: "Accepted source claim has no source decision"
      }),
      expect.objectContaining({
        category: "source_grounding",
        severity: "blocking",
        title: "Source decision uses rejected claim"
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

  it("detects missing slice evidence inputs", () => {
    const findings = runSliceEvidenceAudit(baseSnapshot({
      sliceId: "MM-32B",
      changedFiles: ["packages/harness/src/audit/auditChecks.ts"]
    }));

    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: "verification",
        severity: "warning",
        title: "Audit snapshot lacks intended files"
      }),
      expect.objectContaining({
        category: "verification",
        severity: "warning",
        title: "Audit snapshot lacks verification commands"
      })
    ]));
  });

  it("detects changed files outside intended slice scope", () => {
    const findings = runSliceEvidenceAudit(baseSnapshot({
      sliceId: "MM-32B",
      changedFiles: [
        "packages/harness/src/audit/auditChecks.ts",
        "packages/api/src/server.ts"
      ],
      intendedFiles: ["packages/harness/src/audit/auditChecks.ts"],
      verificationCommands: [{ command: "pnpm test", status: "passed" }]
    }));

    expect(findings).toEqual([expect.objectContaining({
      category: "verification",
      severity: "warning",
      title: "Changed file outside intended slice scope"
    })]);
  });
});
