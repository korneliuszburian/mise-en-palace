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
