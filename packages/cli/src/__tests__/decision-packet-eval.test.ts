import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  DecisionPacket
} from "@krn/core";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  parseDecisionPacketEvalFixture
} from "../decision-packet-fixture.js";
import {
  loadDecisionPacketEvalFixture
} from "../decision-packet-fixture.js";
import {
  type DecisionPacketEvalResult,
  classifyDecisionPacketForEval,
  runDecisionPacketEval
} from "../internal/eval/run-decision-packet-eval.js";
import {
  buildDecisionPacketEvalFailurePersistenceInput
} from "../internal/eval/run-decision-packet-eval-persistence.js";

const fixturePath = fileURLToPath(
  new URL("../../../../tests/fixtures/notes-baseline/decision-packet-vs-notes.json", import.meta.url)
);

interface ProjectStandardCaseExpectation {
  readonly id: string;
  readonly expectedDecisionId: string;
  readonly statement: string;
  readonly sourceRejectionId: string;
  readonly staleDecisionId: string;
  readonly rejectedDecisionId: string;
  readonly baselineFailureRationale: string;
}

const loadMutableFixture = (): {
  topK: number;
  minimumAbstentionCaseCount?: number;
  decisions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
} => JSON.parse(readFileSync(fixturePath, "utf8")) as {
  topK: number;
  minimumAbstentionCaseCount?: number;
  decisions: Array<Record<string, unknown>>;
  notes: Array<Record<string, unknown>>;
  cases: Array<Record<string, unknown>>;
};

const expectProjectStandardCase = (
  result: DecisionPacketEvalResult,
  expected: ProjectStandardCaseExpectation
): void => {
  expect(result.cases.find((testCase) =>
    testCase.id === expected.id
  )).toMatchObject({
    expectedDecisionId: expected.expectedDecisionId,
    qualityLabel: "useful",
    scores: {
      taskUsefulness: 1,
      evidenceFidelity: 1,
      temporalCorrectness: 1,
      sourceSupport: 1,
      rejectionRecall: 1,
      abstention: 1,
      consensusConflict: 1,
      nonProofBoundaries: 1,
      total: 8
    },
    notesBaseline: {
      qualityLabel: "unsafe",
      topDecisionIds: expect.arrayContaining([
        expected.expectedDecisionId,
        expected.staleDecisionId,
        expected.rejectedDecisionId
      ]),
      unsafeDecisionIds: expect.arrayContaining([
        expected.staleDecisionId,
        expected.rejectedDecisionId
      ]),
      failureRationale: expected.baselineFailureRationale
    },
    comparisonOutcome: "krn_win",
    packet: {
      governingDecisionIds: expect.arrayContaining([expected.expectedDecisionId]),
      governingStatements: expect.arrayContaining([expected.statement]),
      taskStandardDecisions: [expect.objectContaining({
        decision: expected.statement
      })],
      sourceRejectionIds: expect.arrayContaining([expected.sourceRejectionId]),
      staleDecisionIds: [expected.staleDecisionId],
      rejectedPathIds: [expected.rejectedDecisionId],
      verificationCommands: ["pnpm --filter @krn/cli test -- decision-packet-eval"],
      abstentionScore: {
        status: "ready",
        score: 100,
        reasons: []
      },
      brief: {
        observationPrefixCount: 1,
        evidenceGapIds: [],
        includedSourceClaimIds: expect.arrayContaining([`source-claim:${expected.expectedDecisionId}`]),
        includedMemoryRecordIds: expect.arrayContaining([`memory:decision:${expected.expectedDecisionId}`]),
        excludedSourceClaimIds: expect.arrayContaining([
          `source-claim:${expected.staleDecisionId}`,
          `source-claim:${expected.rejectedDecisionId}`
        ])
      },
      severeStaleAuthorityIds: []
    }
  });
};

describe("runDecisionPacketEval", () => {
  it("passes the pre-code decision-packet quality benchmark", async () => {
    const result = await runDecisionPacketEval(loadDecisionPacketEvalFixture(fixturePath));

    expect(result).toMatchObject({
      kind: "krn.decisionPacket.eval.v1",
      scorerModel: "DecisionPacketEvalCase.v1",
      fixtureVersion: "1",
      status: "pass",
      thresholds: {
        minimumUsefulRate: 0.8,
        minimumKrnWinRate: 0.75,
        maximumNotesWinRate: 0,
        maximumSevereStaleAuthorityInclusions: 0,
        maximumCaveatedSourceClaimInclusions: 0,
        maximumMissingAbstentions: 0,
        minimumAbstentionScore: 1,
        minimumAbstentionCaseCount: 1,
        minimumAverageConsensusConflictScore: 1,
        maximumAverageNoiseDecisions: 2
      },
      metrics: {
        caseCount: 21,
        usefulCount: 20,
        abstainedCount: 1,
        noisyCount: 0,
        missCount: 0,
        staleAuthorityCount: 0,
        notesUsableCount: 5,
        notesUnsafeCount: 15,
        notesUnsupportedCount: 1,
        notesMissCount: 0,
        krnWinCount: 16,
        notesWinCount: 0,
        tieCount: 5,
        decisiveComparisonCount: 16,
        abstentionCaseCount: 1,
        correctAbstentionCount: 1,
        usefulRate: 0.9524,
        krnWinRate: 1,
        notesWinRate: 0,
        abstentionScore: 1,
        averageConsensusConflictScore: 1,
        averageNoiseDecisions: 0.6667,
        severeStaleAuthorityInclusions: 0,
        caveatedSourceClaimInclusions: 0,
        missingAbstentions: 0
      },
      evalCandidates: []
    });
    expect(result.cases.filter((testCase) => testCase.qualityLabel === "useful")).toHaveLength(20);
    expect(result.cases.filter((testCase) => testCase.qualityLabel === "abstained")).toHaveLength(1);
    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )).toMatchObject({
      expectedDecisionId: "store-backed-memory-no-markdown",
      qualityLabel: "useful",
      scores: {
        taskUsefulness: 1,
        evidenceFidelity: 1,
        temporalCorrectness: 1,
        sourceSupport: 1,
        rejectionRecall: 1,
        abstention: 1,
        consensusConflict: 1,
        nonProofBoundaries: 1,
        total: 8
      },
      notesBaseline: {
        qualityLabel: "unsafe",
        topDecisionIds: [
          "store-backed-memory-no-markdown",
          "create-markdown-memory-files",
          "markdown-runtime-memory"
        ],
        unsafeDecisionIds: [
          "create-markdown-memory-files",
          "markdown-runtime-memory"
        ],
        failureRationale:
          "Notes grep can recall the current line, but it also returns stale and rejected markdown-memory paths without authority status."
      },
      comparisonOutcome: "krn_win",
      packet: {
        formatVersion: "krn.decisionPacket.v1",
        governingDecisionIds: expect.arrayContaining(["store-backed-memory-no-markdown"]),
        governingStatements: expect.arrayContaining([
          "Use store-backed MemoryRecord and SourceClaim evidence for runtime memory. Do not create markdown memory files as the active recall system."
        ]),
        sourceClaimIds: expect.arrayContaining(["source-claim:store-backed-memory-no-markdown"]),
        caveatedSourceClaimIds: [],
        sourceDecisionEdgeIds: expect.arrayContaining(["source-decision-edge:store-backed-memory-no-markdown"]),
        sourceRejectionIds: expect.arrayContaining(["source-rejection:create-markdown-memory-files"]),
        sourceConsensus: {
          decisionLinkedSourceClaimIds: expect.arrayContaining(["source-claim:store-backed-memory-no-markdown"]),
          caveatedSourceClaimIds: [],
          sourceDecisionEdgeIds: expect.arrayContaining(["source-decision-edge:store-backed-memory-no-markdown"]),
          staleDecisionIds: ["markdown-runtime-memory"],
          rejectedPathIds: ["create-markdown-memory-files"],
          sourceRejectionIds: expect.arrayContaining(["source-rejection:create-markdown-memory-files"]),
          conflictedDecisionIds: [],
          evidenceGapIds: []
        },
        memoryRefs: expect.arrayContaining(["memory:decision:store-backed-memory-no-markdown"]),
        brief: {
          observationPrefixCount: 1,
          evidenceGapIds: [],
          includedSourceClaimIds: expect.arrayContaining([
            "source-claim:store-backed-memory-no-markdown"
          ]),
          includedMemoryRecordIds: expect.arrayContaining([
            "memory:decision:store-backed-memory-no-markdown"
          ]),
          excludedSourceClaimIds: expect.arrayContaining([
            "source-claim:markdown-runtime-memory",
            "source-claim:create-markdown-memory-files"
          ])
        },
        staleDecisionIds: ["markdown-runtime-memory"],
        rejectedPathIds: ["create-markdown-memory-files"],
        verificationCommands: ["pnpm --filter @krn/cli test -- decision-packet-eval"],
        evidenceGaps: [],
        abstentionScore: {
          status: "ready",
          score: 100,
          reasons: []
        },
        severeStaleAuthorityIds: []
      }
    });
    expect(result.cases.find((testCase) =>
      testCase.id === "unsupported-mobile-release-task"
    )).toMatchObject({
      expectedEvidenceGap: {
        id: "evidence-gap:unsupported-mobile-release-task:no-governing-decision",
        reason: "No current governed decision matched this task strongly enough to guide Codex.",
        verificationRequired:
          "Capture or promote source-backed decision evidence before turning this task into governing context."
      },
      qualityLabel: "abstained",
      scores: {
        taskUsefulness: 1,
        evidenceFidelity: 1,
        temporalCorrectness: 1,
        sourceSupport: 1,
        rejectionRecall: 1,
        abstention: 1,
        consensusConflict: 1,
        nonProofBoundaries: 1,
        total: 8
      },
      notesBaseline: {
        qualityLabel: "unsupported",
        unsupportedDecisionIds: expect.arrayContaining([
          "create-generic-utils-package",
          "adopt-link-before-authority",
          "build-dashboard-first"
        ])
      },
      comparisonOutcome: "krn_win",
      packet: {
        governingDecisionIds: [],
        evidenceGaps: [{
          id: "evidence-gap:unsupported-mobile-release-task:no-governing-decision",
          reason: "No current governed decision matched this task strongly enough to guide Codex.",
          verificationRequired:
            "Capture or promote source-backed decision evidence before turning this task into governing context."
        }],
        abstentionScore: {
          status: "abstain",
          score: 0,
          reasons: [
            "missing_governing_decision",
            "evidence_gap"
          ],
          evidenceGapIds: ["evidence-gap:unsupported-mobile-release-task:no-governing-decision"]
        },
        brief: {
          evidenceGapIds: ["evidence-gap:unsupported-mobile-release-task:no-governing-decision"]
        }
      },
      reasons: expect.arrayContaining([
        "packet abstains from governing advice for unsupported task",
        "packet includes expected evidence-gap abstention"
      ])
    });
    const projectStandardCases: readonly ProjectStandardCaseExpectation[] = [
      {
        id: "new-frontend-project-standard-task",
        expectedDecisionId: "frontend-project-standard-packet",
        statement:
          "For a normal new frontend app, use the governed frontend bootstrap standard: approved project template, pnpm workspace conventions, project UI constraints, focused component and smoke tests, deployment assumptions, and rejected boilerplate paths before coding.",
        sourceRejectionId: "source-rejection:install-latest-frontend-stack",
        staleDecisionId: "generic-frontend-starter-default",
        rejectedDecisionId: "install-latest-frontend-stack",
        baselineFailureRationale:
          "Notes grep matches the current frontend standard and the stale or rejected starter advice; KRN must select the current packet and expose the bad boilerplate paths as non-governing."
      },
      {
        id: "new-backend-service-standard-task",
        expectedDecisionId: "backend-service-standard-packet",
        statement:
          "For a normal new backend service, use the governed backend service standard: explicit API boundary, strict input validation, environment and persistence assumptions, focused contract tests, DB smoke expectations, and rejected ad hoc server scaffolds before coding.",
        sourceRejectionId: "source-rejection:copy-random-backend-boilerplate",
        staleDecisionId: "generic-backend-server-default",
        rejectedDecisionId: "copy-random-backend-boilerplate",
        baselineFailureRationale:
          "Notes grep matches the current backend standard and the stale or rejected server scaffold advice; KRN must select the current packet and expose the bad boilerplate paths as non-governing."
      },
      {
        id: "new-package-library-standard-task",
        expectedDecisionId: "package-library-standard-packet",
        statement:
          "For a normal new workspace package, use the governed package standard: one clear public API, strict TypeScript boundaries, unknown-first external inputs, focused contract tests, typecheck and Fallow verification, and rejected helper or utils package sprawl before coding.",
        sourceRejectionId: "source-rejection:create-generic-utils-package",
        staleDecisionId: "generic-package-utils-default",
        rejectedDecisionId: "create-generic-utils-package",
        baselineFailureRationale:
          "Notes grep matches the current package standard and the stale or rejected utility-package advice; KRN must select the current packet and expose the bad helper paths as non-governing."
      }
    ];

    for (const testCase of projectStandardCases) {
      expectProjectStandardCase(result, testCase);
    }
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining([
      "live Codex execution or obedience",
      "source truth",
      "broad arbitrary-repo packet quality",
      "that packet review burden is acceptable for every task",
      "that memory refs correspond to existing MemoryRecord rows"
    ]));
  });

  it("fails when packets lose SourceDecisionEdge boundaries", async () => {
    const rawFixture = loadMutableFixture();

    for (const decision of rawFixture.decisions) {
      if (decision["status"] === "current") {
        delete decision["sourceDecisionEdgeId"];
      }
    }

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.metrics.usefulCount).toBe(0);
    expect(result.metrics.abstainedCount).toBe(1);
    expect(result.metrics.noisyCount).toBe(20);
    expect(result.metrics.usefulRate).toBe(0);
    expect(result.cases[0]).toMatchObject({
      qualityLabel: "noisy",
      scores: {
        evidenceFidelity: 0,
        sourceSupport: 0,
        total: 4
      },
      packet: {
        evidenceGaps: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringContaining(":caveated-source-authority:")
          })
        ])
      },
      reasons: expect.arrayContaining([
        "packet is missing SourceDecisionEdge refs",
        "packet includes caveated source claims without decision support"
      ])
    });
    expect(result.evalCandidates.find((candidate) =>
      candidate.caseId === "memory-runtime-task"
    )).toMatchObject({
      status: "candidate",
      caseId: "memory-runtime-task",
      failureClass: "missing_evidence_fidelity",
      sourceEvidence: expect.arrayContaining([
        "fixture:decision-packet:1:case:memory-runtime-task",
        "eval:krn.decisionPacket.eval.v1:case:memory-runtime-task",
        "failure:missing_evidence_fidelity",
        "expectedDecision:store-backed-memory-no-markdown"
      ]),
      evidenceRefs: expect.arrayContaining([
        "fixture:decision-packet:1:case:memory-runtime-task"
      ]),
      metadata: expect.objectContaining({
        caseId: "memory-runtime-task",
        failureClass: "missing_evidence_fidelity",
        qualityLabel: "noisy",
        doesNotProve: expect.stringContaining("live Codex behavior")
      }),
      doesNotProve: expect.stringContaining("live Codex behavior")
    });
  });

  it("fails when unsupported source claims reach the governed packet", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.topK = rawFixture.decisions.length + 1;
    rawFixture.decisions.push({
      id: "accepted-only-runtime-memory-shortcut",
      title: "Accepted-only runtime memory shortcut",
      statement: "Runtime memory can use accepted-only evidence as active authority without a decision edge.",
      status: "current",
      taskScopes: ["runtime memory"],
      evidenceRef: "test:accepted-only-source-claim",
      sourceClaimId: "source-claim:accepted-only-runtime-memory-shortcut",
      falsifier: "An accepted-only source claim appears in a governed decision packet without a caveat.",
      doesNotProve: "Does not prove all source support is present."
    });
    rawFixture.notes.push({
      id: "note-accepted-only-runtime-memory-shortcut",
      decisionId: "accepted-only-runtime-memory-shortcut",
      text: "Runtime memory accepted-only shortcut source claim should not become active authority without a decision edge."
    });

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));
    const memoryRuntimeCase = result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    );

    expect(result.status).toBe("fail");
    expect(result.metrics.caveatedSourceClaimInclusions).toBeGreaterThan(0);
    expect(memoryRuntimeCase).toMatchObject({
      qualityLabel: "noisy",
      scores: {
        sourceSupport: 0
      },
      packet: {
        caveatedSourceClaimIds: expect.arrayContaining([
          "source-claim:accepted-only-runtime-memory-shortcut"
        ])
      },
      reasons: expect.arrayContaining([
        "packet includes caveated source claims without decision support"
      ])
    });
    expect(result.evalCandidates.find((candidate) =>
      candidate.caseId === "memory-runtime-task"
    )).toMatchObject({
      failureClass: "missing_source_support",
      evidenceRefs: expect.arrayContaining([
        "failure:missing_source_support"
      ])
    });
  });

  it("fails when exclusion readback has the wrong decision id with the right count", () => {
    const fixture = loadDecisionPacketEvalFixture(fixturePath);
    const testCase = fixture.cases.find((item) => item.id === "memory-runtime-task");
    const expectedDecision = fixture.decisions.find((decision) =>
      decision.id === testCase?.expectedDecisionId
    );

    expect(testCase).toBeDefined();
    expect(expectedDecision).toBeDefined();

    if (testCase === undefined || expectedDecision === undefined) {
      throw new Error("decision-packet fixture is missing memory-runtime-task setup");
    }

    const packet: DecisionPacket = {
      formatVersion: "krn.decisionPacket.v1",
      governingDecisionIds: ["store-backed-memory-no-markdown"],
      governingStatements: [
        "Use store-backed MemoryRecord and SourceClaim evidence for runtime memory."
      ],
      taskStandardDecisions: [{
        memoryRecordId: "memory:decision:store-backed-memory-no-markdown",
        key: "decision-packet:store-backed-memory-no-markdown",
        sourceRefs: [
          "source-claim:store-backed-memory-no-markdown",
          "source:roadmap:runtime-memory"
        ],
        mechanism:
          "Task-scoped runtime memory guidance activates the store-backed memory standard.",
        krnImplication: "DecisionPacket should expose the standard before Codex relies on memory.",
        decision: "Use store-backed MemoryRecord and SourceClaim evidence for runtime memory.",
        consumer: "decision-packet-eval",
        falsifier: "A runtime task needs a markdown memory folder to recall KRN knowledge.",
        validFrom: "2026-07-07T00:00:00.000Z",
        rejectedPath: "Do not use markdown as runtime memory.",
        doesNotProve: "Does not prove broad memory retrieval quality or live Codex obedience."
      }],
      sourceClaimIds: ["source-claim:store-backed-memory-no-markdown"],
      caveatedSourceClaimIds: [],
      sourceDecisionEdgeIds: ["source-decision-edge:store-backed-memory-no-markdown"],
      sourceDecisionTargets: [{
        targetType: "architecture_decision",
        targetId: "store-backed-memory-no-markdown",
        sourceDecisionEdgeIds: ["source-decision-edge:store-backed-memory-no-markdown"]
      }],
      sourceRejectionIds: [],
      memoryRefs: ["memory:decision:store-backed-memory-no-markdown"],
      caveatedMemoryRefs: [],
      staleDecisionIds: ["cast-json-record"],
      staleKnowledgeIds: [],
      noiseKnowledgeIds: [],
      unknownKnowledgeIds: [],
      supersededPathIds: [],
      rejectedPathIds: ["prose-second-opinion"],
      falsifiers: ["A runtime task needs a markdown memory folder to recall KRN knowledge."],
      verificationCommands: ["pnpm --filter @krn/cli test -- decision-packet-eval"],
      evidenceGaps: [],
      sourceConsensus: {
        decisionLinkedSourceClaimIds: ["source-claim:store-backed-memory-no-markdown"],
        caveatedSourceClaimIds: [],
        unsupportedSourceClaimIds: [],
        conflictingSourceClaimIds: [],
        unknownSourceClaimIds: [],
        sourceDecisionEdgeIds: ["source-decision-edge:store-backed-memory-no-markdown"],
        sourceDecisionTargets: [{
          targetType: "architecture_decision",
          targetId: "store-backed-memory-no-markdown",
          sourceDecisionEdgeIds: ["source-decision-edge:store-backed-memory-no-markdown"]
        }],
        staleDecisionIds: ["cast-json-record"],
        supersededPathIds: [],
        rejectedPathIds: ["prose-second-opinion"],
        sourceRejectionIds: [],
        conflictedDecisionIds: [],
        evidenceGapIds: [],
        doesNotProve:
          "DecisionPacket source consensus summarizes selected packet signals; it does not prove source truth, complete graph consensus, or repository-wide conflict resolution."
      },
      abstentionScore: {
        status: "ready",
        score: 100,
        reasons: [],
        evidenceGapIds: [],
        doesNotProve:
          "DecisionPacket abstention score is a deterministic packet-readiness signal; it does not prove source truth, live Codex obedience, or that missing rejected paths are required for every task."
      },
      doesNotProve: ["Does not prove broad memory retrieval quality or live Codex obedience."],
      nonProofs: ["packet quality only"],
      noiseDecisionIds: [],
      severeStaleAuthorityIds: [],
      brief: {
        includedContextCount: 1,
        observationPrefixCount: 1,
        explicitExclusionCount: 2,
        sourceClaimUseCount: 1,
        memoryRecordUseCount: 1,
        includedSourceClaimIds: ["source-claim:store-backed-memory-no-markdown"],
        includedMemoryRecordIds: ["memory:decision:store-backed-memory-no-markdown"],
        excludedSourceClaimIds: [
          "source-claim:cast-json-record",
          "source-claim:prose-second-opinion"
        ],
        excludedMemoryRecordIds: [],
        excludedAntiMemoryRecordIds: [],
        evidenceGapIds: []
      }
    };

    expect(classifyDecisionPacketForEval(fixture, packet, testCase, expectedDecision)).toBe("noisy");
  });

  it("fails when rejected paths lose SourceRejection boundaries", async () => {
    const rawFixture = loadMutableFixture();

    for (const decision of rawFixture.decisions) {
      if (decision["status"] === "rejected") {
        delete decision["sourceRejectionId"];
      }
    }

    expect(() => parseDecisionPacketEvalFixture(rawFixture)).toThrow(
      "sourceRejectionId is required for rejected decisions"
    );
  });

  it("does not match task scopes by substring", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.decisions.push({
      id: "time-scope-runtime-leak",
      title: "Time scope runtime leak",
      statement: "Runtime memory task guidance that must not apply merely because runtime contains the substring time.",
      status: "current",
      taskScopes: ["time"],
      evidenceRef: "test:scope-token-boundary",
      sourceClaimId: "source-claim:time-scope-runtime-leak",
      sourceDecisionEdgeId: "source-decision-edge:time-scope-runtime-leak",
      falsifier: "A task containing runtime selects a scope that only says time.",
      doesNotProve: "Does not prove all possible scope vocabularies are ideal."
    });
    rawFixture.notes.push({
      id: "note-time-scope-runtime-leak",
      decisionId: "time-scope-runtime-leak",
      text: "Time scope runtime leak. Runtime memory task guidance that must not match runtime by substring time."
    });

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )?.packet.governingDecisionIds).not.toContain("time-scope-runtime-leak");
  });

  it("fails when an unsupported task receives governing advice instead of abstaining", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.topK = rawFixture.decisions.length + 1;
    rawFixture.decisions.push({
      id: "unsupported-mobile-release-shortcut",
      title: "Unsupported mobile release shortcut",
      statement:
        "Create native mobile release pipelines with app store certificates and signing profiles without captured KRN evidence.",
      status: "current",
      taskScopes: [
        "native mobile release pipeline",
        "app store certificates",
        "fastlane profiles",
        "ios android signing"
      ],
      evidenceRef: "test:unsupported-mobile-release-shortcut",
      sourceClaimId: "source-claim:unsupported-mobile-release-shortcut",
      sourceDecisionEdgeId: "source-decision-edge:unsupported-mobile-release-shortcut",
      falsifier: "An unsupported mobile-release task receives governing advice instead of an evidence gap.",
      doesNotProve: "Does not prove KRN has source-backed mobile release standards."
    });
    rawFixture.notes.push({
      id: "note-unsupported-mobile-release-shortcut",
      decisionId: "unsupported-mobile-release-shortcut",
      text: "Native mobile release pipeline app store certificates fastlane profiles ios android signing shortcut."
    });

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.metrics.abstentionCaseCount).toBe(1);
    expect(result.metrics.correctAbstentionCount).toBe(0);
    expect(result.metrics.abstentionScore).toBe(0);
    expect(result.metrics.missingAbstentions).toBe(1);
    expect(result.cases.find((testCase) =>
      testCase.id === "unsupported-mobile-release-task"
    )).toMatchObject({
      qualityLabel: "noisy",
      scores: {
        taskUsefulness: 0,
        evidenceFidelity: 0,
        abstention: 0,
        consensusConflict: 0
      },
      packet: {
        governingDecisionIds: expect.arrayContaining(["unsupported-mobile-release-shortcut"]),
        evidenceGaps: [],
        abstentionScore: {
          status: "weak_context",
          reasons: ["missing_rejected_path_evidence"]
        }
      },
      reasons: expect.arrayContaining([
        "packet gives governing advice for unsupported task",
        "packet misses expected evidence-gap abstention"
      ])
    });
    expect(result.evalCandidates.find((candidate) =>
      candidate.caseId === "unsupported-mobile-release-task"
    )).toMatchObject({
      failureClass: "missing_abstention",
      evidenceRefs: expect.arrayContaining([
        "expectedEvidenceGap:evidence-gap:unsupported-mobile-release-task:no-governing-decision"
      ]),
      expectedSignal: expect.stringContaining("missing_abstention")
    });
  });

  it("fails when the notes-baseline fixture loses abstention coverage", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.cases = rawFixture.cases.filter((testCase) =>
      testCase["expectedEvidenceGap"] === undefined);

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.thresholds.minimumAbstentionCaseCount).toBe(1);
    expect(result.metrics.abstentionCaseCount).toBe(0);
    expect(result.metrics.correctAbstentionCount).toBe(0);
    expect(result.metrics.abstentionScore).toBe(1);
    expect(result.evalCandidates).toEqual([
      expect.objectContaining({
        caseId: "decision-packet-eval-suite",
        failureClass: "threshold_violation",
        evidenceRefs: expect.arrayContaining([
          "threshold:minimumAbstentionCaseCount"
        ]),
        expectedSignal:
          "Restore DecisionPacket eval thresholds: minimumAbstentionCaseCount."
      })
    ]);
  });

  it("fails when a stale decision reaches the governed packet", async () => {
    const rawFixture = loadMutableFixture();
    const staleDecision = rawFixture.decisions.find((decision) =>
      decision["id"] === "markdown-runtime-memory"
    );

    rawFixture.topK = rawFixture.decisions.length;
    staleDecision!["status"] = "current";

    expect(staleDecision?.["status"]).toBe("current");

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));

    expect(result.status).toBe("fail");
    expect(result.metrics.staleAuthorityCount).toBeGreaterThan(0);
    expect(result.metrics.severeStaleAuthorityInclusions).toBeGreaterThan(0);
    expect(result.cases.find((testCase) =>
      testCase.id === "memory-runtime-task"
    )).toMatchObject({
      qualityLabel: "stale_authority",
      packet: {
        severeStaleAuthorityIds: expect.arrayContaining(["markdown-runtime-memory"]),
        abstentionScore: {
          status: "weak_context",
          reasons: expect.arrayContaining(["stale_authority"])
        }
      },
      reasons: expect.arrayContaining(["packet includes stale or rejected authority as governing context"])
    });
    expect(result.evalCandidates.find((candidate) =>
      candidate.caseId === "memory-runtime-task"
    )).toMatchObject({
      failureClass: "stale_authority",
      evidenceRefs: expect.arrayContaining([
        "failure:stale_authority"
      ])
    });
  });

  it("builds opt-in failure persistence through the reviewed feedback seam", async () => {
    const rawFixture = loadMutableFixture();

    for (const decision of rawFixture.decisions) {
      if (decision["status"] === "current") {
        delete decision["sourceDecisionEdgeId"];
      }
    }

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));
    const persistenceInput = buildDecisionPacketEvalFailurePersistenceInput({
      evalCommand: "pnpm --filter @krn/cli eval:decision-packet failing-fixture.json",
      eventSequence: 1,
      executionRunId: "execution-run-eval-1",
      now: "2026-07-09T12:00:00.000Z",
      projectId: "project-eval-1",
      result
    });
    const caseCandidate = persistenceInput?.feedback.evalCandidates.find((candidate) =>
      candidate.metadata["caseId"] === "memory-runtime-task"
    );

    expect(result.status).toBe("fail");
    expect(caseCandidate).toMatchObject({
      metadata: {
        caseId: "memory-runtime-task",
        failureClass: "missing_evidence_fidelity"
      }
    });
    expect(persistenceInput).toMatchObject({
      executionRunId: "execution-run-eval-1",
      projectId: "project-eval-1",
      executionIdentity:
        "project-eval-1:execution-run-eval-1:krn.decisionPacket.eval.v1:1",
      evidence: {
        status: "captured",
        commands: [{
          command: "pnpm --filter @krn/cli eval:decision-packet failing-fixture.json",
          status: "failed",
          provenance: "operator_reported"
        }],
        metadata: {
          evalExecutionIdentity:
            "project-eval-1:execution-run-eval-1:krn.decisionPacket.eval.v1:1",
          projectId: "project-eval-1",
          candidateCount: result.evalCandidates.length
        }
      },
      review: {
        status: "pending",
        reviewer: "krn-decision-packet-eval",
        findings: expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("DecisionPacket eval failure")
          })
        ])
      },
      feedback: {
        status: "candidate",
        memoryCandidates: [],
        sourceDecisions: [],
        evalCandidates: expect.arrayContaining([
          expect.objectContaining({
            projectId: "project-eval-1",
            status: "candidate",
            metadata: expect.objectContaining({
              doesNotProve: expect.any(String),
              evidenceRefs: expect.any(Array),
              observedSignal: expect.any(Object)
            })
          })
        ])
      }
    });
  });

  it("preserves suite-threshold identity for opt-in failure persistence", async () => {
    const rawFixture = loadMutableFixture();

    rawFixture.cases = rawFixture.cases.filter((testCase) =>
      testCase["expectedEvidenceGap"] === undefined
    );

    const result = await runDecisionPacketEval(parseDecisionPacketEvalFixture(rawFixture));
    const persistenceInput = buildDecisionPacketEvalFailurePersistenceInput({
      evalCommand: "pnpm --filter @krn/cli eval:decision-packet suite-threshold-fixture.json",
      eventSequence: 1,
      executionRunId: "execution-run-eval-threshold",
      now: "2026-07-09T12:00:00.000Z",
      projectId: "project-eval-1",
      result
    });

    expect(result.status).toBe("fail");
    expect(result.evalCandidates).toEqual([
      expect.objectContaining({
        caseId: "decision-packet-eval-suite",
        failureClass: "threshold_violation"
      })
    ]);
    expect(persistenceInput?.feedback.evalCandidates).toEqual([
      expect.objectContaining({
        caseId: "decision-packet-eval-suite",
        failureClass: "threshold_violation",
        metadata: expect.objectContaining({
          caseId: "decision-packet-eval-suite",
          failureClass: "threshold_violation",
          evidenceRefs: expect.arrayContaining([
            "threshold:minimumAbstentionCaseCount"
          ])
        })
      })
    ]);
  });

  it("does not build a persistence input for a passing eval", async () => {
    const result = await runDecisionPacketEval(loadDecisionPacketEvalFixture(fixturePath));

    expect(result.status).toBe("pass");
    expect(buildDecisionPacketEvalFailurePersistenceInput({
      evalCommand: "pnpm --filter @krn/cli eval:decision-packet passing-fixture.json",
      eventSequence: 1,
      executionRunId: "execution-run-eval-pass",
      now: "2026-07-09T12:00:00.000Z",
      projectId: "project-eval-1",
      result
    })).toBeUndefined();
  });
});
