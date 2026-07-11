import path from "node:path";
import {
  inspectActivationReadiness,
  inspectHarnessPersistenceReadiness,
  inspectMemoryGovernanceReadiness,
  inspectMigrationReadiness,
  inspectRetrievalSubstrateReadiness,
  inspectSourceGraphReadiness
} from "@krn/db/dev";

import type {
  DoctorCheck,
  DoctorOutcome,
  DoctorSeverity
} from "./run-doctor-command.js";
import {
  connectedButNotReadyRecovery,
  missingDbConfigRecovery,
  unreachablePostgresRecovery
} from "./db-recovery-guidance.js";
import {
  pathExists,
  readJsonObject
} from "./cli-file-boundary.js";
import {
  readOptionalText,
  readScriptStatus,
  readTreeText
} from "./doctor-readiness-support.js";
import {
  createDoctorProof,
  formatDoctorProof
} from "./doctor-proof.js";

const findCheckStatus = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => checks.find((check) => check.label === label)?.status;

type BrainStoreSkipReason =
  | "Postgres not configured"
  | "Postgres unreachable"
  | "memory store not ready";

type BrainStoreGate =
  | {
      kind: "ready";
      databaseUrl: string;
    }
  | {
      kind: "skipped";
      reason: BrainStoreSkipReason;
    };

const skippedStatus = (reason: BrainStoreSkipReason): string => `skipped (${reason})`;

const skippedCheck = (
  label: DoctorCheck["label"],
  gate: Extract<BrainStoreGate, { kind: "skipped" }>
): DoctorCheck => ({
  label,
  status: skippedStatus(gate.reason)
});

const skippedChecks = (
  labels: readonly DoctorCheck["label"][],
  gate: Extract<BrainStoreGate, { kind: "skipped" }>
): DoctorCheck[] => labels.map((label) => skippedCheck(label, gate));

const runtimeProofCheck = (
  label: DoctorCheck["label"],
  databaseUrl: string,
  probeName: string,
  smokeCommand: string,
  runtimeProofReady: boolean,
  details: string
): DoctorCheck => {
  if (!runtimeProofReady) {
    return {
      label,
      status: `unverified (run ${smokeCommand})`,
      outcome: "runtime_unverified",
      severity: "warning"
    };
  }

  const proof = createDoctorProof(databaseUrl, probeName);

  return {
    label,
    status: formatDoctorProof(proof, details),
    outcome: "proven",
    severity: "pass",
    proof
  };
};

type MigrationReadinessReport = Awaited<ReturnType<typeof inspectMigrationReadiness>>;

const migrationStatus = (report: MigrationReadinessReport): string => {
  if (!report.migrationTablePresent) {
    return "migration table missing";
  }

  const counts = `${report.appliedMigrationCount}/${report.expectedMigrationCount} applied`;
  const identity = report.migrationIdentityStatus === "missing"
    ? ""
    : `; identity ${report.migrationIdentityStatus}`;

  return report.migrationsVerified
    ? `verified (${counts})`
    : `unverified (${counts}${identity})`;
};

const migrationOutcome = (report: MigrationReadinessReport): DoctorOutcome => {
  if (!report.migrationTablePresent) {
    return "migration_table_missing";
  }

  return report.migrationsVerified ? "migrations_verified" : "migrations_unverified";
};

const migrationSeverity = (report: MigrationReadinessReport): DoctorSeverity =>
  report.migrationsVerified ? "pass" : "warning";

const missingPostgresChecks = (): DoctorCheck[] => [
  {
    label: "Postgres mode",
    status: "preview/no-DB",
    outcome: "preview_only",
    severity: "warning"
  },
  {
    label: "Postgres config",
    status: "not configured (KRN_DATABASE_URL missing)",
    outcome: "not_configured",
    severity: "warning"
  },
  {
    label: "Postgres next action",
    status: missingDbConfigRecovery()
  },
  {
    label: "pgvector",
    status: "skipped (Postgres not configured)",
    outcome: "skipped",
    severity: "warning"
  },
  {
    label: "migrations",
    status: "skipped (Postgres not configured)",
    outcome: "skipped",
    severity: "warning"
  }
];

const configuredPostgresChecks = (
  report: MigrationReadinessReport
): DoctorCheck[] => {
  const sourceAuthorityIntegrityReady = report.sourceAuthorityIntegrity?.integrityReady === true;
  const ready = report.pgvectorAvailable && report.migrationsVerified && sourceAuthorityIntegrityReady;

  return [
    {
      label: "Postgres mode",
      status: ready ? "ready" : "connected but not ready",
      outcome: ready ? "ready" : "incomplete",
      severity: ready ? "pass" : "warning"
    },
    {
      label: "Postgres config",
      status: "configured and reachable",
      outcome: "configured_reachable",
      severity: "pass"
    },
    {
      label: "pgvector",
      status: report.pgvectorAvailable ? "available" : "missing",
      outcome: report.pgvectorAvailable ? "pgvector_available" : "pgvector_missing",
      severity: report.pgvectorAvailable ? "pass" : "warning"
    },
    {
      label: "migrations",
      status: migrationStatus(report),
      outcome: migrationOutcome(report),
      severity: migrationSeverity(report)
    },
    {
      label: "Postgres next action",
      status: ready ? "none" : connectedButNotReadyRecovery()
    },
    {
      label: "Source authority integrity",
      status: sourceAuthorityIntegrityReady
        ? `clean (${report.sourceAuthorityIntegrity?.violationCount ?? 0} violations)`
        : `blocked (${report.sourceAuthorityIntegrity?.violationCount ?? "unverified"} violations)`,
      outcome: sourceAuthorityIntegrityReady ? "ready" : "blocked",
      severity: sourceAuthorityIntegrityReady ? "pass" : "warning"
    }
  ];
};

const unreachablePostgresChecks = (message: string): DoctorCheck[] => [
  {
    label: "Postgres mode",
    status: "configured but unreachable",
    outcome: "configured_unreachable",
    severity: "failure"
  },
  {
    label: "Postgres config",
    status: `configured but unreachable (${message})`,
    outcome: "configured_unreachable",
    severity: "failure"
  },
  {
    label: "Postgres next action",
    status: unreachablePostgresRecovery()
  },
  {
    label: "pgvector",
    status: "skipped (Postgres unreachable)",
    outcome: "skipped",
    severity: "warning"
  },
  {
    label: "migrations",
    status: "skipped (Postgres unreachable)",
    outcome: "skipped",
    severity: "warning"
  }
];

const brainStoreGate = (
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): BrainStoreGate => {
  const postgresStatus = findCheckStatus(postgresChecks, "Postgres config");
  const pgvectorStatus = findCheckStatus(postgresChecks, "pgvector");
  const migrationStatus = findCheckStatus(postgresChecks, "migrations");
  const sourceAuthorityIntegrityStatus = findCheckStatus(
    postgresChecks,
    "Source authority integrity"
  );

  if (postgresStatus?.startsWith("not configured") === true) {
    return {
      kind: "skipped",
      reason: "Postgres not configured"
    };
  }

  if (postgresStatus?.startsWith("configured but unreachable") === true) {
    return {
      kind: "skipped",
      reason: "Postgres unreachable"
    };
  }

  if (
    databaseUrl === undefined ||
    databaseUrl.trim().length === 0 ||
    pgvectorStatus !== "available" ||
    migrationStatus?.startsWith("verified") !== true ||
    (sourceAuthorityIntegrityStatus !== undefined &&
      !sourceAuthorityIntegrityStatus.startsWith("clean"))
  ) {
    return {
      kind: "skipped",
      reason: "memory store not ready"
    };
  }

  return {
    kind: "ready",
    databaseUrl
  };
};

const anyPathExists = async (paths: readonly string[]): Promise<boolean> => {
  for (const candidatePath of paths) {
    if (await pathExists(candidatePath)) {
      return true;
    }
  }

  return false;
};

const memoryMutationCallPatterns = [
  "createMemoryCandidate(",
  "promoteMemoryCandidate(",
  "createMemoryRecord("
];

const runtimeMarkdownMemoryPresent = async (repoRoot: string): Promise<boolean> =>
  anyPathExists([
    path.join(repoRoot, "memory.md"),
    path.join(repoRoot, "MEMORY.md"),
    path.join(repoRoot, "runtime-memory.md"),
    path.join(repoRoot, "memory"),
    path.join(repoRoot, "memories"),
    path.join(repoRoot, ".memory"),
    path.join(repoRoot, "docs", "memory"),
    path.join(repoRoot, "docs", "runtime-memory")
  ]);

const automaticMemoryMutationPresent = async (repoRoot: string): Promise<boolean> => {
  const evidenceCaptureText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "run-evidence-capture-command.ts")
  );

  return memoryMutationCallPatterns.some((pattern) => evidenceCaptureText.includes(pattern)) ||
    await anyPathExists([
      path.join(repoRoot, "packages", "memory-crawler"),
      path.join(repoRoot, "packages", "memory-worker"),
      path.join(repoRoot, "packages", "memory-auto-promoter")
    ]);
};

const readMemoryGovernanceForbiddenChecks = async (repoRoot: string): Promise<DoctorCheck[]> => [
  {
    label: "Runtime markdown memory",
    status: await runtimeMarkdownMemoryPresent(repoRoot) ? "present" : "absent"
  },
  {
    label: "Automatic memory mutation",
    status: await automaticMemoryMutationPresent(repoRoot) ? "present" : "absent"
  }
];

export const checkPostgres = async (
  databaseUrl: string | undefined,
  migrationsFolder: string
): Promise<DoctorCheck[]> => {
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    return missingPostgresChecks();
  }

  try {
    const report = await inspectMigrationReadiness({
      databaseUrl,
      migrationsFolder
    });
    return configuredPostgresChecks(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown database error";

    return unreachablePostgresChecks(message);
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
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [
      skippedCheck("Harness persistence schema", gate),
      ...smokeChecks
    ];
  }

  try {
    const report = await inspectHarnessPersistenceReadiness({
      databaseUrl: gate.databaseUrl
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
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [
      ...skippedChecks([
        "Source graph schema",
        "SourceRepository read path"
      ], gate),
      smokeCheck,
      skippedCheck("Source graph runtime proof", gate),
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectSourceGraphReadiness({
      databaseUrl: gate.databaseUrl
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
      runtimeProofCheck(
        "Source graph runtime proof",
        gate.databaseUrl,
        "source-graph",
        "pnpm db:smoke:source-graph",
        report.runtimeProofReady,
        `claims ${report.sourceClaimCount}, edges ${report.sourceDecisionEdgeCount}, rejections ${report.sourceRejectionCount}`
      ),
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
  const forbiddenChecks = await readMemoryGovernanceForbiddenChecks(repoRoot);
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [
      ...skippedChecks([
        "Memory governance schema",
        "MemoryRepository read path"
      ], gate),
      smokeCheck,
      skippedCheck("Memory governance runtime proof", gate),
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectMemoryGovernanceReadiness({
      databaseUrl: gate.databaseUrl
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
      runtimeProofCheck(
        "Memory governance runtime proof",
        gate.databaseUrl,
        "memory-governance",
        "pnpm db:smoke:memory-governance",
        report.runtimeProofReady,
        `candidates ${report.memoryCandidateCount}, records ${report.memoryRecordCount}, applications ${report.memoryApplicationCount}, anti-memory ${report.antiMemoryRecordCount}`
      ),
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
  const cliText = await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "parse-args.ts"));
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
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [
      ...skippedChecks([
        "Retrieval substrate schema",
        "RetrievalRepository read path"
      ], gate),
      smokeCheck,
      skippedCheck("Retrieval substrate runtime proof", gate),
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectRetrievalSubstrateReadiness({
      databaseUrl: gate.databaseUrl
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
      runtimeProofCheck(
        "Retrieval substrate runtime proof",
        gate.databaseUrl,
        "retrieval-substrate",
        "pnpm db:smoke:retrieval-substrate",
        report.runtimeProofReady,
        `search documents ${report.searchDocumentCount}, candidates ${report.retrievalCandidateCount}, activation decisions ${report.activationDecisionCount}, exclusions ${report.contextExclusionCount}`
      ),
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
    path.join(repoRoot, "packages", "harness", "src", "activation", "activation-engine.ts")
  );
  const activationIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "harness", "src", "activation", "index.ts")
  );
  const cliText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "parse-args.ts")
  );
  const planText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "run-plan-command.ts")
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
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [
      ...baseChecks,
      skippedCheck("Activation smoke runtime proof", gate),
      ...forbiddenChecks
    ];
  }

  try {
    const report = await inspectActivationReadiness({
      databaseUrl: gate.databaseUrl
    });

    return [
      ...baseChecks,
      runtimeProofCheck(
        "Activation smoke runtime proof",
        gate.databaseUrl,
        "activation",
        "pnpm db:smoke:activation",
        report.runtimeProofReady,
        `decisions ${report.activationDecisionCount}, inclusions ${report.contextItemCount}, exclusions ${report.contextExclusionCount}`
      ),
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

export const checkCodexAdapterRuntimeProof = async (
  _repoRoot: string,
  databaseUrl: string | undefined,
  postgresChecks: readonly DoctorCheck[]
): Promise<DoctorCheck[]> => {
  const gate = brainStoreGate(databaseUrl, postgresChecks);

  if (gate.kind === "skipped") {
    return [skippedCheck("Codex adapter runtime proof", gate)];
  }

  return [{
    label: "Codex adapter runtime proof",
    status: "unverified (run pnpm db:smoke:codex-adapter)",
    outcome: "runtime_unverified",
    severity: "warning"
  }];
};
