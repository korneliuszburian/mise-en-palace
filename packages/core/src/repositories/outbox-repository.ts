import type {
  CreateOutboxEventInput,
  OutboxEventRecord
} from "./types.js";

export interface OutboxRepository {
  enqueue(input: CreateOutboxEventInput): Promise<OutboxEventRecord>;
  listPending(limit: number): Promise<OutboxEventRecord[]>;
}
