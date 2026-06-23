import { asc, eq } from "drizzle-orm";
import type {
  AppendRunEventInput,
  EventLedgerRepository,
  RunEventRecord
} from "@krn/harness/repositories";
import type { ExecutionRunId } from "@krn/core";

import type { KrnDatabase } from "../database.js";
import { runEvents } from "../schema/index.js";
import { requireReturnedRow } from "./common.js";
import { mapRunEvent } from "./mappers.js";

export class DrizzleEventLedgerRepository implements EventLedgerRepository {
  constructor(private readonly db: KrnDatabase) {}

  async appendRunEvent(input: AppendRunEventInput): Promise<RunEventRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(runEvents)
        .values({
          executionRunId: input.executionRunId,
          sequence: input.sequence,
          type: input.type,
          severity: input.severity ?? "info",
          message: input.message,
          payload: input.payload ?? {}
        })
        .returning(),
      "appendRunEvent"
    );

    return mapRunEvent(row);
  }

  async listRunEvents(executionRunId: ExecutionRunId): Promise<RunEventRecord[]> {
    const rows = await this.db.query.runEvents.findMany({
      where: eq(runEvents.executionRunId, executionRunId),
      orderBy: asc(runEvents.sequence)
    });

    return rows.map(mapRunEvent);
  }
}
