import type {
  CandidateReviewability,
  ContextSubjectType,
  EvidenceCommand,
  EvidenceCommandReadback,
  FeedbackCandidateProposalKind,
  SourceTrustTier,
  SourceUsefulnessOutcome,
  TargetEvidence
} from "@krn/core";
import type { ActivationRetrievalDiagnostics } from "@krn/harness";

import type { ProjectResolution } from "./database-runtime.js";
import type { RetainedPatternPlanSelection } from "./retained-pattern-selection.js";

export type RunReadbackOutputFormat = "text" | "json";

export interface RunReadbackCommandResource {
  command: string;
  status: EvidenceCommand["status"];
  provenance: EvidenceCommandReadback["provenance"];
  doesNotProve: string;
}

export interface RunReadbackChangedFilesResource {
  all: string[];
  classification: {
    source: "metadata" | "not_recorded";
    intended: string[];
    unrelated: string[];
    unknown: string[];
  };
}

export interface RunReadbackContextInclusionResource {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  expectedUse: string;
  trustTier: SourceTrustTier;
  tokenEstimate?: number;
}

export interface RunReadbackContextExclusionResource {
  subjectType: ContextSubjectType;
  subjectId: string;
  reason: string;
  explanation: string;
  trustTier: SourceTrustTier;
  score?: number;
}

export interface RunReadbackSourceClaimEdgeInfluenceResource {
  edgeIds: string[];
  edgeKinds: string[];
  seedSourceClaimIds: string[];
  doesNotProve: string;
}

export interface RunReadbackActivationCandidateResource {
  id: string;
  kind: string;
  status: string;
  subjectType: string;
  subjectId: string;
  trustTier: SourceTrustTier;
  lexicalScore?: number;
  vectorScore?: number;
  graphScore?: number;
  temporalScore?: number;
  contextRoiScore?: number;
  totalScore?: number;
  score?: number;
  reason: string;
  sourceClaimEdgeInfluence?: RunReadbackSourceClaimEdgeInfluenceResource;
}

export interface RunReadbackActivationDecisionResource {
  id: string;
  subjectType: string;
  subjectId: string;
  decision: string;
  reason: string;
  score?: number;
  expectedDecisionImpact?: string;
  retrievalCandidateId?: string;
}

export interface RunReadbackActivationTraceResource {
  retrievalRunId: string;
  candidates: RunReadbackActivationCandidateResource[];
  decisions: RunReadbackActivationDecisionResource[];
}

export interface RunReadbackResource {
  kind: "krn.run.readback.v1";
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
  retainedPatternSelection?: RetainedPatternPlanSelection;
  context: {
    status: string;
    inclusions: number;
    exclusions: number;
    inclusionDetails: RunReadbackContextInclusionResource[];
    exclusionDetails: RunReadbackContextExclusionResource[];
    activationDiagnostics?: ActivationRetrievalDiagnostics;
    activationTrace?: RunReadbackActivationTraceResource;
  };
  evidenceBundles: {
    id: string;
    status: string;
    diffRisk: string;
    reviewBurden: string;
    rollbackPath: string;
    changedFiles: RunReadbackChangedFilesResource;
    commands: RunReadbackCommandResource[];
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
    candidates: RunReadbackCandidateResource[];
    sourceUsefulnessOutcomes: RunReadbackSourceUsefulnessOutcomeResource[];
    patternUsefulnessOutcomes: RunReadbackPatternUsefulnessOutcomeResource[];
  }[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

export interface RunReadbackCandidateResource {
  kind: FeedbackCandidateProposalKind;
  id: string;
  status: string;
  summary: string;
  reviewability: CandidateReviewability;
  reviewabilityReasons: string[];
}

export interface RunReadbackSourceUsefulnessOutcomeResource {
  sourceClaimId?: string;
  sourceDecisionId?: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export interface RunReadbackPatternUsefulnessOutcomeResource {
  patternId: string;
  outcome: SourceUsefulnessOutcome;
  reason: string;
  evidenceRefs: string[];
  doesNotProve: string;
}

export type RunReadbackRunResource = RunReadbackResource["run"];
export type RunReadbackTaskResource = RunReadbackResource["task"];
export type RunReadbackContextResource = RunReadbackResource["context"];
export type RunReadbackEvidenceBundleResource = RunReadbackResource["evidenceBundles"][number];
export type RunReadbackReviewAssessmentResource = RunReadbackResource["reviewAssessments"][number];
export type RunReadbackFeedbackDeltaResource = RunReadbackResource["feedbackDeltas"][number];
export type RunReadbackProofResource = RunReadbackResource["proof"];

export const runReadbackProves = [
  "persisted run/evidence/review/feedback records can be read without ad hoc SQL",
  "persisted activation candidate scores and edge-influence metadata can be read without mutating state",
  "this readback surface exposes no write action"
];

export const runReadbackDoesNotProve = [
  "commands were executed by this readback command",
  "activation scoring quality or production graph retrieval quality",
  "memory quality, source truth, review correctness, or product readiness",
  "Memory Core mutation"
];
