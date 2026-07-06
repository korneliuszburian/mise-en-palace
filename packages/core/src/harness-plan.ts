import type {
  HarnessPlanId,
  TaskContractId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type HarnessPlanStatus = "draft" | "ready" | "running" | "completed" | "blocked";

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
