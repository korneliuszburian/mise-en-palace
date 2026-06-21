import type { ExecutionRunId } from "@krn/core";

import type {
  AppendRunEventInput,
  RunEventRecord
} from "./types.js";

export interface EventLedgerRepository {
  appendRunEvent(input: AppendRunEventInput): Promise<RunEventRecord>;
  listRunEvents(executionRunId: ExecutionRunId): Promise<RunEventRecord[]>;
}
