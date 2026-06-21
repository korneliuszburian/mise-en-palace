import type {
  EvalCandidateId,
  ProjectId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type EvalCandidateStatus = "candidate" | "accepted" | "rejected" | "promoted";

export interface EvalCandidate {
  id: EvalCandidateId;
  projectId?: ProjectId;
  status: EvalCandidateStatus;
  title: string;
  scenario: string;
  expectedSignal: string;
  sourceEvidence: string[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
