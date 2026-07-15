import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));
const now = "2026-07-15T12:00:00.000Z";
const earlierPast = "2026-07-13T12:00:00.000Z";
const past = "2026-07-14T12:00:00.000Z";
const future = "2026-07-16T12:00:00.000Z";
const fartherFuture = "2026-07-17T12:00:00.000Z";

const createScaffold = (marker: string, label: string) => createSmokeHarnessScaffold({
  databaseUrl: databaseUrl!,
  migrationsFolder,
  smokeId: marker,
  smokeName: `${label} historical warning selection`,
  workspacePrefix: `krn-${label}-historical-warning`,
  projectSlug: `${label}-historical-warning`,
  cleanupRows: cleanupActivationSmokeRows,
  countMarkerRows: countActivationSmokeMarkerRows,
  rawIntent: `${label} historical warning selection ${marker}`,
  taskContract: {
    title: `Select bounded ${label} historical warnings`,
    objective: "Keep current authority separate from task-relevant historical warnings.",
    constraints: ["project scoped", "time scoped", "bounded after relevance"],
    nonGoals: ["prove semantic ranking quality"],
    acceptance: ["current and historical reads remain disjoint"]
  },
  harnessPlan: {
    summary: `${label} historical warning selection`,
    nextAction: "Falsify time, project, relevance, and limit ordering."
  }
});

describe("historical warning repository selection", () => {
  postgresIt("keeps memory warnings time- and project-scoped with relevance before limit", async () => {
    const marker = `krn_memory_history_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createScaffold(marker, "memory");

    try {
      const foreignProject = await scaffold.projectRepository.createProject({
        workspaceId: scaffold.workspace.id,
        slug: `foreign-memory-${marker}`,
        displayName: "Foreign memory history",
        metadata: { smokeId: marker }
      });
      const createMemory = (input: {
        projectId: string;
        key: string;
        summary: string;
        validFrom?: string;
        validUntil?: string;
      }) => scaffold.memoryRepository.createMemoryRecord({
        projectId: input.projectId,
        key: `${input.key}:${marker}`,
        kind: "constraint",
        status: "active",
        summary: input.summary,
        body: "Historical repository selection fixture.",
        owner: "kernel",
        confidence: 90,
        applicationGuidance: "Use only for the historical warning repository test.",
        invalidationRule: "Remove after the repository test.",
        sourceLineage: [{ sourceId: `source:${input.key}:${marker}` }],
        isUserPreference: false,
        validFrom: input.validFrom ?? earlierPast,
        ...(input.validUntil === undefined ? {} : { validUntil: input.validUntil }),
        metadata: { smokeId: marker }
      });

      const relevantExpired = await createMemory({
        projectId: scaffold.project.id,
        key: "relevant-expired",
        summary: "historical warning exact memory",
        validUntil: now
      });
      await Promise.all(Array.from({ length: 3 }, (_, index) => createMemory({
        projectId: scaffold.project.id,
        key: `expired-distractor-${index}`,
        summary: "historical memory distractor",
        validUntil: past
      })));
      const current = await createMemory({
        projectId: scaffold.project.id,
        key: "current",
        summary: "historical warning exact memory current"
      });
      const futureStarted = await createMemory({
        projectId: scaffold.project.id,
        key: "future-started",
        summary: "historical warning exact memory future",
        validFrom: future,
        validUntil: fartherFuture
      });
      const foreignExpired = await createMemory({
        projectId: foreignProject.id,
        key: "foreign-expired",
        summary: "historical warning exact memory foreign",
        validUntil: past
      });

      const currentRows = await scaffold.memoryRepository.listActiveMemory(
        scaffold.project.id,
        10,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const limitedWarnings = await scaffold.memoryRepository.listHistoricalMemoryWarnings(
        scaffold.project.id,
        1,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const allWarnings = await scaffold.memoryRepository.listHistoricalMemoryWarnings(
        scaffold.project.id,
        10,
        { now }
      );
      const warningIds = allWarnings.map((record) => record.id);

      expect(currentRows.map((record) => record.id)).toEqual([current.id]);
      expect(limitedWarnings.map((record) => record.id)).toEqual([relevantExpired.id]);
      expect(warningIds).toContain(relevantExpired.id);
      expect(warningIds).not.toContain(current.id);
      expect(warningIds).not.toContain(futureStarted.id);
      expect(warningIds).not.toContain(foreignExpired.id);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });

  postgresIt("keeps source warnings time- and project-scoped with relevance before limit", async () => {
    const marker = `krn_source_history_${crypto.randomUUID().replaceAll("-", "")}`;
    const scaffold = await createScaffold(marker, "source");

    try {
      const foreignProject = await scaffold.projectRepository.createProject({
        workspaceId: scaffold.workspace.id,
        slug: `foreign-source-${marker}`,
        displayName: "Foreign source history",
        metadata: { smokeId: marker }
      });
      const createArtifact = (projectId: string, label: string) =>
        scaffold.sourceRepository.createSourceArtifact({
          projectId,
          kind: "operator_input",
          sourceAuthority: "project-decision",
          uri: `operator://historical-warning/${marker}/${label}`,
          title: `${label} historical warning source`,
          contentHash: `${marker}-${label}`,
          metadata: { smokeId: marker }
        });
      const [artifact, foreignArtifact] = await Promise.all([
        createArtifact(scaffold.project.id, "current-project"),
        createArtifact(foreignProject.id, "foreign-project")
      ]);
      const createClaim = (input: {
        sourceArtifactId: string;
        label: string;
        claim: string;
        revisitWhen: string;
      }) => scaffold.sourceRepository.createSourceClaim({
        sourceArtifactId: input.sourceArtifactId,
        claim: input.claim,
        mechanism: "Historical evidence remains warning-only after its review time elapses.",
        krnImplication: "Activation traces task-relevant stale evidence without restoring authority.",
        doesNotProve: "Historical visibility does not make the claim current.",
        sourceAuthority: "project-decision",
        supportType: "risk",
        consumer: "historical warning repository test",
        falsifier: "A stale source disappears or becomes current authority.",
        revisitWhen: input.revisitWhen,
        status: "proposed",
        metadata: { smokeId: marker, label: input.label }
      });

      const relevantExpired = await createClaim({
        sourceArtifactId: artifact.id,
        label: "relevant-expired",
        claim: "historical warning exact source",
        revisitWhen: now
      });
      await Promise.all(Array.from({ length: 3 }, (_, index) => createClaim({
        sourceArtifactId: artifact.id,
        label: `expired-distractor-${index}`,
        claim: "historical source distractor",
        revisitWhen: past
      })));
      const current = await createClaim({
        sourceArtifactId: artifact.id,
        label: "current",
        claim: "historical warning exact source current",
        revisitWhen: future
      });
      const foreignExpired = await createClaim({
        sourceArtifactId: foreignArtifact.id,
        label: "foreign-expired",
        claim: "historical warning exact source foreign",
        revisitWhen: past
      });

      const currentRows = await scaffold.sourceRepository.listClaimsForProject(
        scaffold.project.id,
        10,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const limitedWarnings = await scaffold.sourceRepository.listHistoricalClaimWarningsForProject(
        scaffold.project.id,
        1,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const allWarnings = await scaffold.sourceRepository.listHistoricalClaimWarningsForProject(
        scaffold.project.id,
        10,
        { now }
      );
      const warningIds = allWarnings.map((claim) => claim.id);

      expect(currentRows.map((claim) => claim.id)).toEqual([current.id]);
      expect(limitedWarnings.map((claim) => claim.id)).toEqual([relevantExpired.id]);
      expect(warningIds).toContain(relevantExpired.id);
      expect(warningIds).not.toContain(current.id);
      expect(warningIds).not.toContain(foreignExpired.id);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });
});
