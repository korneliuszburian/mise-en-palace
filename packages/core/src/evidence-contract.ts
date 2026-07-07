import type {
  DiffRisk
} from "./evidence-bundle.js";

export interface EvidenceContractCommand {
  command: string;
  required: boolean;
}

export interface EvidenceContract {
  commands: EvidenceContractCommand[];
  diffRisk: DiffRisk;
  reviewBurden: string;
  rollbackPath: string;
  metadata: Record<string, unknown>;
}
