import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  migrateSqliteDatabase,
  openKrnSqliteDatabase,
  resolveBackendConfig,
} from "@krn/db";
import { SqliteProjectRepository } from "@krn/db/adapters";
import { runCli } from "../run-cli.js";

describe("SQLite persisted plan", () => {
  it("persists the harness spine and returns a run identity without Postgres", async () => {
    const target = await mkdtemp(path.join(os.tmpdir(), "krn-plan-sqlite-"));
    const config = resolveBackendConfig({ backend: "sqlite", env: {}, targetWorkspace: target });
    if (config.kind !== "sqlite") throw new Error("expected sqlite config");
    await migrateSqliteDatabase(config.dbPath);
    const setup = await openKrnSqliteDatabase(config.dbPath, { fileMustExist: true });
    try {
      const repository = new SqliteProjectRepository(setup.db);
      const workspace = await repository.createWorkspace({ slug: "dogfood", displayName: "Dogfood" });
      const project = await repository.createProject({
        workspaceId: workspace.id,
        slug: "target",
        displayName: "Target"
      });
      await repository.createRepoInstallation({
        projectId: project.id,
        provider: "local",
        repoUrl: target,
        defaultBranch: "main",
        localPathHint: target
      });
    } finally {
      setup.close();
    }

    try {
      const result = await runCli(["plan", "--task", "persist the SQLite dogfood loop", "--persist", "--backend", "sqlite", "--json"], {
        cwd: target,
        env: { INIT_CWD: target },
        now: () => "2026-08-13T12:00:00.000Z",
        createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`
      });
      expect(result.exitCode).toBe(0);
      const output = JSON.parse(result.stdout) as {
        handoff: { kind: string; identity: { executionRunId: string }; packetIdentity: { checksum: string } };
      };
      expect(output.handoff.kind).toBe("persisted");
      expect(output.handoff.identity.executionRunId).toBeTruthy();
      expect(output.handoff.packetIdentity.checksum).toMatch(/^[0-9a-f]{64}$/);

      const verify = await openKrnSqliteDatabase(config.dbPath, { readonly: true, fileMustExist: true });
      try {
        expect(verify.client.prepare("select count(*) as count from execution_runs").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from decision_packet_issuances").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from operator_intents").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from task_contracts").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from harness_plans").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from context_assemblies").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from workspaces").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from projects").get()).toEqual({ count: 1 });
        expect(verify.client.prepare("select count(*) as count from repo_installations").get()).toEqual({ count: 1 });
      } finally {
        verify.close();
      }
    } finally {
      await rm(target, { recursive: true, force: true });
    }
  });
});
