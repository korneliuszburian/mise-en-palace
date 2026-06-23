import type {
  AntiMemoryCandidate,
  EvalCandidate,
  ReflectionPolicyCandidateProposal,
  ReflectionRecord,
  SourceClaim
} from "@krn/core";
import {
  assessReflectionOutputContract,
  buildReflectionCandidateGenerationPlan
} from "@krn/core";

import type {
  MemoryRepository
} from "../repositories/memoryRepository.js";
import type {
  SourceRepository
} from "../repositories/sourceRepository.js";

export type ReflectionCandidateWriterStatus = "ready" | "blocked";

export type UnsupportedReflectionCandidateKind =
  | "policy_candidate"
  | "source_claim_candidate";

export interface UnsupportedReflectionCandidate {
  kind: UnsupportedReflectionCandidateKind;
  index: number;
  reason: string;
  proposal:
    | ReflectionPolicyCandidateProposal
    | ReflectionRecord["output"]["sourceClaimCandidates"][number];
}

export interface WriteReflectionCandidatesInput {
  reflectionRecord: ReflectionRecord;
  sourceArtifactId?: string;
  now(): string;
  createId(prefix: string): string;
  memoryRepository: Pick<MemoryRepository, "createMemoryCandidate" | "createAntiMemoryCandidate">;
  sourceRepository?: Pick<SourceRepository, "createSourceClaim">;
}

export interface WriteReflectionCandidatesResult {
  status: ReflectionCandidateWriterStatus;
  blockedReasons: string[];
  memoryCandidates: Awaited<ReturnType<MemoryRepository["createMemoryCandidate"]>>[];
  antiMemoryCandidates: AntiMemoryCandidate[];
  sourceClaims: SourceClaim[];
  evalCandidates: EvalCandidate[];
  unsupportedCandidates: UnsupportedReflectionCandidate[];
}

const reflectionMetadata = (
  reflectionRecord: ReflectionRecord,
  proposalMetadata: Record<string, unknown>
): Record<string, unknown> => ({
  ...proposalMetadata,
  reflectionRecordId: reflectionRecord.id,
  reflectionOutputId: reflectionRecord.output.id,
  candidateWriter: "reflection"
});

const reflectionCandidateMetadata = (
  reflectionRecord: ReflectionRecord,
  proposal: {
    metadata: Record<string, unknown>;
    evidence: ReflectionRecord["output"]["memoryCandidates"][number]["evidence"];
  }
): Record<string, unknown> => reflectionMetadata(reflectionRecord, {
  ...proposal.metadata,
  reflectionCandidateEvidence: proposal.evidence
});

export const writeReflectionCandidates = async (
  input: WriteReflectionCandidatesInput
): Promise<WriteReflectionCandidatesResult> => {
  const assessment = assessReflectionOutputContract(input.reflectionRecord.output);

  if (!assessment.candidateOnly) {
    return {
      status: "blocked",
      blockedReasons: assessment.violations.map((violation) =>
        `${violation.path}:${violation.reason}`
      ),
      memoryCandidates: [],
      antiMemoryCandidates: [],
      sourceClaims: [],
      evalCandidates: [],
      unsupportedCandidates: []
    };
  }

  const plan = buildReflectionCandidateGenerationPlan(input.reflectionRecord.output);

  if (plan.status === "blocked") {
    return {
      status: "blocked",
      blockedReasons: plan.blockedReasons,
      memoryCandidates: [],
      antiMemoryCandidates: [],
      sourceClaims: [],
      evalCandidates: [],
      unsupportedCandidates: []
    };
  }

  const memoryCandidates = [];
  for (const proposal of input.reflectionRecord.output.memoryCandidates) {
    memoryCandidates.push(await input.memoryRepository.createMemoryCandidate({
      projectId: input.reflectionRecord.scope.projectId,
      ...(input.reflectionRecord.scope.executionRunId === undefined
        ? {}
        : { executionRunId: input.reflectionRecord.scope.executionRunId }),
      proposedBy: "reflection",
      kind: proposal.kind,
      status: "candidate",
      summary: proposal.summary,
      body: proposal.body,
      owner: proposal.owner,
      confidence: proposal.confidence,
      applicationGuidance: proposal.applicationGuidance,
      ...(proposal.invalidationRule === undefined
        ? {}
        : { invalidationRule: proposal.invalidationRule }),
      ...(proposal.sourceClaimIds === undefined ? {} : { sourceClaimIds: proposal.sourceClaimIds }),
      sourceLineage: proposal.sourceLineage,
      isUserPreference: proposal.isUserPreference,
      validFrom: proposal.validFrom,
      ...(proposal.validUntil === undefined ? {} : { validUntil: proposal.validUntil }),
      metadata: reflectionCandidateMetadata(input.reflectionRecord, proposal)
    }));
  }

  const antiMemoryCandidates = [];
  for (const proposal of input.reflectionRecord.output.antiMemoryCandidates) {
    antiMemoryCandidates.push(await input.memoryRepository.createAntiMemoryCandidate({
      projectId: input.reflectionRecord.scope.projectId,
      ...(input.reflectionRecord.scope.executionRunId === undefined
        ? {}
        : { executionRunId: input.reflectionRecord.scope.executionRunId }),
      proposedBy: "reflection",
      key: proposal.key,
      status: "candidate",
      ...(proposal.reason === undefined ? {} : { reason: proposal.reason }),
      invalidatedBySourceClaimIds: proposal.invalidatedBySourceClaimIds,
      summary: proposal.summary,
      body: proposal.body,
      owner: proposal.owner,
      confidence: proposal.confidence,
      ...(proposal.appliesTo === undefined ? {} : { appliesTo: proposal.appliesTo }),
      ...(proposal.mayRevisitWhen === undefined
        ? {}
        : { mayRevisitWhen: proposal.mayRevisitWhen }),
      sourceLineage: proposal.sourceLineage,
      metadata: reflectionCandidateMetadata(input.reflectionRecord, proposal)
    }));
  }

  const unsupportedCandidates: UnsupportedReflectionCandidate[] = [];
  const sourceClaims: SourceClaim[] = [];
  input.reflectionRecord.output.sourceClaimCandidates.forEach((_proposal, index) => {
    if (input.sourceRepository === undefined || input.sourceArtifactId === undefined) {
      unsupportedCandidates.push({
        kind: "source_claim_candidate",
        index,
        reason: "source_claim_candidate_requires_source_repository_and_source_artifact",
        proposal: _proposal
      });
    }
  });

  if (input.sourceRepository !== undefined && input.sourceArtifactId !== undefined) {
    for (const proposal of input.reflectionRecord.output.sourceClaimCandidates) {
      sourceClaims.push(await input.sourceRepository.createSourceClaim({
        sourceArtifactId: input.sourceArtifactId,
        ...(input.reflectionRecord.scope.executionRunId === undefined
          ? {}
          : { executionRunId: input.reflectionRecord.scope.executionRunId }),
        claim: proposal.claim,
        mechanism: proposal.mechanism,
        krnImplication: proposal.krnImplication,
        doesNotProve: proposal.doesNotProve,
        trustTier: proposal.trustTier,
        supportType: proposal.supportType,
        consumer: proposal.consumer,
        ...(proposal.falsifier === undefined ? {} : { falsifier: proposal.falsifier }),
        ...(proposal.revisitWhen === undefined ? {} : { revisitWhen: proposal.revisitWhen }),
        status: "proposed",
        metadata: reflectionCandidateMetadata(input.reflectionRecord, proposal)
      }));
    }
  }

  input.reflectionRecord.output.policyCandidates.forEach((proposal, index) => {
    unsupportedCandidates.push({
      kind: "policy_candidate",
      index,
      reason: "policy_candidate_store_not_available",
      proposal
    });
  });

  const evalCandidates = input.reflectionRecord.output.evalCandidates.map((proposal): EvalCandidate => ({
    id: input.createId(`eval-candidate-${input.reflectionRecord.id}`),
    projectId: input.reflectionRecord.scope.projectId,
    status: "candidate",
    title: proposal.title,
    scenario: proposal.scenario,
    expectedSignal: proposal.expectedSignal,
    sourceEvidence: proposal.sourceEvidence,
    metadata: reflectionCandidateMetadata(input.reflectionRecord, proposal),
    createdAt: input.now()
  }));

  return {
    status: "ready",
    blockedReasons: [],
    memoryCandidates,
    antiMemoryCandidates,
    sourceClaims,
    evalCandidates,
    unsupportedCandidates
  };
};
