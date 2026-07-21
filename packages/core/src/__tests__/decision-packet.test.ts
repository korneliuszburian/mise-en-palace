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
import {
  parseEvidenceContract,
  type EvidenceContract
} from "../evidence-contract.js";
import {
  parseDecisionPacketContractReadback
} from "../decision-packet-contract.js";

const now = "2026-07-08T14:45:00.000Z";

const activeEvidenceContractResourcesFor = (
  runId: string,
  commands: EvidenceContract["commands"] = [{
    command: "pnpm test",
    required: true
  }]
): Pick<DecisionPacketReadModelInput, "evidenceContract" | "evidenceContractActivation"> => {
  const evidenceContract: EvidenceContract = {
    taskContractId: `task-${runId}`,
    commands,
    diffRisk: "medium",
    reviewBurden: "Review the current task-bound change.",
    rollbackPath: "Revert the current task-bound change.",
    metadata: {}
  };

  return {
    evidenceContract,
    evidenceContractActivation: {
      status: "active",
      evidenceContract,
      taskContractId: evidenceContract.taskContractId,
      harnessPlanId: `plan-${runId}`,
      executionRunId: runId,
      taskContractStatus: "active",
      executionRunStatus: "planned"
    }
  };
};

const fakeSha256Hex = (value: string): string => {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0").repeat(8);
};

const readModel = {
  run: {
    id: "run-decision-packet-1",
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now
  },
  task: {
    id: "task-run-decision-packet-1",
    projectId: "project-decision-packet",
    title: "Build the governed packet",
    objective: "Return governed task context.",
    constraints: [],
    nonGoals: [],
    acceptance: []
  },
  ...activeEvidenceContractResourcesFor("run-decision-packet-1", [{
    command: "pnpm --filter frontend test",
    required: true
  }]),
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
    }, {
      subjectType: "memory_record",
      subjectId: "memory-stale",
      reason: "stale"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-current",
        sourceRejectionIds: ["source-rejection-current"],
        sourceDecisionSupportBoost: {
          edges: [{
            sourceDecisionEdgeId: "source-decision-edge-current",
            sourceDecisionId: "source-decision-current",
            targetType: "architecture_decision",
            targetId: "source-decision-current"
          }, {
            sourceDecisionEdgeId: "source-decision-edge-stale",
            sourceDecisionId: "source-decision-stale",
            targetType: "architecture_decision",
            targetId: "source-decision-current"
          }, {
            sourceDecisionEdgeId: "source-decision-edge-noise",
            sourceDecisionId: "source-decision-noise",
            targetType: "architecture_decision",
            targetId: "source-decision-current"
          }, {
            sourceDecisionEdgeId: "source-decision-edge-conflicted",
            sourceDecisionId: "source-decision-conflicted",
            targetType: "architecture_decision",
            targetId: "source-decision-current"
          }]
        },
      }, {
        subjectType: "source_claim",
        subjectId: "claim-caveated"
      }, {
        subjectType: "memory_record",
        subjectId: "memory-current",
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-current",
          key: "frontend-template",
          sourceClaimIds: ["claim-current"],
          sourceRefs: ["claim-current"],
          mechanism: "Accepted project standard narrows new frontend setup choices.",
          krnImplication: "DecisionPacket should tell Codex which template to use.",
          decision: "Use the current frontend template for matching app setup tasks.",
          consumer: "DecisionPacket",
          falsifier: "A matching app setup packet omits the current template decision.",
          validFrom: "2026-07-01T00:00:00.000Z",
          rejectedPath: "Do not use the superseded template.",
          doesNotProve: "Does not prove the template fits every frontend task."
        },
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
  evidenceBundles: [{
    commands: [{
      command: "pnpm --filter frontend test"
    }]
  }],
  feedbackDeltas: [{
    status: "accepted",
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
  missingRelationSupportEdgeIds: readonly string[],
  includeRelationEvidenceGap = false
): DecisionPacketReadModelInput => ({
  run: {
    id: "run-relation-consensus",
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now
  },
  task: {
    id: "task-run-relation-consensus",
    projectId: "project-decision-packet",
    title: "Build the relation packet",
    objective: "Evaluate relation support.",
    constraints: [],
    nonGoals: [],
    acceptance: []
  },
  ...activeEvidenceContractResourcesFor("run-relation-consensus"),
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
          edges: [{
            sourceDecisionEdgeId: "source-decision-edge-relation",
            sourceDecisionId: "source-decision-relation-current",
            targetType: "architecture_decision",
            targetId: "source-decision-relation-current"
          }]
        }
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-superseded-relation"
      }],
      sourceConsensusTimeline: {
        currentSourceClaimIds: ["claim-relation-current"],
        caveatedSourceClaimIds: [],
        historicalSourceClaimIds: ["claim-relation-old"],
        staleSourceClaimIds: [],
        supersededSourceClaimIds: ["claim-relation-old"],
        unknownSourceClaimIds: [],
        rejectedSourceClaimIds: [],
        entries: [{
          sourceClaimId: "claim-relation-current",
          claim: "Use the supported relation.",
          status: "accepted",
          createdAt: now,
          sourceAuthority: "project-decision",
          authorityRank: 3,
          temporalValidity: { status: "current" as const },
          authorityState: "accepted",
          state: "current_authority" as const,
          decisionSupportEdgeIds: ["source-decision-edge-relation"],
          evidenceRefs: ["evidence:relation-current"],
          rawEvidenceCitationRefs: ["citation:relation-current"],
          sourceRanges: [],
          relationEvidence: includeRelationEvidenceGap ? [{
            sourceClaimEdgeId: "edge-relation-missing-support",
            direction: "incoming",
            kind: "narrows",
            relatedSourceClaimId: "claim-relation-old",
            metadataEvidenceRefs: [],
            sourceRanges: [],
            evidenceGaps: ["missing_relation_support_ref"],
            temporalValidity: { status: "current" }
          }] : [],
          supportingSourceClaimIds: [],
          dissentingSourceClaimIds: [],
          supersededBySourceClaimIds: [],
          supersedesSourceClaimIds: ["claim-relation-old"],
          rejectionIds: [],
          caveats: []
        }],
        doesNotProve: "Timeline evidence does not prove source truth."
      }
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

const unresolvedAcceptedSourceDissentReadModel = (): DecisionPacketReadModelInput => ({
  run: {
    id: "run-unresolved-accepted-source-dissent",
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now
  },
  ...activeEvidenceContractResourcesFor("run-unresolved-accepted-source-dissent"),
  context: {
    inclusions: 3,
    exclusions: 0,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-governing",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "source_claim",
      subjectId: "claim-dissenting",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "anti_memory_record",
      subjectId: "anti-memory-reviewed",
      sourceAuthority: "project-decision"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-governing",
        sourceClaimAuthorityStatus: "caveated",
        sourceClaimAuthorityReasons: ["accepted_with_dissenting_source_claims"],
        projectStandardDecision: {
          kind: "krn.projectStandardDecision.v1",
          memoryRecordId: "memory-unresolved-source-dissent",
          key: "unresolved-source-dissent",
          sourceRefs: ["claim-governing", "claim-dissenting"],
          mechanism: "Accepted dissent has no reviewed canonical resolution.",
          krnImplication: "Do not render source-conflicted guidance as governing authority.",
          decision: "Do not execute unresolved source dissent as project guidance.",
          consumer: "DecisionPacket",
          falsifier: "An unresolved source dissent packet emits this as governing guidance.",
          validFrom: "2026-07-08T00:00:00.000Z",
          doesNotProve: "Does not determine which accepted source claim is true."
        },
        sourceClaimEdgeInfluence: {
          edgeIds: ["edge-dissenting-contradicts-governing"],
          edgeKinds: ["contradicts"],
          seedSourceClaimIds: ["claim-dissenting"],
          doesNotProve:
            "The relation makes dissent reviewable; it does not resolve which accepted claim is true."
        },
        sourceDecisionSupportBoost: {
          edges: [{
            sourceDecisionEdgeId: "source-decision-edge-governing",
            sourceDecisionId: "source-decision-governing",
            targetType: "architecture_decision",
            targetId: "decision-unresolved-source-dissent"
          }]
        }
      }, {
        subjectType: "source_claim",
        subjectId: "claim-dissenting",
        sourceClaimAuthorityStatus: "accepted",
        sourceClaimAuthorityReasons: ["current_decision_linked_authority"],
        sourceDecisionSupportBoost: {
          edges: [{
            sourceDecisionEdgeId: "source-decision-edge-dissenting",
            sourceDecisionId: "source-decision-dissenting",
            targetType: "architecture_decision",
            targetId: "decision-unresolved-source-dissent"
          }]
        }
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-reviewed"
      }]
    }
  },
  evidenceBundles: [],
  feedbackDeltas: [],
  proof: {
    doesNotProve: ["source truth", "conflict resolution"]
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
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now
  },
  task: {
    id: `task-source-claim-exclusion-${input.reason}`,
    projectId: "project-decision-packet",
    title: "Evaluate source exclusion",
    objective: "Keep non-formal exclusions non-governing.",
    constraints: [],
    nonGoals: [],
    acceptance: []
  },
  ...activeEvidenceContractResourcesFor(`run-source-claim-exclusion-${input.reason}`),
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
          edges: [{
            sourceDecisionEdgeId: "edge-governing",
            sourceDecisionId: "source-decision-governing",
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

const deferredSourceDissentReadModel = (): DecisionPacketReadModelInput => ({
  run: {
    id: "run-deferred-source-dissent",
    status: "planned",
    lifecycleRevision: 1,
    updatedAt: now
  },
  ...activeEvidenceContractResourcesFor("run-deferred-source-dissent"),
  context: {
    inclusions: 2,
    exclusions: 1,
    inclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-deferred-current",
      sourceAuthority: "project-decision"
    }, {
      subjectType: "anti_memory_record",
      subjectId: "anti-memory-deferred-review",
      sourceAuthority: "project-decision"
    }],
    exclusionDetails: [{
      subjectType: "source_claim",
      subjectId: "claim-deferred-proposal",
      reason: "deferred",
      explanation: "Deferred source dissent is not accepted authority.",
      sourceAuthority: "medium"
    }],
    activationTrace: {
      candidates: [{
        subjectType: "source_claim",
        subjectId: "claim-deferred-current",
        sourceRejectionIds: ["source-rejection-deferred"],
        sourceDecisionSupportBoost: {
          edges: [{
            sourceDecisionEdgeId: "edge-deferred-current",
            sourceDecisionId: "source-decision-deferred-current",
            targetType: "architecture_decision",
            targetId: "decision-deferred-current"
          }]
        }
      }],
      decisions: [{
        reason: "anti_memory_block",
        antiMemoryRecordId: "anti-memory-deferred-review"
      }]
    }
  },
  evidenceBundles: [],
  feedbackDeltas: [],
  proof: {
    doesNotProve: ["source truth", "future proposal quality"]
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

  it("preserves persisted standalone anti-memory exclusions as rejected paths", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        exclusions: readModel.context.exclusions + 1,
        exclusionDetails: [
          ...readModel.context.exclusionDetails,
          {
            subjectType: "anti_memory_record",
            subjectId: "anti-memory-standalone",
            reason: "unsafe",
            explanation: "Standalone anti-memory remains non-governing."
          }
        ]
      }
    });

    expect(packet.rejectedPathIds).toEqual([
      "anti-memory-standalone",
      "anti-memory-superseded-template"
    ]);
    expect(packet.memoryRefs).not.toContain("anti-memory-standalone");
    expect(packet.governingDecisionIds).not.toContain("anti-memory-standalone");
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
    expect(packet.caveatedSourceClaimIds).toEqual(["claim-caveated"]);
    expect(packet.sourceDecisionEdgeIds).toEqual([
      "source-decision-edge-current",
      "source-decision-edge-stale",
      "source-decision-edge-noise",
      "source-decision-edge-conflicted"
    ]);
    expect(packet.sourceDecisionTargets).toEqual([{
      targetType: "architecture_decision",
      targetId: "source-decision-current",
      sourceDecisionEdgeIds: [
        "source-decision-edge-current",
        "source-decision-edge-stale",
        "source-decision-edge-noise",
        "source-decision-edge-conflicted"
      ]
    }]);
    expect(packet.memoryRefs).toEqual(["memory-current"]);
    expect(packet.caveatedMemoryRefs).toEqual(["memory-current"]);
    expect(packet.staleDecisionIds).toEqual([]);
    expect(packet.staleKnowledgeIds).toEqual(["memory-stale"]);
    expect(packet.supersededPathIds).toEqual(["claim-superseded"]);
    expect(packet.rejectedPathIds).toEqual(["anti-memory-superseded-template"]);
    expect(packet.sourceRejectionIds).toEqual(["source-rejection-current"]);
    expect(packet.severeStaleAuthorityIds).toEqual([]);
    expect(packet.falsifiers).toEqual([
      "A matching app setup packet omits the current template decision."
    ]);
    expect(packet.verificationCommands).toEqual(["pnpm --filter frontend test"]);
    expect(packet.evidenceGaps.map((gap) => gap.id)).toEqual([
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
        "caveated_source_authority",
        "caveated_memory_authority"
      ]
    });
  });

  it("preserves bounded supporting evidence only on its selected context inclusion", () => {
    const supportingEvidence = {
      searchDocumentId: "search-course-slice-1",
      sourceArtifactId: "artifact-course-1",
      sourceChunkId: "chunk-course-17",
      contentHash: "a".repeat(64),
      renderedContentHash: "1d1ed0da7180bfaa578a13d8b6bdfbe2c22b2d6346b28542658affd087e90eb1",
      sourceRange: "lines 641-680",
      content: "Prefer intrinsic composition before component-specific breakpoints.",
      truncated: false
    };
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        inclusionDetails: readModel.context.inclusionDetails.map((inclusion) =>
          inclusion.subjectId === "claim-current"
            ? { ...inclusion, supportingEvidence }
            : inclusion
        )
      }
    });

    expect(packet.contextInclusions.find(
      (inclusion) => inclusion.subjectId === "claim-current"
    )?.supportingEvidence).toEqual(supportingEvidence);
    expect(packet.contextInclusions.find(
      (inclusion) => inclusion.subjectId === "claim-caveated"
    )?.supportingEvidence).toBeUndefined();
  });

  it("keeps stale memory identity historical without promoting it into memoryRefs", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        exclusions: readModel.context.exclusions + 1,
        exclusionDetails: [...(readModel.context.exclusionDetails ?? []), {
          subjectType: "memory_record",
          subjectId: "memory-stale-boundary",
          reason: "stale"
        }]
      }
    });

    expect(packet.staleKnowledgeIds).toContain("memory-stale-boundary");
    expect(packet.memoryRefs).not.toContain("memory-stale-boundary");
    expect(packet.contextExclusions).toContainEqual(expect.objectContaining({
      subjectId: "memory-stale-boundary",
      reason: "stale"
    }));

    const invalidatedPacket = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        exclusions: readModel.context.exclusions + 1,
        exclusionDetails: [...(readModel.context.exclusionDetails ?? []), {
          subjectType: "memory_record",
          subjectId: "memory-invalidated-boundary",
          reason: "invalidated"
        }]
      }
    });

    expect(invalidatedPacket.staleKnowledgeIds).toContain("memory-invalidated-boundary");
  });

  it("exposes canonical selected SourceDecision ids", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-canonical-source-decision",
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-canonical-source-decision"),
      context: {
        inclusions: 2,
        exclusions: 2,
        inclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-canonical-source-decision",
          sourceAuthority: "project-decision"
        }, {
          subjectType: "source_claim",
          subjectId: "claim-conflicting-source-decision",
          sourceAuthority: "project-decision"
        }],
        exclusionDetails: [{
          subjectType: "source_claim",
          subjectId: "claim-stale-source-decision",
          reason: "stale"
        }, {
          subjectType: "source_claim",
          subjectId: "claim-rejected-source-decision",
          reason: "rejected"
        }],
        activationTrace: {
          candidates: [{
            subjectType: "source_claim",
            subjectId: "claim-canonical-source-decision",
            sourceDecisionSupportBoost: {
              edges: [{
                sourceDecisionEdgeId: "edge-canonical-source-decision",
                sourceDecisionId: "source-decision-canonical-id",
                targetType: "architecture_decision",
                targetId: "architecture-target-opaque-id"
              }]
            }
          }, {
            subjectType: "source_claim",
            subjectId: "claim-conflicting-source-decision",
            sourceClaimEdgeInfluence: {
              edgeIds: ["edge-conflicting-claim"],
              edgeKinds: ["contradicts"],
              seedSourceClaimIds: ["claim-canonical-source-decision"],
              doesNotProve: "The relation does not prove either endpoint true."
            },
            sourceDecisionSupportBoost: {
              edges: [{
                sourceDecisionEdgeId: "edge-conflicting-source-decision",
                sourceDecisionId: "source-decision-conflicting-id",
                targetType: "architecture_decision",
                targetId: "architecture-target-conflicting-id"
              }]
            }
          }, {
            subjectType: "source_claim",
            subjectId: "claim-stale-source-decision",
            sourceDecisionSupportBoost: {
              edges: [{
                sourceDecisionEdgeId: "edge-stale-source-decision",
                sourceDecisionId: "source-decision-stale-id",
                targetType: "architecture_decision",
                targetId: "architecture-target-stale-id"
              }]
            }
          }, {
            subjectType: "source_claim",
            subjectId: "claim-rejected-source-decision",
            sourceDecisionSupportBoost: {
              edges: [{
                sourceDecisionEdgeId: "edge-rejected-source-decision",
                sourceDecisionId: "source-decision-rejected-id",
                targetType: "architecture_decision",
                targetId: "architecture-target-rejected-id"
              }]
            }
          }],
          decisions: []
        }
      },
      evidenceBundles: [],
      feedbackDeltas: [{
        status: "accepted",
        candidates: [],
        sourceUsefulnessOutcomes: [{
          sourceDecisionId: "source-decision-feedback-only-id",
          outcome: "used",
          reason: "Feedback alone cannot select a canonical decision."
        }],
        knowledgeUsefulnessOutcomes: []
      }],
      proof: {
        doesNotProve: ["source truth"]
      }
    });

    expect(packet.governingDecisionIds).toEqual(["architecture-target-opaque-id"]);
    expect(packet.sourceDecisionIds).toEqual(["source-decision-canonical-id"]);
    expect(packet.sourceDecisionIds).not.toEqual(expect.arrayContaining([
      "architecture-target-opaque-id",
      "source-decision-conflicting-id",
      "source-decision-stale-id",
      "source-decision-rejected-id",
      "source-decision-feedback-only-id"
    ]));
  });

  it("preserves persisted stale SourceDecision ids as historical packet boundaries", () => {
    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      context: {
        ...readModel.context,
        activationTrace: {
          ...readModel.context.activationTrace,
          candidates: [
            ...(readModel.context.activationTrace?.candidates ?? []),
            {
              id: "candidate-stale-source",
              kind: "source",
              status: "excluded",
              subjectType: "source_claim",
              subjectId: "claim-stale-source",
              sourceAuthority: "project-decision",
              reason: "stale",
              staleSourceDecisionIds: ["source-decision-historical"]
            }
          ]
        }
      }
    });

    expect(packet.staleDecisionIds).toEqual(["source-decision-historical"]);
    expect(packet.sourceConsensus.staleDecisionIds).toEqual(["source-decision-historical"]);
    expect(packet.governingDecisionIds).not.toContain("source-decision-historical");
    expect(packet.sourceDecisionIds).not.toContain("source-decision-historical");
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
                edges: [{
                  sourceDecisionEdgeId: "hidden-edge",
                  sourceDecisionId: "hidden-decision",
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
      ...activeEvidenceContractResourcesFor("run-decision-packet-1", [{
          command: "pnpm typecheck",
          required: true
        }, {
          command: "pnpm test -- current-task",
          required: false
        }]),
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

  it("keeps an inactive contract as history without promoting its commands", () => {
    const resources = activeEvidenceContractResourcesFor("run-decision-packet-1", [{
      command: "pnpm historical-terminal-check",
      required: true
    }]);
    const activeDecision = resources.evidenceContractActivation;

    if (activeDecision.status !== "active") {
      throw new Error("active EvidenceContract test fixture was not active");
    }

    const packet = buildDecisionPacketFromReadModel({
      ...readModel,
      ...resources,
      run: {
        ...readModel.run,
        status: "succeeded"
      },
      evidenceContractActivation: {
        status: "inactive",
        reason: "execution_run_terminal",
        evidenceContract: activeDecision.evidenceContract,
        taskContractId: activeDecision.taskContractId,
        harnessPlanId: activeDecision.harnessPlanId,
        executionRunId: activeDecision.executionRunId,
        taskContractStatus: activeDecision.taskContractStatus,
        executionRunStatus: "succeeded"
      }
    });

    expect(packet.evidenceContract).toBeUndefined();
    expect(packet.verificationCommands).toEqual([]);
    expect(packet.evidenceGaps).toContainEqual(expect.objectContaining({
      id: "evidence-gap:missing-active-contract",
      reason: expect.stringContaining("execution_run_terminal")
    }));
    expect(packet.abstentionScore.status).toBe("abstain");
  });

  it("does not guess current verification when the active contract is absent", () => {
    const {
      evidenceContract,
      evidenceContractActivation,
      ...readModelWithoutContract
    } = readModel;
    void evidenceContract;
    void evidenceContractActivation;

    const packet = buildDecisionPacketFromReadModel({
      ...readModelWithoutContract,
      evidenceContractActivation: {
        status: "inactive",
        reason: "missing_evidence_contract",
        taskContractId: "task-run-decision-packet-1",
        harnessPlanId: "plan-run-decision-packet-1",
        executionRunId: "run-decision-packet-1",
        taskContractStatus: "active",
        executionRunStatus: "planned"
      },
      evidenceBundles: [{
        commands: [{
          command: "pnpm historical-check=passed"
        }]
      }]
    });

    expect(packet.verificationCommands).toEqual([]);
    expect(packet.evidenceGaps).toContainEqual(expect.objectContaining({
      id: "evidence-gap:missing-active-contract",
      reason: expect.stringContaining("missing_evidence_contract")
    }));
    expect(packet.falsifiers).toEqual([
      "A matching app setup packet omits the current template decision."
    ]);
  });

  it("keeps feedback-only source decisions and reasons outside governing authority", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-feedback-only-authority",
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-feedback-only-authority"),
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
        status: "accepted",
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
    expect(packet.rejectedPathIds).toEqual([]);
    expect(packet.sourceRejectionIds).toEqual([]);
  });

  it("keeps authority-superseded source claims out of formal rejected paths", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-authority-superseded",
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-authority-superseded"),
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
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      task: {
        id: "task-governing-rejected-feedback",
        projectId: "project-decision-packet",
        title: "Evaluate rejected feedback",
        objective: "Keep feedback diagnostic until formal review.",
        constraints: [],
        nonGoals: [],
        acceptance: []
      },
      ...activeEvidenceContractResourcesFor("run-governing-rejected-feedback"),
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
              edges: [{
                sourceDecisionEdgeId: "edge-governing",
                sourceDecisionId: "decision-governing",
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
        status: "accepted",
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

  it("preserves relation evidence gaps in the bounded DecisionPacket timeline", () => {
    const packet = buildDecisionPacketFromReadModel(relationReadModel([], true));

    expect(packet.sourceConsensus.timeline?.entries[0]?.relationEvidence).toEqual([
      expect.objectContaining({
        sourceClaimEdgeId: "edge-relation-missing-support",
        evidenceGaps: ["missing_relation_support_ref"]
      })
    ]);
  });

  it("carries the authoritative temporal consensus explanation into the packet", () => {
    const packet = buildDecisionPacketFromReadModel(relationReadModel([]));

    expect(packet.sourceConsensus.timeline?.entries[0]).toMatchObject({
      sourceClaimId: "claim-relation-current",
      createdAt: now,
      decisionSupportEdgeIds: ["source-decision-edge-relation"],
      evidenceRefs: ["evidence:relation-current"],
      supersedesSourceClaimIds: ["claim-relation-old"]
    });
    expect(packet.sourceConsensus.timeline?.supersededSourceClaimIds).toEqual([
      "claim-relation-old"
    ]);
  });

  it("abstains on unresolved accepted source dissent", () => {
    const packet = buildDecisionPacketFromReadModel(unresolvedAcceptedSourceDissentReadModel());

    expect(packet.sourceClaimIds).toEqual(["claim-governing", "claim-dissenting"]);
    expect(packet.governingDecisionIds).toEqual([]);
    expect(packet.governingStatements).toEqual([]);
    expect(packet.taskStandardDecisions).toEqual([]);
    expect(packet.falsifiers).toEqual([]);
    expect(packet.sourceDecisionEdgeIds).toEqual([]);
    expect(packet.sourceDecisionTargets).toEqual([]);
    expect(packet.sourceConsensus.decisionLinkedSourceClaimIds).toEqual([]);
    expect(packet.sourceConsensus.conflictingSourceClaimIds).toEqual(["claim-governing"]);
    expect(packet.sourceConsensus.sourceDecisionEdgeIds).toEqual([]);
    expect(packet.evidenceGaps).toEqual(expect.arrayContaining([expect.objectContaining({
      id: "evidence-gap:run-unresolved-accepted-source-dissent:unresolved-accepted-source-dissent:claim-governing"
    })]));
    expect(packet.abstentionScore.status).toBe("abstain");
    expect(packet.abstentionScore.reasons).toContain("unresolved_accepted_source_dissent");
  });

  it.each([
    {
      label: "resolved",
      readModel: sourceClaimExclusionReadModel({
        reason: "superseded",
        sourceRejectionIds: ["source-rejection-resolved"]
      }),
      governingDecisionId: "decision-governing"
    },
    {
      label: "rejected",
      readModel: sourceClaimExclusionReadModel({
        reason: "unsafe",
        sourceRejectionIds: ["source-rejection-rejected"]
      }),
      governingDecisionId: "decision-governing"
    },
    {
      label: "deferred",
      readModel: deferredSourceDissentReadModel(),
      governingDecisionId: "decision-deferred-current",
      deferredSourceClaimId: "claim-deferred-proposal"
    }
  ] satisfies readonly {
    label: string;
    readModel: DecisionPacketReadModelInput;
    governingDecisionId: string;
    deferredSourceClaimId?: string;
  }[])("does not manufacture an unresolved accepted-dissent stop for $label source context", ({
    readModel,
    governingDecisionId,
    deferredSourceClaimId
  }) => {
    const packet = buildDecisionPacketFromReadModel(readModel);

    expect(packet.governingDecisionIds).toEqual([governingDecisionId]);
    expect(packet.abstentionScore.reasons).not.toContain("unresolved_accepted_source_dissent");
    expect(packet.evidenceGaps.map((gap) => gap.id)).not.toContain(
      expect.stringContaining(":unresolved-accepted-source-dissent:")
    );

    if (deferredSourceClaimId !== undefined) {
      expect(packet.contextExclusions).toContainEqual(expect.objectContaining({
        subjectType: "source_claim",
        subjectId: deferredSourceClaimId,
        reason: "deferred"
      }));
    }
  });

  it("exposes unsupported, conflicting, and unknown source authority in the packet", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-authority-states",
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-authority-states"),
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
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-governing-plus-unsupported-source"),
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
              edges: [{
                sourceDecisionEdgeId: "edge-governing",
                sourceDecisionId: "source-decision-governing",
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

  it("keeps legacy accepted feedback non-governing until a reviewed artifact exists", () => {
    const packet = buildDecisionPacketFromReadModel({
      run: {
        id: "run-hurt-feedback",
        status: "planned",
        lifecycleRevision: 1,
        updatedAt: now
      },
      ...activeEvidenceContractResourcesFor("run-hurt-feedback"),
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
        status: "accepted",
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
    expect(packet.caveatedMemoryRefs).toEqual([]);
    expect(packet.reviewOnlyUsefulnessCaveats).toEqual([
      expect.objectContaining({
        subjectType: "source_claim",
        subjectId: "claim-hurt",
        outcome: "hurt",
        feedbackStatus: "accepted"
      }),
      expect.objectContaining({
        subjectType: "source_decision",
        subjectId: "source-decision-feedback-rejected",
        outcome: "rejected",
        feedbackStatus: "accepted"
      }),
      expect.objectContaining({
        subjectType: "knowledge",
        subjectId: "memory-hurt",
        outcome: "hurt",
        feedbackStatus: "accepted"
      })
    ]);
    expect(packet.rejectedPathIds).not.toContain("source-decision-feedback-rejected");
    expect(packet.sourceRejectionIds).toEqual([]);
    expect(packet.evidenceGaps.map((gap) => gap.id)).toEqual([
      "evidence-gap:run-hurt-feedback:no-governing-decision",
      "evidence-gap:run-hurt-feedback:caveated-source-authority:claim-hurt"
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
      taskContractId: "task-1",
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
    const replay = buildDecisionPacketContractReadback({
      readModel,
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
      "decision:<id>=selected"
    );
    expect(first.packet.reviewOnlyUsefulnessCaveats).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectType: "knowledge",
        subjectId: "memory-current",
        outcome: "stale",
        feedbackStatus: "accepted"
      })
    ]));
    expect(first.proof.doesNotProve).toContain("live Codex obedience");
    expect(replay.packetIdentity.checksum).toBe(first.packetIdentity.checksum);
    expect(second.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
  });

  it("validates persisted DecisionPacket readback and rejects malformed or tampered artifacts", () => {
    const issued = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const tampered = structuredClone(issued);
    tampered.packet.sourceDecisionIds = ["source-decision-forged-id"];
    const malformed = {
      ...issued,
      packet: {
        ...issued.packet,
        task: {
          ...issued.packet.task,
          status: "unknown"
        }
      }
    };

    expect(parseDecisionPacketContractReadback({
      value: issued,
      expectedRunId: issued.request.runId,
      sha256Hex: fakeSha256Hex
    })).toEqual(issued);
    expect(parseDecisionPacketContractReadback({
      value: tampered,
      expectedRunId: issued.request.runId,
      sha256Hex: fakeSha256Hex
    })).toBeUndefined();
    expect(parseDecisionPacketContractReadback({
      value: malformed,
      expectedRunId: issued.request.runId,
      sha256Hex: fakeSha256Hex
    })).toBeUndefined();
  });

  it("exposes complete packet scope and abstains without project identity", () => {
    const { task: _task, ...projectlessReadModel } = readModel;
    const projectless = buildDecisionPacketContractReadback({
      readModel: projectlessReadModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(projectless.request).toEqual({
      runId: "run-decision-packet-1",
      taskId: "run-decision-packet-1",
      projectId: null
    });
    expect(projectless.packet.task).toMatchObject({
      id: "run-decision-packet-1",
      projectId: null
    });
    expect(projectless.packet.abstentionScore).toMatchObject({
      status: "abstain",
      reasons: expect.arrayContaining(["missing_project_identity"])
    });
  });

  it("binds task and project identity into the packet checksum", () => {
    const task = {
      id: "task-decision-packet-1",
      projectId: "project-a",
      title: "Build the scoped packet",
      objective: "Bind the packet to one task and project.",
      constraints: [],
      nonGoals: [],
      acceptance: []
    };
    const first = buildDecisionPacketContractReadback({
      readModel: { ...readModel, task },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const otherProject = buildDecisionPacketContractReadback({
      readModel: {
        ...readModel,
        task: { ...task, projectId: "project-b" }
      },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(first.request).toEqual({
      runId: "run-decision-packet-1",
      taskId: "task-decision-packet-1",
      projectId: "project-a"
    });
    expect(first.packet.abstentionScore.reasons).not.toContain("missing_project_identity");
    expect(otherProject.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
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

  it("changes packet identity when the execution lifecycle status changes", () => {
    const planned = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const running = buildDecisionPacketContractReadback({
      readModel: {
        ...readModel,
        run: {
          ...readModel.run,
          status: "running"
        }
      },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(running.packetIdentity.checksum).not.toBe(planned.packetIdentity.checksum);
  });

  it("changes packet identity when only the execution lifecycle revision changes", () => {
    const first = buildDecisionPacketContractReadback({
      readModel,
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });
    const nextRevision = buildDecisionPacketContractReadback({
      readModel: {
        ...readModel,
        run: {
          ...readModel.run,
          lifecycleRevision: 2
        }
      },
      generatedAt: now,
      sha256Hex: fakeSha256Hex
    });

    expect(nextRevision.packetIdentity.checksum).not.toBe(first.packetIdentity.checksum);
    expect(nextRevision.packetIdentity.packetId).not.toBe(first.packetIdentity.packetId);
    expect(nextRevision.packetIdentity.sourceRunLifecycleRevision).toBe(2);
  });
});
