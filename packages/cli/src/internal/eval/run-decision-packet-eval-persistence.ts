import type {
  CreateEvalFeedbackDeltaOnceInput,
  CreateEvalFeedbackDeltaOnceResult,
  HarnessRunRepository
} from "@krn/core/repositories/internal";

import type {
  DecisionPacketEvalCandidateReadback,
  DecisionPacketEvalResult
} from "./decision-packet-eval-shape.js";

export interface BuildDecisionPacketEvalFailurePersistenceInput {
  result: DecisionPacketEvalResult;
  executionRunId: string;
  projectId: string;
  evalCommand: string;
  eventSequence: number;
  now: string;
}

export interface PersistDecisionPacketEvalFailuresInput {
  result: DecisionPacketEvalResult;
  executionRunId: string;
  projectId: string;
  evalCommand: string;
  now: string;
  harnessRunRepository: Pick<
    HarnessRunRepository,
    "getHarnessRunByExecutionRunId"
  > & Partial<Pick<HarnessRunRepository, "createEvalFeedbackDeltaOnce">>;
}

const decisionPacketEvalExecutionIdentity = (input: {
  executionRunId: string;
  projectId: string;
  result: Pick<DecisionPacketEvalResult, "kind" | "fixtureVersion">;
}): string => [
  input.projectId,
  input.executionRunId,
  input.result.kind,
  input.result.fixtureVersion
].join(":");

const candidateObservedSignal = (
  candidate: DecisionPacketEvalCandidateReadback
): Record<string, unknown> => ({
  qualityLabel: candidate.metadata["qualityLabel"] ?? "unknown",
  comparisonOutcome: candidate.metadata["comparisonOutcome"] ?? "unknown",
  scores: candidate.metadata["scores"] ?? {},
  reasons: candidate.metadata["reasons"] ?? []
});

const candidateWithPersistenceMetadata = (
  candidate: DecisionPacketEvalCandidateReadback,
  projectId: string
) => ({
  ...candidate,
  projectId,
  metadata: {
    ...candidate.metadata,
    caseId: candidate.caseId,
    failureClass: candidate.failureClass,
    evidenceRefs: [...candidate.evidenceRefs],
    observedSignal: candidateObservedSignal(candidate),
    doesNotProve: candidate.doesNotProve
  }
});

const reviewFindingFor = (
  candidate: DecisionPacketEvalCandidateReadback
) => ({
  severity: candidate.failureClass === "stale_authority" ? "high" as const : "medium" as const,
  message: `${candidate.title}: observed ${JSON.stringify(candidateObservedSignal(candidate))}; expected ${candidate.expectedSignal}`
});

export const buildDecisionPacketEvalFailurePersistenceInput = (
  input: BuildDecisionPacketEvalFailurePersistenceInput
): CreateEvalFeedbackDeltaOnceInput | undefined => {
  const projectId = input.projectId.trim();
  const executionRunId = input.executionRunId.trim();
  const evalCommand = input.evalCommand.trim();

  if (input.result.status === "pass") {
    return undefined;
  }

  if (projectId.length === 0) {
    throw new Error("DecisionPacket eval failure persistence requires project id");
  }

  if (executionRunId.length === 0) {
    throw new Error("DecisionPacket eval failure persistence requires execution run id");
  }

  if (evalCommand.length === 0) {
    throw new Error("DecisionPacket eval failure persistence requires eval command");
  }

  if (input.result.evalCandidates.length === 0) {
    throw new Error("DecisionPacket eval failed without typed eval candidates");
  }

  const executionIdentity = decisionPacketEvalExecutionIdentity({
    executionRunId,
    projectId,
    result: input.result
  });
  const doesNotProve = input.result.proof.doesNotProve.join(" ");
  const evidenceRefs = [...new Set(input.result.evalCandidates.flatMap((candidate) => [
    ...candidate.evidenceRefs,
    ...candidate.sourceEvidence
  ]))];
  const evalCandidates = input.result.evalCandidates.map((candidate) =>
    candidateWithPersistenceMetadata(candidate, projectId)
  );

  return {
    executionRunId,
    projectId,
    executionIdentity,
    evidence: {
      status: "captured",
      changedFiles: [],
      commands: [{
        command: evalCommand,
        status: "failed",
        provenance: "operator_reported",
        assertedBy: "krn-decision-packet-eval",
        capturedAt: input.now,
        doesNotProve
      }],
      diffRisk: "low",
      reviewBurden: "Review the deterministic eval failure classification and evidence refs before any durable remediation.",
      rollbackPath: "Reject the review assessment or feedback candidate; no MemoryRecord or SourceClaim is changed by this persistence.",
      event: {
        sequence: input.eventSequence,
        type: "eval.failure.captured",
        message: "DecisionPacket eval failure captured for review",
        payload: {
          evalExecutionIdentity: executionIdentity,
          projectId,
          candidateCount: evalCandidates.length,
          evidenceRefCount: evidenceRefs.length
        }
      },
      metadata: {
        evalExecutionIdentity: executionIdentity,
        projectId,
        evalKind: input.result.kind,
        fixtureVersion: input.result.fixtureVersion,
        candidateCount: evalCandidates.length,
        evidenceRefs,
        doesNotProve
      }
    },
    review: {
      status: "pending",
      reviewer: "krn-decision-packet-eval",
      summary: `DecisionPacket eval failed with ${evalCandidates.length} reviewable candidate(s).`,
      findings: input.result.evalCandidates.map(reviewFindingFor),
      metadata: {
        evalExecutionIdentity: executionIdentity,
        projectId,
        resultStatus: input.result.status,
        metrics: input.result.metrics,
        doesNotProve
      }
    },
    feedback: {
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates,
      metadata: {
        evalExecutionIdentity: executionIdentity,
        projectId,
        evalKind: input.result.kind,
        fixtureVersion: input.result.fixtureVersion,
        candidateIds: evalCandidates.map((candidate) => candidate.id),
        observedSignal: input.result.metrics,
        doesNotProve
      }
    }
  };
};

export const persistDecisionPacketEvalFailures = async (
  input: PersistDecisionPacketEvalFailuresInput
): Promise<CreateEvalFeedbackDeltaOnceResult | undefined> => {
  const aggregate = await input.harnessRunRepository.getHarnessRunByExecutionRunId(
    input.executionRunId
  );

  if (aggregate === undefined) {
    throw new Error(`No persisted harness run found for --run-id ${input.executionRunId}`);
  }

  const runProjectId = aggregate.taskContract.projectId ?? aggregate.operatorIntent.projectId;

  if (runProjectId !== input.projectId) {
    throw new Error(
      `Eval project mismatch for --run-id ${input.executionRunId}: expected ${input.projectId}, stored ${runProjectId ?? "none"}`
    );
  }

  if (input.harnessRunRepository.createEvalFeedbackDeltaOnce === undefined) {
    throw new Error("Eval failure persistence requires createEvalFeedbackDeltaOnce repository support");
  }

  const persistenceInput = buildDecisionPacketEvalFailurePersistenceInput({
    result: input.result,
    executionRunId: input.executionRunId,
    projectId: input.projectId,
    evalCommand: input.evalCommand,
    eventSequence: aggregate.runEvents.reduce(
      (max, event) => Math.max(max, event.sequence),
      0
    ) + 1,
    now: input.now
  });

  if (persistenceInput === undefined) {
    return undefined;
  }

  return input.harnessRunRepository.createEvalFeedbackDeltaOnce(persistenceInput);
};
