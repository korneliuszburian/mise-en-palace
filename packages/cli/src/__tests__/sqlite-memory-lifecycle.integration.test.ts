import {
  randomUUID
} from "node:crypto";
import {
  mkdtemp,
  realpath,
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
  migrateSqliteDatabase,
  openKrnSqliteDatabase,
  openMemoryLifecycleStore
} from "@krn/db";
import {
  bindDecisionPacketFixtureIdentity,
  decisionPacketMcpFixture
} from "./support/decision-packet-mcp-fixture.js";
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
  it("refuses registration writes when the SQLite migration ledger is tampered", async () => {
    const targetWorkspace = await realpath(
      await mkdtemp(path.join(os.tmpdir(), "krn-sqlite-drifted-init-"))
    );
    fixtures.push(targetWorkspace);
    await writeFile(
      path.join(targetWorkspace, "package.json"),
      JSON.stringify({ name: "sqlite-drifted-init-target" }),
      "utf8"
    );
    const dbPath = path.join(targetWorkspace, ".krn", "memory.db");
    await migrateSqliteDatabase(dbPath);
    const tampered = await openKrnSqliteDatabase(dbPath);
    try {
      tampered.client.prepare(
        "update __drizzle_migrations set hash = ? where created_at = (select min(created_at) from __drizzle_migrations)"
      ).run("tampered-before-init");
      expect((tampered.client.prepare(
        "select count(*) as count from workspaces"
      ).get() as { count: number }).count).toBe(0);
    } finally {
      tampered.close();
    }

    const init = await runCli([
      "init",
      "--connect",
      "--repo",
      targetWorkspace,
      "--persist",
      "--backend",
      "sqlite"
    ], testRuntime(targetWorkspace));

    expect(init.exitCode).toBe(1);
    expect(init.stdout).toBe("");
    expect(init.stderr).toContain("SQLite store is not ready: migration identity mismatched");

    const inspected = await openKrnSqliteDatabase(dbPath);
    try {
      expect((inspected.client.prepare(
        "select count(*) as count from workspaces"
      ).get() as { count: number }).count).toBe(0);
    } finally {
      inspected.close();
    }
  });

  it("migrates in init, creates and promotes a candidate, then recalls it without Postgres", async () => {
    const targetWorkspace = await realpath(
      await mkdtemp(path.join(os.tmpdir(), "krn-sqlite-lifecycle-"))
    );
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

    const feedbackConnection = await openKrnSqliteDatabase(dbPath);
    const feedbackRecordId = randomUUID();
    const unselectedRecordId = randomUUID();
    const packet = structuredClone(decisionPacketMcpFixture);
    const runTask = feedbackConnection.client.prepare(`
      select task_contracts.id as taskId
      from execution_runs
      join harness_plans on harness_plans.id = execution_runs.harness_plan_id
      join task_contracts on task_contracts.id = harness_plans.task_contract_id
      where execution_runs.id = ?
    `).get(runId) as { taskId: string };
    packet.request.runId = runId;
    packet.request.projectId = persistedId(init.stdout, "Project ID");
    packet.request.taskId = runTask.taskId;
    packet.packet.task.projectId = packet.request.projectId;
    packet.packet.task.id = runTask.taskId;
    packet.packet.memoryRefs = [feedbackRecordId];
    packet.packet.brief.includedMemoryRecordIds = [feedbackRecordId];
    packet.packetIdentity.generatedAt = fixedNow;
    packet.packetIdentity.sourceRunLifecycleRevision = 1;
    packet.packetIdentity.sourceRunUpdatedAt = fixedNow;
    const boundPacket = bindDecisionPacketFixtureIdentity(packet);
    delete (boundPacket as { readModel?: unknown }).readModel;
    try {
      feedbackConnection.client.prepare(`
        insert into memory_records
          (id, project_id, key, kind, status, summary, body, owner, confidence,
           application_guidance, source_lineage, is_user_preference, valid_from,
           positive_feedback_count, negative_feedback_count, metadata)
        values (?, ?, 'feedback-fixture', 'fact', 'active', 'Feedback fixture',
          'Feedback fixture body', 'integration-test', 90, 'Use the feedback fixture',
          ?, 0, ?, 0, 0, '{}')
      `).run(
        feedbackRecordId,
        packet.request.projectId,
        JSON.stringify([{ sourceId: "source-feedback-fixture" }]),
        Date.parse(fixedNow)
      );
      feedbackConnection.client.prepare(`
        insert into memory_records
          (id, project_id, key, kind, status, summary, body, owner, confidence,
           application_guidance, source_lineage, is_user_preference, valid_from,
           positive_feedback_count, negative_feedback_count, metadata)
        values (?, ?, 'unselected-feedback-fixture', 'fact', 'active', 'Unselected fixture',
          'Unselected fixture body', 'integration-test', 90, 'Do not use the unselected fixture',
          ?, 0, ?, 0, 0, '{}')
      `).run(
        unselectedRecordId,
        packet.request.projectId,
        JSON.stringify([{ sourceId: "source-unselected-feedback-fixture" }]),
        Date.parse(fixedNow)
      );
      feedbackConnection.client.prepare(`
        insert into decision_packet_issuances
          (execution_run_id, packet_checksum, packet_generated_at,
           source_run_lifecycle_revision, readback)
        values (?, ?, ?, ?, ?)
      `).run(
        runId,
        boundPacket.packetIdentity.checksum,
        Date.parse(fixedNow),
        1,
        JSON.stringify(boundPacket)
      );
    } finally {
      feedbackConnection.close();
    }

    const packetReadback = await runCli([
      "decision",
      "packet",
      "--run-id",
      runId,
      "--json"
    ], runtime);
    expect(packetReadback).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(packetReadback.stdout)).toMatchObject({
      packetIdentity: { checksum: boundPacket.packetIdentity.checksum },
      packet: { task: { id: runTask.taskId } }
    });

    const feedbackStore = await openMemoryLifecycleStore({
      kind: "sqlite",
      dbPath,
      storeIdentity: `sqlite:${dbPath}`
    });
    try {
      const helped = await feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "helped",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum
      });
      const replay = await feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "helped",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum
      });
      expect(helped).toMatchObject({ idempotentReplay: false, feedbackEventId: expect.any(String) });
      expect(replay).toEqual({ feedbackEventId: helped.feedbackEventId, idempotentReplay: true });

      const negative = await feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "hurt",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum,
        note: "The fixture was harmful."
      });
      const stale = await feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "stale",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum,
        note: "The fixture is stale."
      });
      expect(negative.idempotentReplay).toBe(false);
      expect(stale.idempotentReplay).toBe(false);
      await expect(feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "helped",
        runId,
        packetChecksum: "f".repeat(64)
      })).rejects.toThrow(/checksum|issuance/i);
      await expect(feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: feedbackRecordId,
        outcome: "helped",
        runId: randomUUID(),
        packetChecksum: boundPacket.packetIdentity.checksum
      })).rejects.toThrow(/run|issuance/i);
      await expect(feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: randomUUID(),
        outcome: "helped",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum
      })).rejects.toThrow(/record/i);
      await expect(feedbackStore.memoryRepository.recordMemoryFeedbackWithPacketBinding({
        memoryRecordId: unselectedRecordId,
        outcome: "helped",
        runId,
        packetChecksum: boundPacket.packetIdentity.checksum
      })).rejects.toThrow(/select/i);
    } finally {
      await feedbackStore.close();
    }
    const beforeRunId = randomUUID();
    const beforePacket = structuredClone(decisionPacketMcpFixture);
    beforePacket.request.runId = beforeRunId;
    beforePacket.request.projectId = packet.request.projectId;
    beforePacket.request.taskId = runTask.taskId;
    beforePacket.packet.task.projectId = packet.request.projectId;
    beforePacket.packet.task.id = runTask.taskId;
    beforePacket.packet.memoryRefs = [feedbackRecordId, unselectedRecordId];
    beforePacket.packet.brief.includedMemoryRecordIds = [feedbackRecordId, unselectedRecordId];
    beforePacket.packetIdentity.generatedAt = fixedNow;
    beforePacket.packetIdentity.sourceRunLifecycleRevision = 1;
    beforePacket.packetIdentity.sourceRunUpdatedAt = fixedNow;
    const boundBeforePacket = bindDecisionPacketFixtureIdentity(beforePacket);
    delete (boundBeforePacket as { readModel?: unknown }).readModel;
    const beforeConnection = await openKrnSqliteDatabase(dbPath);
    try {
      const plan = beforeConnection.client.prepare("select harness_plan_id as harnessPlanId from execution_runs where id = ?")
        .get(runId) as { harnessPlanId: string };
      beforeConnection.client.prepare(`
        insert into execution_runs (id, harness_plan_id, adapter, status, lifecycle_revision, metadata)
        values (?, ?, 'integration-test', 'planned', 1, '{}')
      `).run(beforeRunId, plan.harnessPlanId);
      beforeConnection.client.prepare(`
        insert into decision_packet_issuances
          (execution_run_id, packet_checksum, packet_generated_at, source_run_lifecycle_revision, readback)
        values (?, ?, ?, 1, ?)
      `).run(beforeRunId, boundBeforePacket.packetIdentity.checksum, Date.parse(fixedNow), JSON.stringify(boundBeforePacket));
    } finally {
      beforeConnection.close();
    }
    const packetDiff = await runCli([
      "packet",
      "diff",
      "--before-run",
      beforeRunId,
      "--after-run",
      runId,
      "--json"
    ], runtime);
    expect(packetDiff).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(packetDiff.stdout)).toMatchObject({
      commonMemoryRecords: [feedbackRecordId],
      addedMemoryRecords: [],
      removedMemoryRecords: [unselectedRecordId],
      memoryRecordSummaries: expect.arrayContaining([
        { id: feedbackRecordId, summary: "Feedback fixture" },
        { id: unselectedRecordId, summary: "Unselected fixture" }
      ]),
      verdict: "selection_changed",
      feedbackEvents: expect.arrayContaining([
        expect.objectContaining({ memoryRecordId: feedbackRecordId, summary: "Feedback fixture", outcome: "helped" })
      ])
    });
    const counters = await openKrnSqliteDatabase(dbPath);
    try {
      expect(counters.client.prepare(
        "select positive_feedback_count as positive, negative_feedback_count as negative from memory_records where id = ?"
      ).get(feedbackRecordId)).toEqual({ positive: 1, negative: 2 });
    } finally {
      counters.close();
    }
  }, 30_000);
});
