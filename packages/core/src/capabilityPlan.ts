import type {
  CapabilityPlanId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type CapabilityRequirementKind =
  | "source_grounding"
  | "type_safety"
  | "schema_design"
  | "test_boundary"
  | "db_migration"
  | "review_capture"
  | "evidence_capture"
  | "policy_gate";

export interface CapabilityRequirement {
  kind: CapabilityRequirementKind;
  reason: string;
  requiredEvidence: string[];
}

export interface CapabilityPlan {
  id: CapabilityPlanId;
  harnessPlanId: HarnessPlanId;
  requirements: CapabilityRequirement[];
  toolBoundaries: string[];
  policyGateIds: string[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
