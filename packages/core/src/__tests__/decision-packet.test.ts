import {
  describe,
  expect,
  it
} from "vitest";

import {
  buildDecisionPacketContractReadback,
  buildDecisionPacketFromReadModel,
  decisionPacketNegativePathsForContext,
  type DecisionPacketReadModelInput
} from "../decision-packet.js";
import { parseEvidenceContract } from "../evidence-contract.js";

const now = "2026-07-08T14:45:00.000Z";

const fakeSha256Hex = (value: string): string => {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(64, "0");
};

const readModel = {
  run: {
    id: "run-decision-packet-1",
    updatedAt: now
  },
  context: {
    inclusions: 3,
    exclusions: 2,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-current",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "claim-caveated",
      sourceAuthority: "medium"
    }, {
      subjectType: "memory_record",
      subjectId: "memory-current",
      sourceAuthority: "medium"
    }],
    exclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-superseded",
      reason: "superseded"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-current",
        sourceRejectionIds: ["source-rejection-current"],
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["source-decision-edge-current"],
          sourceDecisionIds: [
            "source-decision-current",
            "source-decision-stale",
            "source-decision-noise",
            "source-decision-conflicted"
          ],
          targets: [{
            sourceDecisionEdgeId: "source-decision-edge-current",
            targetType: "architecture_decision",
            targetId: "source-decision-current"
          }]
        },
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-current",
          key: "frontend-template",
          sourceRefs: ["claim-current"],
          mechanism: "Accepted project standard narrows new frontend setup choices.",
          krnImplication: "DecisionPacket should tell Codex which template to use.",
          decision: "Use the current frontend template for matching app setup tasks.",
          consumer: "DecisionPacket",
          falsifier: "A matching app setup packet omits the current template decision.",
          validFrom: "2026-07-01T00:00:00.000Z",
          rejectedPath: "Do not use the superseded template.",
          doesNotProve: "Does not prove the template fits every frontend task."
        }
      }, {
        subjectType: "source_claim",
        subjectId: "claim-caveated"
      }, {
        subjectType: "memory_record",
        subjectId: "memory-current",
        pendingAntiMemoryReview: {
          antiMemoryCandidateIds: ["anti-memory-candidate-pending-feedback"],
          feedbackDeltaIds: ["feedback-delta-prior"],
          subjectRefs: ["applies_to:memory-current"],
          doesNotProve:
            "Pending anti-memory candidates are reviewable maintenance proposals; they do not block activation, promote rejected paths, or mutate Memory Core truth until reviewed."
        }
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-superseded-template"
      }]
    }
  },
  evidenceContract: {
    commands: [{
      command: "pnpm --filter frontend test",
      required: true
    }]
  },
  evidenceBundles: [{
    commands: [{
      command: "pnpm --filter frontend test"
    }]
  }],
  feedbackDeltas: [{
    candidates: [{
      kind: "source_decision_candidate",
      id: "source-decision-rejected",
      status: "reject"
    }],
    sourceUsefulnessOutcomes: [{
      sourceDecisionId: "source-decision-current",
      outcome: "helped",
      reason: "Current template reduced setup churn."
    }, {
      sourceDecisionId: "source-decision-stale",
      outcome: "stale",
      reason: "Old template no longer applies."
    }, {
      sourceDecisionId: "source-decision-noise",
      outcome: "noise",
      reason: "Noisy decision matched words but not task."
    }, {
      sourceDecisionId: "source-decision-conflicted",
      outcome: "helped",
      reason: "Conflicted decision was selected before stale feedback."
    }, {
      sourceDecisionId: "source-decision-conflicted",
      outcome: "stale",
      reason: "Conflicted decision is now stale."
    }, {
      sourceClaimId: "claim-current",
      outcome: "stale",
      reason: "Current source claim needs refresh before reuse."
    }],
    knowledgeUsefulnessOutcomes: [{
      knowledgeId: "memory-current",
      outcome: "stale",
      reason: "Current memory needs refresh before reuse."
    }, {
      knowledgeId: "memory-noise",
      outcome: "noise",
      reason: "Noisy memory was not included in this packet."
    }, {
      knowledgeId: "memory-unknown",
      outcome: "unknown",
      reason: "Unknown memory usefulness needs evidence."
    }, {
      knowledgeId: "memory-helped",
      outcome: "helped",
      reason: "Helpful knowledge feedback is not itself a governing statement."
    }]
  }],
  proof: {
    doesNotProve: [
      "source truth",
      "live Codex obedience"
    ]
  }
} satisfies DecisionPacketReadModelInput;

const relationReadModel = (
  missingRelationSupportEdgeIds: readonly string[]
): DecisionPacketReadModelInput => ({
  run: {
    id: "run-relation-consensus",
    updatedAt: now
  },
  context: {
    inclusions: 2,
    exclusions: 0,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-relation-current",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "anti_memory_record",
      subjectId: "anti-memory-superseded-relation",
      sourceAuthority: "project-decision"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-relation-current",
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-relation-current"],
          edgeKinds: ["supports"],
          missingRelationSupportEdgeIds,
          seedSourceClaimIds: ["claim-relation-seed"],
          doesNotProve:
            "SourceClaimEdge influence does not prove source truth, edge correctness, ranking quality, or product graph retrieval quality."
        },
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["source-decision-edge-relation"],
          targets: [{
            sourceDecisionEdgeId: "source-decision-edge-relation",
            targetType: "architecture_decision",
            targetId: "source-decision-relation-current"
          }]
        }
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-superseded-relation"
      }]
    }
  },
  evidenceBundles: [],
  feedbackDeltas: [],
  proof: {
    doesNotProve: [
      "source truth",
      "live Codex obedience"
    ]
  }
});

type NonGoverningSourceClaimExclusionReason =
  | "invalidated"
  | "stale"
  | "superseded"
  | "unsafe";

const sourceClaimExclusionReadModel = (input: {
  readonly reason: NonGoverningSourceClaimExclusionReason;
  readonly sourceRejectionIds?: readonly string[];
}): DecisionPacketReadModelInput => ({
  run: {
    id: `run-source-claim-exclusion-${input.reason}`,
    updatedAt: now
  },
  context: {
    inclusions: 1,
    exclusions: 1,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-governing",
      sourceAuthority: "project-decision"
    }],
    exclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-excluded",
      reason: input.reason
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-governing",
        sourceDecisionSupportBoost: {
          sourceDecisionEdgeIds: ["edge-governing"],
          targets: [{
            sourceDecisionEdgeId: "edge-governing",
            targetType: "architecture_decision",
            targetId: "decision-governing"
          }]
        }
      }, {
        subjectType: "source_claim",
        subjectId: "claim-excluded",
        ...(input.sourceRejectionIds === undefined
          ? {}
          : { sourceRejectionIds: input.sourceRejectionIds })
      }],
      decisions: []
    }
  },
  evidenceBundles: [],
  feedbackDeltas: [],
  proof: {
    doesNotProve: ["source truth"]
  }
});

describe("DecisionPacket builder", () => {
  it("maps compile-time negative context without relabeling source exclusions as rejected paths", () => {
    const paths = decisionPacketNegativePathsForContext({
      contextInclusions: [{
        subjectType: "anti_memory_record",
        subjectId: "anti-memory-included",
        reason: "Known unsafe path.",
        expectedUse: "Do not use it.",
        sourceAuthority: "medium"
      }],
      contextExclusions: [{
        subjectType: "anti_memory_record",
        subjectId: "anti-memory-excluded",
        reason: "unsafe",
        explanation: "Rejected anti-memory remains explicit.",
        sourceAuthority: "medium"
      }, {
        subjectType: "source_claim",
        subjectId: "claim-unsafe",
        reason: "unsafe",
        explanation: "Unsafe source is not formal rejection authority.",
        sourceAuthority: "project-decision"
      }, {
        subjectType: "source_claim",
        subjectId: "claim-stale",
        reason: "stale",
        explanation: "Stale source remains historical context.",
        sourceAuthority: "project-decision"
      }, {
        subjectType: "source_claim",
        subjectId: "claim-invalidated",
        reason: "invalidated",
        explanation: "Invalidated source cannot govern.",
        sourceAuthority: "project-decision"
      }, {
        subjectType: "source_claim",
        subjectId: "claim-superseded",
        reason: "superseded",
        explanation: "Superseded source remains a typed warning.",
        sourceAuthority: "project-decision"
      }]
    });

    expect(paths.rejectedPathIds).toEqual([
      "anti-memory-included",
      "anti-memory-excluded"
    ]);
    expect(paths.supersededPathIds).toEqual(["claim-superseded"]);
  });

  it("builds governed packet signals from read model evidence", () => {
    const packet = buildDecisionPacketFromReadModel(readModel);

    expect(packet.governingDecisionIds).toEqual(["source-decision-current"]);
    expect(packet.governingStatements).toContain(
      "Use the current frontend template for matching app setup tasks."
    );
    expect(packet.governingStatements).not.toContain(
      "Current template reduced setup churn."
    );
    expect(packet.governingStatements).not.toContain(
      "Conflicted decision was selected before stale feedback."
    );
    expect(packet.governingStatements).not.toContain(
      "Helpful knowledge feedback is not itself a governing statement."
    );
    expect(packet.taskStandardDecisions).toEqual([expect.objectContaining({
      key: "frontend-template",
      rejectedPath: "Do not use the superseded template."
    })]);
    expect(packet.sourceClaimIds).toEqual([
      "claim-current",
      "claim-caveated"
    ]);
    expect(packet.caveatedSourceClaimIds).toEqual([
      "claim-current",
      "claim-caveated"
    ]);
    expect(packet.sourceDecisionEdgeIds).toEqual(["source-decision-edge-current"]);
    expect(packet.sourceDecisionTargets).toEqual([{
      targetType: "architecture_decision",
      targetId: "source-decision-current",
      sourceDecisionEdgeIds: ["source-decision-edge-current"]
    }]);
    expect(packet.memoryRefs).toEqual(["memory-current"]);
    expect(packet.caveatedMemoryRefs).toEqual(["memory-current"]);
    expect(packet.staleDecisionIds).toEqual([
      "source-decision-stale",
      "source-decision-conflicted"
    ]);
    expect(packet.staleKnowledgeIds).toEqual(["memory-current"]);
    expect(packet.noiseKnowledgeIds).toEqual([]);
    expect(packet.unknownKnowledgeIds).toEqual([]);
    expect(packet.supersededPathIds).toEqual(["claim-superseded"]);
    expect(packet.rejectedPathIds).toEqual(["anti-memory-superseded-template"]);
    expect(packet.sourceRejectionIds).toEqual(["source-rejection-current"]);
    expect(packet.noiseDecisionIds).toEqual(["source-decision-noise"]);
    expect(packet.severeStaleAuthorityIds).toEqual([]);
    expect(packet.falsifiers).toEqual([
      "A matching app setup packet omits the current template decision."
    ]);
    expect(packet.verificationCommands).toEqual(["pnpm --filter frontend test"]);
    expect(packet.evidenceGaps.map((gap) => gap.id)).toEqual([
      "evidence-gap:run-decision-packet-1:caveated-source-authority:claim-current",
      "evidence-gap:run-decision-packet-1:caveated-source-authority:claim-caveated",
      "evidence-gap:run-decision-packet-1:caveated-memory-authority:memory-current"
    ]);
    expect(packet.rejectedPathIds).not.toContain("anti-memory-candidate-pending-feedback");
    expect(packet.sourceConsensus.supersededPathIds).toEqual(["claim-superseded"]);
    expect(packet.sourceConsensus.evidenceGapIds).toEqual(packet.evidenceGaps.map((gap) => gap.id));
    expect(packet.abstentionScore).toMatchObject({
      status: "abstain",
      reasons: [
        "evidence_gap",
        "missing_decision_linked_source",
        "caveated_source_authority",
        "caveated_memory_authority"
      ]
    });
  });

  it("falsifies that the packet exposes canonical selected SourceDecision ids", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-canonical-source-decision",
        updatedAt: now
      },
      context: {
        inclusions: 1,
        exclusions: 0,
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-canonical-source-decision",
          sourceAuthority: "project-decision"
        }],
        activationTrace: {
          candidates: [{
            subjectType: "source_claim",
            subjectId: "claim-canonical-source-decision",
            sourceDecisionSupportBoost: {
              sourceDecisionEdgeIds: ["edge-canonical-source-decision"],
              sourceDecisionIds: ["source-decision-canonical-id"],
              targets: [{
                sourceDecisionEdgeId: "edge-canonical-source-decision",
                targetType: "architecture_decision",
                targetId: "architecture-target-opaque-id"
              }]
            }
          }],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.governingDecisionIds).toEqual(["architecture-target-opaque-id"]);
    expect(packet).not.toHaveProperty("sourceDecisionIds");
  });

  it("keeps project-scoped owner-file directives out of governing authority", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        inclusions: readModel.context.inclusions + 1,
        inclusionDetails: [
          ...readModel.context.inclusionDetails,
          {
            subjectType: "owner_file",
            subjectId: "owner-file:project-1:AGENTS.md",
            sourceAuthority: "project-decision"
          }
        ]
      }
    });

    expect(packet.governingDecisionIds).toEqual(["source-decision-current"]);
    expect(packet.governingStatements).not.toContain("owner-file:project-1:AGENTS.md");
  });

  it("derives governing prose only from included activation subjects", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        inclusionDetails: readModel.context.inclusionDetails.filter((inclusion) =>
          inclusion.subjectId !== "memory-excluded"
        ),
        activationTrace: {
          ...readModel.context.activationTrace,
          candidates: [
            ...(readModel.context.activationTrace?.candidates ?? []),
            {
              subjectType: "memory_record",
              subjectId: "memory-excluded",
              projectStandardDecision: {
                kind: "krn.projectStandardDecision.v1",
                memoryRecordId: "memory-excluded",
                key: "excluded-standard",
                sourceRefs: ["excluded-source"],
                mechanism: "Excluded activation candidates must not become packet authority.",
                krnImplication: "Only included subjects can contribute governing prose.",
                decision: "Never expose this excluded standard as governing guidance.",
                consumer: "DecisionPacket",
                falsifier: "The excluded standard appears in governingStatements.",
                validFrom: now,
                doesNotProve: "This test does not prove source truth."
              }
            },
            {
              subjectType: "source_claim",
              subjectId: "claim-excluded",
              sourceDecisionSupportBoost: {
                sourceDecisionEdgeIds: ["hidden-edge"],
                sourceDecisionIds: ["hidden-decision"],
                targets: [{
                  sourceDecisionEdgeId: "hidden-edge",
                  targetType: "architecture_decision",
                  targetId: "hidden-architecture-decision"
                }],
                confidence: ["high"],
                supportTypes: ["decision"],
                doesNotProve: "This test does not prove source truth."
              },
              sourceRejectionIds: ["hidden-source-rejection"]
            }
          ]
        }
      }
    });

    expect(packet.governingStatements).not.toContain(
      "Never expose this excluded standard as governing guidance."
    );
    expect(packet.taskStandardDecisions).not.toEqual([
      expect.objectContaining({ key: "excluded-standard" })
    ]);
    expect(packet.governingDecisionIds).not.toContain("hidden-architecture-decision");
    expect(packet.sourceDecisionEdgeIds).not.toContain("hidden-edge");
    expect(packet.sourceRejectionIds).not.toContain("hidden-source-rejection");
  });

  it("uses the active evidence contract instead of historical command observations", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      evidenceContract: {
        commands: [{
          command: "pnpm typecheck",
          required: true
        }, {
          command: "pnpm test -- current-task",
          required: false
        }]
      },
      evidenceBundles: [{
        commands: [{
          command: "pnpm old-check=failed"
        }, {
          command: "pnpm old-check=skipped"
        }, {
          command: "pnpm old-check=default_template"
        }]
      }]
    });

    expect(packet.verificationCommands).toEqual([
      "pnpm typecheck",
      "pnpm test -- current-task"
    ]);
    expect(packet.falsifiers).toEqual([
      "A matching app setup packet omits the current template decision."
    ]);
    expect(packet.verificationCommands).not.toContain("pnpm old-check=failed");
    expect(packet.falsifiers).not.toContain("pnpm old-check=skipped");
  });

  it("does not guess current verification when the active contract is absent", () => {
    const { evidenceContract, ...readModelWithoutContract } = readModel;
    void evidenceContract;

    const packet = buildDecisionPacketFromReadModel({
      ...readModelWithoutContract,
      evidenceBundles: [{
        commands: [{
          command: "pnpm historical-check=passed"
        }]
      }]
    });

    expect(packet.verificationCommands).toEqual([]);
    expect(packet.falsifiers).toEqual([
      "A matching app setup packet omits the current template decision."
    ]);
  });

  it("keeps feedback-only source decisions and reasons outside governing authority", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-feedback-only-authority",
        updatedAt: now
      },
      context: {
        inclusions: 0,
        exclusions: 0,
        inclusionDetails: [],
        activationTrace: {
          candidates: [],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [{
        candidates: [],
        sourceUsefulnessOutcomes: [
          {
            sourceDecisionId: "source-decision-unseen-selected",
            outcome: "selected",
            reason: "Caller supplied reason must remain diagnostic only.",
            evidenceRefs: ["packet:feedback-only"],
            doesNotProve: "This feedback does not prove source truth."
          },
          {
            sourceDecisionId: "source-decision-unseen-used",
            outcome: "used",
            reason: "Caller supplied used reason must remain diagnostic only.",
            evidenceRefs: ["packet:feedback-only"],
            doesNotProve: "This feedback does not prove source truth."
          },
          {
            sourceDecisionId: "source-decision-unseen-helped",
            outcome: "helped",
            reason: "Caller supplied helped reason must remain diagnostic only.",
            evidenceRefs: ["packet:feedback-only"],
            doesNotProve: "This feedback does not prove source truth."
          }
        ],
        knowledgeUsefulnessOutcomes: []
      }],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.governingDecisionIds).toEqual([]);
    expect(packet.governingStatements).toEqual([]);
    expect(packet.staleDecisionIds).toEqual([]);
    expect(packet.noiseDecisionIds).toEqual([]);
    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceRejectionIds).toEqual([]);
  });

  it("keeps authority-superseded source claims out of formal rejected paths", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-authority-superseded",
        updatedAt: now
      },
      context: {
        inclusions: 0,
        exclusions: 1,
        inclusionDetails: [],
        exclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-authority-superseded",
          reason: "unsafe"
        }],
        activationTrace: {
          candidates: [{
            subjectType: "source_claim",
            subjectId: "claim-authority-superseded",
            sourceClaimAuthorityStatus: "blocked",
            sourceClaimAuthorityReasons: ["superseded_by_current_claim"]
          }],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.supersededPathIds).toEqual(["claim-authority-superseded"]);
    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceConsensus.supersededPathIds).toEqual([
      "claim-authority-superseded"
    ]);
  });

  it.each([
    ["unsafe", []],
    ["stale", []],
    ["invalidated", []],
    ["superseded", ["claim-excluded"]]
  ] satisfies readonly [NonGoverningSourceClaimExclusionReason, readonly string[]][])(
    "keeps %s source exclusions out of formal rejected-path coverage",
    (reason, supersededPathIds) => {
      const packet = buildDecisionPacketFromReadModel(sourceClaimExclusionReadModel({ reason }));

      expect(packet.rejectedPathIds).toEqual([]);
      expect(packet.sourceRejectionIds).toEqual([]);
      expect(packet.supersededPathIds).toEqual(supersededPathIds);
      expect(packet.abstentionScore).toMatchObject({
        status: "weak_context",
        reasons: ["missing_rejected_path_evidence"]
      });
    }
  );

  it("uses a formal SourceRejection without relabeling its excluded claim", () => {
    const packet = buildDecisionPacketFromReadModel(sourceClaimExclusionReadModel({
      reason: "unsafe",
      sourceRejectionIds: ["source-rejection-formal"]
    }));

    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceRejectionIds).toEqual(["source-rejection-formal"]);
    expect(packet.abstentionScore).toMatchObject({
      status: "ready",
      reasons: []
    });
  });

  it("does not let rejected usefulness feedback supply formal rejected-path coverage", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-governing-rejected-feedback",
        updatedAt: now
      },
      context: {
        inclusions: 1,
        exclusions: 0,
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-governing",
          sourceAuthority: "project-decision"
        }],
        activationTrace: {
          candidates: [{
            subjectType: "source_claim",
            subjectId: "claim-governing",
            sourceDecisionSupportBoost: {
              sourceDecisionEdgeIds: ["edge-governing"],
              sourceDecisionIds: ["decision-governing"],
              targets: [{
                sourceDecisionEdgeId: "edge-governing",
                targetType: "architecture_decision",
                targetId: "decision-governing"
              }]
            }
          }],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [{
        candidates: [],
        sourceUsefulnessOutcomes: [{
          sourceDecisionId: "decision-governing",
          outcome: "rejected",
          reason: "Feedback is diagnostic until a formal rejection is reviewed."
        }],
        knowledgeUsefulnessOutcomes: []
      }],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceRejectionIds).toEqual([]);
    expect(packet.abstentionScore).toMatchObject({
      status: "weak_context",
      reasons: ["missing_rejected_path_evidence"]
    });
  });

  it("keeps decision-linked relation evidence usable when the relation has support", () => {
    const packet = buildDecisionPacketFromReadModel(relationReadModel([]));

    expect(packet.sourceConsensus.decisionLinkedSourceClaimIds).toEqual([
      "claim-relation-current"
    ]);
    expect(packet.sourceConsensus.evidenceGapIds).toEqual([]);
    expect(packet.evidenceGaps).toEqual([]);
    expect(packet.abstentionScore).toMatchObject({
      status: "ready",
      reasons: []
    });
  });

  it("exposes unsupported, conflicting, and unknown source authority in the packet", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-authority-states",
        updatedAt: now
      },
      context: {
        inclusions: 3,
        exclusions: 0,
        inclusionDetails: [
          {
            subjectType: "source_claim",
            subjectId: "claim-unsupported",
            sourceAuthority: "medium"
          },
          {
            subjectType: "source_claim",
            subjectId: "claim-conflicting",
            sourceAuthority: "medium"
          },
          {
            subjectType: "source_claim",
            subjectId: "claim-unknown",
            sourceAuthority: "medium"
          }
        ],
        activationTrace: {
          candidates: [
            {
              subjectType: "source_claim",
              subjectId: "claim-unsupported",
              sourceClaimAuthorityStatus: "evidence_gap",
              sourceClaimAuthorityReasons: ["missing_source_decision_support"]
            },
            {
              subjectType: "source_claim",
              subjectId: "claim-conflicting",
              sourceClaimAuthorityStatus: "caveated",
              sourceClaimAuthorityReasons: ["accepted_with_dissenting_source_claims"]
            },
            {
              subjectType: "source_claim",
              subjectId: "claim-unknown"
            }
          ],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.sourceConsensus.unsupportedSourceClaimIds).toEqual(["claim-unsupported"]);
    expect(packet.sourceConsensus.conflictingSourceClaimIds).toEqual(["claim-conflicting"]);
    expect(packet.sourceConsensus.unknownSourceClaimIds).toEqual(["claim-unknown"]);
    expect(packet.abstentionScore.reasons).toContain("conflicting_authority");
    expect(packet.abstentionScore.status).toBe("abstain");
  });

  it("does not treat an unsupported source claim as formal rejected-path evidence", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-governing-plus-unsupported-source",
        updatedAt: now
      },
      context: {
        inclusions: 2,
        exclusions: 0,
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-governing",
          sourceAuthority: "project-decision"
        }, {
          subjectType: "source_claim",
          subjectId: "claim-unsupported",
          sourceAuthority: "medium"
        }],
        activationTrace: {
          candidates: [{
            subjectType: "source_claim",
            subjectId: "claim-governing",
            sourceDecisionSupportBoost: {
              sourceDecisionEdgeIds: ["edge-governing"],
              targets: [{
                sourceDecisionEdgeId: "edge-governing",
                targetType: "architecture_decision",
                targetId: "decision-governing"
              }]
            }
          }, {
            subjectType: "source_claim",
            subjectId: "claim-unsupported",
            sourceClaimAuthorityStatus: "evidence_gap",
            sourceClaimAuthorityReasons: ["missing_source_decision_support"]
          }],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.governingDecisionIds).toEqual(["decision-governing"]);
    expect(packet.sourceConsensus.unsupportedSourceClaimIds).toEqual(["claim-unsupported"]);
    expect(packet.sourceRejectionIds).toEqual([]);
    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.abstentionScore).toMatchObject({
      status: "abstain",
      reasons: expect.arrayContaining([
        "evidence_gap",
        "caveated_source_authority",
        "missing_rejected_path_evidence"
      ])
    });
  });

  it("treats hurt and rejected usefulness feedback as maintenance caveats", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-hurt-feedback",
        updatedAt: now
      },
      context: {
        inclusions: 2,
        exclusions: 0,
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-hurt",
          sourceAuthority: "project-decision"
        }, {
          subjectType: "memory_record",
          subjectId: "memory-hurt",
          sourceAuthority: "project-decision"
        }]
      },
      evidenceBundles: [],
      feedbackDeltas: [{
        candidates: [],
        sourceUsefulnessOutcomes: [{
          sourceClaimId: "claim-hurt",
          outcome: "hurt",
          reason: "This source claim led to the wrong implementation path."
        }, {
          sourceDecisionId: "source-decision-feedback-rejected",
          outcome: "rejected",
          reason: "Reviewer rejected this decision path."
        }],
        knowledgeUsefulnessOutcomes: [{
          knowledgeId: "memory-hurt",
          outcome: "hurt",
          reason: "This memory caused the wrong setup."
        }]
      }],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.caveatedSourceClaimIds).toEqual(["claim-hurt"]);
    expect(packet.caveatedMemoryRefs).toEqual(["memory-hurt"]);
    expect(packet.rejectedPathIds).not.toContain("source-decision-feedback-rejected");
    expect(packet.sourceRejectionIds).toEqual([]);
    expect(packet.evidenceGaps.map((gap) => gap.id)).toEqual([
      "evidence-gap:run-hurt-feedback:no-governing-decision",
      "evidence-gap:run-hurt-feedback:caveated-source-authority:claim-hurt",
      "evidence-gap:run-hurt-feedback:caveated-memory-authority:memory-hurt"
    ]);
  });

  it("abstains when selected relation evidence has no support ref", () => {
    const packet = buildDecisionPacketFromReadModel(
      relationReadModel(["edge-relation-current"])
    );

    expect(packet.sourceConsensus.decisionLinkedSourceClaimIds).toEqual([
      "claim-relation-current"
    ]);
    expect(packet.evidenceGaps).toEqual([{
      id:
        "evidence-gap:run-relation-consensus:source-relation-support:claim-relation-current:edge-relation-current",
      reason:
        "SourceClaim claim-relation-current was selected through SourceClaimEdge edge-relation-current, but that relation has no evidenceRef, evidenceRefs, or sourceDecisionRef support.",
      verificationRequired:
        "Capture relation metadata evidenceRef/evidenceRefs/sourceDecisionRef, or demote/remove the relation before treating it as governing packet context."
    }]);
    expect(packet.sourceConsensus.evidenceGapIds).toEqual(packet.evidenceGaps.map((gap) => gap.id));
    expect(packet.abstentionScore).toMatchObject({
      status: "abstain",
      reasons: ["evidence_gap"]
    });
  });

  it("fails closed when the active evidence contract contains malformed commands", () => {
    expect(parseEvidenceContract({
      commands: [{
        command: "pnpm typecheck",
        required: true
      }, {
        command: "pnpm test"
      }],
      diffRisk: "medium",
      reviewBurden: "review",
      rollbackPath: "revert"
    })).toBeUndefined();
  });

  it("binds return channels to a stable packet checksum", () => {
    const first = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const second = buildDecisionPacketContractReadback({
      readModel: {
        ...readModel,
        context: {
          ...readModel.context,
          inclusionDetails: [...readModel.context.inclusionDetails].reverse()
        }
      },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(first.packetIdentity.checksum).toMatch(/^[a-f0-9]{64}$/u);
    expect(first.packetIdentity.evidenceRef).toBe(`packet:${first.packetIdentity.checksum}`);
    expect(first.returnChannels.evidence.persistedCommand).toContain(
      `--decision-packet-checksum ${first.packetIdentity.checksum}`
    );
    expect(first.returnChannels.evidence.persistedCommand).toContain(
      `--decision-packet-generated-at ${first.packetIdentity.generatedAt}`
    );
    expect(first.returnChannels.feedback.sourceDecisionUsefulnessExample).toContain(
      "does not expose canonical selected SourceDecision ids"
    );
    expect(first.proof.doesNotProve).toContain("live Codex obedience");
    expect(second.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
  });

  it("gives each packet issuance its own checksum", () => {
    const first = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const later = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: "2026-07-12T10:01:00.000Z",
      sha256Hex: fakeSha256Hex
    });

    expect(later.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
    expect(later.packetIdentity.generatedAt).not.toBe(first.packetIdentity.generatedAt);
  });
});
