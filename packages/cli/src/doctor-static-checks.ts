import path from "node:path";

import {
  createCodexHookExpectationProjection,
  createExecutionBrief,
  renderExecutionBriefText
} from "@krn/codex-adapter";
import {
  DrizzleProjectRepository,
  DrizzleWorkerJobRepository
} from "@krn/db/adapters";
import {
  runInitConnectSmokeCheck
} from "@krn/db/dev";
import {
  outboxEvents,
  projectKernels,
  projects,
  repoInstallations,
  workerJobs,
  workerJobStatus
} from "@krn/db/schema";
import {
  maintenanceJobRuntimeContract
} from "@krn/workers";

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
import {
  runTargetRepoHarnessSmokeCheck
} from "./target-repo-harness-smoke.js";

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

const hasMcpServer = async (
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
  const hookProjectionPresent = hasFunction(createCodexHookExpectationProjection);
  const codexRunnerPresent = await hasCodexRunner(repoRoot);
  const mcpServerPresent = await hasMcpServer(repoRoot);

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
      label: "Hook expectation projection",
      status: hookProjectionPresent ? "present" : "missing",
      outcome: hookProjectionPresent ? "present" : "missing",
      severity: passOrWarning(hookProjectionPresent)
    },
    {
      label: "Codex execution runner",
      status: codexRunnerPresent ? "present" : "absent",
      outcome: codexRunnerPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(codexRunnerPresent)
    },
    {
      label: "KRN MCP server",
      status: mcpServerPresent ? "present" : "absent",
      outcome: mcpServerPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(mcpServerPresent)
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
  packagePath(repoRoot, "workers", "package.json")
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

const hasBroadWorkerDaemon = async (
  repoRoot: string
): Promise<boolean> => await pathExistsAny([
    path.join(repoRoot, "packages", "worker-daemon"),
    path.join(repoRoot, "packages", "workers-daemon"),
    path.join(repoRoot, "packages", "job-runner")
  ]);

const workerRepositoryMethods = [
  "enqueueWorkerJob",
  "listQueuedWorkerJobs",
  "markWorkerJobRunning",
  "markWorkerJobSucceeded",
  "markWorkerJobSkipped",
  "markWorkerJobFailed",
  "cleanupTestWorkerJobs"
] as const;

const workerJobSchemaPresent = (): boolean =>
  workerJobs !== undefined &&
  outboxEvents !== undefined &&
  workerJobStatus.enumValues.includes("skipped");

const workerJobRepositoryPresent = (): boolean =>
  workerRepositoryMethods.every((methodName) =>
    hasFunction(DrizzleWorkerJobRepository.prototype[methodName])
  );

export const checkWorkerJobs = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const dependencyText = await readDependencyText(repoRoot);
  const schemaPresent = workerJobSchemaPresent();
  const repositoryPresent = workerJobRepositoryPresent();
  const redisKafkaPresent = hasRedisOrKafkaDependency(dependencyText);
  const workerJobSmokeStatus = readScriptStatus(
    packageJson,
    "db:smoke:worker-jobs",
    "krn db smoke worker-jobs"
  );
  const broadWorkerDaemonPresent = await hasBroadWorkerDaemon(
    repoRoot
  ) || Boolean(maintenanceJobRuntimeContract.requiresBackgroundLoop);

  return [
    {
      label: "Worker job schema",
      status: schemaPresent ? "present" : "missing",
      outcome: schemaPresent ? "present" : "missing",
      severity: passOrWarning(schemaPresent)
    },
    {
      label: "Worker job repository",
      status: repositoryPresent ? "present" : "missing",
      outcome: repositoryPresent ? "present" : "missing",
      severity: passOrWarning(repositoryPresent)
    },
    {
      label: "Worker job smoke",
      status: workerJobSmokeStatus,
      outcome: availableOutcome(workerJobSmokeStatus),
      severity: passOrWarning(workerJobSmokeStatus.startsWith("available"))
    },
    {
      label: "Redis/Kafka queue",
      status: redisKafkaPresent ? "present" : "absent",
      outcome: redisKafkaPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(redisKafkaPresent)
    },
    {
      label: "Broad worker daemon",
      status: broadWorkerDaemonPresent ? "present" : "absent",
      outcome: broadWorkerDaemonPresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(broadWorkerDaemonPresent)
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

const hasInitConnectSmokeProof = (
  packageJson: Record<string, unknown> | undefined
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:init-connect",
    "krn db smoke init-connect"
  ).startsWith("available") &&
  hasDbSmokeRoute("initConnect", "init-connect") &&
  hasFunction(runInitConnectSmokeCheck);

const hasTargetHarnessSmokeProof = (
  packageJson: Record<string, unknown> | undefined
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:target-repo-harness",
    "krn db smoke target-repo-harness"
  ).startsWith("available") &&
  hasDbSmokeRoute("targetRepoHarness", "target-repo-harness") &&
  hasFunction(runTargetRepoHarnessSmokeCheck);

const hasCrossProjectLeakageProof = (
  targetHarnessSmokeProven: boolean
): boolean =>
  targetHarnessSmokeProven &&
  hasFunction(DrizzleProjectRepository.prototype.getLatestProjectKernel) &&
  hasFunction(DrizzleProjectRepository.prototype.listRepoInstallationsForProject);

const hasForbiddenTargetSurface = async (fixturePath: string): Promise<boolean> =>
  await pathExistsAny([
    path.join(fixturePath, ".krn"),
    path.join(fixturePath, "apps"),
    path.join(fixturePath, "packages", "dashboard"),
    path.join(fixturePath, "packages", "api"),
    path.join(fixturePath, "memory.md"),
    path.join(fixturePath, "MEMORY.md")
  ]);

export const checkTargetRepoReadiness = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const fixturePath = targetRepoFixturePath(repoRoot);
  const initCommandAvailable = hasTargetInitCommand();
  const fixtureAvailable = await hasTargetFixture(fixturePath);
  const projectRegistrationSchemaPresent = hasProjectRegistrationSchema();
  const initConnectSmokeProven = hasInitConnectSmokeProof(packageJson);
  const targetHarnessSmokeProven = hasTargetHarnessSmokeProof(packageJson);
  const crossProjectLeakageProofKnown = hasCrossProjectLeakageProof(targetHarnessSmokeProven);
  const forbiddenSurfacePresent = await hasForbiddenTargetSurface(fixturePath);

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
    {
      label: "Init-connect smoke",
      status: initConnectSmokeProven
        ? "proven (pnpm db:smoke:init-connect)"
        : "unverified (pnpm db:smoke:init-connect missing)",
      outcome: initConnectSmokeProven ? "proven" : "runtime_unverified",
      severity: passOrWarning(initConnectSmokeProven)
    },
    {
      label: "Target repo harness smoke",
      status: targetHarnessSmokeProven
        ? "proven (pnpm db:smoke:target-repo-harness)"
        : "unverified (pnpm db:smoke:target-repo-harness missing)",
      outcome: targetHarnessSmokeProven ? "proven" : "runtime_unverified",
      severity: passOrWarning(targetHarnessSmokeProven)
    },
    {
      label: "Cross-project leakage proof",
      status: crossProjectLeakageProofKnown ? "known" : "unproven",
      outcome: crossProjectLeakageProofKnown ? "known" : "runtime_unverified",
      severity: passOrWarning(crossProjectLeakageProofKnown)
    },
    {
      label: "Target repo forbidden surfaces",
      status: forbiddenSurfacePresent ? "present" : "absent",
      outcome: forbiddenSurfacePresent ? "present" : "absent",
      severity: forbiddenSurfaceSeverity(forbiddenSurfacePresent)
    }
  ];
};
