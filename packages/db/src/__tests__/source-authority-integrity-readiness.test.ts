import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { inspectSourceAuthorityIntegrity } from "../source-authority-integrity-readiness.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

const fixtureMetadata = (smokeId: string, evidenceContentHash = "sha256:fixture-evidence"): Record<string, unknown> => ({
  smokeId,
  evidenceStatus: "captured",
  evidenceContentHash
});

describe("source authority integrity readiness", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reports each controlled authority violation exactly once without writing",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-integrity-${crypto.randomUUID()}`;
      const workspace = await client<{ id: string }[]>`
        insert into workspaces (slug, display_name, metadata)
        values (${marker}, 'Source authority integrity smoke', ${client.json({ smokeId: marker })})
        returning id
      `;
      const workspaceId = workspace[0]?.id;
      if (workspaceId === undefined) {
        throw new Error("source authority integrity smoke workspace was not created");
      }

      const projects = await client<{ id: string; slug: string }[]>`
        insert into projects (workspace_id, slug, display_name, metadata)
        values
          (${workspaceId}, ${`${marker}-one`}, 'Source authority integrity one', ${client.json({ smokeId: marker })}),
          (${workspaceId}, ${`${marker}-two`}, 'Source authority integrity two', ${client.json({ smokeId: marker })})
        returning id, slug
      `;
      const projectOne = projects.find((project) => project.slug.endsWith("-one"))?.id;
      const projectTwo = projects.find((project) => project.slug.endsWith("-two"))?.id;
      if (projectOne === undefined || projectTwo === undefined) {
        throw new Error("source authority integrity smoke projects were not created");
      }

      const createArtifact = async (suffix: string, projectId = projectOne, metadata = fixtureMetadata(marker)) => {
        const rows = await client<{ id: string }[]>`
          insert into source_artifacts (project_id, kind, trust_tier, uri, title, content_hash, metadata)
          values (${projectId}, 'doc', 'project-decision', ${`source-authority://${marker}/${suffix}`}, ${suffix}, ${`sha256:${marker}:${suffix}`}, ${client.json(metadata)})
          returning id
        `;
        return rows[0]!.id;
      };
      const createClaim = async (artifactId: string, status: "proposed" | "accepted" = "proposed", metadata = fixtureMetadata(marker)) => {
        const rows = await client<{ id: string }[]>`
          insert into source_claims (source_artifact_id, claim, mechanism, krn_implication, does_not_prove, trust_tier, support_type, consumer, status, metadata)
          values (${artifactId}, 'fixture claim', 'fixture mechanism', 'fixture implication', 'fixture non-proof', 'project-decision', 'implementation-boundary', 'source authority smoke', ${status}, ${client.json(metadata)})
          returning id
        `;
        return rows[0]!.id;
      };
      const createDecision = async (claimId: string, status: "adopt" | "reject" | "defer", projectId = projectOne, metadata = fixtureMetadata(marker)) => {
        const rows = await client<{ id: string }[]>`
          insert into source_decisions (project_id, source_claim_id, status, decision, rationale, falsifier, consumer, metadata)
          values (${projectId}, ${claimId}, ${status}, 'fixture decision', 'fixture rationale', 'fixture falsifier', 'source authority smoke', ${client.json(metadata)})
          returning id
        `;
        return rows[0]!.id;
      };

      const mismatchArtifact = await createArtifact("project-mismatch");
      const mismatchClaim = await createClaim(mismatchArtifact);
      const mismatchDecision = await createDecision(mismatchClaim, "adopt", projectTwo);

      const missingArtifact = await createArtifact("missing-review");
      const missingClaim = await createClaim(missingArtifact, "accepted");

      const conflictArtifact = await createArtifact("conflict-review");
      const conflictClaim = await createClaim(conflictArtifact, "accepted");
      await createDecision(conflictClaim, "adopt");
      await createDecision(conflictClaim, "defer");

      const mismatchStatusArtifact = await createArtifact("status-mismatch");
      const mismatchStatusClaim = await createClaim(mismatchStatusArtifact, "accepted");
      await createDecision(mismatchStatusClaim, "defer");

      const invalidEdgeArtifact = await createArtifact("invalid-edge");
      const invalidEdgeClaim = await createClaim(invalidEdgeArtifact);
      const invalidEdgeDecision = await createDecision(invalidEdgeClaim, "reject");
      const invalidEdge = await client<{ id: string }[]>`
        insert into source_decision_edges (source_claim_id, source_decision_id, target_type, target_id, support_type, confidence, notes, metadata)
        values (${invalidEdgeClaim}, ${invalidEdgeDecision}, 'architecture_decision', ${`${marker}-invalid-edge`}, 'implementation-boundary', 'high', 'fixture edge', ${client.json({ smokeId: marker })})
        returning id
      `;

      const activeSearchArtifact = await createArtifact("active-search");
      const activeSearchClaim = await createClaim(activeSearchArtifact);
      const activeSearch = await client<{ id: string }[]>`
        insert into search_documents (project_id, subject_type, subject_id, source_artifact_id, source_claim_id, trust_tier, validity_status, title, body, search_text, metadata)
        values (${projectOne}, 'source_claim', ${activeSearchClaim}, ${activeSearchArtifact}, ${activeSearchClaim}, 'project-decision', 'active', 'fixture search', 'fixture body', 'fixture search', ${client.json({ smokeId: marker })})
        returning id
      `;

      const incompleteArtifact = await client<{ id: string }[]>`
        insert into source_artifacts (project_id, import_id, import_row_id, kind, trust_tier, uri, title, content_hash, metadata)
        values (${projectOne}, ${marker}, 'incomplete', 'doc', 'project-decision', ${`source-authority://${marker}/incomplete`}, 'incomplete', ${`sha256:${marker}:incomplete`}, ${client.json({ smokeId: marker, decisionCorpusStatus: "current" })})
        returning id
      `;

      const evidenceArtifact = await createArtifact("evidence-mismatch", projectOne, fixtureMetadata(marker, "sha256:artifact-evidence"));
      const evidenceClaim = await createClaim(evidenceArtifact, "accepted", fixtureMetadata(marker, "sha256:claim-evidence"));
      const evidenceChunk = await client<{ id: string }[]>`
        insert into source_chunks (source_artifact_id, ordinal, content, content_hash, metadata)
        values (${evidenceArtifact}, 0, 'fixture evidence chunk', ${`sha256:${marker}:chunk`}, ${client.json(fixtureMetadata(marker, "sha256:chunk-evidence"))})
        returning id
      `;
      const evidenceDecision = await createDecision(evidenceClaim, "adopt", projectOne, fixtureMetadata(marker, "sha256:decision-evidence"));

      try {
        const before = await client<{ count: number }[]>`select count(*)::int as count from source_artifacts`;
        const report = await inspectSourceAuthorityIntegrity({ databaseUrl: databaseUrl! });
        const after = await client<{ count: number }[]>`select count(*)::int as count from source_artifacts`;
        const fixtureSubjectIds = [
          mismatchDecision,
          missingClaim,
          conflictClaim,
          mismatchStatusClaim,
          invalidEdge[0]!.id,
          activeSearch[0]!.id,
          incompleteArtifact[0]!.id,
          evidenceDecision
        ];
        const fixtureViolations = report.violations.filter((item) => fixtureSubjectIds.includes(item.subjectId));

        expect(report.readOnly).toBe(true);
        expect(after[0]?.count).toBe(before[0]?.count);
        expect(new Set(fixtureViolations.map((item) => item.id)).size).toBe(fixtureViolations.length);
        expect(fixtureViolations).toEqual(expect.arrayContaining([
          expect.objectContaining({ kind: "project_mismatch", subjectId: mismatchDecision }),
          expect.objectContaining({ kind: "missing_terminal_review", subjectId: missingClaim }),
          expect.objectContaining({ kind: "conflicting_terminal_review", subjectId: conflictClaim }),
          expect.objectContaining({ kind: "claim_decision_status_mismatch", subjectId: mismatchStatusClaim }),
          expect.objectContaining({ kind: "governing_edge_without_current_reviewed_decision", subjectId: invalidEdge[0]!.id }),
          expect.objectContaining({ kind: "active_search_without_canonical_authority", subjectId: activeSearch[0]!.id }),
          expect.objectContaining({ kind: "incomplete_import_lifecycle", subjectId: incompleteArtifact[0]!.id }),
          expect.objectContaining({ kind: "captured_evidence_missing_or_mismatched", subjectId: evidenceDecision })
        ]));
      } finally {
        await client`delete from workspaces where id = ${workspaceId}`;
        await client.end();
      }
      void evidenceChunk;
    }
  );
});
