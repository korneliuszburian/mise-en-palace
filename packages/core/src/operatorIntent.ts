import type {
  OperatorIntentId,
  ProjectId,
  WorkspaceId
} from "./ids.js";
import type { IsoTimestamp } from "./time.js";

export type OperatorIntentSource = "goal" | "cli" | "api" | "codex" | "operator";

export interface OperatorIntent {
  id: OperatorIntentId;
  workspaceId: WorkspaceId;
  projectId?: ProjectId;
  source: OperatorIntentSource;
  rawIntent: string;
  normalizedIntent?: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
}
