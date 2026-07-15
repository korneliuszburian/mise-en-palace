import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import { antiMemoryRecords } from "../../schema/index.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

describe("DrizzleMemoryRepository anti-memory selection", () => {
  postgresIt("selects current project relevance before the bounded limit", async () => {
    const marker = `krn_anti_memory_relevance_${crypto.randomUUID().replaceAll("-", "")}`;
    const createScaffold = (suffix: string) => createSmokeHarnessScaffold({
      databaseUrl: databaseUrl!,
      migrationsFolder,
      smokeId: `${marker}_${suffix}`,
      smokeName: `anti-memory relevance ${suffix}`,
      workspacePrefix: `krn-anti-memory-relevance-${suffix}`,
      projectSlug: `anti-memory-relevance-${suffix}`,
      cleanupRows: cleanupActivationSmokeRows,
      countMarkerRows: countActivationSmokeMarkerRows,
      rawIntent: `anti-memory relevance ${marker} ${suffix}`,
      taskContract: {
        title: "Select relevant anti-memory before the limit",
        objective: "Keep current project rejected paths visible.",
        constraints: ["apply relevance and temporal eligibility before limit"],
        nonGoals: ["promote anti-memory to governing authority"],
        acceptance: ["the position-26 relevant row is selected"]
      },
      harnessPlan: {
        summary: "Anti-memory relevance selection",
        nextAction: "Read the bounded current project anti-memory set."
      }
    });
    const primary = await createScaffold("primary");
    const foreign = await createScaffold("foreign");
    const selectionNow = "2026-07-15T12:00:00.000Z";
    const recordInput = (projectId: string, key: string, body: string) => ({
      projectId,
      key,
      rejectedClaim: body,
      reason: "Rejected by reviewed evidence.",
      summary: key,
      body,
      owner: "anti-memory-relevance-test",
      confidence: 90,
      sourceLineage: [{ sourceId: `source:${marker}` }],
      validFrom: "2026-07-01T00:00:00.000Z",
      metadata: { smokeId: marker }
    });

    try {
      const distractors = await Promise.all(Array.from({ length: 25 }, (_, index) =>
        primary.memoryRepository.createAntiMemoryRecord(recordInput(
          primary.project.id,
          `unrelated-rejected-path-${index}`,
          "Unrelated deployment rejection."
        ))
      ));
      const relevant = await primary.memoryRepository.createAntiMemoryRecord(recordInput(
        primary.project.id,
        "position-26-anti-memory-relevant",
        "Position-26 anti-memory relevant rejected path."
      ));
      const expired = await primary.memoryRepository.createAntiMemoryRecord({
        ...recordInput(
          primary.project.id,
          "expired-position-26-anti-memory-relevant",
          "Position-26 anti-memory relevant but expired."
        ),
        validUntil: "2026-07-10T00:00:00.000Z"
      });
      const invalidated = await primary.memoryRepository.createAntiMemoryRecord(recordInput(
        primary.project.id,
        "invalidated-position-26-anti-memory-relevant",
        "Position-26 anti-memory relevant but invalidated."
      ));
      await primary.db
        .update(antiMemoryRecords)
        .set({ invalidatedAt: new Date("2026-07-12T00:00:00.000Z") })
        .where(eq(antiMemoryRecords.id, invalidated.id));
      const foreignRelevant = await foreign.memoryRepository.createAntiMemoryRecord(recordInput(
        foreign.project.id,
        "foreign-position-26-anti-memory-relevant",
        "Position-26 anti-memory relevant in another project."
      ));

      const selected = await primary.memoryRepository.listAntiMemoryForProject(
        primary.project.id,
        1,
        {
          terms: ["position-26 anti-memory relevant"],
          now: selectionNow
        }
      );
      const excludedIds = [
        ...distractors.map((record) => record.id),
        expired.id,
        invalidated.id,
        foreignRelevant.id
      ];

      expect(selected.map((record) => record.id)).toEqual([relevant.id]);
      expect(selected.filter((record) => excludedIds.includes(record.id))).toHaveLength(0);
    } finally {
      await Promise.all([primary.cleanup(), foreign.cleanup()]);
      await Promise.all([primary.client.end(), foreign.client.end()]);
    }
  });
});
