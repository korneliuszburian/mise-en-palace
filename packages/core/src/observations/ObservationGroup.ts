import type { ExecutionRunId, ObservationGroupId, ProjectId } from "../ids.js";
import type { IsoTimestamp } from "../time.js";
import type { ObservationScope } from "./ObservationScope.js";

export interface ObservationGroup {
  id: ObservationGroupId;
  projectId?: ProjectId;
  executionRunId?: ExecutionRunId;
  scope: ObservationScope;
  title: string;
  summary: string;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
