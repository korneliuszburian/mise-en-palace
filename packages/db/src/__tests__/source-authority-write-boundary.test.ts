import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createKrnDatabase } from "../database.js";
import { DrizzleSourceRepository } from "../repositories/drizzle-source-repository.js";
import { inspectSourceAuthorityIntegrity } from "../source-authority-integrity-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

interface SourceAuthorityWriteBoundaryFixture {
  readonly client: ReturnType<typeof postgres>;
  readonly marker: string;
  readonly projectId: string;
  readonly sourceRepository: DrizzleSourceRepository;
  readonly sourceUri: string;
  readonly workspaceId: string;
}

const requiredId = (rows: readonly { id: string }[], label: string): string => {
  const id = rows[0]?.id;

  if (id === undefined) {
    throw new Error(`source authority write boundary ${label} was not created`);
  }

  return id;
};

const createFixture = async (url: string): Promise<SourceAuthorityWriteBoundaryFixture> => {
  const client = postgres(url, { max: 1, onnotice: () => undefined });
  const marker = `source-authority-write-boundary-${crypto.randomUUID()}`;
  const sourceUri = `source-authority://${marker}/uncaptured`;

  try {
    const workspace = await client<{ id: string }[]>`
      insert into workspaces (slug, display_name, metadata)
      values (${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
      returning id
    `;
    const workspaceId = requiredId(workspace, "workspace");
    const project = await client<{ id: string }[]>`
      insert into projects (workspace_id, slug, display_name, metadata)
      values (${workspaceId}, ${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
      returning id
    `;
    const projectId = requiredId(project, "project");

    return {
      client,
      marker,
      projectId,
      sourceRepository: new DrizzleSourceRepository(createKrnDatabase(client)),
      sourceUri,
      workspaceId
    };
  } catch (error) {
    await client`delete from workspaces where slug = ${marker}`;
    await client.end();
    throw error;
  }
};

const cleanupFixture = async (fixture: SourceAuthorityWriteBoundaryFixture): Promise<void> => {
  await fixture.client`delete from outbox_events where payload->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decision_edges where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_decisions where metadata->>'smokeId' = ${fixture.marker}`;
  await fixture.client`delete from source_artifacts where uri = ${fixture.sourceUri}`;
  await fixture.client`delete from workspaces where id = ${fixture.workspaceId}`;
  await fixture.client.end();
};

describe("source authority write boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reproduces governing authority persisted without captured evidence",
    async () => {
      const fixture = await createFixture(databaseUrl!);

      try {
        const sourceArtifact = await fixture.sourceRepository.createSourceArtifact({
          projectId: fixture.projectId,
          kind: "doc",
          sourceAuthority: "project-decision",
          uri: fixture.sourceUri,
          title: "Uncaptured governing source",
          contentHash: `sha256:${fixture.marker}`,
          metadata: { smokeId: fixture.marker }
        });
        const sourceClaim = await fixture.sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
          claim: "A governing source must have captured bytes.",
          mechanism: "Captured bytes bind source authority to inspectable evidence.",
          krnImplication: "Uncaptured source claims must remain non-governing.",
          doesNotProve: "Captured bytes do not prove source truth.",
          sourceAuthority: "project-decision",
          supportType: "implementation-boundary",
          consumer: "source authority write boundary",
          falsifier: "An uncaptured claim becomes adopted decision support.",
          metadata: { smokeId: fixture.marker }
        });
        const sourceDecision = await fixture.sourceRepository.createSourceDecision({
          projectId: fixture.projectId,
          sourceClaimId: sourceClaim.id,
          status: "adopt",
          decision: "Adopt uncaptured source authority.",
          rationale: "This should be rejected before authority is persisted.",
          falsifier: "The uncaptured source claim becomes governing.",
          consumer: "source authority write boundary",
          metadata: { smokeId: fixture.marker }
        });
        const sourceDecisionEdge = await fixture.sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          sourceDecisionId: sourceDecision.id,
          targetType: "architecture_decision",
          targetId: `${fixture.marker}-target`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "This edge must not exist without captured evidence.",
          metadata: { smokeId: fixture.marker }
        });
        const claimReadback = await fixture.client<{ status: string }[]>`
          select status::text as status from source_claims where id = ${sourceClaim.id}
        `;
        const decisionCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count from source_decisions where id = ${sourceDecision.id}
        `;
        const edgeCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count from source_decision_edges where id = ${sourceDecisionEdge.id}
        `;
        const sourceChunkCount = await fixture.client<{ count: number }[]>`
          select count(*)::int as count from source_chunks where source_artifact_id = ${sourceArtifact.id}
        `;
        const integrity = await inspectSourceAuthorityIntegrity({ databaseUrl: databaseUrl! });
        const evidenceViolations = integrity.violations
          .filter((violation) => violation.subjectId === sourceDecision.id)
          .map((violation) => violation.kind);

        expect({
          claimStatus: claimReadback[0]?.status,
          decisionCount: decisionCount[0]?.count,
          edgeCount: edgeCount[0]?.count,
          sourceChunkCount: sourceChunkCount[0]?.count,
          evidenceViolations
        }).toEqual({
          claimStatus: "accepted",
          decisionCount: 1,
          edgeCount: 1,
          sourceChunkCount: 0,
          evidenceViolations: ["captured_evidence_missing_or_mismatched"]
        });
      } finally {
        await cleanupFixture(fixture);
      }
    }
  );
});
