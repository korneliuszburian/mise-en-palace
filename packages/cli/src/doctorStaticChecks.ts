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

export const checkCodexAdapter = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const adapterIndexText = await readOptionalText(
    path.join(repoRoot, "packages", "codex-adapter", "src", "index.ts")
  );
  const renderExecutionBriefText = await readOptionalText(
    path.join(repoRoot, "packages", "codex-adapter", "src", "renderExecutionBrief.ts")
  );
  const renderHookExpectationsText = await readOptionalText(
    path.join(repoRoot, "packages", "codex-adapter", "src", "renderHookExpectations.ts")
  );
  const contractsText = await readOptionalText(
    path.join(repoRoot, "packages", "codex-adapter", "src", "contracts.ts")
  );
  const cliText = [
    await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts")),
    await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "runCli.ts")),
    await readOptionalText(path.join(repoRoot, "packages", "cli", "src", "runCodexBriefCommand.ts"))
  ].join("\n");
  const adapterText = await readTreeText(
    path.join(repoRoot, "packages", "codex-adapter", "src")
  );
  const rendererPresent =
    adapterIndexText.includes("./renderExecutionBrief") &&
    renderExecutionBriefText.includes("createExecutionBrief") &&
    renderExecutionBriefText.includes("renderExecutionBriefText");
  const hookProjectionPresent =
    contractsText.includes("CodexHookExpectationProjection") &&
    renderHookExpectationsText.includes("createCodexHookExpectationProjection");
  const codexRunnerPresent =
    await pathExists(path.join(repoRoot, "packages", "codex-runner")) ||
    await pathExists(path.join(repoRoot, "packages", "codex-executor")) ||
    await pathExists(path.join(repoRoot, "packages", "codex-execution")) ||
    cliText.includes("runCodexExecution") ||
    cliText.includes("invokeCodex(") ||
    cliText.includes("codex execute") ||
    cliText.includes("codex run") ||
    cliText.includes("codex exec") ||
    adapterText.includes("spawn(\"codex\"") ||
    adapterText.includes("spawn('codex'") ||
    adapterText.includes("exec(\"codex\"") ||
    adapterText.includes("exec('codex'");
  const mcpServerPresent =
    await pathExists(path.join(repoRoot, "packages", "mcp-server")) ||
    await pathExists(path.join(repoRoot, "packages", "krn-mcp-server")) ||
    await pathExists(path.join(repoRoot, "packages", "mcp")) ||
    cliText.includes("createMcpServer") ||
    cliText.includes("startMcpServer") ||
    adapterText.includes("createMcpServer") ||
    adapterText.includes("startMcpServer");

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

export const checkWorkerJobs = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const rootPackageText = await readOptionalText(path.join(repoRoot, "package.json"));
  const packageManifestTexts = await Promise.all([
    readOptionalText(path.join(repoRoot, "packages", "cli", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "codex-adapter", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "core", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "db", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "harness", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "schema", "package.json")),
    readOptionalText(path.join(repoRoot, "packages", "workers", "package.json"))
  ]);
  const schemaText = await readOptionalText(
    path.join(repoRoot, "packages", "db", "src", "schema", "events.ts")
  );
  const repositoryText = await readOptionalText(
    path.join(repoRoot, "packages", "db", "src", "repositories", "DrizzleWorkerJobRepository.ts")
  );
  const workersText = await readTreeText(path.join(repoRoot, "packages", "workers", "src"));
  const workerRepositoryText = await readTreeText(
    path.join(repoRoot, "packages", "db", "src", "repositories")
  );
  const dependencyText = `${rootPackageText}\n${packageManifestTexts.join("\n")}`.toLowerCase();
  const schemaPresent =
    schemaText.includes("workerJobs") &&
    schemaText.includes("outboxEvents") &&
    schemaText.includes("workerJobStatus") &&
    schemaText.includes("skipped");
  const repositoryPresent =
    repositoryText.includes("DrizzleWorkerJobRepository") &&
    repositoryText.includes("enqueueWorkerJob") &&
    repositoryText.includes("listQueuedWorkerJobs") &&
    repositoryText.includes("markWorkerJobRunning") &&
    repositoryText.includes("markWorkerJobSucceeded") &&
    repositoryText.includes("markWorkerJobSkipped") &&
    repositoryText.includes("markWorkerJobFailed") &&
    repositoryText.includes("cleanupTestWorkerJobs");
  const redisKafkaPresent =
    dependencyText.includes("\"redis\"") ||
    dependencyText.includes("redis@") ||
    dependencyText.includes("ioredis") ||
    dependencyText.includes("@upstash/redis") ||
    dependencyText.includes("\"kafka\"") ||
    dependencyText.includes("kafka@") ||
    dependencyText.includes("kafkajs");
  const broadWorkerDaemonPresent =
    await pathExists(path.join(repoRoot, "packages", "worker-daemon")) ||
    await pathExists(path.join(repoRoot, "packages", "workers-daemon")) ||
    await pathExists(path.join(repoRoot, "packages", "job-runner")) ||
    workersText.includes("setInterval") ||
    workersText.includes("while (") ||
    workersText.includes("for (;;)") ||
    workersText.includes("spawn(") ||
    workersText.includes("exec(") ||
    workersText.includes("requiresBackgroundLoop: true") ||
    workerRepositoryText.includes("requiresBackgroundLoop: true");

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

export const checkTargetRepoReadiness = async (repoRoot: string): Promise<DoctorCheck[]> => {
  const packageJson = await readJsonObject(path.join(repoRoot, "package.json"));
  const parseArgsText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "parseArgs.ts")
  );
  const runCliText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runCli.ts")
  );
  const runInitText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runInitCommand.ts")
  );
  const runPlanText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "runPlanCommand.ts")
  );
  const databaseRuntimeText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "databaseRuntime.ts")
  );
  const targetHarnessSmokeText = await readOptionalText(
    path.join(repoRoot, "packages", "cli", "src", "targetRepoHarnessSmoke.ts")
  );
  const initConnectSmokeText = await readOptionalText(
    path.join(repoRoot, "packages", "db", "src", "initConnectSmoke.ts")
  );
  const harnessSchemaText = await readOptionalText(
    path.join(repoRoot, "packages", "db", "src", "schema", "harness.ts")
  );
  const verificationText = await readOptionalText(
    path.join(repoRoot, "docs", "runs", "2026-06-22-target-repo-init-connect", "VERIFICATION.md")
  );
  const fixturePath = path.join(
    repoRoot,
    "tests",
    "fixtures",
    "target-repos",
    "typescript-basic"
  );
  const initCommandAvailable =
    parseArgsText.includes("--connect") &&
    runCliText.includes("runInitCommand") &&
    runInitText.includes("connect") &&
    runInitText.includes("createRepoInstallation") &&
    runInitText.includes("createProjectKernel");
  const fixtureAvailable =
    await pathExists(path.join(fixturePath, "package.json")) &&
    await pathExists(path.join(fixturePath, "src"));
  const projectRegistrationSchemaPresent =
    harnessSchemaText.includes("projects") &&
    harnessSchemaText.includes("repoInstallations") &&
    harnessSchemaText.includes("projectKernels") &&
    harnessSchemaText.includes("repoFingerprint") &&
    harnessSchemaText.includes("localPathHint");
  const initConnectSmokeProven =
    readScriptStatus(
      packageJson,
      "db:smoke:init-connect",
      "krn db smoke init-connect"
    ).startsWith("available") &&
    parseArgsText.includes("init-connect") &&
    initConnectSmokeText.includes("runInitConnectSmokeCheck") &&
    initConnectSmokeText.includes("cleanupFixtureProjectRecords") &&
    verificationText.includes("Live `pnpm db:smoke:init-connect` passed");
  const targetHarnessSmokeProven =
    readScriptStatus(
      packageJson,
      "db:smoke:target-repo-harness",
      "krn db smoke target-repo-harness"
    ).startsWith("available") &&
    parseArgsText.includes("target-repo-harness") &&
    targetHarnessSmokeText.includes("runTargetRepoHarnessSmokeCheck") &&
    targetHarnessSmokeText.includes("targetProjectLinked") &&
    targetHarnessSmokeText.includes("cleanupMarkerRows") &&
    verificationText.includes("Live `pnpm db:smoke:target-repo-harness` passed");
  const crossProjectLeakageProofKnown =
    runPlanText.includes("projectId") &&
    runPlanText.includes("ProjectKernel") &&
    databaseRuntimeText.includes("getLatestProjectKernel") &&
    databaseRuntimeText.includes("listRepoInstallationsForProject") &&
    targetHarnessSmokeText.includes("targetProjectLinked") &&
    verificationText.includes("Target project linkage was verified as `yes`");
  const forbiddenSurfacePresent =
    await pathExists(path.join(fixturePath, ".krn")) ||
    await pathExists(path.join(fixturePath, "apps")) ||
    await pathExists(path.join(fixturePath, "packages", "dashboard")) ||
    await pathExists(path.join(fixturePath, "packages", "api")) ||
    await pathExists(path.join(fixturePath, "memory.md")) ||
    await pathExists(path.join(fixturePath, "MEMORY.md"));

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
