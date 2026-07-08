import type {
  OperatorIntentId,
  ProjectId,
  WorkspaceId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export const operatorIntentStatuses = [
  "received",
  "contracted",
  "planned",
  "executed",
  "reviewed",
  "closed"
] as const;

export type OperatorIntentStatus = typeof operatorIntentStatuses[number];

export type OperatorIntentSource = "goal" | "cli" | "api" | "codex" | "operator";

export interface OperatorIntent {
  id: OperatorIntentId;
  workspaceId: WorkspaceId;
  projectId?: ProjectId;
  source: OperatorIntentSource;
  rawIntent: string;
  normalizedIntent?: string;
  status: OperatorIntentStatus;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
