import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createKrnDatabase } from "../database.js";
import { DrizzleSourceRepository } from "../repositories/drizzle-source-repository.js";
import { inspectSourceAuthorityIntegrity } from "../source-authority-integrity-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

describe("source authority write boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reproduces governing authority persisted without captured evidence",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-write-boundary-${crypto.randomUUID()}`;
      const sourceUri = `source-authority://${marker}/uncaptured`;
      let workspaceId: string | undefined;

      try {
        const workspace = await client<{ id: string }[]>`
          insert into workspaces (slug, display_name, metadata)
          values (${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
          returning id
        `;
        workspaceId = workspace[0]?.id;
        if (workspaceId === undefined) {
          throw new Error("source authority write boundary workspace was not created");
        }

        const project = await client<{ id: string }[]>`
          insert into projects (workspace_id, slug, display_name, metadata)
          values (${workspaceId}, ${marker}, 'Source authority write boundary', ${client.json({ smokeId: marker })})
          returning id
        `;
        const projectId = project[0]?.id;
        if (projectId === undefined) {
          throw new Error("source authority write boundary project was not created");
        }

        const sourceRepository = new DrizzleSourceRepository(createKrnDatabase(client));
        const sourceArtifact = await sourceRepository.createSourceArtifact({
          projectId,
          kind: "doc",
          sourceAuthority: "project-decision",
          uri: sourceUri,
          title: "Uncaptured governing source",
          contentHash: `sha256:${marker}`,
          metadata: { smokeId: marker }
        });
        const sourceClaim = await sourceRepository.createSourceClaim({
          sourceArtifactId: sourceArtifact.id,
          claim: "A governing source must have captured bytes.",
          mechanism: "Captured bytes bind source authority to inspectable evidence.",
          krnImplication: "Uncaptured source claims must remain non-governing.",
          doesNotProve: "Captured bytes do not prove source truth.",
          sourceAuthority: "project-decision",
          supportType: "implementation-boundary",
          consumer: "source authority write boundary",
          falsifier: "An uncaptured claim becomes adopted decision support.",
          metadata: { smokeId: marker }
        });
        const sourceDecision = await sourceRepository.createSourceDecision({
          projectId,
          sourceClaimId: sourceClaim.id,
          status: "adopt",
          decision: "Adopt uncaptured source authority.",
          rationale: "This should be rejected before authority is persisted.",
          falsifier: "The uncaptured source claim becomes governing.",
          consumer: "source authority write boundary",
          metadata: { smokeId: marker }
        });
        const sourceDecisionEdge = await sourceRepository.createSourceDecisionEdge({
          sourceClaimId: sourceClaim.id,
          sourceDecisionId: sourceDecision.id,
          targetType: "architecture_decision",
          targetId: `${marker}-target`,
          supportType: "implementation-boundary",
          confidence: "high",
          notes: "This edge must not exist without captured evidence.",
          metadata: { smokeId: marker }
        });
        const claimReadback = await client<{ status: string }[]>`
          select status::text as status from source_claims where id = ${sourceClaim.id}
        `;
        const decisionCount = await client<{ count: number }[]>`
          select count(*)::int as count from source_decisions where id = ${sourceDecision.id}
        `;
        const edgeCount = await client<{ count: number }[]>`
          select count(*)::int as count from source_decision_edges where id = ${sourceDecisionEdge.id}
        `;
        const sourceChunkCount = await client<{ count: number }[]>`
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
        await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
        await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_artifacts where uri = ${sourceUri}`;
        if (workspaceId !== undefined) {
          await client`delete from workspaces where id = ${workspaceId}`;
        }
        await client.end();
      }
    }
  );
});
