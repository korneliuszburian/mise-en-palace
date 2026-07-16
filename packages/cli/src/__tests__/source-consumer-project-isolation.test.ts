import crypto from "node:crypto";

import postgres from "postgres";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it
} from "vitest";

import {
  buildMaintenanceQueueWriteBoundaryReadback,
  stampCurrentDecisionPacketAuthorityMetadata
} from "@krn/core";
import type {
  AntiMemoryCandidate,
  AntiMemoryRecord,
  FeedbackDelta,
  MaintenanceJob,
  MemoryCandidate,
  MemoryRecord,
  SourceClaim,
  SourceDecision
} from "@krn/core";
import type {
  CreateAntiMemoryCandidateInput
} from "@krn/core/repositories/internal";
import {
  createFeedbackDeltaMaintenanceHandler,
  DrizzleSourceRepository
} from "@krn/db/adapters";
import {
  createKrnDatabase
} from "@krn/db";
import {
  promoteAntiMemoryCandidateThroughGate,
  promoteMemoryCandidateThroughGate
} from "@krn/harness";

import {
  createDatabaseRuntime
} from "../database-runtime.js";
import type {
  DatabaseRuntimeInput
} from "../database-runtime.js";
import {
  runCli
} from "../run-cli.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const now = "2026-07-16T12:00:00.000Z";

interface ProjectSourceFixture {
  readonly projectId: string;
  readonly primaryClaim: SourceClaim;
  readonly relatedClaim: SourceClaim;
  readonly primaryDecision: SourceDecision;
}

interface SourceConsumerProjectIsolationFixture {
  readonly client: ReturnType<typeof postgres>;
  readonly marker: string;
  readonly projectA: ProjectSourceFixture;
  readonly projectB: ProjectSourceFixture;
}

const cleanupFixtureData = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<void> => {
  await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
  await client`delete from source_claim_edges where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from workspaces where slug = ${marker}`;
};

const scopedRuntime = (
  marker: string,
  projectSlug: string
) => (input: DatabaseRuntimeInput) => createDatabaseRuntime({
  ...input,
  workspaceSlug: marker,
  projectSlug
});

const seedAcceptedSource = async (input: {
  readonly label: string;
  readonly marker: string;
  readonly projectId: string;
  readonly sourceRepository: DrizzleSourceRepository;
}): Promise<{
  readonly claim: SourceClaim;
  readonly decision: SourceDecision;
}> => {
  const metadata = {
    smokeId: input.marker,
    evidenceRef: `project-isolation://${input.marker}/${input.label}`,
    evidenceStatus: "captured",
    evidenceContentHash: `sha256:${input.marker}:${input.label}:captured`,
    evidenceFreshness: "current"
  };
  const artifact = await input.sourceRepository.createSourceArtifact({
    projectId: input.projectId,
    kind: "doc",
    sourceAuthority: "project-decision",
    uri: `project-isolation://${input.marker}/${input.label}`,
    title: `Project isolation ${input.label}`,
    contentHash: `sha256:${input.marker}:${input.label}:artifact`,
    metadata
  });
  const chunk = await input.sourceRepository.createSourceChunk({
    sourceArtifactId: artifact.id,
    ordinal: 0,
    content: `Captured source bytes for ${input.label}.`,
    contentHash: `sha256:${input.marker}:${input.label}:chunk`,
    metadata
  });
  const proposedClaim = await input.sourceRepository.createSourceClaim({
    sourceArtifactId: artifact.id,
    sourceChunkId: chunk.id,
    claim: `Project-scoped source claim ${input.label}`,
    mechanism: "Repository reads join SourceClaim ownership through its SourceArtifact project.",
    krnImplication: "Source-derived consumers must retain the runtime project boundary.",
    doesNotProve: "Project isolation does not prove source truth.",
    sourceAuthority: "project-decision",
    supportType: "implementation-boundary",
    consumer: "source consumer project isolation smoke",
    falsifier: "A consumer in another project can resolve this claim.",
    metadata
  });
  const decision = await input.sourceRepository.createSourceDecision({
    projectId: input.projectId,
    sourceClaimId: proposedClaim.id,
    status: "adopt",
    decision: `Adopt ${input.label} for its owning project only.`,
    rationale: "Captured-current evidence supports the bounded project consumer.",
    falsifier: "The source becomes stale or crosses its owning project boundary.",
    consumer: "source consumer project isolation smoke",
    metadata
  });
  const claim = await input.sourceRepository.getSourceClaimForProject(
    input.projectId,
    proposedClaim.id
  );

  if (claim === undefined) {
    throw new Error(`Accepted source fixture was not readable: ${input.label}`);
  }

  return { claim, decision };
};

const seedProjectSource = async (input: {
  readonly marker: string;
  readonly projectSlug: string;
}): Promise<ProjectSourceFixture> => {
  const runtime = await createDatabaseRuntime({
    databaseUrl: databaseUrl!,
    workspaceSlug: input.marker,
    projectSlug: input.projectSlug,
    now: () => now,
    createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
  });

  try {
    const sourceRepository = runtime.sourceRepository as DrizzleSourceRepository;
    const primary = await seedAcceptedSource({
      label: `${input.projectSlug}-primary`,
      marker: input.marker,
      projectId: runtime.projectId,
      sourceRepository
    });
    const related = await seedAcceptedSource({
      label: `${input.projectSlug}-related`,
      marker: input.marker,
      projectId: runtime.projectId,
      sourceRepository
    });
    await sourceRepository.createSourceClaimEdge({
      fromSourceClaimId: primary.claim.id,
      toSourceClaimId: related.claim.id,
      kind: "supports",
      metadata: {
        smokeId: input.marker,
        consumer: "source consumer project isolation smoke",
        doesNotProve: "An isolated edge does not prove either claim is true.",
        evidenceRef: `project-isolation:${input.projectSlug}:edge`
      }
    });

    return {
      projectId: runtime.projectId,
      primaryClaim: primary.claim,
      relatedClaim: related.claim,
      primaryDecision: primary.decision
    };
  } finally {
    await runtime.close();
  }
};

const memoryCandidate = (input: {
  readonly projectId: string;
  readonly sourceClaimId: string;
}): MemoryCandidate => ({
  id: `memory-candidate-${input.projectId}-${input.sourceClaimId}`,
  projectId: input.projectId,
  proposedBy: "project-isolation-smoke",
  kind: "constraint",
  status: "candidate",
  summary: "Keep source-derived consumers scoped to their project.",
  body: "A project may use only source authority owned by that project.",
  owner: "operator",
  confidence: 90,
  applicationGuidance: "Apply at every source-derived review boundary.",
  invalidationRule: "Revisit if organization-wide authorization is explicitly designed.",
  sourceClaimIds: [input.sourceClaimId],
  sourceLineage: [{ sourceId: input.sourceClaimId }],
  isUserPreference: false,
  validFrom: now,
  metadata: {
    reflectionCandidateEvidence: {
      provenance: "source_claim",
      evidenceRefs: [input.sourceClaimId],
      doesNotProve: "A source reference does not prove promotion is authorized."
    }
  },
  createdAt: now,
  updatedAt: now
});

const memoryRecord = (
  candidate: MemoryCandidate
): MemoryRecord => ({
  id: `memory-record-${candidate.id}`,
  projectId: candidate.projectId,
  key: `memory:${candidate.id}`,
  kind: candidate.kind,
  status: "active",
  summary: candidate.summary,
  body: candidate.body,
  owner: candidate.owner,
  confidence: candidate.confidence,
  applicationGuidance: candidate.applicationGuidance,
  invalidationRule: candidate.invalidationRule ?? "",
  sourceLineage: candidate.sourceLineage,
  isUserPreference: false,
  positiveFeedbackCount: 0,
  negativeFeedbackCount: 0,
  validFrom: candidate.validFrom ?? now,
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const antiMemoryCandidate = (input: {
  readonly projectId: string;
  readonly sourceClaimId: string;
}): AntiMemoryCandidate => ({
  id: `anti-memory-candidate-${input.projectId}-${input.sourceClaimId}`,
  projectId: input.projectId,
  proposedBy: "project-isolation-smoke",
  key: `anti-source-${input.sourceClaimId}`,
  status: "candidate",
  rejectedClaim: "Foreign source authority can invalidate local memory.",
  reason: "Source invalidation must remain inside the owning project.",
  invalidatedBySourceClaimIds: [input.sourceClaimId],
  sourceLineage: [{ sourceId: input.sourceClaimId }],
  summary: "Do not apply foreign source invalidation.",
  body: "A project cannot consume another project's invalidating claim.",
  owner: "operator",
  confidence: 90,
  validFrom: now,
  metadata: {
    reflectionCandidateEvidence: {
      provenance: "source_claim",
      evidenceRefs: [input.sourceClaimId],
      doesNotProve: "A source reference does not prove anti-memory promotion is authorized."
    }
  },
  createdAt: now,
  updatedAt: now
});

const antiMemoryRecord = (
  candidate: AntiMemoryCandidate
): AntiMemoryRecord => ({
  id: `anti-memory-record-${candidate.id}`,
  projectId: candidate.projectId,
  createdFromCandidateId: candidate.id,
  key: candidate.key,
  rejectedClaim: candidate.rejectedClaim ?? "",
  reason: candidate.reason ?? "",
  invalidatedBySourceClaimIds: candidate.invalidatedBySourceClaimIds,
  summary: candidate.summary,
  body: candidate.body,
  owner: candidate.owner,
  confidence: candidate.confidence,
  sourceLineage: candidate.sourceLineage,
  validFrom: now,
  metadata: {},
  createdAt: now,
  updatedAt: now
});

const feedbackDelta = (input: {
  readonly id: string;
  readonly sourceClaimId: string;
  readonly sourceDecisionId: string;
}): FeedbackDelta => ({
  id: input.id,
  reviewAssessmentId: `review-${input.id}`,
  status: "candidate",
  memoryCandidates: [],
  sourceDecisions: [],
  evalCandidates: [],
  metadata: stampCurrentDecisionPacketAuthorityMetadata({
    sourceUsefulnessOutcomes: [{
      sourceClaimId: input.sourceClaimId,
      outcome: "stale",
      reason: "The bounded source requires maintenance review.",
      evidenceRefs: [`packet:${input.id}:claim`],
      doesNotProve: "Usefulness feedback does not prove source truth."
    }, {
      sourceDecisionId: input.sourceDecisionId,
      outcome: "rejected",
      reason: "The bounded decision requires maintenance review.",
      evidenceRefs: [`packet:${input.id}:decision`],
      doesNotProve: "Usefulness feedback does not revoke source authority directly."
    }]
  }, {
    checksum: `checksum-${input.id}`,
    generatedAt: now,
    sourceRunLifecycleRevision: 1
  }),
  createdAt: now,
  updatedAt: now
});

const maintenanceJob = (input: {
  readonly feedbackDeltaId: string;
  readonly projectId: string;
}): Extract<MaintenanceJob, { jobType: "review_feedback_delta" }> => ({
  jobType: "review_feedback_delta",
  payload: {
    projectId: input.projectId,
    feedbackDeltaId: input.feedbackDeltaId,
    reason: "source consumer project isolation smoke"
  }
});

describe.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
  "source consumer project isolation",
  () => {
    let fixture: SourceConsumerProjectIsolationFixture;

    beforeAll(async () => {
      const marker = `source-consumer-project-isolation-${crypto.randomUUID()}`;
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });

      try {
        fixture = {
          client,
          marker,
          projectA: await seedProjectSource({ marker, projectSlug: `${marker}-a` }),
          projectB: await seedProjectSource({ marker, projectSlug: `${marker}-b` })
        };
      } catch (error) {
        await cleanupFixtureData(client, marker);
        await client.end();
        throw error;
      }
    });

    afterAll(async () => {
      if (fixture === undefined) {
        return;
      }

      try {
        await cleanupFixtureData(fixture.client, fixture.marker);
      } finally {
        await fixture.client.end();
      }
    });

    it("promotes only same-project memory source lineage", async () => {
      const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(fixture.client));
      const localCandidate = memoryCandidate({
        projectId: fixture.projectA.projectId,
        sourceClaimId: fixture.projectA.primaryClaim.id
      });
      const foreignCandidate = memoryCandidate({
        projectId: fixture.projectA.projectId,
        sourceClaimId: fixture.projectB.primaryClaim.id
      });
      const promoted: string[] = [];
      const repositoryFor = (candidate: MemoryCandidate) => ({
        async getMemoryCandidateById() {
          return candidate;
        },
        async promoteReviewedMemoryCandidate() {
          promoted.push(candidate.id);
          return memoryRecord(candidate);
        }
      });

      const local = await promoteMemoryCandidateThroughGate({
        memoryRepository: repositoryFor(localCandidate),
        sourceRepository,
        review: {
          candidateId: localCandidate.id,
          reviewer: "project-isolation-smoke",
          evidenceReviewedRef: fixture.projectA.primaryClaim.id
        }
      });
      expect(local.reviewedSourceClaims.map((claim) => claim.id)).toEqual([
        fixture.projectA.primaryClaim.id
      ]);
      await expect(promoteMemoryCandidateThroughGate({
        memoryRepository: repositoryFor(foreignCandidate),
        sourceRepository,
        review: {
          candidateId: foreignCandidate.id,
          reviewer: "project-isolation-smoke",
          evidenceReviewedRef: fixture.projectB.primaryClaim.id
        }
      })).rejects.toThrow(`SourceClaim not found: ${fixture.projectB.primaryClaim.id}`);
      expect(promoted).toEqual([localCandidate.id]);
    });

    it("promotes only same-project anti-memory invalidation lineage", async () => {
      const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(fixture.client));
      const localCandidate = antiMemoryCandidate({
        projectId: fixture.projectA.projectId,
        sourceClaimId: fixture.projectA.primaryClaim.id
      });
      const foreignCandidate = antiMemoryCandidate({
        projectId: fixture.projectA.projectId,
        sourceClaimId: fixture.projectB.primaryClaim.id
      });
      const promoted: string[] = [];
      const repositoryFor = (candidate: AntiMemoryCandidate) => ({
        async getAntiMemoryCandidateById() {
          return candidate;
        },
        async promoteReviewedAntiMemoryCandidate() {
          promoted.push(candidate.id);
          return antiMemoryRecord(candidate);
        }
      });

      const local = await promoteAntiMemoryCandidateThroughGate({
        memoryRepository: repositoryFor(localCandidate),
        sourceRepository,
        review: {
          candidateId: localCandidate.id,
          reviewer: "project-isolation-smoke",
          evidenceReviewedRef: fixture.projectA.primaryClaim.id
        }
      });
      expect(local.reviewedSourceClaims.map((claim) => claim.id)).toEqual([
        fixture.projectA.primaryClaim.id
      ]);
      await expect(promoteAntiMemoryCandidateThroughGate({
        memoryRepository: repositoryFor(foreignCandidate),
        sourceRepository,
        review: {
          candidateId: foreignCandidate.id,
          reviewer: "project-isolation-smoke",
          evidenceReviewedRef: fixture.projectB.primaryClaim.id
        }
      })).rejects.toThrow(`SourceClaim not found: ${fixture.projectB.primaryClaim.id}`);
      expect(promoted).toEqual([localCandidate.id]);
    });

    it("nominates maintenance only for same-project source subjects", async () => {
      const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(fixture.client));
      const createdCandidates: CreateAntiMemoryCandidateInput[] = [];
      const memoryRepository = {
        async createAntiMemoryCandidate(input: CreateAntiMemoryCandidateInput) {
          createdCandidates.push(input);

          return {
            id: `maintenance-candidate-${createdCandidates.length}`,
            projectId: input.projectId,
            feedbackDeltaId: input.feedbackDeltaId ?? "feedback-delta-project-isolation",
            proposedBy: input.proposedBy,
            key: input.key,
            status: input.status ?? "candidate",
            rejectedClaim: input.rejectedClaim ?? "",
            reason: input.reason ?? "",
            invalidatedBySourceClaimIds: input.invalidatedBySourceClaimIds ?? [],
            appliesTo: input.appliesTo ?? "",
            summary: input.summary,
            body: input.body,
            owner: input.owner,
            confidence: input.confidence,
            sourceLineage: input.sourceLineage,
            validFrom: input.validFrom ?? now,
            metadata: input.metadata ?? {},
            createdAt: now,
            updatedAt: now
          } satisfies AntiMemoryCandidate;
        }
      };
      let selectedFeedback = feedbackDelta({
        id: "feedback-project-a",
        sourceClaimId: fixture.projectA.primaryClaim.id,
        sourceDecisionId: fixture.projectA.primaryDecision.id
      });
      const handler = createFeedbackDeltaMaintenanceHandler({
        harnessRunRepository: {
          async getFeedbackDeltaForProject(projectId, feedbackDeltaId) {
            expect(projectId).toBe(fixture.projectA.projectId);
            expect(feedbackDeltaId).toBe(selectedFeedback.id);
            return { status: "found", feedbackDelta: selectedFeedback };
          }
        },
        memoryRepository,
        sourceRepository,
        now: () => now
      });
      const run = (job: Extract<MaintenanceJob, { jobType: "review_feedback_delta" }>) => handler.run({
        job,
        record: {
          id: `queue-${job.payload.feedbackDeltaId}`,
          jobType: "review_feedback_delta",
          queueKey: `review_feedback_delta:${job.payload.projectId}:${job.payload.feedbackDeltaId}`,
          status: "running",
          payload: { ...job.payload },
          attempts: 0,
          maxAttempts: 3,
          runAfter: now,
          lockedAt: now,
          lockedBy: "project-isolation-smoke",
          createdAt: now,
          updatedAt: now
        },
        writeBoundary: buildMaintenanceQueueWriteBoundaryReadback("review_feedback_delta")
      });

      const localResult = await run(maintenanceJob({
        projectId: fixture.projectA.projectId,
        feedbackDeltaId: selectedFeedback.id
      }));
      if (localResult.status === "skipped") {
        throw new Error(`Same-project maintenance unexpectedly skipped: ${localResult.reason}`);
      }
      expect(localResult).toMatchObject({
        status: "succeeded",
        createdReviewCandidates: [{ kind: "anti_memory_candidate" }, {
          kind: "anti_memory_candidate"
        }]
      });
      expect(createdCandidates).toHaveLength(2);
      expect(createdCandidates.every((candidate) =>
        candidate.projectId === fixture.projectA.projectId
      )).toBe(true);

      selectedFeedback = feedbackDelta({
        id: "feedback-project-a-foreign-source",
        sourceClaimId: fixture.projectB.primaryClaim.id,
        sourceDecisionId: fixture.projectB.primaryDecision.id
      });
      const foreignResult = await run(maintenanceJob({
        projectId: fixture.projectA.projectId,
        feedbackDeltaId: selectedFeedback.id
      }));
      expect(foreignResult).toEqual({
        status: "skipped",
        reason:
          `SourceClaim ${fixture.projectB.primaryClaim.id} is unavailable in project ` +
          `${fixture.projectA.projectId}; maintenance failed closed`
      });
      expect(createdCandidates).toHaveLength(2);
    });

    it("renders only same-project source graph content through the CLI", async () => {
      const createScopedRuntime = scopedRuntime(fixture.marker, `${fixture.marker}-a`);
      const local = await runCli([
        "source",
        "claim",
        "edges",
        "--source-claim-id",
        fixture.projectA.primaryClaim.id
      ], {
        env: { KRN_DATABASE_URL: databaseUrl },
        createDatabaseRuntime: createScopedRuntime
      });
      expect(local.exitCode).toBe(0);
      expect(local.stderr).toBe("");
      expect(local.stdout).toContain(fixture.projectA.primaryClaim.claim);
      expect(local.stdout).toContain(fixture.projectA.relatedClaim.claim);
      expect(local.stdout).not.toContain(fixture.projectB.primaryClaim.claim);
      expect(local.stdout).not.toContain("postgres://");
      expect(local.stdout).not.toContain("krn:krn");

      const foreign = await runCli([
        "source",
        "claim",
        "edges",
        "--source-claim-id",
        fixture.projectB.primaryClaim.id
      ], {
        env: { KRN_DATABASE_URL: databaseUrl },
        createDatabaseRuntime: createScopedRuntime
      });
      expect(foreign.exitCode).toBe(1);
      expect(foreign.stdout).toBe("");
      expect(foreign.stderr).toContain(
        `SourceClaim not found: ${fixture.projectB.primaryClaim.id}`
      );
      expect(foreign.stderr).not.toContain(fixture.projectB.primaryClaim.claim);
      expect(foreign.stderr).not.toContain("postgres://");
      expect(foreign.stderr).not.toContain("krn:krn");
    });
  }
);
