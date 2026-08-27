import { openKrnSqliteDatabase, resolveBackendConfig } from "@krn/db";
import { parseDecisionPacketContractReadback } from "./internal/mcp/decision-packet-contract-parser.js";
import { diffDecisionPackets, type PacketDiffOutput } from "./packet-diff.js";
import { resolveTargetWorkspace } from "./target-workspace.js";
import type { BaseCommandRuntime } from "./command-runtime-support.js";

export interface PacketDiffCommandRuntime extends BaseCommandRuntime { cwd: string; beforeRun: string; afterRun: string; }

const parseReadback = (value: unknown, runId: string) => {
  if (typeof value !== "string") return parseDecisionPacketContractReadback(value, runId);
  try {
    const parsed: unknown = JSON.parse(value);
    return parseDecisionPacketContractReadback(parsed, runId);
  } catch {
    return undefined;
  }
};

const selectedMemoryRecordIds = (
  before: ReturnType<typeof parseReadback>,
  after: ReturnType<typeof parseReadback>
): string[] => [...new Set([
  ...(before?.packet.memoryRefs ?? []),
  ...(after?.packet.memoryRefs ?? [])
])];

export const runPacketDiffCommand = async (runtime: PacketDiffCommandRuntime): Promise<{ stdout: string }> => {
  const targetWorkspace = await resolveTargetWorkspace({ cwd: runtime.cwd, env: runtime.env });
  const config = resolveBackendConfig({ env: runtime.env, targetWorkspace });
  if (config.kind !== "sqlite") throw new Error("krn packet diff currently requires the SQLite backend");
  const connection = await openKrnSqliteDatabase(config.dbPath, { readonly: true, fileMustExist: true });
  try {
    const issuance = connection.client.prepare("select execution_run_id as runId, packet_checksum as checksum, readback from decision_packet_issuances where execution_run_id = ?");
    const beforeRow = issuance.get(runtime.beforeRun) as { runId: string; checksum: string; readback: unknown } | undefined;
    const afterRow = issuance.get(runtime.afterRun) as { runId: string; checksum: string; readback: unknown } | undefined;
    const before = beforeRow === undefined ? undefined : parseReadback(beforeRow.readback, runtime.beforeRun);
    const after = afterRow === undefined ? undefined : parseReadback(afterRow.readback, runtime.afterRun);
    const memoryRecordIds = selectedMemoryRecordIds(before, after);
    const memoryRecordSummaries = memoryRecordIds.length === 0
      ? []
      : connection.client.prepare(`
        select id, summary from memory_records where id in (${memoryRecordIds.map(() => "?").join(", ")})
      `).all(...memoryRecordIds) as PacketDiffOutput["memoryRecordSummaries"];
    const feedbackEvents = afterRow === undefined ? [] : connection.client.prepare(`
      select f.id, f.memory_record_id as memoryRecordId, r.summary, f.outcome, f.note
      from memory_feedback_events f left join memory_records r on r.id = f.memory_record_id
      where f.run_id = ? and f.packet_checksum = ? order by f.created_at asc
    `).all(runtime.afterRun, afterRow.checksum) as PacketDiffOutput["feedbackEvents"];
    const output = diffDecisionPackets(before, after, feedbackEvents, memoryRecordSummaries);
    return { stdout: `${JSON.stringify(output, null, 2)}\n` };
  } finally { connection.close(); }
};
