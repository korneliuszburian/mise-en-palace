import type { IsoTimestamp } from "./time.js";
import type {
  ExecutionRunId,
  ProjectId
} from "./ids.js";

export type AuditFindingSeverity = "info" | "advisory" | "warning" | "blocking";

export type AuditFindingCategory =
  | "architecture"
  | "boundary"
  | "type_safety"
  | "memory_semantics"
  | "source_grounding"
  | "policy"
  | "eval"
  | "handoff"
  | "verification";

export type AuditFindingStatus = "open" | "accepted" | "resolved" | "waived";

export type AuditFinalVerdict = "pass" | "advisory" | "needs_review" | "fail";

export type AuditCommandStatus = "passed" | "failed" | "skipped";

export type AuditRiskEstimate = "low" | "medium" | "high";

export type AuditCandidateUpdateKind =
  | "memory_candidate"
  | "source_claim_candidate"
  | "anti_memory_candidate"
  | "eval_candidate"
  | "policy_candidate"
  | "none";

export interface AuditCommandResult {
  command: string;
  status: AuditCommandStatus;
  exitCode?: number;
  summary?: string;
}

export interface AuditFinding {
  id: string;
  category: AuditFindingCategory;
  severity: AuditFindingSeverity;
  title: string;
  summary: string;
  evidenceRefs: string[];
  recommendation: string;
  status: AuditFindingStatus;
  createdAt: IsoTimestamp;
}

export interface AuditCandidateUpdate {
  kind: AuditCandidateUpdateKind;
  summary: string;
  targetRef?: string;
  requiresReview: boolean;
}

export interface AuditBundle {
  id: string;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  sliceId: string;
  commitCandidate?: string;
  changedFiles: string[];
  intendedFiles: string[];
  unexpectedFiles: string[];
  verificationCommands: AuditCommandResult[];
  verificationResults: string;
  architecturalDelta: string;
  boundaryFindings: AuditFinding[];
  typeSafetyFindings: AuditFinding[];
  memorySemanticsFindings: AuditFinding[];
  sourceGroundingFindings: AuditFinding[];
  policyFindings: AuditFinding[];
  evalFindings: AuditFinding[];
  reviewBurdenEstimate: AuditRiskEstimate;
  diffRiskEstimate: AuditRiskEstimate;
  rollbackPath: string;
  candidateUpdates: AuditCandidateUpdate[];
  selfCritiqueSummary: string;
  finalVerdict: AuditFinalVerdict;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

const severityRank: Record<AuditFindingSeverity, number> = {
  info: 0,
  advisory: 1,
  warning: 2,
  blocking: 3
};

const allFindings = (bundle: AuditBundle): AuditFinding[] => [
  ...bundle.boundaryFindings,
  ...bundle.typeSafetyFindings,
  ...bundle.memorySemanticsFindings,
  ...bundle.sourceGroundingFindings,
  ...bundle.policyFindings,
  ...bundle.evalFindings
];

export const getHighestAuditFindingSeverity = (
  bundle: AuditBundle
): AuditFindingSeverity | undefined =>
  allFindings(bundle).reduce<AuditFindingSeverity | undefined>(
    (highest, finding) => {
      if (!highest || severityRank[finding.severity] > severityRank[highest]) {
        return finding.severity;
      }

      return highest;
    },
    undefined
  );

export const resolveAuditFinalVerdict = (
  bundle: AuditBundle
): AuditFinalVerdict => {
  const highestSeverity = getHighestAuditFindingSeverity(bundle);

  if (!highestSeverity || highestSeverity === "info") {
    return "pass";
  }

  if (highestSeverity === "advisory") {
    return "advisory";
  }

  if (highestSeverity === "warning") {
    return "needs_review";
  }

  return "fail";
};
