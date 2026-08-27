import { mkdtemp, realpath, rm } from "node:fs/promises";
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
    const canonicalTarget = await realpath(target);
    const config = resolveBackendConfig({ backend: "sqlite", env: {}, targetWorkspace: canonicalTarget });
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
        repoUrl: canonicalTarget,
        defaultBranch: "main",
        localPathHint: canonicalTarget
      });
    } finally {
      setup.close();
    }

    try {
      const result = await runCli(["plan", "--task", "persist the SQLite dogfood loop", "--persist", "--backend", "sqlite", "--json"], {
        cwd: canonicalTarget,
        env: { INIT_CWD: canonicalTarget },
        now: () => "2026-08-13T12:00:00.000Z",
        createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`
      });
      expect(result.exitCode, result.stderr || result.stdout).toBe(0);
      const output = JSON.parse(result.stdout) as {
        handoff: { kind: string; identity: { executionRunId: string }; packetIdentity: { checksum: string } };
      };
      expect(output.handoff.kind).toBe("persisted");
      expect(output.handoff.identity.executionRunId).toBeTruthy();
      expect(output.handoff.packetIdentity.checksum).toMatch(/^[0-9a-f]{64}$/);

      const packet = await runCli([
        "decision",
        "packet",
        "--run-id",
        output.handoff.identity.executionRunId,
        "--json"
      ], {
        cwd: canonicalTarget,
        env: { INIT_CWD: canonicalTarget },
        now: () => "2026-08-13T12:00:01.000Z",
        createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`
      });
      expect(packet.exitCode, packet.stderr || packet.stdout).toBe(0);
      const packetOutput = JSON.parse(packet.stdout) as {
        packetIdentity: { checksum: string };
        packet: { task: { id: string } };
      };
      expect(packetOutput.packetIdentity.checksum).toBe(output.handoff.packetIdentity.checksum);
      expect(packetOutput.packet.task.id).toBeTruthy();

      const tamper = await openKrnSqliteDatabase(config.dbPath);
      try {
        const stored = tamper.client.prepare(
          "select readback from decision_packet_issuances where execution_run_id = ?"
        ).get(output.handoff.identity.executionRunId) as { readback: string };
        const tamperedReadback = JSON.parse(stored.readback) as {
          packet: { task: { title: string } };
        };
        tamperedReadback.packet.task.title = "tampered";
        tamper.client.prepare(
          "update decision_packet_issuances set readback = ? where execution_run_id = ?"
        ).run(JSON.stringify(tamperedReadback), output.handoff.identity.executionRunId);
      } finally {
        tamper.close();
      }

      const rejectedPacket = await runCli([
        "decision",
        "packet",
        "--run-id",
        output.handoff.identity.executionRunId,
        "--json"
      ], {
        cwd: canonicalTarget,
        env: { INIT_CWD: canonicalTarget },
        now: () => "2026-08-13T12:00:02.000Z",
        createId: (prefix) => `${prefix}-${Math.random().toString(16).slice(2)}`
      });
      expect(rejectedPacket.exitCode).toBe(1);
      expect(rejectedPacket.stderr).toContain("No valid SQLite DecisionPacket issuance found");

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
