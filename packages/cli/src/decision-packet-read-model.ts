import type {
  CandidateReviewability,
  ContextSubjectType,
  EvidenceCommand,
  EvidenceCommandReadback,
  FeedbackCandidateProposalKind,
  SourceAuthorityLabel,
  SourceUsefulnessOutcome,
  TargetEvidence
} from "@krn/core";
import type { ActivationRetrievalDiagnostics } from "@krn/harness";

import type { ProjectResolution } from "./database-runtime.js";
import type { BrainKnowledgePlanSelection } from "./brain-knowledge-selection.js";

export type DecisionPacketReadModelOutputFormat = "text" | "json";

export interface DecisionPacketReadModelCommand {
  command: string;
  status: EvidenceCommand["status"];
  provenance: EvidenceCommandReadback["provenance"];
  doesNotProve: string;
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
  edgeKinds: string[];
  seedSourceClaimIds: string[];
  doesNotProve: string;
}

export interface DecisionPacketReadModelSourceDecisionSupportBoost {
  sourceDecisionEdgeIds: string[];
  confidence: string[];
  supportTypes: string[];
  doesNotProve: string;
}

export interface DecisionPacketReadModelActivationCandidate {
  id: string;
  kind: string;
  status: string;
  subjectType: string;
  subjectId: string;
  sourceAuthority: SourceAuthorityLabel;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  feedbackScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
  sourceClaimEdgeInfluence?: DecisionPacketReadModelSourceClaimEdgeInfluence;
  sourceDecisionSupportBoost?: DecisionPacketReadModelSourceDecisionSupportBoost;
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
    status: string;
    adapter: string;
    createdAt: string;
    updatedAt: string;
    projectResolution?: ProjectResolution;
  };
  task: {
    id: string;
    title: string;
    objective: string;
    status: string;
  };
  brainKnowledgeSelection?: BrainKnowledgePlanSelection;
  context: {
    status: string;
    inclusions: number;
    exclusions: number;
    inclusionDetails: DecisionPacketReadModelContextInclusion[];
    exclusionDetails: DecisionPacketReadModelContextExclusion[];
    activationDiagnostics?: ActivationRetrievalDiagnostics;
    activationTrace?: DecisionPacketReadModelActivationTrace;
  };
  evidenceBundles: {
    id: string;
    status: string;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    changedFiles: DecisionPacketReadModelChangedFiles;
    commands: DecisionPacketReadModelCommand[];
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
    brainKnowledgeUsefulnessOutcomes: DecisionPacketReadModelBrainKnowledgeUsefulnessOutcome[];
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
  doesNotProve: string;
}

export interface DecisionPacketReadModelBrainKnowledgeUsefulnessOutcome {
  brainKnowledgeId: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export type DecisionPacketReadModelRun = DecisionPacketReadModel["run"];
export type DecisionPacketReadModelTask = DecisionPacketReadModel["task"];
export type DecisionPacketReadModelContext = DecisionPacketReadModel["context"];
export type DecisionPacketReadModelEvidenceBundle = DecisionPacketReadModel["evidenceBundles"][number];
export type DecisionPacketReadModelReviewAssessment = DecisionPacketReadModel["reviewAssessments"][number];
export type DecisionPacketReadModelFeedbackDelta = DecisionPacketReadModel["feedbackDeltas"][number];
export type DecisionPacketReadModelProof = DecisionPacketReadModel["proof"];

export const decisionPacketReadModelProves = [
  "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
  "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
  "this readback surface exposes no write action"
];

export const decisionPacketReadModelDoesNotProve = [
  "commands were executed by this readback command",
  "activation scoring quality or production graph retrieval quality",
  "memory quality, source truth, review correctness, or product readiness",
  "Memory Core mutation"
];
