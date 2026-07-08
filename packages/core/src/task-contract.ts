import type {
  OperatorIntentId,
  ProjectId,
  TaskContractId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const taskContractStatuses = [
  "draft",
  "active",
  "superseded",
  "closed"
] as const;

export type TaskContractStatus = typeof taskContractStatuses[number];

export interface TaskContract {
  id: TaskContractId;
  operatorIntentId: OperatorIntentId;
  projectId?: ProjectId;
  title: string;
  objective: string;
  constraints: string[];
  nonGoals: string[];
  acceptance: string[];
  status: TaskContractStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
