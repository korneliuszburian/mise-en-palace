import { asc, eq } from "drizzle-orm";
import type {
  CreateOutboxEventInput,
  OutboxEventRecord,
  OutboxRepository
} from "@krn/harness/repositories";

import type { KrnDatabase } from "../database.js";
import { outboxEvents } from "../schema/index.js";
import {
  fromIsoTimestamp,
  requireReturnedRow
} from "./common.js";
import { mapOutboxEvent } from "./mappers.js";

export class DrizzleOutboxRepository implements OutboxRepository {
  constructor(private readonly db: KrnDatabase) {}

  async enqueue(input: CreateOutboxEventInput): Promise<OutboxEventRecord> {
    const row = requireReturnedRow(
      await this.db
        .insert(outboxEvents)
        .values({
          topic: input.topic,
          payload: input.payload,
          ...(input.availableAt === undefined
            ? {}
            : { availableAt: fromIsoTimestamp(input.availableAt) })
        })
        .returning(),
      "enqueueOutboxEvent"
    );

    return mapOutboxEvent(row);
  }

  async listPending(limit: number): Promise<OutboxEventRecord[]> {
    const rows = await this.db.query.outboxEvents.findMany({
      where: eq(outboxEvents.status, "pending"),
      orderBy: asc(outboxEvents.availableAt),
      limit
    });

    return rows.map(mapOutboxEvent);
  }
}
