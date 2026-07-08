import type {
  HarnessPlanId,
  TaskContractId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const harnessPlanStatuses = [
  "draft",
  "ready",
  "running",
  "completed",
  "blocked"
] as const;

export type HarnessPlanStatus = typeof harnessPlanStatuses[number];

export interface HarnessPlan {
  id: HarnessPlanId;
  taskContractId: TaskContractId;
  version: number;
  status: HarnessPlanStatus;
  summary: string;
  nextAction?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
