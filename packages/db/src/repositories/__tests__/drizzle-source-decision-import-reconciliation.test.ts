import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createKrnDatabase } from "../../database.js";
import { DrizzleProjectRepository } from "../drizzle-project-repository.js";
import {
  DrizzleSourceDecisionImportRepository
} from "../drizzle-source-decision-import-repository.js";
import { DrizzleSourceRepository } from "../drizzle-source-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const pageSize = 25;

describe("source decision import reconciliation", () => {
  postgresIt("admits current captured evidence only from the requested project", async () => {
    const marker = `captured-project-evidence-${crypto.randomUUID()}`;
    const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
    const db = createKrnDatabase(client);
    const projectRepository = new DrizzleProjectRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const importRepository = new DrizzleSourceDecisionImportRepository(db);
    const workspaceIds: string[] = [];
    const projectIds: string[] = [];

    try {
      const workspace = await projectRepository.createWorkspace({
        slug: marker,
        displayName: "Captured evidence project isolation",
        metadata: { smokeId: marker }
      });
      workspaceIds.push(workspace.id);
      const firstProject = await projectRepository.createProject({
        workspaceId: workspace.id,
        slug: `${marker}-first`,
        displayName: "Captured evidence first project",
        metadata: { smokeId: marker }
      });
      const secondProject = await projectRepository.createProject({
        workspaceId: workspace.id,
        slug: `${marker}-second`,
        displayName: "Captured evidence second project",
        metadata: { smokeId: marker }
      });
      const missingProject = await projectRepository.createProject({
        workspaceId: workspace.id,
        slug: `${marker}-missing`,
        displayName: "Captured evidence missing project",
        metadata: { smokeId: marker }
      });
      projectIds.push(firstProject.id, secondProject.id, missingProject.id);
      const content = "Reviewed Complete CSS evidence slice";
      const contentHash = crypto.createHash("sha256").update(content).digest("hex");
      const storedContentHash = `sha256:${contentHash}`;
      const evidenceRef = `krn-source://sha256/${contentHash}`;
      const firstHeader = "Complete CSS captured header";
      const firstHeaderHash = `sha256:${crypto.createHash("sha256").update(firstHeader).digest("hex")}`;
      const firstArtifactHash = `sha256:${crypto.createHash("sha256").update(`${firstHeader}\n${content}`).digest("hex")}`;
      const firstArtifact = await sourceRepository.createSourceArtifact({
        projectId: firstProject.id,
        kind: "file",
        sourceAuthority: "source-code",
        uri: `file:///outside-repo/complete-css.html?capture=${marker}-first`,
        title: "Complete CSS evidence slice",
        contentHash: firstArtifactHash,
        metadata: {
          smokeId: marker,
          evidenceFreshness: "current"
        }
      });
      await sourceRepository.createSourceChunk({
        sourceArtifactId: firstArtifact.id,
        ordinal: 1,
        content: firstHeader,
        contentHash: firstHeaderHash,
        metadata: { smokeId: marker }
      });
      const firstEvidenceChunk = await sourceRepository.createSourceChunk({
        sourceArtifactId: firstArtifact.id,
        ordinal: 2,
        content,
        contentHash: storedContentHash,
        metadata: { smokeId: marker }
      });
      const secondHeader = "Different-machine captured header";
      const secondHeaderHash = `sha256:${crypto.createHash("sha256").update(secondHeader).digest("hex")}`;
      const secondArtifactHash = `sha256:${crypto.createHash("sha256").update(`${secondHeader}\n${content}`).digest("hex")}`;
      const secondArtifact = await sourceRepository.createSourceArtifact({
        projectId: secondProject.id,
        kind: "file",
        sourceAuthority: "source-code",
        uri: `file:///different-machine/complete-css.html?capture=${marker}-second`,
        title: "Complete CSS evidence slice",
        contentHash: secondArtifactHash,
        metadata: {
          smokeId: marker,
          evidenceFreshness: "current"
        }
      });
      await sourceRepository.createSourceChunk({
        sourceArtifactId: secondArtifact.id,
        ordinal: 1,
        content: secondHeader,
        contentHash: secondHeaderHash,
        metadata: { smokeId: marker }
      });
      const secondEvidenceChunk = await sourceRepository.createSourceChunk({
        sourceArtifactId: secondArtifact.id,
        ordinal: 2,
        content,
        contentHash: storedContentHash,
        metadata: { smokeId: marker }
      });

      expect(await importRepository.getCapturedSourceEvidence({
        projectId: firstProject.id,
        evidenceRef,
        contentHash
      })).toMatchObject({
        status: "captured",
        evidenceRef,
        content,
        contentHash: storedContentHash,
        freshness: "current",
        provenance: {
          kind: "source_artifact",
          sourceArtifactId: firstArtifact.id,
          sourceChunkId: firstEvidenceChunk.id
        }
      });
      expect(await importRepository.getCapturedSourceEvidence({
        projectId: secondProject.id,
        evidenceRef,
        contentHash
      })).toMatchObject({
        status: "captured",
        evidenceRef,
        contentHash: storedContentHash,
        freshness: "current",
        provenance: {
          kind: "source_artifact",
          sourceArtifactId: secondArtifact.id,
          sourceChunkId: secondEvidenceChunk.id
        }
      });
      expect(await importRepository.getCapturedSourceEvidence({
        projectId: missingProject.id,
        evidenceRef,
        contentHash
      })).toMatchObject({
        status: "missing",
        evidenceRef
      });

      const snapshotUri = `https://example.com/complete-css/${marker}`;
      await client`
        insert into source_snapshots (
          id,
          source_artifact_id,
          snapshot_uri,
          content_hash,
          metadata
        ) values (
          ${crypto.randomUUID()},
          ${firstArtifact.id},
          ${snapshotUri},
          ${firstHeaderHash},
          ${JSON.stringify({ smokeId: marker, evidenceFreshness: "unknown" })}::jsonb
        )
      `;
      expect(await importRepository.getCapturedSourceEvidence({
        projectId: firstProject.id,
        evidenceRef: snapshotUri
      })).toMatchObject({
        status: "captured",
        evidenceRef: snapshotUri,
        content: firstHeader,
        freshness: "unknown",
        provenance: {
          kind: "source_snapshot",
          sourceArtifactId: firstArtifact.id
        }
      });
    } finally {
      await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
      if (projectIds.length > 0) {
        await client`delete from projects where id in ${client(projectIds)}`;
      }
      if (workspaceIds.length > 0) {
        await client`delete from workspaces where id in ${client(workspaceIds)}`;
      }
      await client.end();
    }
  });

  postgresIt("aggregates equivalent manifests once per bounded page", async () => {
    const marker = `reconciliation-page-${crypto.randomUUID()}`;
    let measuredQueryCount = 0;
    let measuring = false;
    const client = postgres(databaseUrl!, {
      max: 1,
      onnotice: () => undefined,
      debug: () => {
        if (measuring) measuredQueryCount += 1;
      }
    });
    const db = createKrnDatabase(client);
    const projectRepository = new DrizzleProjectRepository(db);
    const sourceRepository = new DrizzleSourceRepository(db);
    const reconciliationRepository = new DrizzleSourceDecisionImportRepository(db);
    let workspaceId: string | undefined;
    let projectId: string | undefined;

    try {
      const workspace = await projectRepository.createWorkspace({
        slug: marker,
        displayName: "Reconciliation page query proof",
        metadata: { smokeId: marker }
      });
      workspaceId = workspace.id;
      const project = await projectRepository.createProject({
        workspaceId: workspace.id,
        slug: marker,
        displayName: "Reconciliation page query proof",
        metadata: { smokeId: marker }
      });
      projectId = project.id;
      const contentHash = crypto
        .createHash("sha256")
        .update("shared-reconciliation-manifest")
        .digest("hex");

      for (let index = 0; index < pageSize; index += 1) {
        const importId = `${marker}-${index.toString().padStart(2, "0")}`;

        await sourceRepository.createSourceArtifact({
          projectId: project.id,
          importId,
          importRowId: "shared-row",
          kind: "doc",
          sourceAuthority: "project-decision",
          uri: `source-decision-import://${importId}/shared-row`,
          title: `Reconciliation import ${index}`,
          contentHash,
          metadata: { smokeId: marker }
        });
      }

      expect(await reconciliationRepository.findEquivalentSourceDecisionImportIds({
        projectId: project.id,
        manifest: [{ decisionId: "shared-row", contentHash }]
      })).toEqual([
        `${marker}-00`,
        `${marker}-01`
      ]);

      measuring = true;
      const report = await reconciliationRepository.listSourceDecisionImportReconciliation({
        projectId: project.id,
        limit: pageSize
      });
      measuring = false;

      expect(report.imports).toMatchObject({
        totalCount: pageSize,
        returnedCount: pageSize,
        truncated: false
      });
      expect(report.nextAfterImportId).toBeNull();
      expect(report.imports.items).toHaveLength(pageSize);
      for (const imported of report.imports.items) {
        expect(imported).toMatchObject({
          lifecycle: "partial",
          rowCount: 1,
          completeRowCount: 0,
          partialRowCount: 1,
          equivalentImportIds: {
            totalCount: pageSize - 1,
            returnedCount: pageSize - 1,
            truncated: false
          }
        });
        expect(imported.equivalentImportIds.items).not.toContain(imported.importId);
      }
      expect(measuredQueryCount).toBeLessThanOrEqual(pageSize + 3);
    } finally {
      measuring = false;
      await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
      if (projectId !== undefined) {
        await client`delete from projects where id = ${projectId}`;
      }
      if (workspaceId !== undefined) {
        await client`delete from workspaces where id = ${workspaceId}`;
      }
      await client.end();
    }
  });
});
