import type { PolicyGateId } from "./ids.js";

export type PolicyGateKind =
  | "forbidden_surface"
  | "type_boundary"
  | "source_grounding"
  | "tool_authority"
  | "review_burden";

export interface ToolBoundary {
  toolName: string;
  allowed: boolean;
  reason: string;
}

export interface PolicyGate {
  id: PolicyGateId;
  kind: PolicyGateKind;
  description: string;
  requiredEvidence: string[];
}

export interface PolicyGateResult {
  gateId: PolicyGateId;
  passed: boolean;
  reason: string;
  evidence: string[];
}
