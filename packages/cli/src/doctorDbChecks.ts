import path from "node:path";
import {
  inspectActivationReadiness,
  inspectHarnessPersistenceReadiness,
  inspectMemoryGovernanceReadiness,
  inspectMigrationReadiness,
  inspectRetrievalSubstrateReadiness,
  inspectSourceGraphReadiness
} from "@krn/db";

import type {
  DoctorCheck
} from "./runDoctorCommand.js";
import {
  pathExists,
  readJsonObject
} from "./cliFileBoundary.js";
import {
  readOptionalText,
  readScriptStatus,
  readTreeText
} from "./doctorCheckHelpers.js";

const findCheckStatus = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => checks.find((check) => check.label === label)?.status;

export const checkPostgres = async (
  databaseUrl: string | undefined,
  migrationsFolder: string
): Promise<DoctorCheck[]> => {
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    return [
      {
        label: "Postgres config",
        status: "not configured (KRN_DATABASE_URL missing)"
      },
      {
        label: "pgvector",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "migrations",
        status: "skipped (Postgres not configured)"
      }
    ];
  }

  try {
    const report = await inspectMigrationReadiness({
      databaseUrl,
      migrationsFolder
    });
    const migrationStatus = !report.migrationTablePresent
      ? "migration table missing"
      : report.migrationsVerified
        ? `verified (${report.appliedMigrationCount}/${report.expectedMigrationCount} applied)`
        : `unverified (${report.appliedMigrationCount}/${report.expectedMigrationCount} applied)`;

    return [
      {
        label: "Postgres config",
        status: "configured and reachable"
      },
      {
        label: "pgvector",
        status: report.pgvectorAvailable ? "available" : "missing"
      },
      {
        label: "migrations",
        status: migrationStatus
      }
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown database error";

    return [
      {
        label: "Postgres config",
        status: `configured but unreachable (${message})`
      },
      {
        label: "pgvector",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "migrations",
        status: "skipped (Postgres unreachable)"
      }
    ];
  }
};

export const checkHarnessPersistence = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeChecks = [
    {
      label: "Project repository smoke",
      status: readScriptStatus(packageJson, "db:smoke", "krn db smoke")
    },
    {
      label: "Harness plan smoke",
      status: readScriptStatus(packageJson, "db:smoke:harness-plan", "krn db smoke harness-plan")
    },
    {
      label: "Evidence persistence smoke",
      status: readScriptStatus(
        packageJson,
        "db:smoke:harness-evidence",
        "krn db smoke harness-evidence"
      )
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (Postgres not configured)"
      },
      ...smokeChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (Postgres unreachable)"
      },
      ...smokeChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Harness persistence schema",
        status: "skipped (brain store not ready)"
      },
      ...smokeChecks
    ];
  }

  try {
    const report = await inspectHarnessPersistenceReadiness({
      databaseUrl
    });

    return [
      {
        label: "Harness persistence schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      ...smokeChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown harness schema error";

    return [
      {
        label: "Harness persistence schema",
        status: `failed (${message})`
      },
      ...smokeChecks
    ];
  }
};

export const checkSourceGraph = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Source graph smoke",
    status: readScriptStatus(packageJson, "db:smoke:source-graph", "krn db smoke source-graph")
  };
  const sourceCrawlerPresent =
    await pathExists(path.join(repoRoot, "packages", "source-crawler")) ||
    await pathExists(path.join(repoRoot, "packages", "crawler")) ||
    await pathExists(path.join(repoRoot, "packages", "research"));
  const separateGraphDbPresent =
    await pathExists(path.join(repoRoot, "packages", "graph-db")) ||
    await pathExists(path.join(repoRoot, "packages", "neo4j"));
  const forbiddenChecks = [
    {
      label: "Source crawler/research layer",
      status: sourceCrawlerPresent ? "present" : "absent"
    },
    {
      label: "Separate graph DB",
      status: separateGraphDbPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Source graph schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "SourceRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectSourceGraphReadiness({
      databaseUrl
    });

    return [
      {
        label: "Source graph schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "SourceRepository read path",
        status: report.sourceRepositoryReachable
          ? "reachable"
          : `failed (${report.sourceRepositoryError ?? "unknown source repository error"})`
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: report.runtimeProofReady
          ? `ready (claims ${report.sourceClaimCount}, edges ${report.sourceDecisionEdgeCount}, rejections ${report.sourceRejectionCount})`
          : "unverified (run pnpm db:smoke:source-graph)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown source graph schema error";

    return [
      {
        label: "Source graph schema",
        status: `failed (${message})`
      },
      {
        label: "SourceRepository read path",
        status: "skipped (source graph schema check failed)"
      },
      smokeCheck,
      {
        label: "Source graph runtime proof",
        status: "skipped (source graph schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

export const checkMemoryGovernance = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Memory governance smoke",
    status: readScriptStatus(
      packageJson,
      "db:smoke:memory-governance",
      "krn db smoke memory-governance"
    )
  };
  const runtimeMarkdownMemoryPresent =
    await pathExists(path.join(repoRoot, "memory.md")) ||
    await pathExists(path.join(repoRoot, "MEMORY.md")) ||
    await pathExists(path.join(repoRoot, "runtime-memory.md")) ||
    await pathExists(path.join(repoRoot, "memory")) ||
    await pathExists(path.join(repoRoot, "memories")) ||
    await pathExists(path.join(repoRoot, ".memory")) ||
    await pathExists(path.join(repoRoot, "docs", "memory")) ||
    await pathExists(path.join(repoRoot, "docs", "runtime-memory"));
  const evidenceCaptureText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runEvidenceCaptureCommand.ts")
  );
  const automaticMemoryMutationPresent =
    evidenceCaptureText.includes("createMemoryCandidate(") ||
    evidenceCaptureText.includes("promoteMemoryCandidate(") ||
    evidenceCaptureText.includes("createMemoryRecord(") ||
    (await pathExists(path.join(repoRoot, "packages", "memory-crawler"))) ||
    (await pathExists(path.join(repoRoot, "packages", "memory-worker"))) ||
    (await pathExists(path.join(repoRoot, "packages", "memory-auto-promoter")));
  const forbiddenChecks = [
    {
      label: "Runtime markdown memory",
      status: runtimeMarkdownMemoryPresent ? "present" : "absent"
    },
    {
      label: "Automatic memory mutation",
      status: automaticMemoryMutationPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Memory governance schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectMemoryGovernanceReadiness({
      databaseUrl
    });

    return [
      {
        label: "Memory governance schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "MemoryRepository read path",
        status: report.memoryRepositoryReachable
          ? "reachable"
          : `failed (${report.memoryRepositoryError ?? "unknown memory repository error"})`
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: report.runtimeProofReady
          ? `ready (candidates ${report.memoryCandidateCount}, records ${report.memoryRecordCount}, applications ${report.memoryApplicationCount}, anti-memory ${report.antiMemoryRecordCount})`
          : "unverified (run pnpm db:smoke:memory-governance)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown memory governance schema error";

    return [
      {
        label: "Memory governance schema",
        status: `failed (${message})`
      },
      {
        label: "MemoryRepository read path",
        status: "skipped (memory governance schema check failed)"
      },
      smokeCheck,
      {
        label: "Memory governance runtime proof",
        status: "skipped (memory governance schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

export const checkRetrievalSubstrate = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Retrieval substrate smoke",
    status: readScriptStatus(
      packageJson,
      "db:smoke:retrieval-substrate",
      "krn db smoke retrieval-substrate"
    )
  };
  const separateVectorSearchDbPresent =
    await pathExists(path.join(repoRoot, "packages", "vector-db")) ||
    await pathExists(path.join(repoRoot, "packages", "qdrant")) ||
    await pathExists(path.join(repoRoot, "packages", "search-engine")) ||
    await pathExists(path.join(repoRoot, "packages", "opensearch")) ||
    await pathExists(path.join(repoRoot, "packages", "elastic"));
  const cliText = await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts"));
  const naiveRagDumpCommandPresent =
    cliText.includes("rag-dump") ||
    cliText.includes("rag dump") ||
    cliText.includes("dump-context") ||
    cliText.includes("context-dump");
  const forbiddenChecks = [
    {
      label: "Separate vector/search DB",
      status: separateVectorSearchDbPresent ? "present" : "absent"
    },
    {
      label: "Naive RAG dump command",
      status: naiveRagDumpCommandPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (Postgres not configured)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (Postgres not configured)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (Postgres unreachable)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      {
        label: "Retrieval substrate schema",
        status: "skipped (brain store not ready)"
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (brain store not ready)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectRetrievalSubstrateReadiness({
      databaseUrl
    });

    return [
      {
        label: "Retrieval substrate schema",
        status: report.schemaReady
          ? `ready (${report.presentTableCount}/${report.requiredTableCount} tables present)`
          : `missing (${report.missingTables.join(", ")})`
      },
      {
        label: "RetrievalRepository read path",
        status: report.retrievalRepositoryReachable
          ? "reachable"
          : `failed (${report.retrievalRepositoryError ?? "unknown retrieval repository error"})`
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: report.runtimeProofReady
          ? `ready (search documents ${report.searchDocumentCount}, candidates ${report.retrievalCandidateCount}, activation decisions ${report.activationDecisionCount}, exclusions ${report.contextExclusionCount})`
          : "unverified (run pnpm db:smoke:retrieval-substrate)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown retrieval substrate schema error";

    return [
      {
        label: "Retrieval substrate schema",
        status: `failed (${message})`
      },
      {
        label: "RetrievalRepository read path",
        status: "skipped (retrieval substrate schema check failed)"
      },
      smokeCheck,
      {
        label: "Retrieval substrate runtime proof",
        status: "skipped (retrieval substrate schema check failed)"
      },
      ...forbiddenChecks
    ];
  }
};

export const checkActivation = async (
  repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const smokeCheck = {
    label: "Activation smoke",
    status: readScriptStatus(packageJson, "db:smoke:activation", "krn db smoke activation")
  };
  const coreActivationText = await readOptionalText(
    path.join(repoRoot, "packages", "core", "src", "activation.ts")
  );
  const coreIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "core", "src", "index.ts")
  );
  const coreText = await readTreeText(path.join(repoRoot, "packages", "core", "src"));
  const activationEngineText = await readOptionalText(
    path.join(repoRoot, "packages", "harness", "src", "activation", "activationEngine.ts")
  );
  const activationIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "harness", "src", "activation", "index.ts")
  );
  const cliText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts")
  );
  const planText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runPlanCommand.ts")
  );
  const requiredContracts = [
    "ActivationPolicy",
    "TrustAssessment",
    "ContextROI",
    "ActivationTrace",
    "ActivationInput",
    "ActivationResult",
    "ActivationAbstention",
    "ConflictSet",
    "ContextBudget"
  ];
  const activationDomainPresent =
    requiredContracts.every((contract) => coreActivationText.includes(contract)) &&
    coreIndexText.includes("./activation");
  const activationEnginePresent =
    activationEngineText.includes("retrieveActivationCandidates") &&
    activationEngineText.includes("persistActivationTrace") &&
    activationIndexText.includes("./conflictFilter") &&
    activationIndexText.includes("./contextRoi") &&
    activationIndexText.includes("./assembleContext");
  const broadContextDumpPresent =
    cliText.includes("rag-dump") ||
    cliText.includes("rag dump") ||
    cliText.includes("dump-context") ||
    cliText.includes("context-dump") ||
    planText.includes("raw onboarding") ||
    await pathExists(path.join(repoRoot, "packages", "context-dump"));
  const requiredSkillsPresent = coreText.includes("requiredSkills");
  const forbiddenChecks = [
    {
      label: "Broad context dump",
      status: broadContextDumpPresent ? "present" : "absent"
    },
    {
      label: "Core requiredSkills field",
      status: requiredSkillsPresent ? "present" : "absent"
    }
  ];
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const baseChecks = [
    {
      label: "Activation domain contracts",
      status: activationDomainPresent ? "present" : "missing"
    },
    {
      label: "Activation engine surface",
      status: activationEnginePresent ? "present" : "missing"
    },
    smokeCheck
  ];

  if (postgresStatus?.startsWith("not configured") === true) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (Postgres not configured)"
      },
      ...forbiddenChecks
    ];
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (Postgres unreachable)"
      },
      ...forbiddenChecks
    ];
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true
  ) {
    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: "skipped (brain store not ready)"
      },
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectActivationReadiness({
      databaseUrl
    });

    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: report.runtimeProofReady
          ? `ready (decisions ${report.activationDecisionCount}, inclusions ${report.contextItemCount}, exclusions ${report.contextExclusionCount})`
          : "unverified (run pnpm db:smoke:activation)"
      },
      ...forbiddenChecks
    ];
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown activation readiness error";

    return [
      ...baseChecks,
      {
        label: "Activation smoke runtime proof",
        status: `failed (${message})`
      },
      ...forbiddenChecks
    ];
  }
};
