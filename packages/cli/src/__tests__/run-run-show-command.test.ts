import { describe, expect, it } from "vitest";
import type {
  HarnessRunAggregate
} from "@krn/harness/repositories";

import {
  runRunShowCommand
} from "../run-run-show-command.js";
import type {
  DecisionPacketReadModel
} from "../run-run-show-command.js";

const now = "2026-06-25T14:40:00.000Z";

const activationRetrievalDiagnostics = {
  projectScoped: true,
  inputStatus: "empty_activation_store",
  memoryRecordCount: 0,
  sourceClaimCount: 0,
  searchResultCount: 0,
  ownerFileCandidateCount: 0,
  antiMemoryRecordCount: 0,
  mergedCandidateCount: 0,
  targetReadModelStatus: "not_provided",
  sourceSeedCount: 0,
  targetOwnerFileCount: 0,
  trustExclusionCount: 0,
  doesNotProve:
    "Activation diagnostics do not prove selected context is sufficient, source truth is correct, or ranking quality is good."
} as const;

const aggregate: HarnessRunAggregate = {
  operatorIntent: {
    id: "intent-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    source: "cli",
    rawIntent: "show run",
    metadata: {},
    createdAt: now
  },
  taskContract: {
    id: "task-1",
    operatorIntentId: "intent-1",
    projectId: "project-1",
    title: "Read back run evidence",
    objective: "Show persisted evidence without SQL.",
    constraints: ["read-only"],
    nonGoals: ["do not mutate memory"],
    acceptance: ["operator sees proof boundaries"],
    status: "active",
    metadata: {},
    createdAt: now,
    updatedAt: now
  },
  harnessPlan: {
    id: "plan-1",
    taskContractId: "task-1",
    version: 1,
    status: "ready",
    summary: "Decision packet read model plan",
    metadata: {
      brainKnowledgeSelection: {
        kind: "krn.brainKnowledgePlanSelection.v1",
        status: "selected",
        query: "unknown first",
        source: "brain_knowledge_catalog",
        selectedKnowledgeIds: ["ts-boundary-unknown-first-result-state"],
        selectedKnowledge: [{
          id: "pattern:ts-boundary-unknown-first-result-state",
          knowledgeId: "ts-boundary-unknown-first-result-state",
          title: "Unknown-first TypeScript boundary",
          reviewability: "ready",
          nextAction: "use",
          targetFit: "target_specific",
          targetFitReasons: ["matched distinctive query token(s): unknown, first."],
          doesNotProve:
            "This brain knowledge does not prove the implementation used unknown-first validation correctly."
        }],
        targetFitSummary: {
          verdict: "target_specific_selected_knowledge",
          targetSpecific: 1,
          genericGuardrail: 0,
          adjacentPattern: 0,
          noise: 0,
          unknown: 0,
          recommendedUse:
            "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
          doesNotProve:
            "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
        },
        recommendedNextAction:
          "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
        reason: "Brain knowledge matched the pre-coding plan query.",
        doesNotProve:
          "Selected brain knowledge do not prove implementation correctness, source truth, ranking quality, or product readiness.",
        proof: {
          proves: ["brain knowledge catalog selected a brain knowledge for the plan query"],
          doesNotProve: ["future pattern recall quality"]
        }
      }
    },
    createdAt: now,
    updatedAt: now
  },
  contextAssembly: {
    id: "context-1",
    harnessPlanId: "plan-1",
    status: "assembled",
    tokenBudget: 100,
    inclusions: [{
      subjectType: "source_claim",
      subjectId: "claim-1",
      reason: "Evidence readback should distinguish proof strength.",
      expectedUse: "Render proof boundary.",
      tokenEstimate: 20,
      sourceAuthority: "project-decision"
    }],
    exclusions: [{
      subjectType: "source_claim",
      subjectId: "claim-weak",
      reason: "low_trust",
      explanation: "Weak source excluded.",
      score: 10,
      sourceAuthority: "low"
    }],
    metadata: {
      activationRetrievalDiagnostics
    },
    createdAt: now
  },
  activationTrace: {
    retrievalRunId: "retrieval-1",
    candidates: [{
      id: "retrieval-candidate-1",
      retrievalRunId: "retrieval-1",
      kind: "source",
      status: "included",
      subjectType: "source_claim",
      subjectId: "claim-1",
      sourceAuthority: "project-decision",
      lexicalScore: 12,
      vectorScore: 0,
      graphScore: 9,
      temporalScore: 0,
      contextRoiScore: 80,
      totalScore: 113,
      score: 113,
      reason: "Relevant source claim. Edge-aware source graph context: narrows.",
      metadata: {
        feedbackScore: 12,
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-1"],
          edgeKinds: ["narrows"],
          seedSourceClaimIds: ["claim-seed"],
          doesNotProve:
            "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        }
      },
      createdAt: now
    }, {
      id: "retrieval-candidate-2",
      retrievalRunId: "retrieval-1",
      kind: "memory",
      status: "included",
      subjectType: "memory_record",
      subjectId: "memory-refreshed-1",
      sourceAuthority: "project-decision",
      lexicalScore: 16,
      vectorScore: 0,
      graphScore: 0,
      temporalScore: 20,
      contextRoiScore: 40,
      totalScore: 106,
      score: 106,
      reason: "Current frontend bootstrap project standard.",
      metadata: {
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-refreshed-1",
          key: "frontend-bootstrap-standard",
          sourceRefs: ["source-claim-2", "feedback-delta-2"],
          mechanism: "Reviewed feedback and source claim show the current frontend boilerplate replaced the older starter.",
          krnImplication: "Activation should select this standard for new frontend project setup and caveat the superseded path.",
          decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
          rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects.",
          consumer: "activation:new-project-setup",
          falsifier: "A matching new-project DecisionPacket omits memory-refreshed-1 or includes memory-stale-1 as current guidance.",
          validFrom: "2026-06-01T00:00:00.000Z",
          doesNotProve: "This project standard does not prove the starter applies to every stack or future template revision."
        }
      },
      createdAt: now
    }],
    decisions: [{
      id: "activation-decision-1",
      retrievalRunId: "retrieval-1",
      retrievalCandidateId: "retrieval-candidate-1",
      contextAssemblyId: "context-1",
      subjectType: "source_claim",
      subjectId: "claim-1",
      decision: "included",
      reason: "Evidence readback should distinguish proof strength.",
      score: 113,
      contextBudgetCost: 20,
      expectedDecisionImpact: "Render proof boundary.",
      metadata: {
        expectedUse: "Render proof boundary.",
        sourceSupportState: "source_claim_supported"
      },
      createdAt: now
    }]
  },
  executionRun: {
    id: "run-1",
    harnessPlanId: "plan-1",
    adapter: "cli",
    status: "succeeded",
    metadata: {
      projectResolution: {
        kind: "connected_repo_path",
        reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
        doesNotProve:
          "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
        repoPathHint: "/repo/root"
      }
    },
    createdAt: now,
    updatedAt: now
  },
  evidenceBundles: [{
    id: "evidence-1",
    executionRunId: "run-1",
    status: "captured",
    changedFiles: ["packages/cli/src/run-run-show-command.ts"],
    commands: [{
      command: "pnpm typecheck",
      status: "passed",
      provenance: "operator_reported",
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    }],
    diffRisk: "medium",
    reviewBurden: "Review readback output.",
    rollbackPath: "Revert run show commit.",
    metadata: {
      changedFileClassification: {
        intended: ["packages/cli/src/run-run-show-command.ts"],
        unrelated: [],
        unknown: []
      },
      targetEvidence: {
        targetRepo: "../wilq-seo",
        mode: "observation_only",
        dirtyBefore: "dirty",
        dirtyAfter: "dirty",
        ownedChanges: "external",
        targetStatusFreshness: "changed_since_selection",
        targetPatchLifecycle: "handed_off_unresolved",
        handoffArtifact: "review-evidence/target/HANDOFF.md",
        targetOwnerDecision: "stronger verification requested",
        allowedWrites: [],
        forbiddenWrites: ["wilq-seo/**"],
        changedFiles: [{
          status: "M",
          path: "apps/dashboard/src/App.tsx",
          ownership: "external"
        }],
        commands: ["wilq-seo scripts/test.sh"],
        doesNotProve: [
          "Target evidence does not prove KRN source correctness.",
          "Target evidence does not prove product readiness or V02-01 second-operator usability."
        ]
      }
    },
    createdAt: now,
    updatedAt: now
  }],
  reviewAssessments: [{
    id: "review-1",
    evidenceBundleId: "evidence-1",
    status: "pending",
    reviewer: "krn-cli",
    summary: "Review required.",
    findings: [],
    metadata: {},
    createdAt: now,
    updatedAt: now
  }],
  feedbackDeltas: [{
    id: "feedback-1",
    reviewAssessmentId: "review-1",
    status: "candidate",
    memoryCandidates: [{
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "run-1",
      feedbackDeltaId: "feedback-1",
      proposedBy: "krn evidence capture",
      kind: "pattern",
      status: "proposed",
      summary: "Review changed files for reusable memory.",
      body: "Changed files may contain reusable KRN operating knowledge.",
      owner: "krn-cli",
      confidence: 50,
      applicationGuidance: "Review only with source lineage.",
      sourceClaimIds: [],
      sourceLineage: [],
      isUserPreference: false,
      validFrom: now,
      metadata: {
        reviewability: "needs_more_evidence",
        reviewabilityReasons: ["Missing source lineage."]
      },
      createdAt: now,
      updatedAt: now
    }],
    sourceDecisions: [{
      id: "source-decision-candidate-1",
      status: "defer",
      decision: "Review changed files for source graph decision updates.",
      rationale: "Changed files imply a possible source decision.",
      falsifier: "No SourceClaim with mechanism exists.",
      consumer: "krn evidence capture",
      metadata: {
        reviewability: "needs_more_evidence",
        reviewabilityReasons: ["Missing source claim."]
      },
      createdAt: now,
      updatedAt: now
    }],
    evalCandidates: [],
    metadata: {
      reviewability: "needs_more_evidence",
      sourceUsefulnessOutcomes: [{
        sourceClaimId: "claim-1",
        sourceDecisionId: "source-decision-candidate-1",
        outcome: "helped",
        reason: "Source claim kept command proof boundaries visible in the decision packet read model.",
        evidenceRefs: ["evidence-1", "feedback-1"],
        doesNotProve:
          "This source outcome does not prove the source selector will choose the same claim in future runs."
      }, {
        sourceClaimId: "claim-weak",
        outcome: "stale",
        reason: "Weak source was excluded and should not guide future evidence proof claims.",
        evidenceRefs: ["context-1"],
        doesNotProve:
          "This stale outcome does not alter or deprecate SourceClaim truth."
      }, {
        sourceClaimId: "claim-incomplete",
        outcome: "helped",
        reason: "Missing doesNotProve should drop this malformed feedback row.",
        evidenceRefs: ["feedback-1"]
      }],
      brainKnowledgeUsefulnessOutcomes: [{
        brainKnowledgeId: "pattern:ts-boundary-unknown-first-result-state",
        outcome: "helped",
        reason: "Knowledge selected the unknown-first parser shape for the implementation.",
        evidenceRefs: ["evidence-1", "feedback-1"],
        doesNotProve:
          "This pattern outcome does not prove future pattern recall or TypeScript quality."
      }, {
        brainKnowledgeId: "pattern-incomplete",
        outcome: "helped",
        reason: "Missing doesNotProve should drop this malformed pattern row.",
        evidenceRefs: ["feedback-1"]
      }]
    },
    createdAt: now,
    updatedAt: now
  }],
  runEvents: []
};

const isRecord = (input: unknown): input is Record<string, unknown> =>
  typeof input === "object" && input !== null && !Array.isArray(input);

const isDecisionPacketReadModel = (input: unknown): input is DecisionPacketReadModel =>
  isRecord(input) && input.kind === "krn.decisionPacket.readModel.v1";

describe("runRunShowCommand", () => {
  it("renders persisted run evidence without mutating state", async () => {
    let closed = false;
    const result = await runRunShowCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      runId: "run-1",
      format: "text",
      createDatabaseRuntime: async () => ({
        harnessRunRepository: {
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-1" ? aggregate : undefined;
          }
        },
        async close() {
          closed = true;
        }
      })
    });

    expect(result.stdout).toContain("KRN Decision Packet Read Model");
    expect(result.stdout).toContain("Persistence: read-only (Postgres)");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Run ID: run-1");
    expect(result.stdout).toContain("project resolution: connected_repo_path (connected repo path)");
    expect(result.stdout).toContain(
      "project resolution reason: Resolved from repo_installations.local_path_hint matching the current repo root."
    );
    expect(result.stdout).toContain("project resolution repoPathHint: /repo/root");
    expect(result.stdout).toContain(
      "project resolution does not prove: Connected repo path resolution does not prove owner files are complete, current, or sufficient."
    );
    expect(result.stdout).toContain("Selected KRN Context:");
    expect(result.stdout).toContain("Selected KRN context: selected");
    expect(result.stdout).toContain("Selected KRN context query: unknown first");
    expect(result.stdout).toContain("Selected KRN context IDs: ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Selected KRN context targetFit: target_specific_selected_knowledge");
    expect(result.stdout).toContain("Selected KRN context recommended use: Use target-specific selectedKnowledge");
    expect(result.stdout).toContain(
      "knowledge=ts-boundary-unknown-first-result-state | card=pattern:ts-boundary-unknown-first-result-state | reviewability=ready | targetFit=target_specific"
    );
    expect(result.stdout).toContain(
      "Selected KRN context does not prove: Selected brain knowledge do not prove implementation correctness"
    );
    expect(result.stdout).toContain("Activation diagnostics:");
    expect(result.stdout).toContain("Context inclusion details:");
    expect(result.stdout).toContain("source_claim:claim-1");
    expect(result.stdout).toContain("expectedUse: Render proof boundary.");
    expect(result.stdout).toContain("Activation trace:");
    expect(result.stdout).toContain("retrievalRunId: retrieval-1");
    expect(result.stdout).toContain("source_claim:claim-1 | status=included | kind=source");
    expect(result.stdout).toContain("scores: lexical=12 vector=0 graph=9 temporal=0 contextRoi=80 feedback=12 total=113");
    expect(result.stdout).toContain("memory_record:memory-refreshed-1 | status=included | kind=memory");
    expect(result.stdout).toContain("projectStandardDecision:");
    expect(result.stdout).toContain("decision: Use the refreshed frontend bootstrap standard for matching new frontend projects.");
    expect(result.stdout).toContain("consumer: activation:new-project-setup");
    expect(result.stdout).toContain("falsifier: A matching new-project DecisionPacket omits memory-refreshed-1");
    expect(result.stdout).toContain("sourceClaimEdgeInfluence:");
    expect(result.stdout).toContain("edgeIds: edge-1");
    expect(result.stdout).toContain("edgeKinds: narrows");
    expect(result.stdout).toContain("seedSourceClaimIds: claim-seed");
    expect(result.stdout).toContain(
      "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
    );
    expect(result.stdout).toContain("Context exclusion details:");
    expect(result.stdout).toContain("source_claim:claim-weak");
    expect(result.stdout).toContain("explanation: Weak source excluded.");
    expect(result.stdout).toContain("- inputStatus: empty_activation_store");
    expect(result.stdout).toContain(
      "- counts: memory=0 sourceClaims=0 search=0 ownerFile=0 antiMemory=0 merged=0"
    );
    expect(result.stdout).toContain("- targetReadModel: not_provided sourceSeeds=0 ownerFiles=0 trustExclusions=0");
    expect(result.stdout).toContain("changed file classification:");
    expect(result.stdout).toContain("- intended=1");
    expect(result.stdout).toContain("- unrelated=0");
    expect(result.stdout).toContain("- unknown=0");
    expect(result.stdout).toContain("targetEvidence:");
    expect(result.stdout).toContain("- repo: ../wilq-seo");
    expect(result.stdout).toContain("- mode: observation_only");
    expect(result.stdout).toContain("- dirtyBefore: dirty");
    expect(result.stdout).toContain("- targetStatusFreshness: changed_since_selection");
    expect(result.stdout).toContain("- targetPatchLifecycle: handed_off_unresolved");
    expect(result.stdout).toContain("- handoffArtifact: review-evidence/target/HANDOFF.md");
    expect(result.stdout).toContain("- targetOwnerDecision: stronger verification requested");
    expect(result.stdout).toContain("- M apps/dashboard/src/App.tsx | ownership=external");
    expect(result.stdout).toContain("pnpm typecheck: passed | provenance=operator_reported");
    expect(result.stdout).toContain("doesNotProve: This command result does not prove memory quality");
    expect(result.stdout).toContain("memory_candidate:memory-candidate-1");
    expect(result.stdout).toContain("source_decision_candidate:source-decision-candidate-1");
    expect(result.stdout).toContain("source_decision=1");
    expect(result.stdout).toContain("source usefulness outcomes:");
    expect(result.stdout).toContain(
      "outcome=helped sourceClaim=claim-1 sourceDecision=source-decision-candidate-1"
    );
    expect(result.stdout).toContain(
      "reason: Source claim kept command proof boundaries visible in the decision packet read model."
    );
    expect(result.stdout).toContain("evidenceRef: evidence-1");
    expect(result.stdout).toContain(
      "doesNotProve: This source outcome does not prove the source selector will choose the same claim in future runs."
    );
    expect(result.stdout).toContain("outcome=stale sourceClaim=claim-weak sourceDecision=none");
    expect(result.stdout).not.toContain("claim-incomplete");
    expect(result.stdout).toContain("knowledge usefulness outcomes:");
    expect(result.stdout).toContain("outcome=helped knowledge=pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain(
      "reason: Knowledge selected the unknown-first parser shape for the implementation."
    );
    expect(result.stdout).toContain(
      "doesNotProve: This pattern outcome does not prove future pattern recall or TypeScript quality."
    );
    expect(result.stdout).not.toContain("pattern-incomplete");
    expect(result.stdout).toContain("reviewability: needs_more_evidence");
    expect(result.stdout).toContain("reviewabilityReason: Missing source claim.");
    expect(result.stdout).not.toContain("reviewability: see candidate metadata or source evidence");
    expect(result.stdout).toContain("What This Does Not Prove:");
    expect(closed).toBe(true);
  });

  it("degrades malformed metadata to explicit readback fallbacks", async () => {
    const malformedAggregate: HarnessRunAggregate = {
      ...aggregate,
      executionRun: {
        ...aggregate.executionRun,
        metadata: {
          projectResolution: {
            kind: "deleted_project",
            reason: 42,
            doesNotProve: false
          }
        }
      },
      evidenceBundles: aggregate.evidenceBundles.map((bundle) => ({
        ...bundle,
        metadata: {
          ...bundle.metadata,
          changedFileClassification: "not-a-record"
        }
      })),
      feedbackDeltas: aggregate.feedbackDeltas.map((feedback) => ({
        ...feedback,
        memoryCandidates: feedback.memoryCandidates.map((candidate) => ({
          ...candidate,
          metadata: {
            reviewability: "ship_it",
            reviewabilityReasons: "missing-array"
          }
        })),
        sourceDecisions: feedback.sourceDecisions.map((decision) => ({
          ...decision,
          metadata: {
            reviewability: ["ready"],
            reviewabilityReasons: "missing-array"
          }
        }))
      }))
    };

    const result = await runRunShowCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      runId: "run-1",
      format: "json",
      createDatabaseRuntime: async () => ({
        harnessRunRepository: {
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-1" ? malformedAggregate : undefined;
          }
        },
        async close() {}
      })
    });

    const parsed: unknown = JSON.parse(result.stdout);

    expect(isDecisionPacketReadModel(parsed)).toBe(true);

    if (!isDecisionPacketReadModel(parsed)) {
      throw new Error("run show json did not render a decision packet read model");
    }

    expect(parsed.run.projectResolution).toBeUndefined();
    expect(parsed.evidenceBundles[0]?.changedFiles.classification).toEqual({
      source: "not_recorded",
      intended: [],
      unrelated: [],
      unknown: ["packages/cli/src/run-run-show-command.ts"]
    });
    expect(parsed.feedbackDeltas[0]?.candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "memory-candidate-1",
          reviewability: "unknown",
          reviewabilityReasons: [
            "Reviewability reasons were not present in candidate metadata."
          ]
        }),
        expect.objectContaining({
          id: "source-decision-candidate-1",
          reviewability: "unknown",
          reviewabilityReasons: [
            "Reviewability reasons were not present in candidate metadata."
          ]
        })
      ])
    );
    expect(result.stdout).not.toContain("ship_it");
    expect(result.stdout).not.toContain("missing-array");
  });

  it("renders read-only typed json for external consumers", async () => {
    let closed = false;
    const result = await runRunShowCommand({
      env: {
        KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
      },
      now: () => now,
      createId: (prefix) => `${prefix}-1`,
      runId: "run-1",
      format: "json",
      createDatabaseRuntime: async () => ({
        harnessRunRepository: {
          async getHarnessRunByExecutionRunId(runId: string) {
            return runId === "run-1" ? aggregate : undefined;
          }
        },
        async close() {
          closed = true;
        }
      })
    });

    const parsed: unknown = JSON.parse(result.stdout);

    expect(isDecisionPacketReadModel(parsed)).toBe(true);

    if (!isDecisionPacketReadModel(parsed)) {
      throw new Error("run show json did not render a decision packet read model");
    }

    expect(parsed).toMatchObject({
      kind: "krn.decisionPacket.readModel.v1",
      access: "read_only",
      mutation: "none",
      run: {
        id: "run-1",
        projectResolution: {
          kind: "connected_repo_path",
          reason: "Resolved from repo_installations.local_path_hint matching the current repo root.",
          doesNotProve:
            "Connected repo path resolution does not prove owner files are complete, current, or sufficient.",
          repoPathHint: "/repo/root"
        }
      },
      brainKnowledgeSelection: {
        kind: "krn.brainKnowledgePlanSelection.v1",
        status: "selected",
        query: "unknown first",
        source: "brain_knowledge_catalog",
        selectedKnowledgeIds: ["ts-boundary-unknown-first-result-state"],
        selectedKnowledge: [{
          id: "pattern:ts-boundary-unknown-first-result-state",
          knowledgeId: "ts-boundary-unknown-first-result-state",
          title: "Unknown-first TypeScript boundary",
          reviewability: "ready",
          nextAction: "use",
          targetFit: "target_specific",
          targetFitReasons: ["matched distinctive query token(s): unknown, first."],
          doesNotProve:
            "This brain knowledge does not prove the implementation used unknown-first validation correctly."
        }],
        targetFitSummary: {
          verdict: "target_specific_selected_knowledge",
          targetSpecific: 1,
          genericGuardrail: 0,
          adjacentPattern: 0,
          noise: 0,
          unknown: 0,
          recommendedUse:
            "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails.",
          doesNotProve:
            "Target-specific selectedKnowledge does not prove source truth, ranking quality, or product readiness."
        },
        recommendedNextAction:
          "Use target-specific selectedKnowledge first, then treat generic or adjacent packets as guardrails."
      },
      context: {
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-1",
          reason: "Evidence readback should distinguish proof strength.",
          expectedUse: "Render proof boundary.",
          tokenEstimate: 20,
          sourceAuthority: "project-decision"
        }],
        exclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-weak",
          reason: "low_trust",
          explanation: "Weak source excluded.",
          score: 10,
          sourceAuthority: "low"
        }],
        activationDiagnostics: {
          inputStatus: "empty_activation_store",
          memoryRecordCount: 0,
          sourceClaimCount: 0,
          searchResultCount: 0,
          ownerFileCandidateCount: 0,
          antiMemoryRecordCount: 0,
          mergedCandidateCount: 0
        },
        activationTrace: {
          retrievalRunId: "retrieval-1",
          decisions: [{
            id: "activation-decision-1",
            subjectType: "source_claim",
            subjectId: "claim-1",
            decision: "included",
            retrievalCandidateId: "retrieval-candidate-1"
          }]
        }
      },
      evidenceBundles: [{
        changedFiles: {
          classification: {
            source: "metadata",
            intended: ["packages/cli/src/run-run-show-command.ts"],
            unrelated: [],
            unknown: []
          }
        },
        targetEvidence: {
          targetRepo: "../wilq-seo",
          mode: "observation_only",
          dirtyBefore: "dirty",
          dirtyAfter: "dirty",
          ownedChanges: "external",
          targetStatusFreshness: "changed_since_selection",
          targetPatchLifecycle: "handed_off_unresolved",
          handoffArtifact: "review-evidence/target/HANDOFF.md",
          targetOwnerDecision: "stronger verification requested",
          allowedWrites: ["none"],
          forbiddenWrites: ["wilq-seo/**"],
          changedFiles: [{
            status: "M",
            path: "apps/dashboard/src/App.tsx",
            ownership: "external"
          }],
          commands: ["wilq-seo scripts/test.sh"]
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "operator_reported",
          doesNotProve:
            "This command result does not prove memory quality, source truth, review correctness, or production readiness."
        }]
      }],
      feedbackDeltas: [{
        memoryRecordMutation: "none",
        candidateCounts: {
          source: 1,
          sourceClaim: 0,
          sourceDecision: 1
        },
        candidates: [{
          kind: "memory_candidate",
          reviewability: "needs_more_evidence",
          reviewabilityReasons: ["Missing source lineage."]
        }, {
          kind: "source_decision_candidate",
          id: "source-decision-candidate-1",
          status: "defer",
          summary: "Review changed files for source graph decision updates.",
          reviewability: "needs_more_evidence",
          reviewabilityReasons: ["Missing source claim."]
        }],
        sourceUsefulnessOutcomes: [{
          sourceClaimId: "claim-1",
          sourceDecisionId: "source-decision-candidate-1",
          outcome: "helped",
          reason: "Source claim kept command proof boundaries visible in the decision packet read model.",
          evidenceRefs: ["evidence-1", "feedback-1"],
          doesNotProve:
            "This source outcome does not prove the source selector will choose the same claim in future runs."
        }, {
          sourceClaimId: "claim-weak",
          outcome: "stale",
          reason: "Weak source was excluded and should not guide future evidence proof claims.",
          evidenceRefs: ["context-1"],
          doesNotProve:
            "This stale outcome does not alter or deprecate SourceClaim truth."
        }],
        brainKnowledgeUsefulnessOutcomes: [{
          brainKnowledgeId: "pattern:ts-boundary-unknown-first-result-state",
          outcome: "helped",
          reason: "Knowledge selected the unknown-first parser shape for the implementation.",
          evidenceRefs: ["evidence-1", "feedback-1"],
          doesNotProve:
            "This pattern outcome does not prove future pattern recall or TypeScript quality."
        }]
      }],
      proof: {
        proves: [
          "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
          "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
          "this readback surface exposes no write action"
        ],
        doesNotProve: [
          "commands were executed by this readback command",
          "activation scoring quality or production graph retrieval quality",
          "memory quality, source truth, review correctness, or product readiness",
          "Memory Core mutation"
        ]
      }
    });
    expect(parsed.context.activationTrace?.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "retrieval-candidate-1",
        subjectType: "source_claim",
        subjectId: "claim-1",
        graphScore: 9,
        feedbackScore: 12,
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-1"],
          edgeKinds: ["narrows"],
          seedSourceClaimIds: ["claim-seed"],
          doesNotProve:
            "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        }
      }),
      expect.objectContaining({
        id: "retrieval-candidate-2",
        subjectType: "memory_record",
        subjectId: "memory-refreshed-1",
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-refreshed-1",
          key: "frontend-bootstrap-standard",
          sourceRefs: ["source-claim-2", "feedback-delta-2"],
          mechanism: "Reviewed feedback and source claim show the current frontend boilerplate replaced the older starter.",
          krnImplication: "Activation should select this standard for new frontend project setup and caveat the superseded path.",
          decision: "Use the refreshed frontend bootstrap standard for matching new frontend projects.",
          rejectedPath: "Do not use the superseded old frontend bootstrap standard for new projects.",
          consumer: "activation:new-project-setup",
          falsifier: "A matching new-project DecisionPacket omits memory-refreshed-1 or includes memory-stale-1 as current guidance.",
          validFrom: "2026-06-01T00:00:00.000Z",
          doesNotProve: "This project standard does not prove the starter applies to every stack or future template revision."
        }
      })
    ]));
    expect(parsed.proof.proves).toEqual([
      "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
      "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
      "this readback surface exposes no write action"
    ]);
    expect(parsed.proof.proves).not.toContain("commands were executed by this readback command");
    expect(parsed.proof.proves).not.toContain(
      "memory quality, source truth, review correctness, or product readiness"
    );
    expect(parsed.proof.doesNotProve).toEqual([
      "commands were executed by this readback command",
      "activation scoring quality or production graph retrieval quality",
      "memory quality, source truth, review correctness, or product readiness",
      "Memory Core mutation"
    ]);
    expect(parsed.evidenceBundles[0]?.commands[0]?.doesNotProve).toBe(
      "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    );
    expect(result.stdout).not.toContain("promote");
    expect(result.stdout).not.toContain("mutate");
    expect(closed).toBe(true);
  });
});
