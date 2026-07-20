import { execFile } from "node:child_process";
import crypto from "node:crypto";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  migrateDatabase
} from "@krn/db/dev";
import postgres from "postgres";
import { describe, expect, it } from "vitest";

import {
  projectDecisionPacketSupportingEvidence
} from "@krn/core";
import {
  createDatabaseRuntime,
  defaultProjectSlug,
  defaultWorkspaceSlug
} from "../database-runtime.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const migrationsFolder = path.join(repoRoot, "packages", "db", "src", "migrations");
const fixturePath = path.join(
  repoRoot,
  "tests",
  "fixtures",
  "decision-corpus-ingest",
  "source-import-retry.json"
);

interface ImportGraphCounts {
  readonly artifactCount: number;
  readonly projectCount: number;
  readonly chunkCount: number;
  readonly claimCount: number;
  readonly decisionCount: number;
  readonly decisionEdgeCount: number;
  readonly searchDocumentCount: number;
  readonly rejectionCount: number;
}

const databaseUrlFor = (input: string, databaseName: string): string => {
  const parsed = new URL(input);
  parsed.pathname = `/${databaseName}`;
  return parsed.toString();
};

const createDisposableDatabase = async (input: string): Promise<{
  readonly databaseUrl: string;
  readonly cleanup: () => Promise<void>;
}> => {
  const databaseName = `krn_source_import_retry_${crypto.randomUUID().replaceAll("-", "")}`;
  const adminClient = postgres(databaseUrlFor(input, "postgres"), {
    max: 1,
    onnotice: () => undefined
  });

  try {
    await adminClient.unsafe(`create database ${databaseName}`);
  } catch (error) {
    await adminClient.end();
    throw error;
  }

  return {
    databaseUrl: databaseUrlFor(input, databaseName),
    cleanup: async () => {
      try {
        await adminClient.unsafe(`drop database if exists ${databaseName} with (force)`);
      } finally {
        await adminClient.end();
      }
    }
  };
};

const runSourceImportCli = async (input: {
  readonly databaseUrl?: string;
  readonly filePath?: string;
  readonly persist: boolean;
  readonly repoPath?: string;
}) =>
  execFileAsync("pnpm", [
    "--silent",
    "--filter",
    "@krn/cli",
    "krn",
    "source",
    "decision",
    "import",
    "--file",
    input.filePath ?? fixturePath,
    ...(input.repoPath === undefined ? [] : ["--repo", input.repoPath]),
    ...(input.persist ? ["--persist"] : []),
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(input.databaseUrl === undefined ? {} : { KRN_DATABASE_URL: input.databaseUrl })
    }
  });

const runSourcePreviewCli = async (input: {
  readonly databaseUrl: string;
  readonly filePath: string;
  readonly repoPath: string;
}) =>
  execFileAsync("pnpm", [
    "--silent",
    "--filter",
    "@krn/cli",
    "krn",
    "source",
    "artifact",
    "preview",
    "--file",
    input.filePath,
    "--repo",
    input.repoPath,
    "--chunk-lines",
    "1",
    "--all-chunks",
    "--source-authority",
    "practitioner",
    "--persist",
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      KRN_DATABASE_URL: input.databaseUrl
    }
  });

const runPlanCli = async (input: {
  readonly databaseUrl: string;
  readonly repoPath: string;
  readonly task: string;
}) =>
  execFileAsync("pnpm", [
    "--silent",
    "--filter",
    "@krn/cli",
    "krn",
    "plan",
    "--repo",
    input.repoPath,
    "--task",
    input.task,
    "--persist",
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      KRN_DATABASE_URL: input.databaseUrl
    }
  });

const runDecisionPacketCli = async (input: {
  readonly databaseUrl: string;
  readonly runId: string;
}) =>
  execFileAsync("pnpm", [
    "--silent",
    "--filter",
    "@krn/cli",
    "krn",
    "decision",
    "packet",
    "--run-id",
    input.runId,
    "--json"
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      KRN_DATABASE_URL: input.databaseUrl
    }
  });

interface SourceDecisionImportOutput {
  readonly persistence: "enabled" | "disabled";
  readonly importId: string;
  readonly projectId?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sourceDecisionImportOutput = (stdout: string): SourceDecisionImportOutput => {
  const parsed: unknown = JSON.parse(stdout);

  if (
    !isRecord(parsed) ||
    typeof parsed["persistence"] !== "string" ||
    (parsed["persistence"] !== "enabled" && parsed["persistence"] !== "disabled") ||
    typeof parsed["importId"] !== "string"
  ) {
    throw new Error("source decision import CLI did not emit a typed import identity");
  }

  return {
    persistence: parsed["persistence"],
    importId: parsed["importId"],
    ...(typeof parsed["projectId"] === "string"
      ? { projectId: parsed["projectId"] }
      : {})
  };
};

const executionRunIdFromPlan = (stdout: string): string => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed)) {
    throw new Error("plan CLI did not emit an object");
  }
  const handoff = parsed["handoff"];
  if (!isRecord(handoff) || handoff["kind"] !== "persisted") {
    throw new Error("plan CLI did not emit a persisted handoff");
  }
  const identity = handoff["identity"];
  if (!isRecord(identity) || typeof identity["executionRunId"] !== "string") {
    throw new Error("plan CLI did not emit an execution run identity");
  }

  return identity["executionRunId"];
};

interface PacketSourceProjection {
  readonly sourceDecisionIds: readonly string[];
  readonly supportingEvidence: readonly Record<string, unknown>[];
}

const sourceProjectionFromPacket = (stdout: string): PacketSourceProjection => {
  const parsed: unknown = JSON.parse(stdout);

  if (!isRecord(parsed) || !isRecord(parsed["packet"])) {
    throw new Error("decision packet CLI did not emit a packet");
  }
  const sourceDecisionIds = parsed["packet"]["sourceDecisionIds"];
  if (
    !Array.isArray(sourceDecisionIds) ||
    !sourceDecisionIds.every((value) => typeof value === "string")
  ) {
    throw new Error("decision packet CLI did not emit source decision identities");
  }

  const contextInclusions = parsed["packet"]["contextInclusions"];
  if (!Array.isArray(contextInclusions)) {
    throw new Error("decision packet CLI did not emit context inclusions");
  }

  return {
    sourceDecisionIds,
    supportingEvidence: contextInclusions.flatMap((inclusion) => {
      if (!isRecord(inclusion) || !isRecord(inclusion["supportingEvidence"])) {
        return [];
      }

      return [inclusion["supportingEvidence"]];
    })
  };
};

const writeReorderedTaskScopesFixture = async (filePath: string): Promise<void> => {
  const fixture = await readFile(fixturePath, "utf8");
  const reordered = fixture.replace(
    '"taskScopes": ["source-import-retry", "source-authority"]',
    '"taskScopes": ["source-authority", "source-import-retry"]'
  );

  if (reordered === fixture) {
    throw new Error("source import retry fixture is missing reorderable task scopes");
  }

  await writeFile(filePath, reordered, "utf8");
};

const writeEquivalentIdentityVariantFixture = async (filePath: string): Promise<void> => {
  const fixture = await readFile(fixturePath, "utf8");
  const variant = fixture.replace(
    '"corpusName": "source-import-retry-fixture"',
    '"corpusName": "source-import-retry-equivalent-identity-variant"'
  );

  if (variant === fixture) {
    throw new Error("source import retry fixture is missing a variant corpus name");
  }

  await writeFile(filePath, variant, "utf8");
};

const duplicateImportGraphCounts = async (
  client: ReturnType<typeof postgres>
): Promise<ImportGraphCounts> => {
  const rows = await client<ImportGraphCounts[]>`
    with imported_artifacts as (
      select id, project_id
      from source_artifacts
      where import_row_id = 'source-import-retry-fixture'
    )
    select
      (select count(*)::int from imported_artifacts) as "artifactCount",
      (select count(distinct project_id)::int from imported_artifacts) as "projectCount",
      (
        select count(*)::int
        from source_chunks
        join imported_artifacts
          on imported_artifacts.id = source_chunks.source_artifact_id
      ) as "chunkCount",
      (
        select count(*)::int
        from source_claims
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "claimCount",
      (
        select count(*)::int
        from source_decisions
        join source_claims
          on source_claims.id = source_decisions.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "decisionCount",
      (
        select count(*)::int
        from source_decision_edges
        join source_claims
          on source_claims.id = source_decision_edges.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "decisionEdgeCount",
      (
        select count(*)::int
        from search_documents
        join source_claims
          on source_claims.id = search_documents.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "searchDocumentCount",
      (
        select count(*)::int
        from source_rejections
        join source_claims
          on source_claims.id = source_rejections.source_claim_id
        join imported_artifacts
          on imported_artifacts.id = source_claims.source_artifact_id
      ) as "rejectionCount"
  `;
  const counts = rows[0];

  if (counts === undefined) {
    throw new Error("missing duplicate import graph counts");
  }

  return counts;
};

describe("source decision import retry boundary", () => {
  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "installs one content-addressed corpus independently into connected projects",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });
      const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "krn-source-import-connected-"));
      const firstRepo = path.join(temporaryDirectory, "first-repo");
      const secondRepo = path.join(temporaryDirectory, "second-repo");
      const corpusPath = path.join(temporaryDirectory, "reviewed-corpus.json");
      const coursePath = path.join(temporaryDirectory, "complete-css-course.txt");

      try {
        await mkdir(firstRepo);
        await mkdir(secondRepo);
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const workspaceId = crypto.randomUUID();
        const firstProjectId = crypto.randomUUID();
        const secondProjectId = crypto.randomUUID();
        const evidenceBody = [
          "Composition owns external layout; blocks expose bounded custom-property inputs.",
          "course-detail ".repeat(220)
        ].join(" ");
        const evidenceContent = [
          `<p>${evidenceBody}</p>`,
          '<a class="block-action"><span>Next lesson</span><img src="data:image/jpeg;base64,course-navigation-noise"></a>'
        ].join("");
        const renderedEvidenceContent = projectDecisionPacketSupportingEvidence(
          evidenceContent
        ).content;
        expect(projectDecisionPacketSupportingEvidence(
          "<p>Current authority &AMP; invalid entity &#x110000; remains inspectable.</p>"
        ).content).toBe(
          "Current authority & invalid entity &#x110000; remains inspectable."
        );
        expect(projectDecisionPacketSupportingEvidence(
          `<p>Keep this mechanism ${"QUJD".repeat(40)} without copied payload.</p>`
        ).content).toBe("Keep this mechanism without copied payload.");
        const task = "Implement a frontend component layout with reusable composition and CSS custom properties.";
        const evidenceHash = crypto.createHash("sha256").update(evidenceContent).digest("hex");
        const renderedEvidenceHash = crypto.createHash("sha256")
          .update(renderedEvidenceContent)
          .digest("hex");
        const storedEvidenceHash = `sha256:${evidenceHash}`;
        const rawCorpusNoise = Array.from(
          { length: 14 },
          (_, index) => `${task} unreviewed raw course chunk ${index + 1}`
        );
        const corpus = {
          version: "1",
          corpusName: "Connected frontend authority",
          coverageScope: {
            declaredRows: [{
              decisionId: "composition-owns-layout",
              evidenceRefs: [`krn-source://sha256/${evidenceHash}`]
            }]
          },
          decisions: [{
            id: "composition-owns-layout",
            title: "Composition owns external layout",
            statement: "Reusable compositions own inter-component placement; blocks expose only bounded configuration inputs.",
            status: "current",
            taskScopes: ["frontend", "component", "layout"],
            evidenceRef: `krn-source://sha256/${evidenceHash}`,
            falsifier: "A block must duplicate external layout declarations to work in two supported contexts.",
            doesNotProve: "This decision does not prove one composition fits every art-directed layout.",
            noteText: "Prefer an existing composition and configure it through intentional CSS custom properties before adding block-local layout."
          }]
        };

        await writeFile(corpusPath, `${JSON.stringify(corpus, null, 2)}\n`, "utf8");
        await writeFile(
          coursePath,
          [...rawCorpusNoise, evidenceContent].join("\n"),
          "utf8"
        );
        await client`
          insert into workspaces (id, slug, display_name)
          values (${workspaceId}, ${`connected-${workspaceId}`}, 'Connected corpus test')
        `;
        const previewReadbacks: unknown[] = [];

        for (const [projectId, repoPath, suffix] of [
          [firstProjectId, firstRepo, "first"],
          [secondProjectId, secondRepo, "second"]
        ] as const) {
          await client`
            insert into projects (id, workspace_id, slug, display_name)
            values (${projectId}, ${workspaceId}, ${`connected-${suffix}`}, ${`Connected ${suffix}`})
          `;
          await client`
            insert into repo_installations (
              id,
              project_id,
              provider,
              repo_url,
              default_branch,
              local_path_hint
            ) values (
              ${crypto.randomUUID()},
              ${projectId},
              'local',
              ${`file://${repoPath}`},
              'main',
              ${repoPath}
            )
          `;
          const preview = await runSourcePreviewCli({
            databaseUrl: disposableDatabase.databaseUrl,
            filePath: coursePath,
            repoPath
          });
          previewReadbacks.push(JSON.parse(preview.stdout) as unknown);
        }

        const first = sourceDecisionImportOutput((await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: corpusPath,
          persist: true,
          repoPath: firstRepo
        })).stdout);
        const firstRetry = sourceDecisionImportOutput((await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: corpusPath,
          persist: true,
          repoPath: firstRepo
        })).stdout);
        const second = sourceDecisionImportOutput((await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: corpusPath,
          persist: true,
          repoPath: secondRepo
        })).stdout);
        const imported = await client<{
          projectId: string;
          importId: string;
          sourceDecisionIds: string[];
          importedArtifactCount: number;
          importedClaimCount: number;
          importedDecisionCount: number;
          importedChunkContainsRawEvidence: boolean;
        }[]>`
          select
            source_artifacts.project_id as "projectId",
            source_artifacts.import_id as "importId",
            array_agg(distinct source_decisions.id)::text[] as "sourceDecisionIds",
            count(distinct source_artifacts.id)::int as "importedArtifactCount",
            count(distinct source_claims.id)::int as "importedClaimCount",
            count(distinct source_decisions.id)::int as "importedDecisionCount",
            bool_or(source_chunks.content like ${`%${evidenceContent}%`}) as "importedChunkContainsRawEvidence"
          from source_artifacts
          join source_chunks on source_chunks.source_artifact_id = source_artifacts.id
          join source_claims on source_claims.source_artifact_id = source_artifacts.id
          join source_decisions on source_decisions.source_claim_id = source_claims.id
          where source_artifacts.import_id is not null
          group by source_artifacts.project_id, source_artifacts.import_id
          order by source_artifacts.project_id
        `;
        const capturedEvidence = await client<{
          projectId: string;
          sourceArtifactId: string;
          sourceChunkId: string;
          ordinal: number;
        }[]>`
          select
            source_artifacts.project_id as "projectId",
            source_artifacts.id as "sourceArtifactId",
            source_chunks.id as "sourceChunkId",
            source_chunks.ordinal as "ordinal"
          from source_artifacts
          join source_chunks on source_chunks.source_artifact_id = source_artifacts.id
          where source_artifacts.import_id is null
            and source_chunks.content_hash = ${storedEvidenceHash}
          order by source_artifacts.project_id
        `;

        const firstRunId = executionRunIdFromPlan((await runPlanCli({
          databaseUrl: disposableDatabase.databaseUrl,
          repoPath: firstRepo,
          task
        })).stdout);
        const secondRunId = executionRunIdFromPlan((await runPlanCli({
          databaseUrl: disposableDatabase.databaseUrl,
          repoPath: secondRepo,
          task
        })).stdout);
        const firstPacket = sourceProjectionFromPacket((await runDecisionPacketCli({
          databaseUrl: disposableDatabase.databaseUrl,
          runId: firstRunId
        })).stdout);
        const secondPacket = sourceProjectionFromPacket((await runDecisionPacketCli({
          databaseUrl: disposableDatabase.databaseUrl,
          runId: secondRunId
        })).stdout);
        const firstImported = imported.find((row) => row.projectId === firstProjectId);
        const secondImported = imported.find((row) => row.projectId === secondProjectId);
        const firstCaptured = capturedEvidence.find((row) => row.projectId === firstProjectId);
        const secondCaptured = capturedEvidence.find((row) => row.projectId === secondProjectId);

        if (
          firstImported === undefined ||
          secondImported === undefined ||
          firstCaptured === undefined ||
          secondCaptured === undefined
        ) {
          throw new Error("both connected projects must have an imported authority graph");
        }

        expect(first.projectId).toBe(firstProjectId);
        expect(previewReadbacks).toEqual([
          expect.objectContaining({
            artifact: expect.objectContaining({
              chunking: expect.objectContaining({ renderedChunks: 3, persistedChunks: 15 })
            })
          }),
          expect.objectContaining({
            artifact: expect.objectContaining({
              chunking: expect.objectContaining({ renderedChunks: 3, persistedChunks: 15 })
            })
          })
        ]);
        expect(firstRetry.projectId).toBe(firstProjectId);
        expect(firstRetry.importId).toBe(first.importId);
        expect(second.projectId).toBe(secondProjectId);
        expect(second.importId).not.toBe(first.importId);
        expect(imported).toHaveLength(2);
        expect(imported).toEqual(expect.arrayContaining([
          expect.objectContaining({
            projectId: firstProjectId,
            importId: first.importId,
            sourceDecisionIds: [expect.any(String)],
            importedArtifactCount: 1,
            importedClaimCount: 1,
            importedDecisionCount: 1,
            importedChunkContainsRawEvidence: false
          }),
          expect.objectContaining({
            projectId: secondProjectId,
            importId: second.importId,
            sourceDecisionIds: [expect.any(String)],
            importedArtifactCount: 1,
            importedClaimCount: 1,
            importedDecisionCount: 1,
            importedChunkContainsRawEvidence: false
          })
        ]));
        expect(firstPacket.sourceDecisionIds).toEqual(firstImported.sourceDecisionIds);
        expect(firstPacket.sourceDecisionIds).not.toEqual(expect.arrayContaining(
          secondImported.sourceDecisionIds
        ));
        expect(secondPacket.sourceDecisionIds).toEqual(secondImported.sourceDecisionIds);
        expect(secondPacket.sourceDecisionIds).not.toEqual(expect.arrayContaining(
          firstImported.sourceDecisionIds
        ));
        expect(firstPacket.supportingEvidence).toEqual([expect.objectContaining({
          sourceArtifactId: firstCaptured.sourceArtifactId,
          sourceChunkId: firstCaptured.sourceChunkId,
          contentHash: evidenceHash,
          renderedContentHash: renderedEvidenceHash,
          content: renderedEvidenceContent,
          truncated: true
        })]);
        expect(firstCaptured.ordinal).toBe(15);
        expect(firstPacket.supportingEvidence).not.toEqual(expect.arrayContaining([
          expect.objectContaining({ sourceChunkId: secondCaptured.sourceChunkId })
        ]));
        expect(secondPacket.supportingEvidence).toEqual([expect.objectContaining({
          sourceArtifactId: secondCaptured.sourceArtifactId,
          sourceChunkId: secondCaptured.sourceChunkId,
          contentHash: evidenceHash,
          renderedContentHash: renderedEvidenceHash,
          content: renderedEvidenceContent,
          truncated: true
        })]);
        expect(secondCaptured.ordinal).toBe(15);
      } finally {
        await client.end();
        await rm(temporaryDirectory, { recursive: true, force: true });
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "converges concurrent first-use fallback project initialization",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });

      try {
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const [first, second] = await Promise.all([
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            persist: true
          }),
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            persist: true
          })
        ]);
        const firstResult = sourceDecisionImportOutput(first.stdout);
        const secondResult = sourceDecisionImportOutput(second.stdout);
        const scopeRows = await client<{
          workspaceCount: number;
          projectCount: number;
          projectId: string | null;
        }[]>`
          select
            (
              select count(*)::int
              from workspaces
            ) as "workspaceCount",
            (
              select count(*)::int
              from projects
            ) as "projectCount",
            (
              select projects.id
              from projects
              inner join workspaces on workspaces.id = projects.workspace_id
              where workspaces.slug = ${defaultWorkspaceSlug}
                and projects.slug = ${defaultProjectSlug}
            ) as "projectId"
        `;

        expect(firstResult.persistence).toBe("enabled");
        expect(secondResult.persistence).toBe("enabled");
        expect(firstResult.projectId).toBeDefined();
        expect(secondResult.projectId).toBe(firstResult.projectId);
        expect(scopeRows[0]).toEqual({
          workspaceCount: 1,
          projectCount: 1,
          projectId: firstResult.projectId
        });
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "serializes workspace initialization before resolving different fallback projects",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });
      const runtimes: Awaited<ReturnType<typeof createDatabaseRuntime>>[] = [];

      try {
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        await client.unsafe(`
          create function delay_workspace_insert() returns trigger
          language plpgsql
          as $$
          begin
            perform pg_sleep(0.25);
            return new;
          end
          $$
        `);
        await client.unsafe(`
          create trigger delay_workspace_insert
          before insert on workspaces
          for each row execute function delay_workspace_insert()
        `);

        const resolutions = await Promise.allSettled([
          createDatabaseRuntime({
            databaseUrl: disposableDatabase.databaseUrl,
            workspaceSlug: defaultWorkspaceSlug,
            projectSlug: "fallback-a",
            now: () => "2026-07-13T00:00:00.000Z",
            createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
          }),
          createDatabaseRuntime({
            databaseUrl: disposableDatabase.databaseUrl,
            workspaceSlug: defaultWorkspaceSlug,
            projectSlug: "fallback-b",
            now: () => "2026-07-13T00:00:00.000Z",
            createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
          })
        ]);

        for (const resolution of resolutions) {
          if (resolution.status === "fulfilled") {
            runtimes.push(resolution.value);
          }
        }

        expect(resolutions.map((resolution) => resolution.status)).toEqual([
          "fulfilled",
          "fulfilled"
        ]);
        const [first, second] = runtimes;

        if (first === undefined || second === undefined) {
          throw new Error("both fallback runtime resolutions must succeed");
        }

        const scopeRows = await client<{
          workspaceCount: number;
          projectCount: number;
          projectWorkspaceCount: number;
        }[]>`
          select
            (select count(*)::int from workspaces) as "workspaceCount",
            (select count(*)::int from projects) as "projectCount",
            (select count(distinct workspace_id)::int from projects) as "projectWorkspaceCount"
        `;

        expect(first.workspaceId).toBe(second.workspaceId);
        expect(first.projectId).not.toBe(second.projectId);
        expect(scopeRows[0]).toEqual({
          workspaceCount: 1,
          projectCount: 2,
          projectWorkspaceCount: 1
        });
      } finally {
        await Promise.all(runtimes.map(async (runtime) => runtime.close()));
        await client.end();
        await disposableDatabase.cleanup();
      }
    },
    60_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "keeps current, legacy-identity, and canonical-equivalent retries in one graph",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });
      const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "krn-source-import-retry-"));
      const reorderedFixturePath = path.join(temporaryDirectory, "reordered-task-scopes.json");
      const identityVariantFixturePath = path.join(temporaryDirectory, "identity-variant.json");

      try {
        await writeReorderedTaskScopesFixture(reorderedFixturePath);
        await writeEquivalentIdentityVariantFixture(identityVariantFixturePath);
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const setupRuntime = await createDatabaseRuntime({
          databaseUrl: disposableDatabase.databaseUrl,
          workspaceSlug: defaultWorkspaceSlug,
          projectSlug: defaultProjectSlug,
          requireProjectKernelForExplicitProject: false,
          now: () => "2026-07-13T00:00:00.000Z",
          createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
        });
        await setupRuntime.close();
        const preview = await runSourceImportCli({ persist: false });
        const [first, second] = await Promise.all([
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            persist: true
          }),
          runSourceImportCli({
            databaseUrl: disposableDatabase.databaseUrl,
            filePath: identityVariantFixturePath,
            persist: true
          })
        ]);
        const previewResult = sourceDecisionImportOutput(preview.stdout);
        const firstResult = sourceDecisionImportOutput(first.stdout);
        const secondResult = sourceDecisionImportOutput(second.stdout);
        const legacyImportId = `source-decision-import:${"a".repeat(64)}`;

        await client`
          update source_artifacts
          set import_id = ${legacyImportId}
          where import_row_id = 'source-import-retry-fixture'
        `;

        const legacyReplay = await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          persist: true
        });
        const legacyReplayResult = sourceDecisionImportOutput(legacyReplay.stdout);
        const reordered = await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: reorderedFixturePath,
          persist: true
        });
        const reorderedResult = sourceDecisionImportOutput(reordered.stdout);
        const importRows = await client<{ importId: string }[]>`
          select import_id as "importId"
          from source_artifacts
          where import_row_id = 'source-import-retry-fixture'
          order by import_id
        `;

        expect(previewResult.persistence).toBe("disabled");
        expect(firstResult.persistence).toBe("enabled");
        expect(secondResult.persistence).toBe("enabled");
        expect(reorderedResult.persistence).toBe("enabled");
        expect(firstResult.importId).toMatch(/^source-decision-import:[a-f0-9]{64}$/u);
        expect(secondResult.importId).toBe(firstResult.importId);
        expect(legacyReplayResult.importId).toBe(legacyImportId);
        expect(reorderedResult.importId).toBe(legacyImportId);
        expect(importRows.map((row) => row.importId)).toEqual([legacyImportId]);
        expect(await duplicateImportGraphCounts(client)).toEqual({
          artifactCount: 1,
          projectCount: 1,
          chunkCount: 1,
          claimCount: 1,
          decisionCount: 1,
          decisionEdgeCount: 0,
          searchDocumentCount: 1,
          rejectionCount: 0
        });
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    60_000
  );

  it.skipIf(databaseUrl === undefined || databaseUrl.length === 0)(
    "replays reviewed supersession and rolls back a missing predecessor",
    async () => {
      const disposableDatabase = await createDisposableDatabase(databaseUrl!);
      const client = postgres(disposableDatabase.databaseUrl, { max: 1, onnotice: () => undefined });
      const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "krn-source-import-supersession-"));
      const connectedRepo = path.join(temporaryDirectory, "repo");
      const evidencePath = path.join(temporaryDirectory, "evidence.txt");
      const predecessorPath = path.join(temporaryDirectory, "predecessor.json");
      const replacementPath = path.join(temporaryDirectory, "replacement.json");
      const duplicatePath = path.join(temporaryDirectory, "duplicate.json");
      const invalidPath = path.join(temporaryDirectory, "invalid.json");

      try {
        await migrateDatabase({
          databaseUrl: disposableDatabase.databaseUrl,
          migrationsFolder
        });
        const setupRuntime = await createDatabaseRuntime({
          databaseUrl: disposableDatabase.databaseUrl,
          workspaceSlug: defaultWorkspaceSlug,
          projectSlug: defaultProjectSlug,
          requireProjectKernelForExplicitProject: false,
          now: () => "2026-07-20T00:00:00.000Z",
          createId: (prefix) => `${prefix}-${crypto.randomUUID()}`
        });
        const projectId = setupRuntime.projectId;
        await setupRuntime.close();
        await mkdir(connectedRepo);
        const evidence = "Reviewed corpus revisions retain exact supersession lineage.";
        const evidenceHash = crypto.createHash("sha256").update(evidence).digest("hex");
        await writeFile(evidencePath, evidence, "utf8");
        await client`
          insert into repo_installations (
            id,
            project_id,
            provider,
            repo_url,
            default_branch,
            local_path_hint
          ) values (
            ${crypto.randomUUID()},
            ${projectId},
            'local',
            ${`file://${connectedRepo}`},
            'main',
            ${connectedRepo}
          )
        `;
        await runSourcePreviewCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: evidencePath,
          repoPath: connectedRepo
        });
        const evidenceRef = `krn-source://sha256/${evidenceHash}`;
        const baseDecision = (decisionId: string) => ({
          id: decisionId,
          title: "Reviewed source authority",
          statement: "A reviewed replacement supersedes its exact predecessor without deleting history.",
          status: "current",
          taskScopes: ["source-authority", "supersession"],
          evidenceRef,
          falsifier: "The predecessor remains governing or retry duplicates the supersession edge.",
          doesNotProve: "Supersession lineage does not prove source truth.",
          noteText: "Use the reviewed replacement for future selection and retain its predecessor as history."
        });
        const corpus = (decisionId: string, predecessorId?: string) => ({
          version: "1",
          corpusName: `source-import-supersession-${decisionId}`,
          coverageScope: {
            declaredRows: [{ decisionId, evidenceRefs: [evidenceRef] }]
          },
          decisions: [{
            ...baseDecision(decisionId),
            ...(predecessorId === undefined
              ? {}
              : { supersedesSourceClaimIds: [predecessorId] })
          }]
        });
        await writeFile(
          predecessorPath,
          `${JSON.stringify(corpus("reviewed-predecessor"), null, 2)}\n`,
          "utf8"
        );
        await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: predecessorPath,
          persist: true,
          repoPath: connectedRepo
        });
        const [predecessor] = await client<{ id: string }[]>`
          select source_claims.id
          from source_claims
          join source_artifacts on source_artifacts.id = source_claims.source_artifact_id
          where source_artifacts.import_row_id = 'reviewed-predecessor'
        `;

        if (predecessor === undefined) {
          throw new Error("missing predecessor SourceClaim for supersession test");
        }

        await writeFile(
          replacementPath,
          `${JSON.stringify(corpus("reviewed-replacement", predecessor.id), null, 2)}\n`,
          "utf8"
        );

        const first = await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: replacementPath,
          persist: true,
          repoPath: connectedRepo
        });
        const retry = await runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: replacementPath,
          persist: true,
          repoPath: connectedRepo
        });
        const firstOutput = JSON.parse(first.stdout) as Record<string, unknown>;
        const retryOutput = JSON.parse(retry.stdout) as Record<string, unknown>;
        const firstRows = firstOutput["rows"];
        const retryRows = retryOutput["rows"];

        expect(Array.isArray(firstRows) && isRecord(firstRows[0])
          ? firstRows[0]["sourceClaimSupersessionEdgeIds"]
          : undefined).toEqual([expect.any(String)]);
        expect(retryRows).toEqual(firstRows);
        const [edgeCount] = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_claim_edges
          where to_source_claim_id = ${predecessor.id}
            and kind = 'supersedes'
        `;
        expect(edgeCount?.count).toBe(1);
        await client`
          update source_claim_edges
          set metadata = jsonb_set(metadata, '{consumer}', '"tampered"'::jsonb)
          where to_source_claim_id = ${predecessor.id}
            and kind = 'supersedes'
        `;
        await expect(runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: replacementPath,
          persist: true,
          repoPath: connectedRepo
        })).rejects.toThrow(/conflicting reviewed supersession provenance/u);

        const duplicate = corpus("canonical-duplicate", predecessor.id);
        duplicate.decisions[0]!.supersedesSourceClaimIds = [
          predecessor.id,
          ` ${predecessor.id} `
        ];
        await writeFile(
          duplicatePath,
          `${JSON.stringify(duplicate, null, 2)}\n`,
          "utf8"
        );
        await expect(runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: duplicatePath,
          persist: true,
          repoPath: connectedRepo
        })).rejects.toThrow(/duplicate supersedesSourceClaimIds/u);

        await writeFile(
          invalidPath,
          `${JSON.stringify(corpus("missing-predecessor", crypto.randomUUID()), null, 2)}\n`,
          "utf8"
        );
        await expect(runSourceImportCli({
          databaseUrl: disposableDatabase.databaseUrl,
          filePath: invalidPath,
          persist: true,
          repoPath: connectedRepo
        })).rejects.toThrow(/did not return a row/u);
        const [invalidArtifacts] = await client<{ count: number }[]>`
          select count(*)::int as count
          from source_artifacts
          where import_row_id = 'missing-predecessor'
        `;
        expect(invalidArtifacts?.count).toBe(0);
      } finally {
        await client.end();
        await disposableDatabase.cleanup();
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    60_000
  );
});
