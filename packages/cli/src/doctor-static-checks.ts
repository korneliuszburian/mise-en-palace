import path from "node:path";

import {
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  DrizzleMaintenanceQueueRepository,
  runMaintenanceQueueRecord
} from "@krn/db/adapters";
import {
  outboxEvents,
  projectKernels,
  projects,
  repoInstallations,
  maintenanceQueues as maintenanceQueueTable,
  maintenanceQueueStatus
} from "@krn/db/schema";
import {
  postgresStoreIdentity,
  readCurrentInitConnectRuntimeProof,
  readCurrentTargetRepoRuntimeProof
} from "@krn/db/dev";
import postgres from "postgres";
import {
  maintenanceJobPersistenceContract
} from "@krn/maintenance-preview";

import type {
  DoctorCheck,
  DoctorOutcome,
  DoctorSeverity
} from "./run-doctor-command.js";
import {
  pathExists,
  readJsonObject
} from "./cli-file-boundary.js";
import {
  readOptionalText,
  readScriptStatus
} from "./doctor-readiness-support.js";
import {
  parseArgs
} from "./parse-args.js";
import {
  runInitCommand
} from "./run-init-command.js";

const pathExistsAny = async (paths: readonly string[]): Promise<boolean> => {
  const exists = await Promise.all(paths.map((targetPath) => pathExists(targetPath)));

  return exists.some(Boolean);
};

const hasFunction = (
  target: unknown
): target is (...args: readonly never[]) => unknown =>
  typeof target === "function";

const passOrWarning = (condition: boolean): DoctorSeverity =>
  condition ? "pass" : "warning";

const forbiddenSurfaceSeverity = (present: boolean): DoctorSeverity =>
  present ? "failure" : "pass";

const availableOutcome = (status: string): DoctorOutcome =>
  status.startsWith("available") ? "available" : "missing";

const packagePath = (
  repoRoot: string,
  packageName: string,
  ...segments: string[]
): string => path.join(repoRoot, "packages", packageName, ...segments);

const hasCodexRunner = async (
  repoRoot: string
): Promise<boolean> => await pathExistsAny([
    path.join(repoRoot, "packages", "codex-runner"),
    path.join(repoRoot, "packages", "codex-executor"),
    path.join(repoRoot, "packages", "codex-execution")
  ]);

const hasMcpProductServer = async (
  repoRoot: string
): Promise<boolean> => await pathExistsAny([
    path.join(repoRoot, "packages", "mcp-server"),
    path.join(repoRoot, "packages", "krn-mcp-server"),
    path.join(repoRoot, "packages", "mcp")
  ]);

export const checkCodexAdapter = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const rendererPresent =
    hasFunction(createExecutionBrief) &&
    hasFunction(renderExecutionBriefText);
  const executionBriefSmokeStatus = readScriptStatus(
    packageJson,
    "db:smoke:codex-adapter",
    "krn db smoke codex-adapter"
  );
  const codexRunnerPresent = await hasCodexRunner(repoRoot);
  const mcpProductServerPresent = await hasMcpProductServer(repoRoot);

  return [
    {
      label: "Codex adapter renderer",
      status: rendererPresent ? "present" : "missing",
      outcome: rendererPresent ? "present" : "missing",
      severity: passOrWarning(rendererPresent)
    },
    {
      label: "Execution brief smoke",
      status: executionBriefSmokeStatus,
      outcome: availableOutcome(executionBriefSmokeStatus),
      severity: passOrWarning(executionBriefSmokeStatus.startsWith("available"))
    },
    {
      label: "Codex execution runner",
      status: codexRunnerPresent ? "present" : "absent",
      outcome: codexRunnerPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(codexRunnerPresent)
    },
    {
      label: "KRN MCP product server",
      status: mcpProductServerPresent ? "present" : "absent",
      outcome: mcpProductServerPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(mcpProductServerPresent)
    }
  ];
};

const packageManifestPaths = (repoRoot: string): string[] => [
  path.join(repoRoot, "package.json"),
  packagePath(repoRoot, "cli", "package.json"),
  packagePath(repoRoot, "codex-adapter", "package.json"),
  packagePath(repoRoot, "core", "package.json"),
  packagePath(repoRoot, "db", "package.json"),
  packagePath(repoRoot, "harness", "package.json"),
  packagePath(repoRoot, "schema", "package.json"),
  packagePath(repoRoot, "maintenance-preview", "package.json")
];

const readDependencyText = async (repoRoot: string): Promise<string> => {
  const texts = await Promise.all(
    packageManifestPaths(repoRoot).map((manifestPath) => readOptionalText(manifestPath))
  );

  return texts.join("\n").toLowerCase();
};

const hasRedisOrKafkaDependency = (dependencyText: string): boolean =>
  [
    "\"redis\"",
    "redis@",
    "ioredis",
    "@upstash/redis",
    "\"kafka\"",
    "kafka@",
    "kafkajs"
  ].some((fragment) => dependencyText.includes(fragment));

const hasAutonomousMaintenanceDaemon = async (
  repoRoot: string
): Promise<boolean> => await pathExistsAny([
    path.join(repoRoot, "packages", "worker-daemon"),
    path.join(repoRoot, "packages", "workers-daemon"),
    path.join(repoRoot, "packages", "job-runner")
  ]);

const maintenanceQueueRepositoryMethods = [
  "enqueueMaintenanceQueue",
  "listQueuedMaintenanceQueues",
  "claimMaintenanceQueueRecord",
  "recordMaintenanceQueueSuccess",
  "recordMaintenanceQueueSkip",
  "recordMaintenanceQueueRetry",
  "recoverStaleMaintenanceQueueRecord",
  "recordMaintenanceQueueDeadLetter",
  "cleanupTestMaintenanceQueues"
] as const;

const maintenanceQueueSchemaPresent = (): boolean =>
  maintenanceQueueTable !== undefined &&
  outboxEvents !== undefined &&
  maintenanceQueueStatus.enumValues.includes("dead_letter");

const maintenanceQueueRepositoryPresent = (): boolean =>
  maintenanceQueueRepositoryMethods.every((methodName) =>
    hasFunction(DrizzleMaintenanceQueueRepository.prototype[methodName])
  );

const maintenanceRecordExecutorPresent = (): boolean =>
  hasFunction(runMaintenanceQueueRecord) &&
  maintenanceJobPersistenceContract.executionMode === "explicit_record_executor";

export const checkMaintenanceQueue = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const dependencyText = await readDependencyText(repoRoot);
  const schemaPresent = maintenanceQueueSchemaPresent();
  const repositoryPresent = maintenanceQueueRepositoryPresent();
  const redisKafkaPresent = hasRedisOrKafkaDependency(dependencyText);
  const maintenanceQueueSmokeStatus = readScriptStatus(
    packageJson,
    "db:smoke:maintenance-queue",
    "krn db smoke maintenance-queue"
  );
  const recordExecutorPresent = maintenanceRecordExecutorPresent();
  const autonomousMaintenanceDaemonPresent = await hasAutonomousMaintenanceDaemon(repoRoot);

  return [
    {
      label: "Maintenance queue schema",
      status: schemaPresent ? "present" : "missing",
      outcome: schemaPresent ? "present" : "missing",
      severity: passOrWarning(schemaPresent)
    },
    {
      label: "Maintenance queue repository",
      status: repositoryPresent ? "present" : "missing",
      outcome: repositoryPresent ? "present" : "missing",
      severity: passOrWarning(repositoryPresent)
    },
    {
      label: "Maintenance queue smoke",
      status: maintenanceQueueSmokeStatus,
      outcome: availableOutcome(maintenanceQueueSmokeStatus),
      severity: passOrWarning(maintenanceQueueSmokeStatus.startsWith("available"))
    },
    {
      label: "Maintenance record executor",
      status: recordExecutorPresent ? "present (explicit per-record)" : "missing",
      outcome: recordExecutorPresent ? "present" : "missing",
      severity: passOrWarning(recordExecutorPresent)
    },
    {
      label: "Redis/Kafka queue",
      status: redisKafkaPresent ? "present" : "absent",
      outcome: redisKafkaPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(redisKafkaPresent)
    },
    {
      label: "Autonomous maintenance daemon",
      status: autonomousMaintenanceDaemonPresent ? "present" : "absent",
      outcome: autonomousMaintenanceDaemonPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(autonomousMaintenanceDaemonPresent)
    }
  ];
};

const targetRepoFixturePath = (repoRoot: string): string =>
  path.join(repoRoot, "tests", "fixtures", "target-repos", "typescript-basic");

const hasTargetInitCommand = (): boolean => {
  const parsed = parseArgs([
    "init",
    "--connect",
    "--repo",
    ".",
    "--persist"
  ]).command;

  return hasFunction(runInitCommand) &&
    parsed?.kind === "init" &&
    parsed.mode === "connect" &&
    parsed.persist;
};

const hasTargetFixture = async (fixturePath: string): Promise<boolean> =>
  await pathExists(path.join(fixturePath, "package.json")) &&
  await pathExists(path.join(fixturePath, "src"));

const hasProjectRegistrationSchema = (): boolean =>
  projects !== undefined &&
  repoInstallations !== undefined &&
  projectKernels !== undefined;

const hasDbSmokeRoute = (
  target: "initConnect" | "targetRepoHarness",
  cliTarget: string
): boolean => {
  const parsed = parseArgs(["db", "smoke", cliTarget]).command;

  return parsed?.kind === "dbSmoke" && parsed.target === target;
};

const hasInitConnectSmokeCapability = (
  packageJson: Record<string, unknown> | undefined
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:init-connect",
    "krn db smoke init-connect"
  ).startsWith("available") &&
  hasDbSmokeRoute("initConnect", "init-connect");

const hasTargetHarnessSmokeCapability = (
  packageJson: Record<string, unknown> | undefined
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:target-repo-harness",
    "krn db smoke target-repo-harness"
  ).startsWith("available") &&
  hasDbSmokeRoute("targetRepoHarness", "target-repo-harness");

const hasForbiddenTargetSurface = async (fixturePath: string): Promise<boolean> =>
  await pathExistsAny([
    path.join(fixturePath, ".krn"),
    path.join(fixturePath, "apps"),
    path.join(fixturePath, "packages", "dashboard"),
    path.join(fixturePath, "packages", "api"),
    path.join(fixturePath, "memory.md"),
    path.join(fixturePath, "MEMORY.md")
  ]);

export const checkTargetRepoReadiness = async (
  repoRoot: string,
  databaseUrl?: string,
  environmentFingerprintId?: string,
  initConnectEnvironmentFingerprintId?: string
): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const fixturePath = targetRepoFixturePath(repoRoot);
  const initCommandAvailable = hasTargetInitCommand();
  const fixtureAvailable = await hasTargetFixture(fixturePath);
  const projectRegistrationSchemaPresent = hasProjectRegistrationSchema();
  const initConnectSmokeAvailable = hasInitConnectSmokeCapability(packageJson);
  const targetHarnessSmokeAvailable = hasTargetHarnessSmokeCapability(packageJson);
  const forbiddenSurfacePresent = await hasForbiddenTargetSurface(fixturePath);
  let initConnectProof: Awaited<ReturnType<typeof readCurrentInitConnectRuntimeProof>>;
  let targetProof: Awaited<ReturnType<typeof readCurrentTargetRepoRuntimeProof>>;

  if (databaseUrl !== undefined) {
    const client = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
    try {
      if (initConnectEnvironmentFingerprintId !== undefined) {
        initConnectProof = await readCurrentInitConnectRuntimeProof(client, {
          databaseUrl,
          environmentFingerprintId: initConnectEnvironmentFingerprintId,
          scopeKey: fixturePath
        });
      }
      if (environmentFingerprintId !== undefined) {
        targetProof = await readCurrentTargetRepoRuntimeProof(client, {
          databaseUrl,
          environmentFingerprintId,
          scopeKey: fixturePath
        });
      }
    } catch {
      targetProof = undefined;
    } finally {
      await client.end();
    }
  }

  let initConnectProofCheck: DoctorCheck = {
    label: "Init-connect smoke",
    status: initConnectSmokeAvailable
      ? "available (pnpm db:smoke:init-connect; run it for proof)"
      : "unverified (pnpm db:smoke:init-connect missing)",
    outcome: initConnectSmokeAvailable ? "available" : "runtime_unverified",
    severity: passOrWarning(initConnectSmokeAvailable)
  };

  if (databaseUrl !== undefined && initConnectEnvironmentFingerprintId !== undefined) {
    initConnectProofCheck = {
      label: "Init-connect smoke",
      status: "unverified (run pnpm db:smoke:init-connect)",
      outcome: "runtime_unverified",
      severity: "warning"
    };
  }

  if (initConnectProof !== undefined && initConnectProof.projectId !== null) {
    const report = initConnectProof.report;
    const proofValid = report.commandStatus === "passed" &&
      report.observationOnly === true &&
      report.projectRegistrationReadback === true &&
      report.idempotencyReadback === true &&
      report.refreshReadback === true;

    if (proofValid) {
      initConnectProofCheck = {
        label: "Init-connect smoke",
        status: `ready (project ${initConnectProof.projectId}; command pnpm db:smoke:init-connect; captured ${initConnectProof.capturedAt}; store ${postgresStoreIdentity(databaseUrl!)})`,
        outcome: "proven",
        severity: "pass",
        proof: {
          command: "pnpm db:smoke:init-connect",
          status: "passed",
          capturedAt: initConnectProof.capturedAt,
          freshness: "current",
          storeIdentity: initConnectProof.storeIdentity,
          projectId: initConnectProof.projectId,
          environmentFingerprintId: initConnectProof.environmentFingerprintId
        }
      };
    }
  }

  let targetProofCheck: DoctorCheck = {
    label: "Cross-project leakage proof",
    status: "unverified (run pnpm db:smoke:target-repo-harness)",
    outcome: "runtime_unverified",
    severity: "warning"
  };

  let targetHarnessProofCheck: DoctorCheck = {
    label: "Target repo harness smoke",
    status: targetHarnessSmokeAvailable
      ? "available (pnpm db:smoke:target-repo-harness; run it for proof)"
      : "unverified (pnpm db:smoke:target-repo-harness missing)",
    outcome: targetHarnessSmokeAvailable ? "available" : "runtime_unverified",
    severity: passOrWarning(targetHarnessSmokeAvailable)
  };

  if (targetProof !== undefined && targetProof.projectId !== null) {
    const targetProofReport = targetProof.report;
    const targetProofValid = targetProofReport.crossProjectLeakageProof === true &&
      targetProofReport.consumerTargetCommandStatus === "passed" &&
      targetProofReport.consumerEvidenceBoundToPacket === true &&
      targetProofReport.targetProjectLinked === true;

    if (targetProofValid) {
      const proof = {
        command: "pnpm db:smoke:target-repo-harness",
        status: "passed" as const,
        capturedAt: targetProof.capturedAt,
        freshness: "current" as const,
        storeIdentity: targetProof.storeIdentity,
        projectId: targetProof.projectId,
        environmentFingerprintId: targetProof.environmentFingerprintId
      };
      targetHarnessProofCheck = {
        label: "Target repo harness smoke",
        status: `ready (project ${targetProof.projectId}; command pnpm db:smoke:target-repo-harness; captured ${targetProof.capturedAt}; store ${postgresStoreIdentity(databaseUrl!)})`,
        outcome: "proven",
        severity: "pass",
        proof
      };
      targetProofCheck = {
      label: "Cross-project leakage proof",
      status: `ready (project ${targetProof.projectId}; command pnpm db:smoke:target-repo-harness; captured ${targetProof.capturedAt}; store ${postgresStoreIdentity(databaseUrl!)})`,
      outcome: "proven",
      severity: "pass",
        proof
      };
    }
  }

  return [
    {
      label: "Target repo init command",
      status: initCommandAvailable
        ? "available (krn init --connect --repo <path> --persist)"
        : "missing (krn init --connect --repo <path> --persist)",
      outcome: initCommandAvailable ? "available" : "missing",
      severity: passOrWarning(initCommandAvailable)
    },
    {
      label: "Target repo fixture smoke",
      status: fixtureAvailable
        ? "available (tests/fixtures/target-repos/typescript-basic)"
        : "missing (tests/fixtures/target-repos/typescript-basic)",
      outcome: fixtureAvailable ? "available" : "missing",
      severity: passOrWarning(fixtureAvailable)
    },
    {
      label: "Project registration schema",
      status: projectRegistrationSchemaPresent
        ? "present (Project, RepoInstallation, ProjectKernel)"
        : "missing (Project, RepoInstallation, ProjectKernel)",
      outcome: projectRegistrationSchemaPresent ? "present" : "missing",
      severity: passOrWarning(projectRegistrationSchemaPresent)
    },
    initConnectProofCheck,
    targetHarnessProofCheck,
    targetProofCheck,
    {
      label: "Target repo forbidden surfaces",
      status: forbiddenSurfacePresent ? "present" : "absent",
      outcome: forbiddenSurfacePresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(forbiddenSurfacePresent)
    }
  ];
};
