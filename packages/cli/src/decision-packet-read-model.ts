import type {
  CandidateReviewability,
  CommandOutputArtifactIntegrityFailureReason,
  ContextSubjectType,
  DecisionPacketBindingReadback,
  EvidenceContract,
  EvidenceContractActivationDecision,
  EvidenceCommand,
  EvidenceCommandReadback,
  ExecutionRunStatus,
  FeedbackCandidateProposalKind,
  FeedbackRecommendationReadback,
  ProjectStandardDecisionReadback,
  SourceAuthorityLabel,
  SourceClaimEdgeKind,
  SourceClaimAuthorityReason,
  SourceClaimAuthorityStatus,
  SourceDecisionTargetType,
  SourceUsefulnessOutcome,
  TaskContractStatus,
  TargetEvidence
} from "@krn/core";
import type { ActivationRetrievalDiagnostics } from "@krn/harness";

import type { ProjectResolution } from "./database-runtime.js";
import type { KnowledgePlanSelection } from "./knowledge-selection.js";

export type DecisionPacketReadModelOutputFormat = "text" | "json";
export type DecisionPacketReadModelEvidenceFreshness =
  | "fresh_current"
  | "stale_historical"
  | "unknown";

export interface DecisionPacketReadModelCommand {
  command: string;
  status: EvidenceCommand["status"];
  provenance: EvidenceCommandReadback["provenance"];
  exitCode?: number;
  outputRef?: string;
  artifactIntegrity?: "valid" | "invalid" | "unresolved";
  artifactIntegrityReason?: CommandOutputArtifactIntegrityFailureReason;
  capturedAt?: string;
  assertedBy?: string;
  doesNotProve: string;
}

export interface DecisionPacketReadModelCommandOutputStreamArtifact {
  storedBytesSha256: string;
  storedByteCount: number;
  totalByteCount: number;
  truncated: boolean;
}

export interface DecisionPacketReadModelCommandOutputArtifact {
  outputRef: string;
  integrity: "valid" | "invalid";
  integrityReason?: CommandOutputArtifactIntegrityFailureReason;
  exitCode: number;
  startedAt: string;
  completedAt: string;
  stdout: DecisionPacketReadModelCommandOutputStreamArtifact;
  stderr: DecisionPacketReadModelCommandOutputStreamArtifact;
}

export interface DecisionPacketReadModelChangedFiles {
  all: string[];
  classification: {
    source: "metadata" | "not_recorded";
    intended: string[];
    unrelated: string[];
    unknown: string[];
  };
}

export interface DecisionPacketReadModelContextInclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  sourceAuthority: SourceAuthorityLabel;
  tokenEstimate?: number;
}

export interface DecisionPacketReadModelContextExclusion {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  sourceAuthority: SourceAuthorityLabel;
  score?: number;
}

export interface DecisionPacketReadModelSourceClaimEdgeInfluence {
  edgeIds: string[];
  edgeKinds: SourceClaimEdgeKind[];
  missingRelationSupportEdgeIds?: string[];
  seedSourceClaimIds: string[];
  doesNotProve: string;
}

export interface DecisionPacketReadModelSourceDecisionSupportBoost {
  sourceDecisionEdgeIds: string[];
  sourceDecisionIds?: string[];
  targets: DecisionPacketReadModelSourceDecisionSupportTarget[];
  confidence: string[];
  supportTypes: string[];
  doesNotProve: string;
}

export interface DecisionPacketReadModelPendingAntiMemoryReview {
  antiMemoryCandidateIds: string[];
  feedbackDeltaIds: string[];
  subjectRefs: string[];
  doesNotProve: string;
}

export interface DecisionPacketReadModelSourceDecisionSupportTarget {
  sourceDecisionEdgeId: string;
  targetType: SourceDecisionTargetType;
  targetId: string;
}

export interface DecisionPacketReadModelActivationCandidate {
  id: string;
  kind: string;
  status: string;
  subjectType: string;
  subjectId: string;
  sourceAuthority: SourceAuthorityLabel;
  sourceClaimAuthorityStatus?: SourceClaimAuthorityStatus;
  sourceClaimAuthorityReasons?: SourceClaimAuthorityReason[];
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  feedbackScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
  projectStandardDecision?: ProjectStandardDecisionReadback;
  sourceClaimEdgeInfluence?: DecisionPacketReadModelSourceClaimEdgeInfluence;
  sourceDecisionSupportBoost?: DecisionPacketReadModelSourceDecisionSupportBoost;
  sourceRejectionIds?: string[];
  pendingAntiMemoryReview?: DecisionPacketReadModelPendingAntiMemoryReview;
}

export interface DecisionPacketReadModelActivationDecision {
  id: string;
  subjectType: string;
  subjectId: string;
  decision: string;
  reason: string;
  score?: number;
  expectedDecisionImpact?: string;
  retrievalCandidateId?: string;
  antiMemoryRecordId?: string;
}

export interface DecisionPacketReadModelActivationTrace {
  retrievalRunId: string;
  candidates: DecisionPacketReadModelActivationCandidate[];
  decisions: DecisionPacketReadModelActivationDecision[];
}

export interface DecisionPacketReadModel {
  kind: "krn.decisionPacket.readModel.v1";
  access: "read_only";
  mutation: "none";
  run: {
    id: string;
    status: ExecutionRunStatus;
    lifecycleRevision: number;
    adapter: string;
    createdAt: string;
    updatedAt: string;
    projectResolution?: ProjectResolution;
  };
  task: {
    id: string;
    projectId: string | null;
    title: string;
    objective: string;
    constraints: string[];
    nonGoals: string[];
    acceptance: string[];
    status: TaskContractStatus;
  };
  nextAction?: string;
  knowledgeSelection?: KnowledgePlanSelection;
  context: {
    status: string;
    inclusions: number;
    exclusions: number;
    inclusionDetails: DecisionPacketReadModelContextInclusion[];
    exclusionDetails: DecisionPacketReadModelContextExclusion[];
    activationDiagnostics?: ActivationRetrievalDiagnostics;
    activationTrace?: DecisionPacketReadModelActivationTrace;
  };
  evidenceContractActivation: EvidenceContractActivationDecision;
  evidenceContract?: EvidenceContract;
  evidenceBundles: {
    id: string;
    executionRunId: string;
    createdAt: string;
    updatedAt: string;
    status: string;
    freshness: DecisionPacketReadModelEvidenceFreshness;
    packetChecksum?: string;
    packetBinding: DecisionPacketBindingReadback;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    changedFiles: DecisionPacketReadModelChangedFiles;
    commands: DecisionPacketReadModelCommand[];
    commandOutputArtifacts: DecisionPacketReadModelCommandOutputArtifact[];
    targetEvidence?: TargetEvidence;
  }[];
  reviewAssessments: {
    id: string;
    status: string;
    reviewer: string;
  }[];
  feedbackDeltas: {
    id: string;
    status: string;
    memoryRecordMutation: "none";
    candidateCounts: {
      memory: number;
      source: number;
      sourceClaim: number;
      sourceDecision: number;
      antiMemory: number;
      eval: number;
      observation: number;
    };
    candidates: DecisionPacketReadModelCandidate[];
    sourceUsefulnessOutcomes: DecisionPacketReadModelSourceUsefulnessOutcome[];
    knowledgeUsefulnessOutcomes: DecisionPacketReadModelKnowledgeUsefulnessOutcome[];
  }[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export interface DecisionPacketReadModelCandidate {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string;
  summary: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: string[];
}

export interface DecisionPacketReadModelSourceUsefulnessOutcome {
  sourceClaimId?: string;
  sourceDecisionId?: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  recommendation: FeedbackRecommendationReadback;
  doesNotProve: string;
}

export interface DecisionPacketReadModelKnowledgeUsefulnessOutcome {
  knowledgeId: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  recommendation: FeedbackRecommendationReadback;
  doesNotProve: string;
}

export type DecisionPacketReadModelRun = DecisionPacketReadModel["run"];
export type DecisionPacketReadModelTask = DecisionPacketReadModel["task"];
export type DecisionPacketReadModelContext = DecisionPacketReadModel["context"];
export type DecisionPacketReadModelEvidenceBundle = DecisionPacketReadModel["evidenceBundles"][number];
export type DecisionPacketReadModelReviewAssessment = DecisionPacketReadModel["reviewAssessments"][number];
export type DecisionPacketReadModelFeedbackDelta = DecisionPacketReadModel["feedbackDeltas"][number];
export type DecisionPacketReadModelProof = DecisionPacketReadModel["proof"];
