import type {
  FeedbackDeltaId,
  ReviewAssessmentId
} from "./ids.js";
import type { EvalCandidate } from "./eval.js";
import type { MemoryCandidate } from "./memory.js";
import type { SourceDecision } from "./source.js";
import type { IsoTimestamp } from "./time.js";

export type FeedbackDeltaStatus = "candidate" | "accepted" | "rejected" | "applied";

export interface FeedbackDelta {
  id: FeedbackDeltaId;
  reviewAssessmentId: ReviewAssessmentId;
  status: FeedbackDeltaStatus;
  memoryCandidates: MemoryCandidate[];
  sourceDecisions: SourceDecision[];
  evalCandidates: EvalCandidate[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
