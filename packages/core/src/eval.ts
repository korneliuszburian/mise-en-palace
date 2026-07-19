import type {
  EvalCandidateId,
  ExecutionRunId,
  FeedbackDeltaId,
  ProjectId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type EvalCandidateStatus = "candidate" | "accepted" | "rejected" | "promoted";
export type EvalCandidateProposalStatus = "candidate";
export type PairedLiveEvalEvidenceOutcome =
  | "win"
  | "tie"
  | "loss"
  | "invalid"
  | "unknown";
export type PairedLiveEvalEvidenceUsefulnessOutcome =
  | "helped"
  | "neutral"
  | "hurt"
  | "unknown";
export type PairedLiveEvalEvidenceArtifactStatus =
  | "passed"
  | "invalid"
  | "blocked"
  | "unverified";

export interface EvalCandidateBase {
  id: EvalCandidateId;
  projectId?: ProjectId;
  title: string;
  scenario: string;
  expectedSignal: string;
  sourceEvidence: string[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}

export interface EvalCandidateProposal extends EvalCandidateBase {
  status: EvalCandidateProposalStatus;
}

export interface EvalCandidate extends EvalCandidateBase {
  status: EvalCandidateStatus;
}

interface PairedLiveEvalEvidencePayload {
  projectId: ProjectId;
  runId: ExecutionRunId;
  feedbackDeltaId?: FeedbackDeltaId;
  candidateId: EvalCandidateId;
  candidateStatus: EvalCandidateProposalStatus;
  title: string;
  scenario: string;
  family: string;
  expectedSignal: string;
  artifactStatus: PairedLiveEvalEvidenceArtifactStatus;
  outcome: PairedLiveEvalEvidenceOutcome;
  usefulnessOutcome: PairedLiveEvalEvidenceUsefulnessOutcome;
  packetChecksum: string;
  packetEvidenceRef: string;
  artifactHash: string;
  artifactRef: string;
  manifestHash: string;
  manifestRef: string;
  checkerRevision: string;
  checkerEvidenceRef: string;
  environmentProfileHash: string;
  environmentEvidenceRef: string;
  sourceEvidence: string[];
  evidenceRefs: string[];
}

export interface PairedLiveEvalEvidenceRecord extends PairedLiveEvalEvidencePayload {
  id: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface RecordPairedLiveEvalEvidenceInput extends PairedLiveEvalEvidencePayload {
  metadata?: Record<string, unknown>;
}

export interface RecordPairedLiveEvalEvidenceResult {
  evidence: PairedLiveEvalEvidenceRecord;
  created: boolean;
}

export interface ListPairedLiveEvalEvidenceInput {
  projectId: ProjectId;
  runId?: ExecutionRunId;
  scenario?: string;
  outcome?: PairedLiveEvalEvidenceOutcome;
  usefulnessOutcome?: PairedLiveEvalEvidenceUsefulnessOutcome;
  limit?: number;
}
