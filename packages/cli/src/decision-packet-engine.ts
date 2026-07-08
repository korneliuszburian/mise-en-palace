import {
  buildDecisionPacketAbstentionScore,
  buildDecisionPacketSourceConsensus,
  decisionPacketFormatVersion,
  type CapabilityPlan,
  type ContextObservationPrefix,
  type DecisionPacket,
  type DecisionPacketTaskStandard,
  type MemoryRecord,
  type SourceClaim,
  type SourceClaimEdge,
  type SourceDecisionEdge,
  type TaskContract
} from "@krn/core";
import {
  createExecutionBrief,
  type ExecutionBrief
} from "@krn/codex-adapter";
import {
  applyActivationFilters,
  assembleContext,
  retrieveActivationCandidates
} from "@krn/harness";
import type {
  RankedActivationCandidate
} from "@krn/harness";
import type {
  EvidenceContract
} from "@krn/harness";

import type {
  DecisionPacketRow,
  DecisionPacketCase,
  DecisionPacketEvalFixture
} from "./decision-packet-fixture.js";

const now = "2026-07-07T00:00:00.000Z";
const projectId = "project:decision-packet-eval";

const currentDecisionStatus = "current";
const acceptedSourceClaimStatus = "accepted";

const nonEmpty = (
  value: string | undefined
): value is string => value !== undefined && value.trim().length > 0;

const decisionById = (
  decisions: readonly DecisionPacketRow[]
): ReadonlyMap<string, DecisionPacketRow> =>
  new Map(decisions.map((decision) => [decision.id, decision]));

const rowForSourceClaim = (
  decisions: readonly DecisionPacketRow[],
  sourceClaimId: string
): DecisionPacketRow | undefined =>
  decisions.find((decision) => decision.sourceClaimId === sourceClaimId);

const rowForMemoryRef = (
  decisions: readonly DecisionPacketRow[],
  memoryRef: string
): DecisionPacketRow | undefined => {
  const decisionId = memoryRef.startsWith("memory:decision:")
    ? memoryRef.slice("memory:decision:".length)
    : undefined;

  return decisionId === undefined
    ? undefined
    : decisions.find((decision) => decision.id === decisionId);
};

const sourceClaimStatusFor = (
  decision: DecisionPacketRow
): SourceClaim["status"] => {
  if (decision.status === "current") {
    return acceptedSourceClaimStatus;
  }

  return decision.status === "stale" ? "deprecated" : "rejected";
};

const toSourceClaim = (decision: DecisionPacketRow): SourceClaim => ({
  id: decision.sourceClaimId,
  sourceArtifactId: `source-artifact:${decision.id}`,
  claim: `${decision.title}: ${decision.statement}`,
  mechanism: `Decision ${decision.id} is represented as source-backed engineering guidance.`,
  krnImplication: `Use decision ${decision.id} when the task matches ${decision.title}.`,
  doesNotProve: decision.doesNotProve,
  sourceAuthority: "project-decision",
  supportType: "decision",
  consumer: "decision-packet-eval",
  falsifier: decision.falsifier,
  status: sourceClaimStatusFor(decision),
  metadata: {
    decisionId: decision.id,
    evidenceRef: decision.evidenceRef
  },
  createdAt: now,
  updatedAt: now
});

const toSourceDecisionEdge = (
  decision: DecisionPacketRow
): SourceDecisionEdge | undefined =>
  decision.sourceDecisionEdgeId === undefined
    ? undefined
    : {
        id: decision.sourceDecisionEdgeId,
        sourceClaimId: decision.sourceClaimId,
        targetType: "architecture_decision",
        targetId: decision.id,
        supportType: "decision",
        confidence: "high",
        notes: `Decision-packet eval edge for ${decision.id}.`,
        metadata: {
          evidenceRef: decision.evidenceRef
        },
        createdAt: now
      };

const toMemoryRecord = (decision: DecisionPacketRow): MemoryRecord => ({
  id: `memory:decision:${decision.id}`,
  projectId,
  key: `decision-packet:${decision.id}`,
  kind: "procedure",
  status: "active",
  summary: decision.title,
  body: decision.statement,
  owner: "decision-packet-eval",
  confidence: 95,
  applicationGuidance: `Apply ${decision.id} only with its SourceClaim and SourceDecisionEdge boundary.`,
  sourceLineage: [
    {
      sourceId: decision.sourceClaimId,
      note: decision.evidenceRef
    }
  ],
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  metadata: {
    decisionId: decision.id,
    sourceClaimId: decision.sourceClaimId
  },
  validFrom: now,
  createdAt: now,
  updatedAt: now
});

const taskContractFor = (testCase: DecisionPacketCase): TaskContract => ({
  id: `task-contract:${testCase.id}`,
  operatorIntentId: `operator-intent:${testCase.id}`,
  projectId,
  title: testCase.id,
  objective: testCase.task,
  constraints: [
    "Use only governed current decision-packet context.",
    "Expose stale and rejected paths as exclusions, not as governing guidance."
  ],
  nonGoals: [
    "Live Codex execution",
    "LLM judgment"
  ],
  acceptance: [
    testCase.expectedDecisionId === undefined
      ? `Abstains with ${testCase.expectedEvidenceGap?.id ?? "evidence gap"}`
      : `Includes ${testCase.expectedDecisionId}`,
    "Excludes stale and rejected authority"
  ],
  status: "active",
  metadata: {
    evalCaseId: testCase.id
  },
  createdAt: now,
  updatedAt: now
});

const capabilityPlanFor = (testCase: DecisionPacketCase): CapabilityPlan => ({
  id: `capability-plan:${testCase.id}`,
  harnessPlanId: `harness-plan:${testCase.id}`,
  requirements: [
    {
      kind: "source_grounding",
      priority: "required",
      reason: "Decision packet eval requires source-backed guidance.",
      requiredEvidence: ["SourceDecisionEdge support"]
    },
    {
      kind: "context_abstention",
      priority: "required",
      reason: "Stale and rejected authority must not become context inclusions.",
      requiredEvidence: ["context exclusions"]
    }
  ],
  toolBoundaries: [
    "Do not execute Codex.",
    "Do not mutate DB state."
  ],
  metadata: {
    evalCaseId: testCase.id
  },
  createdAt: now
});

const evidenceContractFor = (testCase: DecisionPacketCase): EvidenceContract => ({
  commands: [
    {
      command: "pnpm --filter @krn/cli test -- decision-packet-eval",
      required: true
    }
  ],
  diffRisk: "medium",
  reviewBurden: "Verify real activation/context/brief path, stale exclusions, and rejected-path readback.",
  rollbackPath: "Revert the decision-packet eval implementation slice.",
  metadata: {
    evalCaseId: testCase.id
  }
});

const observationPrefixFor = (
  testCase: DecisionPacketCase
): ContextObservationPrefix | undefined => {
  const items = testCase.observationPrefixItems ?? [];

  return items.length === 0
    ? undefined
    : {
        projectId,
        taskContractId: `task-contract:${testCase.id}`,
        text: items.map((item) => item.summary).join("\n"),
        itemCount: items.length,
        warningCount: 0,
        exclusionCount: 0,
        items: items.map((item, index) => ({
          observationId: item.observationId,
          kind: item.kind,
          confidence: "high",
          priority: "high",
          summary: item.summary,
          sourceRangeCount: 1,
          reason: item.reason,
          score: 100 - index
        })),
        warnings: [],
        exclusions: []
      };
};

const sourceClaimEdgesFor = (
  decisions: readonly DecisionPacketRow[]
): readonly SourceClaimEdge[] => {
  const currentRows = decisions.filter((decision) => decision.status === currentDecisionStatus);
  const staleRows = decisions.filter((decision) => decision.status === "stale");

  return currentRows.flatMap((current) =>
    staleRows.map((stale): SourceClaimEdge => ({
      id: `source-claim-edge:${current.id}:stale:${stale.id}`,
      fromSourceClaimId: current.sourceClaimId,
      toSourceClaimId: stale.sourceClaimId,
      kind: "expires",
      metadata: {
        consumer: "decision-packet-eval",
        doesNotProve: "Rank-down edge does not prove the stale claim is false outside this eval fixture.",
        evidenceRef: stale.evidenceRef,
        sourceDecisionRef: current.sourceDecisionEdgeId ?? current.id
      },
      createdAt: now
    }))
  );
};

const budgetCandidates = (
  candidates: readonly RankedActivationCandidate[],
  maxIncluded: number
): readonly RankedActivationCandidate[] => {
  const includedIds = new Set(candidates
    .filter((candidate) => candidate.exclusion === undefined)
    .sort((left, right) => right.totalScore - left.totalScore || left.id.localeCompare(right.id))
    .slice(0, maxIncluded)
    .map((candidate) => candidate.id));

  return candidates.map((candidate) => {
    if (candidate.exclusion !== undefined || includedIds.has(candidate.id)) {
      return candidate;
    }

    return {
      ...candidate,
      exclusion: {
        reason: "over_budget",
        explanation: `Decision packet budget keeps the top ${maxIncluded} activation candidates.`
      }
    };
  });
};

const makeRepositories = (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
) => {
  const scopedDecisions = fixture.decisions.filter((decision) =>
    decisionAppliesToCase(decision, testCase)
  );
  const sourceClaims = scopedDecisions.map(toSourceClaim);
  const sourceEdges = sourceClaimEdgesFor(scopedDecisions);
  const sourceDecisionEdges = scopedDecisions
    .map(toSourceDecisionEdge)
    .filter((edge): edge is SourceDecisionEdge => edge !== undefined);
  const memoryRecords = scopedDecisions
    .filter((decision) => decision.status === currentDecisionStatus)
    .map(toMemoryRecord);

  return {
    memoryRepository: {
      async listActiveMemory(): Promise<MemoryRecord[]> {
        return memoryRecords;
      },
      async listAntiMemoryForProject(): Promise<[]> {
        return [];
      }
    },
    sourceRepository: {
      async listClaimsForProject(): Promise<SourceClaim[]> {
        return sourceClaims;
      },
      async listSourceClaimEdgesForClaim(sourceClaimId: SourceClaim["id"]): Promise<SourceClaimEdge[]> {
        return sourceEdges.filter((edge) =>
          edge.fromSourceClaimId === sourceClaimId || edge.toSourceClaimId === sourceClaimId
        );
      },
      async listSourceDecisionEdgesForClaim(
        sourceClaimId: SourceDecisionEdge["sourceClaimId"]
      ): Promise<SourceDecisionEdge[]> {
        return sourceDecisionEdges.filter((edge) => edge.sourceClaimId === sourceClaimId);
      }
    },
    retrievalRepository: {
      async searchLexical(): Promise<[]> {
        return [];
      }
    }
  };
};

const decisionAppliesToCase = (
  decision: DecisionPacketRow,
  testCase: DecisionPacketCase
): boolean => {
  if (
    decision.id === testCase.expectedDecisionId ||
    testCase.staleDecisionIds.includes(decision.id) ||
    testCase.rejectedDecisionIds.includes(decision.id)
  ) {
    return true;
  }

  if (decision.taskScopes.length === 0) {
    return true;
  }

  const taskTokens = new Set(scopeTokens(testCase.task));

  return decision.taskScopes.some((scope) =>
    scopeTokens(scope).every((token) => taskTokens.has(token))
  );
};

const scopeTokens = (
  value: string
): readonly string[] => [...value.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)]
  .map((match) => match[0])
  .filter((token) => token.length > 0);

const weakMatchStopwords = new Set([
  "about",
  "after",
  "before",
  "coding",
  "codex",
  "could",
  "current",
  "create",
  "decision",
  "does",
  "from",
  "governed",
  "have",
  "into",
  "should",
  "store",
  "task",
  "that",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "without"
]);

const meaningfulTokens = (
  value: string
): readonly string[] => scopeTokens(value)
  .filter((token) => token.length >= 4 && !weakMatchStopwords.has(token));

const stronglyMatchesTask = (
  decision: DecisionPacketRow,
  testCase: DecisionPacketCase
): boolean => {
  const taskTokens = new Set(meaningfulTokens(testCase.task));
  const decisionTokens = meaningfulTokens([
    decision.title,
    decision.statement,
    ...decision.taskScopes
  ].join(" "));

  return decisionTokens.some((token) => taskTokens.has(token));
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const includedDecisionRows = (
  fixture: DecisionPacketEvalFixture,
  brief: ExecutionBrief
): readonly DecisionPacketRow[] =>
  unique([
    ...brief.includedContext
      .filter((item) => item.subjectType === "source_claim")
      .map((item) => item.subjectId),
    ...brief.sourceClaimsUsed
  ])
    .map((sourceClaimId) => rowForSourceClaim(fixture.decisions, sourceClaimId))
    .filter((decision): decision is DecisionPacketRow => decision !== undefined);

const includedMemoryRows = (
  fixture: DecisionPacketEvalFixture,
  brief: ExecutionBrief
): readonly DecisionPacketRow[] =>
  brief.memoryRecordsUsed
    .map((memoryRef) => rowForMemoryRef(fixture.decisions, memoryRef))
    .filter((decision): decision is DecisionPacketRow => decision !== undefined);

const excludedDecisionIds = (
  fixture: DecisionPacketEvalFixture,
  brief: ExecutionBrief,
  expectedIds: readonly string[]
): readonly string[] => {
  const expected = new Set(expectedIds);

  return unique(brief.explicitExclusions
    .filter((item) => item.subjectType === "source_claim")
    .map((item) => rowForSourceClaim(fixture.decisions, item.subjectId)?.id)
    .filter((id): id is string => id !== undefined && expected.has(id)));
};

const rejectedRows = (
  fixture: DecisionPacketEvalFixture,
  rejectedDecisionIds: readonly string[]
): readonly DecisionPacketRow[] => {
  const rejected = new Set(rejectedDecisionIds);

  return fixture.decisions.filter((decision) =>
    decision.status === "rejected" && rejected.has(decision.id)
  );
};

const taskStandardDecisionsFor = (
  decisions: readonly DecisionPacketRow[]
): readonly DecisionPacketTaskStandard[] => decisions
  .filter((decision) => decision.taskScopes.length > 0)
  .map((decision): DecisionPacketTaskStandard => ({
    memoryRecordId: `memory:decision:${decision.id}`,
    key: `decision-packet:${decision.id}`,
    sourceRefs: unique([decision.sourceClaimId, decision.evidenceRef]),
    mechanism:
      `Task scopes (${decision.taskScopes.join(", ")}) activate this governed decision for matching coding work.`,
    krnImplication: "DecisionPacket should expose this standard before Codex starts implementation.",
    decision: decision.statement,
    consumer: "decision-packet-eval",
    falsifier: decision.falsifier,
    validFrom: now,
    doesNotProve: decision.doesNotProve
  }));

export const buildDecisionPacketWithEngine = async (
  fixture: DecisionPacketEvalFixture,
  testCase: DecisionPacketCase
): Promise<DecisionPacket> => {
  const repositories = makeRepositories(fixture, testCase);
  const retrieved = await retrieveActivationCandidates({
    taskContract: taskContractFor(testCase),
    limits: {
      memory: fixture.topK,
      source: fixture.decisions.length,
      search: 0,
      antiMemory: 0
    },
    repositories
  });
  const filtered = applyActivationFilters({
    candidates: retrieved.candidates,
    antiMemoryRecords: retrieved.antiMemoryRecords,
    minimumSourceAuthority: "medium",
    now
  });
  const budgeted = budgetCandidates(filtered.candidates, fixture.topK);
  const observationPrefix = observationPrefixFor(testCase);
  const contextAssembly = assembleContext({
    id: `context-assembly:${testCase.id}`,
    harnessPlanId: `harness-plan:${testCase.id}`,
    candidates: budgeted,
    ...(observationPrefix === undefined ? {} : { observationPrefix }),
    tokenBudget: 4_000,
    createdAt: now,
    metadata: {
      evalCaseId: testCase.id,
      activationCandidateCount: retrieved.candidates.length
    }
  });
  const evidenceContract = evidenceContractFor(testCase);
  const brief = createExecutionBrief({
    taskContract: taskContractFor(testCase),
    contextAssembly,
    capabilityPlan: capabilityPlanFor(testCase),
    evidenceContract,
    nextAction: "Use the governed decision packet before coding."
  });
  const decisionsById = decisionById(fixture.decisions);
  const sourceRows = includedDecisionRows(fixture, brief);
  const memoryRows = includedMemoryRows(fixture, brief);
  const governingDecisionIds = unique([
    ...sourceRows.map((decision) => decision.id),
    ...memoryRows.map((decision) => decision.id)
  ]);
  const governingRows = governingDecisionIds
    .map((id) => decisionsById.get(id))
    .filter((decision): decision is DecisionPacketRow => decision !== undefined);
  const supportedGoverningRows = governingRows.filter((decision) =>
    stronglyMatchesTask(decision, testCase)
  );
  const supportedGoverningDecisionIds = supportedGoverningRows.map((decision) => decision.id);
  const sourceClaimIds = unique(supportedGoverningRows.map((decision) => decision.sourceClaimId));
  const caveatedSourceClaimIds = unique(supportedGoverningRows
    .filter((decision) => !nonEmpty(decision.sourceDecisionEdgeId))
    .map((decision) => decision.sourceClaimId));
  const sourceDecisionEdgeIds = unique(supportedGoverningRows.flatMap((decision) =>
    nonEmpty(decision.sourceDecisionEdgeId) ? [decision.sourceDecisionEdgeId] : []
  ));
  const sourceDecisionTargets = supportedGoverningRows.flatMap((decision) =>
    nonEmpty(decision.sourceDecisionEdgeId)
      ? [{
          targetType: "architecture_decision" as const,
          targetId: decision.id,
          sourceDecisionEdgeIds: [decision.sourceDecisionEdgeId]
        }]
      : []
  );
  const staleDecisionIds = excludedDecisionIds(fixture, brief, testCase.staleDecisionIds);
  const rejectedPathIds = excludedDecisionIds(fixture, brief, testCase.rejectedDecisionIds);
  const sourceRejectionIds = unique(rejectedRows(fixture, rejectedPathIds).flatMap((decision) =>
    nonEmpty(decision.sourceRejectionId) ? [decision.sourceRejectionId] : []
  ));
  const severeExpectedIds = new Set([
    ...testCase.staleDecisionIds,
    ...testCase.rejectedDecisionIds
  ]);
  const evidenceGaps = supportedGoverningDecisionIds.length === 0
    ? [{
        id: `evidence-gap:${testCase.id}:no-governing-decision`,
        reason: "No current governed decision matched this task strongly enough to guide Codex.",
        verificationRequired:
          "Capture or promote source-backed decision evidence before turning this task into governing context."
      }]
    : caveatedSourceClaimIds.map((sourceClaimId) => ({
        id: `evidence-gap:${testCase.id}:caveated-source-authority:${sourceClaimId}`,
        reason:
          `SourceClaim ${sourceClaimId} is included without current decision-linked authority.`,
        verificationRequired:
          "Link the claim to a current SourceDecisionEdge or remove it from governing packet context."
      }));
  const severeStaleAuthorityIds = supportedGoverningDecisionIds.filter((id) =>
    severeExpectedIds.has(id)
  );
  const sourceConsensusBase = {
    sourceClaimIds,
    caveatedSourceClaimIds,
    sourceDecisionEdgeIds,
    sourceDecisionTargets,
    staleDecisionIds,
    rejectedPathIds,
    sourceRejectionIds
  };
  const sourceConsensus = buildDecisionPacketSourceConsensus({
    ...sourceConsensusBase,
    conflictedDecisionIds: severeStaleAuthorityIds,
    evidenceGapIds: evidenceGaps.map((gap) => gap.id)
  });

  return {
    formatVersion: decisionPacketFormatVersion,
    governingDecisionIds: supportedGoverningDecisionIds,
    governingStatements: unique(supportedGoverningRows.map((decision) => decision.statement).filter(nonEmpty)),
    taskStandardDecisions: taskStandardDecisionsFor(supportedGoverningRows),
    sourceClaimIds,
    caveatedSourceClaimIds,
    sourceDecisionEdgeIds,
    sourceDecisionTargets,
    sourceRejectionIds,
    caveatedMemoryRefs: [],
    memoryRefs: unique(memoryRows
      .filter((decision) => supportedGoverningDecisionIds.includes(decision.id))
      .map((decision) => `memory:decision:${decision.id}`)),
    staleDecisionIds,
    staleKnowledgeIds: [],
    noiseKnowledgeIds: [],
    unknownKnowledgeIds: [],
    rejectedPathIds,
    falsifiers: unique(supportedGoverningRows.map((decision) => decision.falsifier).filter(nonEmpty)),
    verificationCommands: evidenceContract.commands.map((command) => command.command),
    evidenceGaps,
    sourceConsensus,
    abstentionScore: buildDecisionPacketAbstentionScore({
      governingDecisionIds: supportedGoverningDecisionIds,
      sourceConsensus
    }),
    doesNotProve: unique(supportedGoverningRows.map((decision) => decision.doesNotProve).filter(nonEmpty)),
    nonProofs: [
      "packet quality only",
      "does not prove live Codex obedience",
      "does not prove source truth"
    ],
    noiseDecisionIds: supportedGoverningDecisionIds.filter((id) => id !== testCase.expectedDecisionId),
    severeStaleAuthorityIds,
    brief: {
      includedContextCount: brief.includedContext.length,
      observationPrefixCount: brief.observationPrefix.length,
      explicitExclusionCount: brief.explicitExclusions.length,
      sourceClaimUseCount: brief.sourceClaimsUsed.length,
      memoryRecordUseCount: brief.memoryRecordsUsed.length
    }
  };
};
