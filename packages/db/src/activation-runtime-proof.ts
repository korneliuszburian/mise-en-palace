import type postgres from "postgres";

const freshnessWindowMs = 15 * 60 * 1000;

export interface ActivationRuntimeProofInput {
  environmentFingerprintId: string;
  storeIdentity: string;
  status: "passed" | "failed";
  capturedAt: Date;
  cleanupRemainingMarkerCount: number;
  report: unknown;
}

export interface ActivationRuntimeProofReadback {
  id: string;
  environmentFingerprintId: string;
  storeIdentity: string;
  status: "passed" | "failed";
  capturedAt: string;
  cleanupRemainingMarkerCount: number;
  report: Record<string, unknown>;
}

export const postgresStoreIdentity = (databaseUrl: string): string => {
  try {
    const parsed = new URL(databaseUrl);
    const port = parsed.port.length > 0 ? parsed.port : "5432";
    const database = parsed.pathname.replace(/^\//u, "") || "default";

    return `${parsed.protocol}//${parsed.hostname}:${port}/${database}`;
  } catch {
    return "postgres-store:unparseable-url";
  }
};

export const persistActivationRuntimeProof = async (
  client: postgres.Sql,
  input: ActivationRuntimeProofInput
): Promise<string> => {
  if (input.environmentFingerprintId.trim().length === 0) {
    throw new Error("activation runtime proof requires an environment fingerprint");
  }

  if (input.storeIdentity.trim().length === 0) {
    throw new Error("activation runtime proof requires a store identity");
  }

  if (input.cleanupRemainingMarkerCount !== 0 || input.status !== "passed") {
    throw new Error("activation runtime proof requires a passed smoke with zero cleanup residue");
  }

  const [row] = await client<{ id: string }[]>`
    insert into activation_runtime_proofs (
      environment_fingerprint_id,
      store_identity,
      status,
      captured_at,
      cleanup_remaining_marker_count,
      report
    )
    values (
      ${input.environmentFingerprintId},
      ${input.storeIdentity},
      ${input.status},
      ${input.capturedAt.toISOString()},
      ${input.cleanupRemainingMarkerCount},
      ${client.json(JSON.stringify(input.report))}
    )
    returning id
  `;

  if (row === undefined) {
    throw new Error("activation runtime proof insert returned no row");
  }

  return row.id;
};

export const readCurrentActivationRuntimeProof = async (
  client: postgres.Sql,
  input: {
    databaseUrl: string;
    environmentFingerprintId: string | undefined;
    now?: Date;
  }
): Promise<ActivationRuntimeProofReadback | undefined> => {
  const fingerprintId = input.environmentFingerprintId?.trim();
  if (fingerprintId === undefined || fingerprintId.length === 0) {
    return undefined;
  }

  const now = input.now ?? new Date();
  const capturedAfter = new Date(now.getTime() - freshnessWindowMs);
  const storeIdentity = postgresStoreIdentity(input.databaseUrl);
  const [row] = await client<ActivationRuntimeProofReadback[]>`
    select
      id,
      environment_fingerprint_id as "environmentFingerprintId",
      store_identity as "storeIdentity",
      status,
      captured_at as "capturedAt",
      cleanup_remaining_marker_count as "cleanupRemainingMarkerCount",
      report
    from activation_runtime_proofs
    where store_identity = ${storeIdentity}
      and environment_fingerprint_id = ${fingerprintId}
      and status = 'passed'
      and cleanup_remaining_marker_count = 0
      and captured_at > ${capturedAfter.toISOString()}
      and captured_at <= ${now.toISOString()}
    order by captured_at desc
    limit 1
  `;

  return row;
};
