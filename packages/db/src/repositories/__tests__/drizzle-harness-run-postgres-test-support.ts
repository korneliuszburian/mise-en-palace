import { expect } from "vitest";
import postgres from "postgres";

export const postgresBackendPid = async (
  client: ReturnType<typeof postgres>
): Promise<number> => {
  const rows = await client<{ pid: number }[]>`select pg_backend_pid()::int as pid`;
  const pid = rows[0]?.pid;

  if (pid === undefined) {
    throw new Error("PostgreSQL race barrier could not read its backend PID");
  }

  return pid;
};

export const waitForPostgresBackendBlock = async (
  observer: ReturnType<typeof postgres>,
  targetPid: number,
  expectedBlockerPids: readonly number[]
): Promise<void> => {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const rows = await observer<{ blockingPids: number[] }[]>`
      select pg_blocking_pids(${targetPid})::int[] as "blockingPids"
    `;
    if (rows[0]?.blockingPids.some((pid) => expectedBlockerPids.includes(pid)) === true) {
      return;
    }

    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error(`PostgreSQL backend ${targetPid} did not reach the expected lock barrier`);
};

export const expectRejectedReason = <T>(
  result: PromiseSettledResult<T>,
  unexpectedSuccessMessage: string
): unknown => {
  expect(result.status).toBe("rejected");

  if (result.status !== "rejected") {
    throw new Error(unexpectedSuccessMessage);
  }

  return result.reason;
};
