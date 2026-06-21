import type {
  OperatorIntentId,
  ProjectId,
  TaskContractId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type TaskContractStatus = "draft" | "active" | "superseded" | "closed";

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
