import { describe, expect, test } from "vitest";
import {
  OBSERVATION_SOURCE_RANGE_POLICY
} from "../../core/src/observations/observationPolicy.js";

import {
  type ObservationItem,
  ObservationKindSchema,
  ObservationProvenanceKindSchema,
  parseAuditBundleInput,
  parseEvidenceCaptureInput,
  parseHarnessCompileInput,
  parseMemoryCandidateInput,
  parseObservationGroupInput,
  parseObservationItemInput,
  parseOperatorIntentInput,
  parseReflectionRecordInput,
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
  test("observation item inputs parse source-ranged staging records into core-compatible shape", () => {
    const observation: ObservationItem = parseObservationItemInput({
      id: "observation-1",
      groupId: "group-1",
      scope: {
        projectId: "project-1",
        workspaceId: "workspace-1",
        executionRunId: "run-1"
      },
      kind: "fact",
      status: "observed",
      priority: "medium",
      confidence: "high",
      provenanceKind: "run_event",
      subject: "memory brain audit",
      summary: "Audit CLI found advisory findings only.",
      body: "The observation is sourced to a dogfood audit run.",
      temporalScope: {
        observedAt: "2026-06-22T18:20:00.000Z",
        ingestedAt: "2026-06-22T18:21:00.000Z",
        referencedAt: "2026-06-22T18:19:22.000Z",
        relativeTimeBase: "2026-06-22T18:20:00.000Z"
      },
      sourceRanges: [
        {
          id: "range-1",
          sourceType: "evidence_bundle",
          sourceId: "evidence-1",
          locator: "docs/runs/2026-06-22-memory-brain-audit-dogfood.md#results",
          excerpt: "Repo audit verdict: advisory",
          capturedAt: "2026-06-22T18:21:00.000Z"
        }
      ],
      entityLinks: [
        {
          entityKind: "project",
          entityId: "project-1",
          relation: "observed_in"
        }
      ],
      claimLinks: [],
      metadata: {
        source: "dogfood"
      }
    });

    expect(observation.sourceRanges).toHaveLength(1);
    expect(observation.entityLinks[0]?.entityKind).toBe("project");
    expect(observation.createdAt).toBeDefined();
    expect(observation.updatedAt).toBeDefined();
  });

  test("observation schemas reject unsourced factual claims and private reasoning metadata", () => {
    expect(() =>
      parseObservationItemInput({
        id: "observation-1",
        groupId: "group-1",
        scope: {
          projectId: "project-1"
        },
        kind: "fact",
        status: "observed",
        priority: "medium",
        confidence: "medium",
        provenanceKind: "run_event",
        subject: "unsupported claim",
        summary: "Unsupported factual observation.",
        body: "This should fail because it lacks source ranges.",
        temporalScope: {
          observedAt: "2026-06-22T18:20:00.000Z",
          ingestedAt: "2026-06-22T18:21:00.000Z"
        },
        sourceRanges: []
      })
    ).toThrow();

    expect(() =>
      parseObservationItemInput({
        id: "observation-1",
        groupId: "group-1",
        scope: {
          projectId: "project-1"
        },
        kind: "preference",
        status: "observed",
        priority: "low",
        confidence: "medium",
        provenanceKind: "user_preference",
        subject: "operator preference",
        summary: "Preference can omit source ranges.",
        body: "But private reasoning metadata is forbidden.",
        temporalScope: {
          observedAt: "2026-06-22T18:20:00.000Z",
          ingestedAt: "2026-06-22T18:21:00.000Z"
        },
        sourceRanges: [],
        metadata: {
          chainOfThought: "private reasoning"
        }
      })
    ).toThrow();
  });

  test("observation schemas reject invalid datetimes and normalize valid offsets", () => {
    expect(() =>
      parseObservationItemInput({
        id: "observation-1",
        groupId: "group-1",
        scope: {
          projectId: "project-1"
        },
        kind: "fact",
        status: "observed",
        priority: "medium",
        confidence: "medium",
        provenanceKind: "run_event",
        subject: "invalid temporal anchor",
        summary: "Invalid temporal anchors must fail.",
        body: "Temporal memory needs parseable datetimes.",
        temporalScope: {
          observedAt: "not-a-date",
          ingestedAt: "2026-06-22T18:21:00.000Z"
        },
        sourceRanges: [{
          id: "range-1",
          sourceType: "run_event",
          sourceId: "run-event-1",
          locator: "run_events.sequence:1",
          capturedAt: "2026-06-22T18:21:00.000Z"
        }]
      })
    ).toThrow();

    const observation = parseObservationItemInput({
      id: "observation-1",
      groupId: "group-1",
      scope: {
        projectId: "project-1"
      },
      kind: "fact",
      status: "observed",
      priority: "medium",
      confidence: "medium",
      provenanceKind: "run_event",
      subject: "normalized temporal anchor",
      summary: "Offset datetimes normalize to UTC.",
      body: "Temporal memory should compare normalized timestamps.",
      temporalScope: {
        observedAt: "2026-06-22T20:20:00+02:00",
        ingestedAt: "2026-06-22T18:21:00Z",
        validUntil: "2026-06-22T21:20:00+02:00"
      },
      sourceRanges: [{
        id: "range-1",
        sourceType: "run_event",
        sourceId: "run-event-1",
        locator: "run_events.sequence:1",
        capturedAt: "2026-06-22T20:21:00+02:00"
      }]
    });

    expect(observation.temporalScope.observedAt).toBe("2026-06-22T18:20:00.000Z");
    expect(observation.temporalScope.ingestedAt).toBe("2026-06-22T18:21:00.000Z");
    expect(observation.temporalScope.validUntil).toBe("2026-06-22T19:20:00.000Z");
    expect(observation.sourceRanges[0]?.capturedAt).toBe("2026-06-22T18:21:00.000Z");
  });

  test("observation schema enum coverage matches core source-range policy", () => {
    const coreKinds = Object.keys(OBSERVATION_SOURCE_RANGE_POLICY).sort();
    const schemaKinds = [...ObservationKindSchema.options].sort();

    expect(schemaKinds).toEqual(coreKinds);

    for (const kind of coreKinds) {
      const coreProvenanceKinds = Object.keys(
        OBSERVATION_SOURCE_RANGE_POLICY[
          kind as keyof typeof OBSERVATION_SOURCE_RANGE_POLICY
        ]
      ).sort();

      expect([...ObservationProvenanceKindSchema.options].sort()).toEqual(coreProvenanceKinds);
    }
  });

  test("observation schema source-range requirement matches core policy", () => {
    for (const [kind, policyByProvenance] of Object.entries(OBSERVATION_SOURCE_RANGE_POLICY)) {
      for (const [provenanceKind, requiresSourceRange] of Object.entries(policyByProvenance)) {
        const parse = () =>
          parseObservationItemInput({
            id: "observation-1",
            groupId: "group-1",
            scope: {
              projectId: "project-1"
            },
            kind,
            status: "observed",
            priority: "medium",
            confidence: "medium",
            provenanceKind,
            subject: "policy parity",
            summary: "Schema must match core source-range policy.",
            body: "Policy drift should fail this test.",
            temporalScope: {
              observedAt: "2026-06-22T18:20:00.000Z",
              ingestedAt: "2026-06-22T18:21:00.000Z"
            },
            sourceRanges: []
          });

        if (requiresSourceRange) {
          expect(parse, `${kind}/${provenanceKind} should require source ranges`).toThrow();
        } else {
          expect(parse, `${kind}/${provenanceKind} should allow source-less input`).not.toThrow();
        }
      }
    }
  });

  test("observation group inputs default metadata and timestamps", () => {
    const group = parseObservationGroupInput({
      id: "group-1",
      scope: {
        projectId: "project-1"
      },
      title: "MM-09 observation schema",
      summary: "Schema boundary for observation IO.",
      source: "manual-test"
    });

    expect(group.metadata).toEqual({});
    expect(group.createdAt).toBeDefined();
    expect(group.updatedAt).toBeDefined();
  });

  test("reflection record inputs parse candidate-only outputs", () => {
    const reflection = parseReflectionRecordInput({
      projectId: "project-1",
      executionRunId: "run-1",
      taskContractId: "task-1",
      summary: "Reflection generated candidate-only output.",
      scope: {
        projectId: "project-1",
        executionRunId: "run-1",
        taskContractId: "task-1"
      },
      input: {
        scope: {
          projectId: "project-1",
          executionRunId: "run-1",
          taskContractId: "task-1"
        },
        observationItemIds: ["observation-1"],
        sourceClaimIds: [],
        antiMemoryKeys: [],
        generatedAt: "2026-06-22T20:00:00.000Z",
        metadata: {}
      },
      output: {
        id: "reflection-1",
        scope: {
          projectId: "project-1",
          executionRunId: "run-1",
          taskContractId: "task-1"
        },
        status: "candidate",
        summary: "Reflection output remains candidate-only.",
        candidateLinks: [{
          targetType: "memory_candidate",
          targetId: "candidate-1",
          summary: "Candidate requires review.",
          evidenceRefs: ["observation-1"]
        }],
        metadata: {},
        createdAt: "2026-06-22T20:00:00.000Z",
        updatedAt: "2026-06-22T20:00:00.000Z"
      },
      metadata: {}
    });

    expect(reflection.output.candidateLinks[0]?.targetType).toBe("memory_candidate");
    expect(reflection.output.findings).toEqual([]);
  });

  test("reflection schemas reject final-truth targets and mutation metadata", () => {
    expect(() =>
      parseReflectionRecordInput({
        projectId: "project-1",
        summary: "Invalid reflection output.",
        scope: {
          projectId: "project-1"
        },
        input: {
          scope: {
            projectId: "project-1"
          },
          observationItemIds: [],
          sourceClaimIds: [],
          antiMemoryKeys: [],
          generatedAt: "2026-06-22T20:00:00.000Z",
          metadata: {}
        },
        output: {
          id: "reflection-1",
          scope: {
            projectId: "project-1"
          },
          status: "candidate",
          summary: "This should fail.",
          candidateLinks: [{
            targetType: "memory_record",
            summary: "This would bypass review.",
            evidenceRefs: []
          }],
          metadata: {},
          createdAt: "2026-06-22T20:00:00.000Z",
          updatedAt: "2026-06-22T20:00:00.000Z"
        },
        metadata: {}
      })
    ).toThrow();

    expect(() =>
      parseReflectionRecordInput({
        projectId: "project-1",
        summary: "Invalid reflection metadata.",
        scope: {
          projectId: "project-1"
        },
        input: {
          scope: {
            projectId: "project-1"
          },
          observationItemIds: [],
          sourceClaimIds: [],
          antiMemoryKeys: [],
          generatedAt: "2026-06-22T20:00:00.000Z",
          metadata: {}
        },
        output: {
          id: "reflection-1",
          scope: {
            projectId: "project-1"
          },
          status: "candidate",
          summary: "This should fail.",
          metadata: {
            createActiveMemory: true
          },
          createdAt: "2026-06-22T20:00:00.000Z",
          updatedAt: "2026-06-22T20:00:00.000Z"
        },
        metadata: {}
      })
    ).toThrow();
  });

  test("audit bundle inputs parse compact review evidence and reject private reasoning keys", () => {
    expect(() =>
      parseAuditBundleInput({
        sliceId: "MM-04",
        changedFiles: ["packages/core/src/auditBundle.ts"],
        intendedFiles: ["packages/core/src/auditBundle.ts"],
        verificationCommands: [
          {
            command: "pnpm typecheck",
            status: "passed"
          }
        ],
        verificationResults: "typecheck passed",
        architecturalDelta: "Adds schema and persistence",
        reviewBurdenEstimate: "low",
        diffRiskEstimate: "low",
        rollbackPath: "git restore packages/schema/src/auditBundle.ts",
        selfCritiqueSummary: "chainOfThought should be rejected",
        finalVerdict: "pass",
        metadata: {
          chainOfThought: "private reasoning"
        }
      })
    ).toThrow();

    const auditBundle = parseAuditBundleInput({
      sliceId: "MM-04",
      commitCandidate: "feat(db): add audit bundle persistence",
      changedFiles: ["packages/schema/src/auditBundle.ts"],
      intendedFiles: ["packages/schema/src/auditBundle.ts"],
      unexpectedFiles: [],
      verificationCommands: [
        {
          command: "pnpm typecheck",
          status: "passed",
          summary: "all packages typechecked"
        }
      ],
      verificationResults: "typecheck passed",
      architecturalDelta: "Adds AuditBundle schemas",
      boundaryFindings: [
        {
          category: "boundary",
          severity: "advisory",
          title: "test-only fs import",
          summary: "Fixture read is test-only",
          evidenceRefs: ["packages/harness/src/activation/noisyBrainFixture.test.ts"],
          recommendation: "Classify test fixture imports separately"
        }
      ],
      reviewBurdenEstimate: "low",
      diffRiskEstimate: "low",
      rollbackPath: "git restore packages/schema/src/auditBundle.ts",
      candidateUpdates: [],
      selfCritiqueSummary: "Schema boundary only; no runtime mutation.",
      finalVerdict: "advisory"
    });

    expect(auditBundle.boundaryFindings).toHaveLength(1);
    expect(auditBundle.evalFindings).toEqual([]);
    expect(auditBundle.metadata).toEqual({});
  });

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

  test("retrieval substrate inputs constrain search, scoring, decisions, and context", () => {
    const parseSearchDocumentInput = parser("parseSearchDocumentInput");
    const parseRetrievalRunInput = parser("parseRetrievalRunInput");
    const parseRetrievalCandidateInput = parser("parseRetrievalCandidateInput");
    const parseActivationDecisionInput = parser("parseActivationDecisionInput");
    const parseContextItemInput = parser("parseContextItemInput");
    const parseContextExclusionInput = parser("parseContextExclusionInput");

    const document = parseSearchDocumentInput({
      subjectType: "source_claim",
      subjectId: "source-claim-1",
      sourceClaimId: "source-claim-1",
      title: "  Source graph Postgres edge tables  ",
      body: "Use Postgres source decision edges before adding a separate graph DB.",
      trustTier: "project-decision"
    });

    expect(document).toMatchObject({
      subjectType: "source_claim",
      searchText:
        "Source graph Postgres edge tables\nUse Postgres source decision edges before adding a separate graph DB.",
      metadataFilters: {},
      metadata: {}
    });

    expect(() =>
      parseRetrievalRunInput({
        query: "source graph postgres edge tables",
        mode: "prompt-dump"
      })
    ).toThrow();

    expect(
      parseRetrievalRunInput({
        executionRunId: "execution-run-1",
        query: "source graph postgres edge tables",
        mode: "hybrid",
        budget: 4000
      })
    ).toMatchObject({
      mode: "hybrid",
      budget: 4000,
      metadataFilters: {},
      metadata: {}
    });

    expect(() =>
      parseRetrievalCandidateInput({
        retrievalRunId: "retrieval-run-1",
        searchDocumentId: "search-document-1",
        candidateType: "search",
        subjectType: "search_document",
        subjectId: "search-document-1",
        trustTier: "project-decision",
        score: 1001,
        reason: "Lexical match"
      })
    ).toThrow();

    expect(
      parseRetrievalCandidateInput({
        retrievalRunId: "retrieval-run-1",
        searchDocumentId: "search-document-1",
        candidateType: "search",
        subjectType: "search_document",
        subjectId: "search-document-1",
        trustTier: "project-decision",
        lexicalScore: 90,
        score: 95,
        reason: "Lexical match plus trusted source metadata"
      })
    ).toMatchObject({
      candidateType: "search",
      status: "candidate",
      score: 95,
      metadata: {}
    });

    expect(() =>
      parseActivationDecisionInput({
        retrievalRunId: "retrieval-run-1",
        subjectType: "search_document",
        subjectId: "search-document-1",
        decision: "maybe",
        reason: "Unclear"
      })
    ).toThrow();

    expect(
      parseActivationDecisionInput({
        retrievalRunId: "retrieval-run-1",
        retrievalCandidateId: "candidate-1",
        subjectType: "search_document",
        subjectId: "search-document-1",
        decision: "included",
        reason: "High trust and directly relevant",
        contextBudgetCost: 240,
        expectedDecisionImpact: "Supports choosing Postgres edge tables"
      })
    ).toMatchObject({
      decision: "included",
      contextBudgetCost: 240,
      metadata: {}
    });

    expect(
      parseContextItemInput({
        contextAssemblyId: "context-assembly-1",
        subjectType: "search_document",
        subjectId: "search-document-1",
        position: 1,
        reason: "Direct source graph decision",
        expectedUse: "Guide retrieval substrate implementation",
        trustTier: "project-decision"
      })
    ).toMatchObject({
      position: 1,
      metadata: {}
    });

    expect(() =>
      parseContextExclusionInput({
        contextAssemblyId: "context-assembly-1",
        subjectType: "search_document",
        subjectId: "search-document-2",
        reason: "interesting",
        explanation: "Nearby but irrelevant",
        trustTier: "low"
      })
    ).toThrow();

    expect(
      parseContextExclusionInput({
        contextAssemblyId: "context-assembly-1",
        subjectType: "search_document",
        subjectId: "search-document-2",
        reason: "low_context_roi",
        explanation: "Mentions graph DB but gives no KRN mechanism",
        score: 20,
        trustTier: "low"
      })
    ).toMatchObject({
      reason: "low_context_roi",
      metadata: {}
    });
  });
});
