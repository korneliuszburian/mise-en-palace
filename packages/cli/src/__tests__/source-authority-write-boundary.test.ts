import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createDatabaseRuntime } from "../database-runtime.js";
import { runCli } from "../run-cli.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

const persistedId = (stdout: string, label: string): string => {
  const match = new RegExp(`^${label}: ([^\\n]+)$`, "m").exec(stdout);

  if (match?.[1] === undefined) {
    throw new Error(`Missing ${label} in CLI output`);
  }

  return match[1];
};

describe("source authority write boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "reproduces generic CLI authority persisted without captured evidence",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-cli-boundary-${crypto.randomUUID()}`;
      const sourceTitle = `Uncaptured governing source ${marker}`;
      const createScopedRuntime = ({
        databaseUrl: runtimeDatabaseUrl,
        projectId,
        requireProjectKernelForExplicitProject,
        now,
        createId
      }: Parameters<typeof createDatabaseRuntime>[0]) =>
        createDatabaseRuntime({
          databaseUrl: runtimeDatabaseUrl,
          workspaceSlug: marker,
          projectSlug: marker,
          ...(projectId === undefined ? {} : { projectId }),
          ...(requireProjectKernelForExplicitProject === undefined
            ? {}
            : { requireProjectKernelForExplicitProject }),
          now,
          createId
        });

      try {
        const sourceClaimAdd = await runCli(
          [
            "source",
            "claim",
            "add",
            "--title",
            sourceTitle,
            "--claim",
            "A governing source must have captured bytes.",
            "--mechanism",
            "Captured bytes bind source authority to inspectable evidence.",
            "--does-not-prove",
            "Captured bytes do not prove source truth.",
            "--falsifier",
            "An uncaptured claim becomes adopted decision support.",
            "--support-type",
            "implementation-boundary",
            "--source-authority",
            "project-decision",
            "--consumer",
            "source authority CLI write boundary",
            "--metadata",
            `smokeId=${marker}`,
            "--persist"
          ],
          {
            env: { KRN_DATABASE_URL: databaseUrl },
            createDatabaseRuntime: createScopedRuntime
          }
        );
        expect({
          exitCode: sourceClaimAdd.exitCode,
          stderr: sourceClaimAdd.stderr,
          stdout: sourceClaimAdd.stdout
        }).toEqual({
          exitCode: 0,
          stderr: "",
          stdout: expect.stringContaining("sourceClaim:")
        });
        const sourceClaimId = persistedId(sourceClaimAdd.stdout, "sourceClaim");
        const sourceDecisionAdopt = await runCli(
          [
            "source",
            "decision",
            "adopt",
            "--source-claim-id",
            sourceClaimId,
            "--decision",
            "Adopt uncaptured source authority.",
            "--rationale",
            "This should be rejected before authority is persisted.",
            "--falsifier",
            "The uncaptured source claim becomes governing.",
            "--consumer",
            "source authority CLI write boundary",
            "--metadata",
            `smokeId=${marker}`,
            "--persist",
            "--link",
            "--link-target-type",
            "architecture_decision",
            "--link-target-id",
            `${marker}-target`,
            "--link-support-type",
            "implementation-boundary",
            "--link-confidence",
            "high",
            "--link-notes",
            "This edge must not exist without captured evidence."
          ],
          {
            env: { KRN_DATABASE_URL: databaseUrl },
            createDatabaseRuntime: createScopedRuntime
          }
        );
        expect({
          exitCode: sourceDecisionAdopt.exitCode,
          stderr: sourceDecisionAdopt.stderr,
          stdout: sourceDecisionAdopt.stdout
        }).toEqual({
          exitCode: 0,
          stderr: "",
          stdout: expect.stringContaining("sourceDecisionEdge:")
        });
        const sourceDecisionId = persistedId(sourceDecisionAdopt.stdout, "sourceDecision");
        const sourceDecisionEdgeId = persistedId(sourceDecisionAdopt.stdout, "sourceDecisionEdge");
        const claimReadback = await client<{ status: string }[]>`
          select status::text as status from source_claims where id = ${sourceClaimId}
        `;
        const decisionCount = await client<{ count: number }[]>`
          select count(*)::int as count from source_decisions where id = ${sourceDecisionId}
        `;
        const edgeCount = await client<{ count: number }[]>`
          select count(*)::int as count from source_decision_edges where id = ${sourceDecisionEdgeId}
        `;
        const sourceChunkCount = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_chunks
          where source_artifact_id = (select source_artifact_id from source_claims where id = ${sourceClaimId})
        `;

        expect({
          claimStatus: claimReadback[0]?.status,
          decisionCount: decisionCount[0]?.count,
          edgeCount: edgeCount[0]?.count,
          sourceChunkCount: sourceChunkCount[0]?.count
        }).toEqual({
          claimStatus: "accepted",
          decisionCount: 1,
          edgeCount: 1,
          sourceChunkCount: 0
        });
      } finally {
        await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
        await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
        await client`delete from source_artifacts where title = ${sourceTitle}`;
        await client`delete from workspaces where slug = ${marker}`;
        await client.end();
      }
    }
  );
});
