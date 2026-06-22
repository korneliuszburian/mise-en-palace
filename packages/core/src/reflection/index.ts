import type {
  EvalCandidate
} from "../eval.js";
import type {
  ExecutionRunId,
  ObservationGroupId,
  ObservationItemId,
  ProjectId,
  SourceClaimId,
  TaskContractId
} from "../ids.js";
import type {
  SourceLineageRef
} from "../memory.js";
import type {
  SourceClaim
} from "../source.js";
import type {
  IsoTimestamp
} from "../time.js";

export type ReflectionStatus = "candidate" | "reviewed" | "rejected" | "superseded";
export type ReflectionFindingKind =
  | "candidate_signal"
  | "contradiction"
  | "gap"
  | "risk"
  | "correction"
  | "policy_signal";
export type ReflectionSeverity = "low" | "medium" | "high" | "critical";

export interface ReflectionScope {
  projectId: ProjectId;
  executionRunId?: ExecutionRunId;
  taskContractId?: TaskContractId;
  observationGroupIds?: ObservationGroupId[];
}

export interface ReflectionInput {
  scope: ReflectionScope;
  observationItemIds: ObservationItemId[];
  sourceClaimIds: SourceClaimId[];
  antiMemoryKeys: string[];
  generatedAt: IsoTimestamp;
  metadata: Record<string, unknown>;
}

export interface ReflectionFinding {
  id: string;
  kind: ReflectionFindingKind;
  severity: ReflectionSeverity;
  summary: string;
  observationItemIds: ObservationItemId[];
  evidenceRefs: string[];
  metadata: Record<string, unknown>;
}

export interface ContradictionReport {
  id: string;
  summary: string;
  observationItemIds: ObservationItemId[];
  conflictingClaims: string[];
  evidenceRefs: string[];
  severity: ReflectionSeverity;
  metadata: Record<string, unknown>;
}

export interface GapReport {
  id: string;
  summary: string;
  missingEvidence: string;
  observationItemIds: ObservationItemId[];
  severity: ReflectionSeverity;
  metadata: Record<string, unknown>;
}

export const REFLECTION_CANDIDATE_OUTPUT_TARGETS = [
  "memory_candidate",
  "source_claim_candidate",
  "anti_memory_candidate",
  "policy_candidate",
  "eval_candidate"
] as const;

export type ReflectionCandidateOutputTarget =
  typeof REFLECTION_CANDIDATE_OUTPUT_TARGETS[number];

export interface ReflectionCandidateLink {
  targetType: ReflectionCandidateOutputTarget;
  targetId?: string;
  summary: string;
  evidenceRefs: string[];
}

export type ReflectionMemoryCandidateKind =
  | "fact"
  | "preference"
  | "constraint"
  | "procedure"
  | "pattern"
  | "risk";

export interface ReflectionMemoryCandidateProposal {
  kind: ReflectionMemoryCandidateKind;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  applicationGuidance: string;
  invalidationRule?: string;
  sourceClaimIds?: SourceClaimId[];
  sourceLineage: SourceLineageRef[];
  isUserPreference: boolean;
  validFrom: IsoTimestamp;
  validUntil?: IsoTimestamp;
  metadata: Record<string, unknown>;
}

export type ReflectionSourceClaimCandidateProposal = Pick<
  SourceClaim,
  | "claim"
  | "mechanism"
  | "krnImplication"
  | "doesNotProve"
  | "trustTier"
  | "supportType"
  | "consumer"
  | "metadata"
> & {
  falsifier?: string;
  revisitWhen?: string;
};

export interface ReflectionAntiMemoryCandidateProposal {
  key: string;
  summary: string;
  body: string;
  owner: string;
  confidence: number;
  reason?: string;
  invalidatedBySourceClaimIds: SourceClaimId[];
  appliesTo?: string;
  mayRevisitWhen?: string;
  sourceLineage: SourceLineageRef[];
  metadata: Record<string, unknown>;
}

export interface ReflectionPolicyCandidateProposal {
  key: string;
  summary: string;
  rationale: string;
  evidenceRefs: string[];
  metadata: Record<string, unknown>;
}

export type ReflectionEvalCandidateProposal = Pick<
  EvalCandidate,
  "title" | "scenario" | "expectedSignal" | "sourceEvidence" | "metadata"
>;

export interface ReflectionOutput {
  id: string;
  scope: ReflectionScope;
  status: ReflectionStatus;
  summary: string;
  findings: ReflectionFinding[];
  contradictions: ContradictionReport[];
  gaps: GapReport[];
  candidateLinks: ReflectionCandidateLink[];
  memoryCandidates: ReflectionMemoryCandidateProposal[];
  sourceClaimCandidates: ReflectionSourceClaimCandidateProposal[];
  antiMemoryCandidates: ReflectionAntiMemoryCandidateProposal[];
  policyCandidates: ReflectionPolicyCandidateProposal[];
  evalCandidates: ReflectionEvalCandidateProposal[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

export interface ReflectionRecord {
  id: string;
  scope: ReflectionScope;
  status: ReflectionStatus;
  summary: string;
  input: ReflectionInput;
  output: ReflectionOutput;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const candidateTargetSet = new Set<string>(REFLECTION_CANDIDATE_OUTPUT_TARGETS);

export const isReflectionOutputCandidateOnly = (output: {
  candidateLinks: readonly { targetType: string }[];
}): boolean => (
  output.candidateLinks.every((link) => candidateTargetSet.has(link.targetType))
);
