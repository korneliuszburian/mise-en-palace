import crypto from "node:crypto";

import postgres from "postgres";
import { describe, expect, it } from "vitest";

import { createDatabaseRuntime } from "../database-runtime.js";
import { runCli } from "../run-cli.js";
import type {
  DatabaseRuntime,
  DatabaseRuntimeInput,
  DatabaseRuntimeTransaction
} from "../database-runtime.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();

const persistedId = (stdout: string, label: string): string => {
  const match = new RegExp(`^${label}: ([^\\n]+)$`, "m").exec(stdout);

  if (match?.[1] === undefined) {
    throw new Error(`Missing ${label} in CLI output`);
  }

  return match[1];
};

const scopedDatabaseRuntime = (marker: string) => ({
  databaseUrl: runtimeDatabaseUrl,
  projectId,
  requireProjectKernelForExplicitProject,
  now,
  createId
}: DatabaseRuntimeInput): Promise<DatabaseRuntime> =>
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

const seedCapturedClaim = async (marker: string): Promise<{
  readonly projectId: string;
  readonly sourceClaimId: string;
  readonly sourceChunkId: string;
}> => {
  const createRuntime = scopedDatabaseRuntime(marker);
  const runtime = await createRuntime({
    databaseUrl: databaseUrl!,
    workspaceSlug: marker,
    projectSlug: marker,
    now: () => new Date().toISOString(),
    createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
  });
  const metadata = {
    smokeId: marker,
    evidenceRef: `source-authority://${marker}/captured`,
    evidenceStatus: "captured",
    evidenceContentHash: `sha256:${marker}:captured-evidence`,
    evidenceFreshness: "current"
  };

  try {
    if (runtime.sourceRepository.createSourceChunk === undefined) {
      throw new Error("SourceChunk persistence is unavailable in captured authority fixture");
    }

    const sourceArtifact = await runtime.sourceRepository.createSourceArtifact({
      projectId: runtime.projectId,
      kind: "doc",
      sourceAuthority: "project-decision",
      uri: `source-authority://${marker}/captured`,
      title: `Captured governing source ${marker}`,
      contentHash: `sha256:${marker}:artifact`,
      metadata
    });
    const sourceChunk = await runtime.sourceRepository.createSourceChunk({
      sourceArtifactId: sourceArtifact.id,
      ordinal: 0,
      content: "Captured-current evidence bytes for CLI authority.",
      contentHash: `sha256:${marker}:chunk`,
      metadata
    });
    const sourceClaim = await runtime.sourceRepository.createSourceClaim({
      sourceArtifactId: sourceArtifact.id,
      sourceChunkId: sourceChunk.id,
      claim: "A coherent captured-current source may govern.",
      mechanism: "The exact cited chunk retains inspectable evidence bytes.",
      krnImplication: "CLI adoption may promote only this coherent evidence chain.",
      doesNotProve: "Captured bytes do not prove source truth.",
      sourceAuthority: "project-decision",
      supportType: "implementation-boundary",
      consumer: "source authority CLI write boundary",
      falsifier: "The captured-current claim cannot be adopted.",
      metadata
    });

    return {
      projectId: runtime.projectId,
      sourceClaimId: sourceClaim.id,
      sourceChunkId: sourceChunk.id
    };
  } finally {
    await runtime.close();
  }
};

const adoptAndLinkArgs = (marker: string, sourceClaimId: string): string[] => [
  "source",
  "decision",
  "adopt",
  "--source-claim-id",
  sourceClaimId,
  "--decision",
  "Adopt captured-current source authority.",
  "--rationale",
  "The exact cited chunk retains coherent current evidence.",
  "--falsifier",
  "The captured-current claim cannot become governing.",
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
  "The captured-current chain supports this target."
];

const faultingScopedDatabaseRuntime = (marker: string) => async (
  input: DatabaseRuntimeInput
): Promise<DatabaseRuntime> => {
  const runtime = await scopedDatabaseRuntime(marker)(input);
  const withTransaction = runtime.withTransaction;

  if (withTransaction === undefined) {
    await runtime.close();
    throw new Error("Database transaction is unavailable in atomic rollback fixture");
  }

  return {
    ...runtime,
    withTransaction: async <T>(
      lockKey: string,
      work: (transactionRuntime: DatabaseRuntimeTransaction) => Promise<T>
    ): Promise<T> => withTransaction(lockKey, async (transactionRuntime) => {
      const createSourceDecisionEdge = transactionRuntime.sourceRepository.createSourceDecisionEdge;

      return work({
        ...transactionRuntime,
        sourceRepository: {
          ...transactionRuntime.sourceRepository,
          createSourceDecisionEdge: async (edgeInput) => {
            await createSourceDecisionEdge(edgeInput);
            throw new Error("injected source decision edge failure");
          }
        }
      });
    })
  };
};

const cleanupMarker = async (
  client: ReturnType<typeof postgres>,
  marker: string
): Promise<void> => {
  await client`delete from outbox_events where payload->>'smokeId' = ${marker}`;
  await client`delete from source_decision_edges where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_decisions where metadata->>'smokeId' = ${marker}`;
  await client`delete from source_artifacts where metadata->>'smokeId' = ${marker}`;
  await client`delete from workspaces where slug = ${marker}`;
};

describe("source authority write boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rejects generic CLI authority without captured evidence",
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
        const previewClaim = await client<{ sourceChunkId: string | null; status: string }[]>`
          select source_chunk_id::text as "sourceChunkId", status::text as status
          from source_claims
          where id = ${sourceClaimId}
        `;
        expect(previewClaim).toEqual([{ sourceChunkId: null, status: "proposed" }]);
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
          exitCode: 1,
          stderr: expect.stringContaining(
            "SourceDecision adopt requires coherent captured-current evidence"
          ),
          stdout: ""
        });
        const claimReadback = await client<{ sourceChunkId: string | null; status: string }[]>`
          select source_chunk_id::text as "sourceChunkId", status::text as status
          from source_claims
          where id = ${sourceClaimId}
        `;
        const decisionCount = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_decisions
          where source_claim_id = ${sourceClaimId}
        `;
        const edgeCount = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_decision_edges
          where source_claim_id = ${sourceClaimId}
        `;
        const sourceChunkCount = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_chunks
          where source_artifact_id = (select source_artifact_id from source_claims where id = ${sourceClaimId})
        `;
        const outboxTopics = await client<{ topic: string }[]>`
          select topic
          from outbox_events
          where payload->>'smokeId' = ${marker}
          order by topic, id
        `;

        expect({
          claimStatus: claimReadback[0]?.status,
          sourceChunkId: claimReadback[0]?.sourceChunkId,
          decisionCount: decisionCount[0]?.count,
          edgeCount: edgeCount[0]?.count,
          sourceChunkCount: sourceChunkCount[0]?.count,
          outboxTopics: outboxTopics.map((row) => row.topic)
        }).toEqual({
          claimStatus: "proposed",
          sourceChunkId: null,
          decisionCount: 0,
          edgeCount: 0,
          sourceChunkCount: 0,
          outboxTopics: []
        });
      } finally {
        await cleanupMarker(client, marker);
        await client.end();
      }
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "persists one captured-current CLI authority transaction",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-cli-valid-${crypto.randomUUID()}`;

      try {
        const { sourceClaimId, sourceChunkId } = await seedCapturedClaim(marker);
        const result = await runCli(adoptAndLinkArgs(marker, sourceClaimId), {
          env: { KRN_DATABASE_URL: databaseUrl },
          createDatabaseRuntime: scopedDatabaseRuntime(marker)
        });

        expect({
          exitCode: result.exitCode,
          stderr: result.stderr,
          stdout: result.stdout
        }).toEqual({
          exitCode: 0,
          stderr: "",
          stdout: expect.stringContaining("sourceDecisionEdge:")
        });

        const sourceDecisionId = persistedId(result.stdout, "sourceDecision");
        const sourceDecisionEdgeId = persistedId(result.stdout, "sourceDecisionEdge");
        const authorityState = await client<{
          claimStatus: string;
          decisionStatus: string;
          evidenceStatus: string;
          evidenceContentHash: string;
          evidenceFreshness: string;
          sourceChunkId: string;
        }[]>`
          select
            claim.status::text as "claimStatus",
            decision.status::text as "decisionStatus",
            decision.metadata->>'evidenceStatus' as "evidenceStatus",
            decision.metadata->>'evidenceContentHash' as "evidenceContentHash",
            decision.metadata->>'evidenceFreshness' as "evidenceFreshness",
            claim.source_chunk_id::text as "sourceChunkId"
          from source_claims claim
          join source_decisions decision on decision.source_claim_id = claim.id
          where claim.id = ${sourceClaimId}
            and decision.id = ${sourceDecisionId}
        `;
        const edgeIds = await client<{ id: string }[]>`
          select id::text as id
          from source_decision_edges
          where source_claim_id = ${sourceClaimId}
        `;
        const outboxTopics = await client<{ topic: string }[]>`
          select topic
          from outbox_events
          where payload->>'smokeId' = ${marker}
          order by case topic
            when 'source.decision.created' then 1
            when 'source.decision_edge.created' then 2
            else 3
          end
        `;

        expect(authorityState).toEqual([{
          claimStatus: "accepted",
          decisionStatus: "adopt",
          evidenceStatus: "captured",
          evidenceContentHash: `sha256:${marker}:captured-evidence`,
          evidenceFreshness: "current",
          sourceChunkId
        }]);
        expect(edgeIds).toEqual([{ id: sourceDecisionEdgeId }]);
        expect(outboxTopics.map((row) => row.topic)).toEqual([
          "source.decision.created",
          "source.decision_edge.created"
        ]);
      } finally {
        await cleanupMarker(client, marker);
        await client.end();
      }
    }
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "rolls back the entire CLI authority transaction when edge persistence fails",
    async () => {
      const client = postgres(databaseUrl!, { max: 1, onnotice: () => undefined });
      const marker = `source-authority-cli-rollback-${crypto.randomUUID()}`;

      try {
        const { sourceClaimId, sourceChunkId } = await seedCapturedClaim(marker);
        const result = await runCli(adoptAndLinkArgs(marker, sourceClaimId), {
          env: { KRN_DATABASE_URL: databaseUrl },
          createDatabaseRuntime: faultingScopedDatabaseRuntime(marker)
        });

        expect(result).toEqual({
          exitCode: 1,
          stderr: expect.stringContaining("injected source decision edge failure"),
          stdout: ""
        });

        const state = await client<{
          claimStatus: string;
          sourceChunkId: string;
          decisionCount: number;
          edgeCount: number;
          outboxCount: number;
        }[]>`
          select
            claim.status::text as "claimStatus",
            claim.source_chunk_id::text as "sourceChunkId",
            (select count(*)::int from source_decisions decision where decision.source_claim_id = claim.id) as "decisionCount",
            (select count(*)::int from source_decision_edges edge where edge.source_claim_id = claim.id) as "edgeCount",
            (select count(*)::int from outbox_events event where event.payload->>'smokeId' = ${marker}) as "outboxCount"
          from source_claims claim
          where claim.id = ${sourceClaimId}
        `;

        expect(state).toEqual([{
          claimStatus: "proposed",
          sourceChunkId,
          decisionCount: 0,
          edgeCount: 0,
          outboxCount: 0
        }]);
      } finally {
        await cleanupMarker(client, marker);
        await client.end();
      }
    }
  );
});
