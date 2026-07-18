import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  runDecisionPacketReturnLoopSmokeCheck
} from "../smoke/decision-packet-return-loop-smoke.js";
import {
  pairedLiveCheckerRevision
} from "./paired-live-codex-repair.js";

const requestedArguments = process.argv.slice(2);
const requestedDirectory = requestedArguments[0] === "--"
  ? requestedArguments[1]
  : requestedArguments[0];
const repoRoot = path.basename(process.cwd()) === "cli" &&
    path.basename(path.dirname(process.cwd())) === "packages"
  ? path.resolve(process.cwd(), "../..")
  : path.resolve(process.cwd());
const outputDirectory = path.resolve(
  repoRoot,
  requestedDirectory ?? `.local-lab/paired-live/retained-memory-treatment-${Date.now()}`
);
const databaseUrl = process.env.KRN_DATABASE_URL ??
  "postgres://krn:krn@localhost:54329/krn";
const smokeId = `retained-memory-treatment-${Date.now()}`;
const migrationsFolder = path.join(repoRoot, "packages/db/src/migrations");
const codexCommand = "/home/krn/.npm/_npx/c8ab89660c602c20/node_modules/@openai/codex-linux-x64/vendor/x86_64-unknown-linux-musl/bin/codex";
const codexModel = "gpt-5.6-sol";
const profileConfig = `model = \"${codexModel}\"\n`;
const profileHash = createHash("sha256").update(profileConfig).digest("hex");
const mcpCommand = path.join(repoRoot, "packages/cli/node_modules/.bin/tsx");
const mcpServer = path.join(
  repoRoot,
  "packages/cli/src/internal/mcp/decision-packet-mcp-server.ts"
);
const memoryCoreSkill = path.join(repoRoot, ".agents/skills/krn-memory-core/SKILL.md");

const commonCodex = {
  command: codexCommand,
  args: [
    "--ask-for-approval", "never", "exec", "--model", codexModel,
    "--profile", "paired-live", "--sandbox", "workspace-write",
    "--ignore-user-config", "--ignore-rules", "--ephemeral", "--json", "{prompt}"
  ],
  model: codexModel,
  cliVersion: "codex-cli 0.144.6",
  profile: {
    name: "paired-live",
    config: profileConfig,
    hash: profileHash
  },
  permissions: {
    sandbox: "workspace-write",
    approval: "never"
  },
  networkPolicy: "disabled",
  budget: {
    timeoutMs: 180_000
  }
} as const;

const commonCapabilities = {
  baseline: {
    mode: "baseline",
    mcpServers: [],
    skillPaths: []
  },
  semantic: {
    mode: "krn",
    mcpServers: [{
      name: "krn_decision_packet",
      command: mcpCommand,
      args: [mcpServer],
      envVars: ["KRN_DATABASE_URL"]
    }],
    skillPaths: []
  },
  procedural: {
    mode: "krn",
    mcpServers: [],
    skillPaths: [memoryCoreSkill]
  }
} as const;

const manifestFor = (
  report: Awaited<ReturnType<typeof runDecisionPacketReturnLoopSmokeCheck>>,
  treatment: "semantic_governed" | "procedural_skills"
) => ({
  kind: "krn.pairedLiveCodexRepairManifest.v1",
  scenario: "weak-json-boundary",
  sourcePath: "tests/fixtures/target-repos/weak-json-boundary-typescript",
  projectId: report.projectId,
  taskId: report.taskId,
  task: report.task,
  requiredDecisionIds: report.requiredDecisionIds,
  runId: report.executionRunId,
  treatment,
  codex: commonCodex,
  capabilities: {
    baseline: commonCapabilities.baseline,
    krn: treatment === "semantic_governed"
      ? commonCapabilities.semantic
      : commonCapabilities.procedural
  },
  containment: {
    command: "bwrap",
    version: "bubblewrap 0.11.2",
    network: "model_service_egress",
    workspaceWriteRoot: "{targetRoot}",
    homeRoot: "{sandboxRoot}"
  },
  checker: {
    heldOut: true,
    outcome: "win|tie|loss|invalid"
  },
  packetReadiness: "weak_context",
  checkerRevision: pairedLiveCheckerRevision,
  decisionApplications: report.decisionApplications,
  timeoutMs: 180_000
});

await mkdir(outputDirectory, { recursive: true });
const report = await runDecisionPacketReturnLoopSmokeCheck({
  databaseUrl,
  migrationsFolder,
  smokeId,
  retainFixture: true,
  taskPrefix: "weak json boundary repair"
});

if (!report.retainedFixture || report.cleanedUp) {
  throw new Error("Retained fixture smoke did not preserve the seeded database rows");
}

await writeFile(
  path.join(outputDirectory, "fixture-report.json"),
  `${JSON.stringify({ smokeId, databaseUrl: "configured", report }, null, 2)}\n`
);
await writeFile(
  path.join(outputDirectory, "semantic-governed.json"),
  `${JSON.stringify(manifestFor(report, "semantic_governed"), null, 2)}\n`
);
await writeFile(
  path.join(outputDirectory, "procedural-skills.json"),
  `${JSON.stringify(manifestFor(report, "procedural_skills"), null, 2)}\n`
);

process.stdout.write(`${JSON.stringify({
  outputDirectory,
  smokeId,
  projectId: report.projectId,
  taskId: report.taskId,
  runId: report.executionRunId,
  packetChecksum: report.packetChecksum,
  retainedFixture: report.retainedFixture,
  semanticManifest: path.join(outputDirectory, "semantic-governed.json"),
  proceduralManifest: path.join(outputDirectory, "procedural-skills.json")
}, null, 2)}\n`);
