import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq, inArray, sql } from "drizzle-orm";
import postgres from "postgres";

import {
  activeMemorySelectionOrder,
  antiMemoryPromotionMetadata,
  assertAntiMemoryCandidateInvariants,
  assertMemoryCoreInvariants,
  DrizzleMemoryRepository,
  memoryPromotionMetadata
} from "../drizzle-memory-repository.js";
import { createKrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import { memoryApplications, memoryRecords } from "../../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

const waitForBackendTableLock = async (
  observer: ReturnType<typeof postgres>,
  backendPid: number
): Promise<void> => {
  const deadline = Date.now() + 5_000;

  while (Date.now() < deadline) {
    const [activity] = await observer<{
      waitEventType: string | null;
    }[]>`
      select wait_event_type as "waitEventType"
      from pg_stat_activity
      where pid = ${backendPid}
    `;

    if (activity?.waitEventType === "Lock") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(`writer backend ${backendPid} did not wait for the rebuild table lock`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const orderColumnName = (order: unknown): string | undefined => {
  if (!isRecord(order) || !Array.isArray(order["queryChunks"])) {
    return undefined;
  }

  const column = order["queryChunks"].find((chunk) =>
    isRecord(chunk) && typeof chunk["name"] === "string"
  );

  return isRecord(column) && typeof column["name"] === "string"
    ? column["name"]
    : undefined;
};

const orderDirection = (order: unknown): "asc" | "desc" | undefined => {
  if (!isRecord(order) || !Array.isArray(order["queryChunks"])) {
    return undefined;
  }

  const suffix = order["queryChunks"].flatMap((chunk) => {
    if (!isRecord(chunk) || !Array.isArray(chunk["value"])) {
      return [];
    }

    return chunk["value"].filter((item): item is string => typeof item === "string");
  }).join("");

  return suffix.includes("desc") ? "desc" : "asc";
};

describe("DrizzleMemoryRepository", () => {
  postgresIt("retains the most task-relevant active memory before the bounded limit", async () => {
    const marker = `krn_memory_relevance_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "memory relevance prelimit",
      workspacePrefix: "krn-memory-relevance-prelimit",
      projectSlug: "memory-relevance-prelimit",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `memory relevance prelimit ${marker}`,
      taskContract: {
        title: "Retain the best task-relevant memory before the limit",
        objective: "Select an all-term match ahead of one-term distractors.",
        constraints: ["bounded PostgreSQL query"],
        nonGoals: ["prove globally optimal semantic ranking"],
        acceptance: ["the position-26 all-term record is selected"]
      },
      harnessPlan: {
        summary: "Memory relevance prelimit",
        nextAction: "Compare deterministic lexical relevance before counters."
      }
    });

    try {
      const relevant = await scaffold.memoryRepository.createMemoryRecord({
        projectId: scaffold.project.id,
        key: `memory:position-26:all-terms:${marker}`,
        kind: "constraint",
        status: "active",
        summary: "position-26 task-relevant memory",
        body: "This record matches every bounded retrieval term.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use for the position-26 relevance boundary.",
        invalidationRule: "Remove after the repository test.",
        sourceLineage: [{ sourceId: `source:${marker}:relevant` }],
        isUserPreference: false,
        metadata: { smokeId: marker, position26: true }
      });
      const distractors = await Promise.all(Array.from({ length: 25 }, async (_, index) =>
        scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `memory:position-26:distractor:${index}:${marker}`,
          kind: "constraint",
          status: "active",
          summary: `position-26 generic distractor ${index}`,
          body: "This record matches only the common retrieval term.",
          owner: "kernel",
          confidence: 90,
          applicationGuidance: "Do not select over the all-term match.",
          invalidationRule: "Remove after the repository test.",
          sourceLineage: [{ sourceId: `source:${marker}:distractor:${index}` }],
          isUserPreference: false,
          metadata: { smokeId: marker, position26: false }
        })
      ));
      await scaffold.db
        .update(memoryRecords)
        .set({ positiveFeedbackCount: 1 })
        .where(inArray(memoryRecords.id, distractors.map((record) => record.id)));

      const selected = await scaffold.memoryRepository.listActiveMemory(
        scaffold.project.id,
        1,
        { terms: ["position-26", "task-relevant", "bounded"] }
      );

      expect(
        selected.map((record) => record.id),
        `expected ${relevant.id}; returned ${selected.map((record) => record.id).join(",")}`
      ).toEqual([relevant.id]);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });

  postgresIt("serializes counter rebuild with a concurrent memory application", async () => {
    const marker = `krn_counter_rebuild_race_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: marker,
      smokeName: "memory counter rebuild race",
      workspacePrefix: "krn-counter-rebuild-race",
      projectSlug: "counter-rebuild-race",
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `memory counter rebuild race ${marker}`,
      taskContract: {
        title: "Falsify memory counter rebuild races",
        objective: "Keep a committed application visible after counter reconciliation.",
        constraints: ["two PostgreSQL connections"],
        nonGoals: ["measure throughput"],
        acceptance: ["counter equals canonical applications at one serialized snapshot"]
      },
      harnessPlan: {
        summary: "Memory counter rebuild race",
        nextAction: "Interleave one application after classification."
      }
    });
    const writerClient = postgres(databaseUrl!, { max: 1 });
    const observerClient = postgres(databaseUrl!, { max: 1 });
    const writerDb = createKrnDatabase(writerClient);
    let releaseRebuild = (): void => undefined;
    let reportClassified = (): void => undefined;
    const rebuildClassified = new Promise<void>((resolve) => {
      reportClassified = resolve;
    });
    const allowRebuildPersist = new Promise<void>((resolve) => {
      releaseRebuild = resolve;
    });

    try {
      const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
        harnessPlanId: scaffold.harnessPlan.id,
        adapter: "counter-rebuild-race",
        status: "planned",
        metadata: { smokeId: marker }
      });
      const memoryRecord = await scaffold.memoryRepository.createMemoryRecord({
        projectId: scaffold.project.id,
        key: `memory:counter-rebuild-race:${marker}`,
        kind: "constraint",
        status: "active",
        summary: "Counter rebuild race target",
        body: "A committed hurt application must remain counted after reconciliation.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use only for the counter rebuild race test.",
        invalidationRule: "Remove after the race test.",
        sourceLineage: [{ sourceId: `source:${marker}` }],
        isUserPreference: false,
        metadata: { smokeId: marker }
      });
      const rankingPeerInputs = [
        { key: "newer", updatedAt: new Date("2026-07-14T06:00:00.000Z") },
        { key: "older", updatedAt: new Date("2026-07-13T06:00:00.000Z") }
      ] as const;
      const rankingPeers = await Promise.all(rankingPeerInputs.map(({ key }) =>
        scaffold.memoryRepository.createMemoryRecord({
          projectId: scaffold.project.id,
          key: `memory:counter-rebuild-race:${key}:${marker}`,
          kind: "constraint",
          status: "active",
          summary: `Counter rebuild ranking peer ${key}`,
          body: "Counter-only repair must not rewrite semantic recency.",
          owner: "kernel",
          confidence: 80,
          applicationGuidance: "Use only for the counter rebuild ordering test.",
          invalidationRule: "Remove after the ordering test.",
          sourceLineage: [{ sourceId: `source:${marker}` }],
          isUserPreference: false,
          metadata: { smokeId: marker, rankingPeer: key }
        })
      ));
      await Promise.all(rankingPeers.map((peer, index) => scaffold.db
        .update(memoryRecords)
        .set({ updatedAt: rankingPeerInputs[index]!.updatedAt })
        .where(eq(memoryRecords.id, peer.id))));
      const beforeRebuildPeers = await Promise.all(rankingPeers.map((peer) =>
        scaffold.memoryRepository.getMemoryRecordById(peer.id)
      ));
      const beforeRebuildOrder = (await scaffold.memoryRepository
        .listActiveMemory(scaffold.project.id, 100))
        .filter((record) => rankingPeers.some((peer) => peer.id === record.id))
        .map((record) => record.id);
      const rebuildRepository = new DrizzleMemoryRepository(scaffold.db, {
        beforeCounterRebuildPersist: async () => {
          reportClassified();
          await allowRebuildPersist;
        }
      });
      const rebuild = rebuildRepository.rebuildMemoryApplicationCounters();
      await rebuildClassified;

      const [{ pid: writerBackendPid }] = await writerClient<{ pid: number }[]>`
        select pg_backend_pid()::int as pid
      `;
      const writer = writerDb.transaction(async (tx) => {
        await tx.insert(memoryApplications).values({
          memoryRecordId: memoryRecord.id,
          executionRunId: executionRun.id,
          decisionPacketChecksum: "a".repeat(64),
          expectedUse: "Falsify a stale counter snapshot.",
          outcome: "hurt",
          notes: "Committed after rebuild classification.",
          metadata: {
            smokeId: marker,
            decisionPacketChecksum: "a".repeat(64),
            decisionPacketGeneratedAt: "2026-07-15T06:00:00.000Z",
            decisionPacketSourceRunLifecycleRevision: 1,
            memoryApplicationRequestFingerprint: "race-fingerprint"
          }
        });
        await tx
          .update(memoryRecords)
          .set({
            negativeFeedbackCount: sql`${memoryRecords.negativeFeedbackCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(memoryRecords.id, memoryRecord.id));
      });
      await waitForBackendTableLock(observerClient, writerBackendPid);

      releaseRebuild();
      await Promise.all([rebuild, writer]);

      const afterRebuild = await scaffold.memoryRepository.getMemoryRecordById(memoryRecord.id);
      const afterRebuildPeers = await Promise.all(rankingPeers.map((peer) =>
        scaffold.memoryRepository.getMemoryRecordById(peer.id)
      ));
      const afterRebuildOrder = (await scaffold.memoryRepository
        .listActiveMemory(scaffold.project.id, 100))
        .filter((record) => rankingPeers.some((peer) => peer.id === record.id))
        .map((record) => record.id);
      expect(afterRebuild?.negativeFeedbackCount).toBe(1);
      expect(afterRebuildPeers.map((peer) => peer?.updatedAt))
        .toEqual(beforeRebuildPeers.map((peer) => peer?.updatedAt));
      expect(afterRebuildOrder).toEqual(beforeRebuildOrder);

      const faultRepository = new DrizzleMemoryRepository(scaffold.db, {
        faultAfterCounterRebuildReset: () => {
          throw new Error("fault:after_counter_rebuild_reset");
        }
      });
      await expect(faultRepository.rebuildMemoryApplicationCounters())
        .rejects.toThrow("fault:after_counter_rebuild_reset");
      const afterFault = await scaffold.memoryRepository.getMemoryRecordById(memoryRecord.id);
      expect(afterFault).toMatchObject({
        negativeFeedbackCount: afterRebuild?.negativeFeedbackCount,
        updatedAt: afterRebuild?.updatedAt
      });
    } finally {
      releaseRebuild();
      await scaffold.cleanup();
      await Promise.all([scaffold.client.end(), writerClient.end(), observerClient.end()]);
    }
  });

  it("orders active memory before limit by negative feedback, positive feedback, then recency", () => {
    const order = activeMemorySelectionOrder();

    expect(order.map(orderColumnName)).toEqual([
      "negative_feedback_count",
      "positive_feedback_count",
      "updated_at",
      "id"
    ]);
    expect(order.map(orderDirection)).toEqual([
      "asc",
      "desc",
      "desc",
      "asc"
    ]);
  });

  it("accepts governed memory core inputs with lineage and guidance", () => {
    expect(() => assertMemoryCoreInvariants({
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      invalidationRule: "Revisit when governance changes.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validFrom: "2026-06-22T00:00:00.000Z",
      validUntil: "2026-07-22T00:00:00.000Z"
    }, "Memory record")).not.toThrow();
  });

  it("rejects missing source lineage, owner, guidance, and bad confidence", () => {
    const valid = {
      summary: "Reviewed memory summary",
      body: "Reviewed memory body.",
      owner: "kernel",
      confidence: 90,
      applicationGuidance: "Use only for governed memory tests.",
      sourceLineage: [{ sourceId: "source-claim-1" }]
    };

    expect(() => assertMemoryCoreInvariants({
      ...valid,
      sourceLineage: []
    }, "Memory record")).toThrow("Memory record requires source lineage");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      owner: " "
    }, "Memory record")).toThrow("Memory record requires owner");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      applicationGuidance: ""
    }, "Memory record")).toThrow("Memory record requires application guidance");
    expect(() => assertMemoryCoreInvariants({
      ...valid,
      confidence: 101
    }, "Memory record")).toThrow("Memory record confidence must be an integer from 0 to 100");
  });

  it("requires validity and invalidation strategy for temporal memory", () => {
    const temporal = {
      summary: "Temporal memory summary",
      body: "Temporal memory body.",
      owner: "kernel",
      confidence: 80,
      applicationGuidance: "Use until stale.",
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validUntil: "2026-06-22T00:00:00.000Z"
    };

    expect(() => assertMemoryCoreInvariants(temporal, "Memory record"))
      .toThrow("Memory record with validUntil requires validFrom");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-21T00:00:00.000Z"
    }, "Memory record")).toThrow("Memory record with validUntil requires invalidation rule");
    expect(() => assertMemoryCoreInvariants({
      ...temporal,
      validFrom: "2026-06-23T00:00:00.000Z",
      invalidationRule: "Revisit when stale."
    }, "Memory record")).toThrow("Memory record validUntil must be after validFrom");
  });

  it("accepts reviewed anti-memory candidate inputs with lineage", () => {
    expect(() => assertAntiMemoryCandidateInvariants({
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      validFrom: "2026-06-22T00:00:00.000Z",
      validUntil: "2026-07-22T00:00:00.000Z"
    }, "Anti-memory candidate")).not.toThrow();

    expect(() => assertAntiMemoryCandidateInvariants({
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      sourceLineage: []
    }, "Anti-memory candidate")).toThrow(
      "Anti-memory candidate requires invalidating source claim or source lineage"
    );
  });

  it("rejects ungoverned anti-memory record inputs", () => {
    const valid = {
      key: "anti-markdown-runtime-memory",
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      sourceLineage: [{ sourceId: "source-claim-1" }]
    };

    expect(() => assertAntiMemoryCandidateInvariants(
      {
        ...valid,
        confidence: -1
      },
      "Anti-memory record"
    )).toThrow("Anti-memory record confidence must be an integer from 0 to 100");
    expect(() => assertAntiMemoryCandidateInvariants(
      {
        ...valid,
        sourceLineage: []
      },
      "Anti-memory record"
    )).toThrow(
      "Anti-memory record requires invalidating source claim or source lineage"
    );
  });

  it("preserves review gate metadata when promoting a candidate", () => {
    const metadata = memoryPromotionMetadata({
      id: "memory-candidate-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "reflection",
      kind: "constraint",
      status: "candidate",
      summary: "Use Postgres edge tables first",
      body: "Use Postgres edge tables first.",
      owner: "operator",
      confidence: 80,
      applicationGuidance: "Use when evaluating graph DB proposals.",
      invalidationRule: "Revisit when graph traversal exceeds Postgres limits.",
      sourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      isUserPreference: false,
      validFrom: "2026-06-23T00:00:00.000Z",
      metadata: {
        candidateNote: "from reflection"
      },
      createdAt: "2026-06-23T00:00:00.000Z",
      updatedAt: "2026-06-23T00:00:00.000Z"
    }, {
      candidateId: "memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "raw-evidence:run-event-1"
        }
      }
    });

    expect(metadata).toMatchObject({
      candidateNote: "from reflection",
      createdFromCandidateId: "memory-candidate-1",
      sourceClaimIds: ["source-claim-1"],
      reviewGate: {
        evidenceReviewedRef: "raw-evidence:run-event-1"
      }
    });
  });

  it("preserves anti-memory review gate metadata when promoting a candidate", () => {
    const metadata = antiMemoryPromotionMetadata({
      id: "anti-memory-candidate-1",
      projectId: "project-1",
      executionRunId: "execution-run-1",
      proposedBy: "reflection",
      key: "anti-markdown-runtime-memory",
      status: "candidate",
      rejectedClaim: "Markdown files are runtime memory",
      reason: "Memory Core is store-backed.",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      sourceLineage: [{ sourceId: "source-claim-1" }],
      summary: "Do not treat markdown as runtime memory.",
      body: "Markdown may be source/export, not Memory Core.",
      owner: "operator",
      confidence: 90,
      validFrom: "2026-06-23T00:00:00.000Z",
      metadata: {
        candidateNote: "from reflection"
      },
      createdAt: "2026-06-23T00:00:00.000Z",
      updatedAt: "2026-06-23T00:00:00.000Z"
    }, {
      candidateId: "anti-memory-candidate-1",
      reviewer: "operator",
      decision: "accepted",
      metadata: {
        reviewGate: {
          evidenceReviewedRef: "source-claim-1"
        }
      }
    });

    expect(metadata).toMatchObject({
      candidateNote: "from reflection",
      createdFromCandidateId: "anti-memory-candidate-1",
      invalidatedBySourceClaimIds: ["source-claim-1"],
      reviewGate: {
        evidenceReviewedRef: "source-claim-1"
      }
    });
  });
});
