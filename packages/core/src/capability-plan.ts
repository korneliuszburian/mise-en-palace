import type {
  CapabilityPlanId,
  HarnessPlanId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const capabilityPlanToolBoundariesMetadataKey = "capabilityPlanToolBoundaries";

export const capabilityPlanToolBoundaries = [
  "Do not invoke Codex from the harness compiler.",
  "Do not mutate memory automatically.",
  "Do not write runtime markdown memory.",
  "Do not spawn agents from the compiler."
] as const;

export type CapabilityRequirementKind =
  | "source_grounding"
  | "type_safety"
  | "schema_design"
  | "test_boundary"
  | "db_migration"
  | "review_capture"
  | "evidence_capture"
  | "context_abstention";

export type CapabilityRequirementPriority = "required" | "recommended";

export interface CapabilityRequirement {
  kind: CapabilityRequirementKind;
  priority: CapabilityRequirementPriority;
  reason: string;
  requiredEvidence: string[];
}

export interface CapabilityPlan {
  id: CapabilityPlanId;
  harnessPlanId: HarnessPlanId;
  requirements: CapabilityRequirement[];
  toolBoundaries: string[];
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
