import postgres from "postgres";
import { randomUUID } from "node:crypto";
import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  persistActivationRuntimeProof,
  postgresStoreIdentity,
  readCurrentActivationRuntimeProof,
  readCurrentInitConnectRuntimeProof,
  readCurrentTargetRepoRuntimeProof
} from "../activation-runtime-proof.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

describe.skipIf(databaseUrl === undefined)("activation runtime proof", () => {
  const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
  const insertedIds: string[] = [];

  afterEach(async () => {
    if (insertedIds.length > 0) {
      for (const id of insertedIds) {
        await client`delete from activation_runtime_proofs where id = ${id}`;
      }
      insertedIds.length = 0;
    }
  });

  it("round-trips a fresh clean proof and rejects foreign or stale fingerprints", async () => {
    const capturedAt = new Date();
    const environmentFingerprintId = `proof-${randomUUID()}`;
    const id = await persistActivationRuntimeProof(client, {
      environmentFingerprintId,
      storeIdentity: postgresStoreIdentity(databaseUrl!),
      status: "passed",
      capturedAt,
      cleanupRemainingMarkerCount: 0,
      report: { activationDecisionCount: 3, cleanedUp: true }
    });
    insertedIds.push(id);

    await expect(readCurrentActivationRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId,
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toMatchObject({ id, status: "passed", cleanupRemainingMarkerCount: 0 });

    await expect(readCurrentActivationRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId: "foreign-proof",
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toBeUndefined();

    await expect(readCurrentActivationRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId,
      now: new Date(capturedAt.getTime() + 16 * 60_000)
    })).resolves.toBeUndefined();
  });

  it("fails closed before writing a proof with cleanup residue", async () => {
    await expect(persistActivationRuntimeProof(client, {
      environmentFingerprintId: "dirty-proof",
      storeIdentity: postgresStoreIdentity(databaseUrl!),
      status: "passed",
      capturedAt: new Date(),
      cleanupRemainingMarkerCount: 1,
      report: { cleanedUp: false }
    })).rejects.toThrow("zero cleanup residue");
  });

  it("scopes target-repo proofs to the exact fixture path", async () => {
    const capturedAt = new Date();
    const environmentFingerprintId = `target-proof-${randomUUID()}`;
    const scopeKey = "/repo/fixture/typescript-basic";
    const id = await persistActivationRuntimeProof(client, {
      proofKind: "target_repo_harness",
      scopeKey,
      projectId: "target-project",
      environmentFingerprintId,
      storeIdentity: postgresStoreIdentity(databaseUrl!),
      status: "passed",
      capturedAt,
      cleanupRemainingMarkerCount: 0,
      report: {
        crossProjectLeakageProof: true,
        consumerTargetCommandStatus: "passed",
        consumerEvidenceBoundToPacket: true,
        targetProjectLinked: true
      }
    });
    insertedIds.push(id);

    await expect(readCurrentTargetRepoRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId,
      scopeKey,
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toMatchObject({ id, projectId: "target-project" });

    await expect(readCurrentTargetRepoRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId,
      scopeKey: "/repo/foreign",
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toBeUndefined();
  });

  it("scopes init-connect proofs to the exact fixture path and fingerprint", async () => {
    const capturedAt = new Date();
    const environmentFingerprintId = `init-connect-proof-${randomUUID()}`;
    const scopeKey = "/repo/fixture/typescript-basic";
    const id = await persistActivationRuntimeProof(client, {
      proofKind: "init_connect",
      scopeKey,
      projectId: "init-project",
      environmentFingerprintId,
      storeIdentity: postgresStoreIdentity(databaseUrl!),
      status: "passed",
      capturedAt,
      cleanupRemainingMarkerCount: 0,
      report: {
        commandStatus: "passed",
        observationOnly: true,
        projectRegistrationReadback: true,
        idempotencyReadback: true,
        refreshReadback: true
      }
    });
    insertedIds.push(id);

    await expect(readCurrentInitConnectRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId,
      scopeKey,
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toMatchObject({ id, projectId: "init-project" });

    await expect(readCurrentInitConnectRuntimeProof(client, {
      databaseUrl: databaseUrl!,
      environmentFingerprintId: "foreign-init-connect-proof",
      scopeKey,
      now: new Date(capturedAt.getTime() + 60_000)
    })).resolves.toBeUndefined();
  });
});
