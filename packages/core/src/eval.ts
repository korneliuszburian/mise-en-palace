import type {
  EvalCandidateId,
  ProjectId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type EvalCandidateStatus = "candidate" | "accepted" | "rejected" | "promoted";
export type EvalCandidateProposalStatus = "candidate";

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
