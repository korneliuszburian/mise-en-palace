import {
  randomUUID
} from "node:crypto";
import {
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  openKrnSqliteDatabase
} from "@krn/db";
import {
  runCli
} from "../run-cli.js";

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) =>
    rm(fixture, { recursive: true, force: true })
  ));
});

const fixedNow = "2026-08-12T10:00:00.000Z";

const testRuntime = (targetWorkspace: string) => ({
  cwd: path.resolve(process.cwd(), "../.."),
  env: { INIT_CWD: targetWorkspace },
  now: () => fixedNow,
  createId: (prefix: string) => `${prefix}-sqlite-lifecycle`
});

const persistedId = (stdout: string, label: string): string => {
  const match = stdout.match(new RegExp(`^${label}: ([^\\s]+)(?: .*)?$`, "mu"));
  if (match?.[1] === undefined) {
    throw new Error(`Missing ${label} in output:\n${stdout}`);
  }
  return match[1];
};

describe("SQLite persisted memory lifecycle", () => {
  it("migrates in init, creates and promotes a candidate, then recalls it without Postgres", async () => {
    const targetWorkspace = await mkdtemp(path.join(os.tmpdir(), "krn-sqlite-lifecycle-"));
    fixtures.push(targetWorkspace);
    await writeFile(
      path.join(targetWorkspace, "package.json"),
      JSON.stringify({ name: "sqlite-lifecycle-target" }),
      "utf8"
    );
    const runtime = testRuntime(targetWorkspace);

    const init = await runCli([
      "init",
      "--connect",
      "--repo",
      targetWorkspace,
      "--persist",
      "--backend",
      "sqlite"
    ], runtime);
    expect(init).toMatchObject({ exitCode: 0, stderr: "" });
    expect(init.stdout).toContain("Persistence: enabled (SQLite, explicit --persist)");

    const dbPath = path.join(targetWorkspace, ".krn", "memory.db");
    const connection = await openKrnSqliteDatabase(dbPath);
    let runId: string;
    let claimId: string;
    try {
      const project = connection.client.prepare(`
        select projects.id, projects.workspace_id as workspaceId
        from repo_installations
        join projects on projects.id = repo_installations.project_id
        where repo_installations.local_path_hint = ?
      `).get(targetWorkspace) as { id: string; workspaceId: string } | undefined;
      expect(project).toBeDefined();
      if (project === undefined) {
        throw new Error("Initialized SQLite project was not persisted");
      }
      const intentId = randomUUID();
      const contractId = randomUUID();
      const planId = randomUUID();
      runId = randomUUID();
      const artifactId = randomUUID();
      claimId = randomUUID();
      connection.client.prepare(`
        insert into operator_intents
          (id, workspace_id, project_id, source, raw_intent, status, metadata)
        values (?, ?, ?, 'cli', 'sqlite lifecycle fixture', 'received', '{}')
      `).run(intentId, project.workspaceId, project.id);
      connection.client.prepare(`
        insert into task_contracts
          (id, operator_intent_id, project_id, title, objective, constraints, non_goals, acceptance, status, metadata)
        values (?, ?, ?, 'SQLite lifecycle', 'Prove the persisted memory lifecycle', '[]', '[]', '[]', 'active', '{}')
      `).run(contractId, intentId, project.id);
      connection.client.prepare(`
        insert into harness_plans
          (id, task_contract_id, version, status, summary, metadata)
        values (?, ?, 1, 'ready', 'SQLite lifecycle plan', '{}')
      `).run(planId, contractId);
      connection.client.prepare(`
        insert into execution_runs
          (id, harness_plan_id, adapter, status, lifecycle_revision, started_at, metadata)
        values (?, ?, 'integration-test', 'running', 1, ?, '{}')
      `).run(runId, planId, Date.parse(fixedNow));
      connection.client.prepare(`
        insert into source_artifacts
          (id, project_id, kind, trust_tier, uri, title, content_hash, metadata)
        values (?, ?, 'operator_input', 'project-decision', ?, 'SQLite lifecycle authority', ?, '{}')
      `).run(artifactId, project.id, `test://sqlite-lifecycle/${runId}`, "a".repeat(64));
      connection.client.prepare(`
        insert into source_claims
          (id, source_artifact_id, execution_run_id, claim, mechanism, krn_implication,
           does_not_prove, trust_tier, support_type, consumer, falsifier, status, metadata)
        values (?, ?, ?, 'SQLite lifecycle preserves reviewed memory',
          'A dialect-specific repository stores the governed record',
          'SQLite can own local Memory Core persistence',
          'This fixture does not prove concurrency or crash recovery',
          'project-decision', 'implementation-boundary', 'SQLite lifecycle integration',
          'The promoted record cannot be recalled', 'accepted', '{}')
      `).run(claimId, artifactId, runId);
    } finally {
      connection.close();
    }

    const candidate = await runCli([
      "memory", "candidate", "add",
      "--run-id", runId,
      "--kind", "constraint",
      "--content", "SQLite lifecycle preserves reviewed memory",
      "--confidence", "high",
      "--application-guidance", "Use this record for the SQLite lifecycle test",
      "--source-claim-id", claimId,
      "--invalidation-rule", "Invalidate when the SQLite repository contract changes",
      "--candidate-evidence-provenance", "operator_reported",
      "--candidate-evidence-ref", "test://sqlite-lifecycle",
      "--candidate-evidence-does-not-prove", "This fixture does not prove concurrency or crash recovery.",
      "--persist"
    ], runtime);
    expect(candidate).toMatchObject({ exitCode: 0, stderr: "" });
    expect(candidate.stdout).toContain("Persistence: enabled (SQLite, explicit --persist)");
    const candidateId = persistedId(candidate.stdout, "memoryCandidate");

    const promoted = await runCli([
      "memory", "candidate", "promote",
      "--candidate-id", candidateId,
      "--reviewer", "integration-test",
      "--decision", "accepted",
      "--evidence-reviewed-ref", "test://sqlite-lifecycle-review",
      "--persist"
    ], runtime);
    expect(promoted).toMatchObject({ exitCode: 0, stderr: "" });
    expect(promoted.stdout).toContain("Review gate: passed");
    expect(promoted.stdout).toContain("Persistence: enabled (SQLite, explicit --persist)");
    const memoryRecordId = persistedId(promoted.stdout, "memoryRecord");

    const recalled = await runCli([
      "memory", "recall",
      "--text", "SQLite lifecycle preserves reviewed memory",
      "--json"
    ], runtime);
    expect(recalled).toMatchObject({ exitCode: 0, stderr: "" });
    const readback = JSON.parse(recalled.stdout) as {
      kind: string;
      access: string;
      mutation: string;
      source: string;
      readModels: Array<{ memoryRecordId?: string; sourceRefs: string[] }>;
    };
    expect(readback).toMatchObject({
      kind: "krn.memory.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "memory_store"
    });
    expect(readback.readModels).toEqual([
      expect.objectContaining({
        memoryRecordId,
        sourceRefs: [claimId]
      })
    ]);

    const persisted = await openKrnSqliteDatabase(dbPath);
    try {
      expect(persisted.client.prepare(
        "select status from memory_candidates where id = ?"
      ).get(candidateId)).toMatchObject({ status: "accepted" });
      const record = persisted.client.prepare(
        "select status, project_id as projectId from memory_records where id = ?"
      ).get(memoryRecordId) as { status: string; projectId: string } | undefined;
      expect(record).toMatchObject({ status: "active", projectId: persistedId(init.stdout, "Project ID") });
      expect(persisted.client.prepare(
        "select created_from_candidate_id as createdFromCandidateId from memory_record_versions where memory_record_id = ?"
      ).get(memoryRecordId)).toMatchObject({ createdFromCandidateId: candidateId });
      expect((persisted.client.prepare("select topic from outbox_events").all() as { topic: string }[]).map((row) => row.topic))
        .toEqual(expect.arrayContaining(["memory.candidate.created", "memory.candidate.promoted"]));
    } finally {
      persisted.close();
    }

    const doctor = await runCli(["doctor", "--backend", "sqlite"], runtime);
    expect(doctor).toMatchObject({ exitCode: 0, stderr: "" });
    expect(doctor.stdout).toContain("Memory store readiness: ready");
    expect(doctor.stdout).toContain("Activation readiness: runtime_unverified");
  }, 30_000);
});
