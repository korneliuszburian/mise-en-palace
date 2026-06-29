import path from "node:path";

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

const includesAll = (text: string, fragments: readonly string[]): boolean =>
  fragments.every((fragment) => text.includes(fragment));

const includesAny = (text: string, fragments: readonly string[]): boolean =>
  fragments.some((fragment) => text.includes(fragment));

const pathExistsAny = async (paths: readonly string[]): Promise<boolean> => {
  const exists = await Promise.all(paths.map((targetPath) => pathExists(targetPath)));

  return exists.some(Boolean);
};

const packagePath = (
  repoRoot: string,
  packageName: string,
  ...segments: string[]
): string => path.join(repoRoot, "packages", packageName, ...segments);

const hasCodexRunner = async (
  repoRoot: string,
  cliText: string,
  adapterText: string
): Promise<boolean> =>
  await pathExistsAny([
    path.join(repoRoot, "packages", "codex-runner"),
    path.join(repoRoot, "packages", "codex-executor"),
    path.join(repoRoot, "packages", "codex-execution")
  ]) ||
  includesAny(cliText, [
    "runCodexExecution",
    "invokeCodex(",
    "codex execute",
    "codex run",
    "codex exec"
  ]) ||
  includesAny(adapterText, [
    "spawn(\"codex\"",
    "spawn('codex'",
    "exec(\"codex\"",
    "exec('codex'"
  ]);

const hasMcpServer = async (
  repoRoot: string,
  cliText: string,
  adapterText: string
): Promise<boolean> =>
  await pathExistsAny([
    path.join(repoRoot, "packages", "mcp-server"),
    path.join(repoRoot, "packages", "krn-mcp-server"),
    path.join(repoRoot, "packages", "mcp")
  ]) ||
  includesAny(cliText, [
    "createMcpServer",
    "startMcpServer"
  ]) ||
  includesAny(adapterText, [
    "createMcpServer",
    "startMcpServer"
  ]);

export const checkCodexAdapter = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const adapterIndexText = await readOptionalText(
    packagePath(repoRoot, "codex-adapter", "src", "index.ts")
  );
  const renderExecutionBriefText = await readOptionalText(
    packagePath(repoRoot, "codex-adapter", "src", "renderExecutionBrief.ts")
  );
  const renderHookExpectationsText = await readOptionalText(
    packagePath(repoRoot, "codex-adapter", "src", "renderHookExpectations.ts")
  );
  const contractsText = await readOptionalText(
    packagePath(repoRoot, "codex-adapter", "src", "contracts.ts")
  );
  const cliText = [
    await readOptionalText(packagePath(repoRoot, "cli", "src", "parseArgs.ts")),
    await readOptionalText(packagePath(repoRoot, "cli", "src", "runCli.ts")),
    await readOptionalText(packagePath(repoRoot, "cli", "src", "runCodexBriefCommand.ts"))
  ].join("\n");
  const adapterText = await readTreeText(
    packagePath(repoRoot, "codex-adapter", "src")
  );
  const rendererPresent =
    includesAll(adapterIndexText, ["./renderExecutionBrief"]) &&
    includesAll(renderExecutionBriefText, [
      "createExecutionBrief",
      "renderExecutionBriefText"
    ]);
  const hookProjectionPresent =
    includesAll(contractsText, ["CodexHookExpectationProjection"]) &&
    includesAll(renderHookExpectationsText, ["createCodexHookExpectationProjection"]);
  const codexRunnerPresent = await hasCodexRunner(repoRoot, cliText, adapterText);
  const mcpServerPresent = await hasMcpServer(repoRoot, cliText, adapterText);

  return [
    {
      label: "Codex adapter renderer",
      status: rendererPresent ? "present" : "missing"
    },
    {
      label: "Execution brief smoke",
      status: readScriptStatus(
        packageJson,
        "db:smoke:codex-adapter",
        "krn db smoke codex-adapter"
      )
    },
    {
      label: "Hook expectation projection",
      status: hookProjectionPresent ? "present" : "missing"
    },
    {
      label: "Codex execution runner",
      status: codexRunnerPresent ? "present" : "absent"
    },
    {
      label: "KRN MCP server",
      status: mcpServerPresent ? "present" : "absent"
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
  includesAny(dependencyText, [
    "\"redis\"",
    "redis@",
    "ioredis",
    "@upstash/redis",
    "\"kafka\"",
    "kafka@",
    "kafkajs"
  ]);

const hasBroadWorkerDaemon = async (
  repoRoot: string,
  workersText: string,
  workerRepositoryText: string
): Promise<boolean> =>
  await pathExistsAny([
    path.join(repoRoot, "packages", "worker-daemon"),
    path.join(repoRoot, "packages", "workers-daemon"),
    path.join(repoRoot, "packages", "job-runner")
  ]) ||
  includesAny(workersText, [
    "setInterval",
    "while (",
    "for (;;)",
    "spawn(",
    "exec(",
    "requiresBackgroundLoop: true"
  ]) ||
  includesAny(workerRepositoryText, ["requiresBackgroundLoop: true"]);

export const checkWorkerJobs = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const dependencyText = await readDependencyText(repoRoot);
  const schemaText = await readOptionalText(
    packagePath(repoRoot, "db", "src", "schema", "events.ts")
  );
  const repositoryText = await readOptionalText(
    packagePath(repoRoot, "db", "src", "repositories", "DrizzleWorkerJobRepository.ts")
  );
  const workersText = await readTreeText(packagePath(repoRoot, "workers", "src"));
  const workerRepositoryText = await readTreeText(
    packagePath(repoRoot, "db", "src", "repositories")
  );
  const schemaPresent = includesAll(schemaText, [
    "workerJobs",
    "outboxEvents",
    "workerJobStatus",
    "skipped"
  ]);
  const repositoryPresent = includesAll(repositoryText, [
    "DrizzleWorkerJobRepository",
    "enqueueWorkerJob",
    "listQueuedWorkerJobs",
    "markWorkerJobRunning",
    "markWorkerJobSucceeded",
    "markWorkerJobSkipped",
    "markWorkerJobFailed",
    "cleanupTestWorkerJobs"
  ]);
  const redisKafkaPresent = hasRedisOrKafkaDependency(dependencyText);
  const broadWorkerDaemonPresent = await hasBroadWorkerDaemon(
    repoRoot,
    workersText,
    workerRepositoryText
  );

  return [
    {
      label: "Worker job schema",
      status: schemaPresent ? "present" : "missing"
    },
    {
      label: "Worker job repository",
      status: repositoryPresent ? "present" : "missing"
    },
    {
      label: "Worker job smoke",
      status: readScriptStatus(
        packageJson,
        "db:smoke:worker-jobs",
        "krn db smoke worker-jobs"
      )
    },
    {
      label: "Redis/Kafka queue",
      status: redisKafkaPresent ? "present" : "absent"
    },
    {
      label: "Broad worker daemon",
      status: broadWorkerDaemonPresent ? "present" : "absent"
    }
  ];
};

const targetRepoFixturePath = (repoRoot: string): string =>
  path.join(repoRoot, "tests", "fixtures", "target-repos", "typescript-basic");

const hasTargetInitCommand = (
  parseArgsText: string,
  runCliText: string,
  runInitText: string
): boolean =>
  includesAll(parseArgsText, ["--connect"]) &&
  includesAll(runCliText, ["runInitCommand"]) &&
  includesAll(runInitText, [
    "connect",
    "createRepoInstallation",
    "createProjectKernel"
  ]);

const hasTargetFixture = async (fixturePath: string): Promise<boolean> =>
  await pathExists(path.join(fixturePath, "package.json")) &&
  await pathExists(path.join(fixturePath, "src"));

const hasProjectRegistrationSchema = (harnessSchemaText: string): boolean =>
  includesAll(harnessSchemaText, [
    "projects",
    "repoInstallations",
    "projectKernels",
    "repoFingerprint",
    "localPathHint"
  ]);

const hasInitConnectSmokeProof = (
  packageJson: Record<string, unknown> | undefined,
  parseArgsText: string,
  initConnectSmokeText: string,
  verificationText: string
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:init-connect",
    "krn db smoke init-connect"
  ).startsWith("available") &&
  includesAll(parseArgsText, ["init-connect"]) &&
  includesAll(initConnectSmokeText, [
    "runInitConnectSmokeCheck",
    "cleanupFixtureProjectRecords"
  ]) &&
  includesAll(verificationText, ["Live `pnpm db:smoke:init-connect` passed"]);

const hasTargetHarnessSmokeProof = (
  packageJson: Record<string, unknown> | undefined,
  parseArgsText: string,
  targetHarnessSmokeText: string,
  verificationText: string
): boolean =>
  readScriptStatus(
    packageJson,
    "db:smoke:target-repo-harness",
    "krn db smoke target-repo-harness"
  ).startsWith("available") &&
  includesAll(parseArgsText, ["target-repo-harness"]) &&
  includesAll(targetHarnessSmokeText, [
    "runTargetRepoHarnessSmokeCheck",
    "targetProjectLinked",
    "cleanupMarkerRows"
  ]) &&
  includesAll(verificationText, ["Live `pnpm db:smoke:target-repo-harness` passed"]);

const hasCrossProjectLeakageProof = (
  runPlanText: string,
  databaseRuntimeText: string,
  targetHarnessSmokeText: string,
  verificationText: string
): boolean =>
  includesAll(runPlanText, [
    "projectId",
    "ProjectKernel"
  ]) &&
  includesAll(databaseRuntimeText, [
    "getLatestProjectKernel",
    "listRepoInstallationsForProject"
  ]) &&
  includesAll(targetHarnessSmokeText, ["targetProjectLinked"]) &&
  includesAll(verificationText, ["Target project linkage was verified as `yes`"]);

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
  const parseArgsText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "parseArgs.ts")
  );
  const runCliText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "runCli.ts")
  );
  const runInitText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "runInitCommand.ts")
  );
  const runPlanText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "runPlanCommand.ts")
  );
  const databaseRuntimeText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "databaseRuntime.ts")
  );
  const targetHarnessSmokeText = await readOptionalText(
    packagePath(repoRoot, "cli", "src", "targetRepoHarnessSmoke.ts")
  );
  const initConnectSmokeText = await readOptionalText(
    packagePath(repoRoot, "db", "src", "initConnectSmoke.ts")
  );
  const harnessSchemaText = await readOptionalText(
    packagePath(repoRoot, "db", "src", "schema", "harness.ts")
  );
  const verificationText = await readOptionalText(
    path.join(repoRoot, "docs", "runs", "2026-06-22-target-repo-init-connect", "VERIFICATION.md")
  );
  const fixturePath = targetRepoFixturePath(repoRoot);
  const initCommandAvailable = hasTargetInitCommand(
    parseArgsText,
    runCliText,
    runInitText
  );
  const fixtureAvailable = await hasTargetFixture(fixturePath);
  const projectRegistrationSchemaPresent = hasProjectRegistrationSchema(harnessSchemaText);
  const initConnectSmokeProven = hasInitConnectSmokeProof(
    packageJson,
    parseArgsText,
    initConnectSmokeText,
    verificationText
  );
  const targetHarnessSmokeProven = hasTargetHarnessSmokeProof(
    packageJson,
    parseArgsText,
    targetHarnessSmokeText,
    verificationText
  );
  const crossProjectLeakageProofKnown = hasCrossProjectLeakageProof(
    runPlanText,
    databaseRuntimeText,
    targetHarnessSmokeText,
    verificationText
  );
  const forbiddenSurfacePresent = await hasForbiddenTargetSurface(fixturePath);

  return [
    {
      label: "Target repo init command",
      status: initCommandAvailable
        ? "available (krn init --connect --repo <path> --persist)"
        : "missing (krn init --connect --repo <path> --persist)"
    },
    {
      label: "Target repo fixture smoke",
      status: fixtureAvailable
        ? "available (tests/fixtures/target-repos/typescript-basic)"
        : "missing (tests/fixtures/target-repos/typescript-basic)"
    },
    {
      label: "Project registration schema",
      status: projectRegistrationSchemaPresent
        ? "present (Project, RepoInstallation, ProjectKernel)"
        : "missing (Project, RepoInstallation, ProjectKernel)"
    },
    {
      label: "Init-connect smoke",
      status: initConnectSmokeProven
        ? "proven (pnpm db:smoke:init-connect)"
        : "unverified (pnpm db:smoke:init-connect missing)"
    },
    {
      label: "Target repo harness smoke",
      status: targetHarnessSmokeProven
        ? "proven (pnpm db:smoke:target-repo-harness)"
        : "unverified (pnpm db:smoke:target-repo-harness missing)"
    },
    {
      label: "Cross-project leakage proof",
      status: crossProjectLeakageProofKnown ? "known" : "unproven"
    },
    {
      label: "Target repo forbidden surfaces",
      status: forbiddenSurfacePresent ? "present" : "absent"
    }
  ];
};
