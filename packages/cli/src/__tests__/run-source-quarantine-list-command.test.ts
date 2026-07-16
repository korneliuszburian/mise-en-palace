import { describe, expect, it } from "vitest";

import { runSourceQuarantineListCommand } from "../run-source-quarantine-list-command.js";

describe("runSourceQuarantineListCommand", () => {
  it("renders bounded read-only lifecycle output", async () => {
    const result = await runSourceQuarantineListCommand({
      env: { KRN_DATABASE_URL: "postgres://localhost/krn" },
      command: {
        kind: "sourceQuarantineList",
        projectId: "10000000-0000-4000-8000-000000000001",
        limit: 1,
        afterId: "20000000-0000-4000-8000-000000000002",
        json: true
      },
      async listQuarantines(input) {
        expect(input).toEqual({
          databaseUrl: "postgres://localhost/krn",
          projectId: "10000000-0000-4000-8000-000000000001",
          limit: 1,
          afterId: "20000000-0000-4000-8000-000000000002"
        });
        return {
          limit: 1,
          projectId: input.projectId ?? null,
          afterId: input.afterId ?? null,
          nextAfterId: null,
          totalCount: 1,
          unresolvedCount: 0,
          returnedCount: 1,
          truncated: false,
          items: [{
            id: "30000000-0000-4000-8000-000000000003",
            entityType: "source_decision_edge",
            entityId: "40000000-0000-4000-8000-000000000004",
            reason: "duplicate_import_historical",
            quarantinedAt: "2026-07-16T12:00:00.000Z",
            projectId: input.projectId ?? null,
            entityPresent: false,
            currentAuthority: "absent",
            resolution: "resolved"
          }]
        };
      }
    });
    const output: unknown = JSON.parse(result.stdout);

    expect(output).toMatchObject({
      kind: "source_authority_quarantine_readback",
      persistence: "read_only_postgres",
      snapshotConsistency: "repeatable_read",
      dbWrites: "none",
      mutation: "none",
      unresolvedCount: 0,
      items: [{ resolution: "resolved", currentAuthority: "absent" }]
    });
  });

  it("requires database configuration", async () => {
    await expect(runSourceQuarantineListCommand({
      env: {},
      command: { kind: "sourceQuarantineList" }
    })).rejects.toThrow("KRN_DATABASE_URL is required for krn source quarantine list");
  });
});
