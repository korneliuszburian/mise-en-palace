import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { assessSourceClaimTemporalValidity } from "@krn/core";
import {
  applyActivationFilters,
  assembleContext,
  retrieveActivationCandidates
} from "@krn/harness";

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
        metadata: { smokeId: scaffold.marker }
      });
      const createMemory = (input: {
        projectId: string;
        key: string;
        summary: string;
        status?: "active" | "deprecated";
        validFrom?: string;
        validUntil?: string;
      }) => scaffold.memoryRepository.createMemoryRecord({
        projectId: input.projectId,
        key: `${input.key}:${marker}`,
        kind: "constraint",
        status: input.status ?? "active",
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
        metadata: { smokeId: scaffold.marker }
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
      const deprecated = await createMemory({
        projectId: scaffold.project.id,
        key: "deprecated",
        summary: "historical warning memory deprecated",
        status: "deprecated"
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
      const retrieved = await retrieveActivationCandidates({
        taskContract: scaffold.taskContract,
        now,
        limits: {
          memory: 10,
          source: 10,
          search: 10,
          antiMemory: 10
        },
        repositories: {
          memoryRepository: scaffold.memoryRepository,
          sourceRepository: scaffold.sourceRepository,
          retrievalRepository: scaffold.retrievalRepository
        }
      });
      const filtered = applyActivationFilters({
        candidates: retrieved.candidates,
        antiMemoryRecords: retrieved.antiMemoryRecords,
        minimumSourceAuthority: "low",
        now
      });
      const context = assembleContext({
        id: "context-deprecated-memory-warning",
        harnessPlanId: scaffold.harnessPlan.id,
        candidates: filtered.candidates,
        createdAt: now
      });

      expect(currentRows.map((record) => record.id)).toEqual([current.id]);
      expect(limitedWarnings.map((record) => record.id)).toEqual([relevantExpired.id]);
      expect(warningIds).toContain(relevantExpired.id);
      expect(warningIds).toContain(deprecated.id);
      expect(warningIds).not.toContain(current.id);
      expect(warningIds).not.toContain(futureStarted.id);
      expect(warningIds).not.toContain(foreignExpired.id);
      expect(retrieved.candidates.map((candidate) => candidate.subjectId))
        .toContain(deprecated.id);
      expect(context.inclusions.map((inclusion) => inclusion.subjectId)).toContain(current.id);
      expect(context.inclusions.map((inclusion) => inclusion.subjectId))
        .not.toContain(deprecated.id);
      expect(context.exclusions).toEqual(expect.arrayContaining([
        expect.objectContaining({
          subjectType: "memory_record",
          subjectId: deprecated.id,
          reason: "stale"
        })
      ]));
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
        metadata: { smokeId: scaffold.marker }
      });
      const createArtifact = (projectId: string, label: string) =>
        scaffold.sourceRepository.createSourceArtifact({
          projectId,
          kind: "operator_input",
          sourceAuthority: "project-decision",
          uri: `operator://historical-warning/${marker}/${label}`,
          title: `${label} historical warning source`,
          contentHash: `${marker}-${label}`,
          metadata: { smokeId: scaffold.marker }
        });
      const [artifact, foreignArtifact] = await Promise.all([
        createArtifact(scaffold.project.id, "current-project"),
        createArtifact(foreignProject.id, "foreign-project")
      ]);
      const createClaim = (input: {
        sourceArtifactId: string;
        label: string;
        claim: string;
        revisitWhen?: string;
        metadata?: Record<string, unknown>;
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
        ...(input.revisitWhen === undefined ? {} : { revisitWhen: input.revisitWhen }),
        status: "proposed",
        metadata: { smokeId: scaffold.marker, label: input.label, ...input.metadata }
      });

      const relevantExpired = await createClaim({
        sourceArtifactId: artifact.id,
        label: "relevant-expired",
        claim: "historical warning exact source",
        revisitWhen: now
      });
      const expiredDistractors = await Promise.all(Array.from({ length: 3 }, (_, index) => createClaim({
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
      const startsAtBoundary = await createClaim({
        sourceArtifactId: artifact.id,
        label: "starts-at-boundary",
        claim: "temporal source boundary start",
        metadata: { validFrom: now }
      });
      const offsetCurrent = await createClaim({
        sourceArtifactId: artifact.id,
        label: "offset-current",
        claim: "temporal source offset current",
        metadata: { validUntil: "2026-07-15T14:00:01+02:00" }
      });
      const highOffsetCurrent = await createClaim({
        sourceArtifactId: artifact.id,
        label: "high-offset-current",
        claim: "temporal source high offset current",
        metadata: { validUntil: "2026-07-16T12:00:01+23:59" }
      });
      const paddedMetadataCurrent = await createClaim({
        sourceArtifactId: artifact.id,
        label: "padded-metadata-current",
        claim: "temporal source padded metadata current",
        metadata: { validUntil: "\t2026-07-15T14:00:01+02:00\n" }
      });
      const expiresAtBoundary = await createClaim({
        sourceArtifactId: artifact.id,
        label: "expires-at-boundary",
        claim: "temporal source boundary expiry",
        metadata: { validUntil: now }
      });
      const submillisecondExpiry = await createClaim({
        sourceArtifactId: artifact.id,
        label: "submillisecond-expiry",
        claim: "temporal source submillisecond expiry",
        metadata: { validUntil: "2026-07-15T12:00:00.0000009Z" }
      });
      const invalidatedAtBoundary = await createClaim({
        sourceArtifactId: artifact.id,
        label: "invalidated-at-boundary",
        claim: "temporal source boundary invalidation",
        metadata: { invalidatedAt: now }
      });
      const beforeValid = await createClaim({
        sourceArtifactId: artifact.id,
        label: "before-valid",
        claim: "temporal source before valid",
        metadata: { validFrom: future }
      });
      const invalidTimestamp = await createClaim({
        sourceArtifactId: artifact.id,
        label: "invalid-timestamp",
        claim: "temporal source invalid timestamp",
        metadata: { validUntil: "2026-02-30T00:00:00.000Z" }
      });
      const invalidLowYear = await createClaim({
        sourceArtifactId: artifact.id,
        label: "invalid-low-year",
        claim: "temporal source invalid low year",
        metadata: { validUntil: "0099-01-01T00:00:00.000Z" }
      });
      const invalidRevisitWhen = await createClaim({
        sourceArtifactId: artifact.id,
        label: "invalid-revisit-when",
        claim: "temporal source invalid revisit timestamp",
        revisitWhen: ` ${future} `
      });
      const claimToDeprecate = await createClaim({
        sourceArtifactId: artifact.id,
        label: "deprecated",
        claim: "temporal source deprecated lifecycle",
        revisitWhen: future
      });
      const deprecated = await scaffold.sourceRepository.deprecateSourceClaim({
        sourceClaimId: claimToDeprecate.id,
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
        20,
        { now }
      );
      const limitedCurrent = await scaffold.sourceRepository.listClaimsForProject(
        scaffold.project.id,
        1,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const limitedWarnings = await scaffold.sourceRepository.listHistoricalClaimWarningsForProject(
        scaffold.project.id,
        1,
        { now, terms: ["historical", "warning", "exact"] }
      );
      const allWarnings = await scaffold.sourceRepository.listHistoricalClaimWarningsForProject(
        scaffold.project.id,
        20,
        { now }
      );
      const invalidNowCurrent = await scaffold.sourceRepository.listClaimsForProject(
        scaffold.project.id,
        10,
        { now: "July 15, 2026 12:00:00 UTC" }
      );
      const invalidNowWarnings = await scaffold.sourceRepository
        .listHistoricalClaimWarningsForProject(
          scaffold.project.id,
          10,
          { now: "July 15, 2026 12:00:00 UTC" }
        );
      const warningIds = allWarnings.map((claim) => claim.id);
      const temporalClaims = [
        relevantExpired,
        ...expiredDistractors,
        current,
        startsAtBoundary,
        offsetCurrent,
        highOffsetCurrent,
        paddedMetadataCurrent,
        expiresAtBoundary,
        submillisecondExpiry,
        invalidatedAtBoundary,
        beforeValid,
        invalidTimestamp,
        invalidLowYear,
        invalidRevisitWhen,
        deprecated
      ];
      const expectedCurrentIds = temporalClaims
        .filter((claim) => assessSourceClaimTemporalValidity(claim, now).status === "current")
        .map((claim) => claim.id)
        .sort();
      const expectedWarningIds = temporalClaims
        .filter((claim) => {
          const assessment = assessSourceClaimTemporalValidity(claim, now);

          return assessment.status === "invalid" ||
            assessment.status === "inactive" ||
            (assessment.status === "historical" && assessment.reason !== "before_valid_from");
        })
        .map((claim) => claim.id)
        .sort();

      expect(currentRows.map((claim) => claim.id).sort()).toEqual(expectedCurrentIds);
      expect(limitedCurrent.map((claim) => claim.id)).toEqual([current.id]);
      expect(limitedWarnings.map((claim) => claim.id)).toEqual([relevantExpired.id]);
      expect(warningIds.sort()).toEqual(expectedWarningIds);
      expect(warningIds).not.toContain(beforeValid.id);
      expect(warningIds).not.toContain(foreignExpired.id);
      expect(invalidNowCurrent).toEqual([]);
      expect(invalidNowWarnings).toEqual([]);
    } finally {
      await scaffold.cleanup();
      await scaffold.client.end();
    }
  });
});
