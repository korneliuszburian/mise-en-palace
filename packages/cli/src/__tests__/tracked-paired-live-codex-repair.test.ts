import { createHash } from "node:crypto";
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildTrackedTrialArtifact,
  codexCapabilityConfigArgs,
  capabilityUseFalsifierReasons,
  observeCodexCapabilityUse,
  hashTree,
  extractLiveCodexObedienceOutput,
  parseLiveCodexObedienceOutputJson,
  readMcpStructuredContent,
  validateLiveCodexObedienceOutputAgainstPacket,
  parseTrackedTrialManifest,
  observeSourceCommands,
  promptPacketForContext,
  readTrackedTrialArtifact,
  runTrackedPairedTrial,
  runTrackedTrialCommand,
  validateTrialPacket,
  verifyTrackedTrialArtifact,
  type PairedTrialManifest
} from "../internal/eval/tracked-paired-live-codex-repair.js";
import type {
  CommandResult,
  HeldOutArmScore,
  PairedRepairScore
} from "../internal/eval/paired-live-codex-repair.js";

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

const profileConfig = "model = \"gpt-5.6-sol\"\n";

describe("Codex capability profiles", () => {
  it("keeps the baseline empty and emits only declared KRN config overrides", () => {
    expect(codexCapabilityConfigArgs({ mode: "baseline", mcpServers: [], skillPaths: [] })).toEqual([
      "--config",
      "skills.config=[]"
    ]);
    expect(codexCapabilityConfigArgs({
      mode: "krn",
      mcpServers: [{ name: "krn_decision_packet", command: "/bin/krn-mcp", args: ["stdio", "--read-only"], envVars: ["KRN_DATABASE_URL"] }],
      skillPaths: ["/home/krn/skills/krn-memory-core/SKILL.md"]
    })).toEqual([
      "--config",
      "mcp_servers.krn_decision_packet.command=\"/bin/krn-mcp\"",
      "--config",
      "mcp_servers.krn_decision_packet.args=[\"stdio\",\"--read-only\"]",
      "--config",
      "mcp_servers.krn_decision_packet.enabled=true",
      "--config",
      "mcp_servers.krn_decision_packet.env_vars=[\"KRN_DATABASE_URL\"]",
      "--config",
      "skills.config=[{path=\"/home/krn/skills/krn-memory-core/SKILL.md\",enabled=true}]"
    ]);
  });

  it("counts only structured capability events, never prose mentions", () => {
    expect(observeCodexCapabilityUse({ stdout: [
      "I used the mcp_tool_call skill.",
      JSON.stringify({ type: "mcp_tool_call", name: "krn_decision_packet" }),
      JSON.stringify({ item: { type: "skill_loaded", path: "SKILL.md" } })
    ].join("\n") })).toEqual({ mcpToolCallEvents: 1, skillEvents: 1 });
    expect(capabilityUseFalsifierReasons({
      baseline: { mcpToolCallEvents: 0, skillEvents: 0 },
      krn: { mcpToolCallEvents: 1, skillEvents: 0 }
    })).toEqual([]);
    expect(capabilityUseFalsifierReasons({
      baseline: { mcpToolCallEvents: 1, skillEvents: 0 },
      krn: { mcpToolCallEvents: 0, skillEvents: 0 }
    })).toEqual([
      "baseline emitted a KRN capability-use event",
      "KRN emitted no structured capability-use event"
    ]);
  });
});

describe("packet context ablation", () => {
  it("keeps packet identity and task while removing decision context", () => {
    const packet = {
      packetIdentity: { checksum: "a".repeat(64) },
      packet: {
        task: { id: "task-1", projectId: "project-1" },
        contextInclusions: [{ subjectId: "decision-1" }],
        contextExclusions: [{ subjectId: "decision-2" }],
        governingDecisionIds: ["decision-1"],
        sourceDecisionIds: ["source-1"],
        governingStatements: ["use decision-1"],
        sourceClaimIds: ["claim-1"],
        taskStandardDecisions: [{ id: "decision-1" }],
        sourceConsensus: { status: "current" },
        sourceConsensusTimeline: { status: "current" },
        memoryConsensusTimeline: { status: "current" }
      }
    };

    expect(promptPacketForContext(packet, "full")).toBe(packet);
    expect(promptPacketForContext(packet, "task-only")).toEqual({
      packetIdentity: packet.packetIdentity,
      packet: { task: packet.packet.task }
    });
  });
});

describe("MCP packet readback", () => {
  it("accepts a JSON packet carried in text content when structuredContent is absent", () => {
    const packet = { kind: "krn.decisionPacketReadback.v1", packet: { task: { id: "task-1" } } };
    const stdout = [
      "pnpm warning",
      JSON.stringify({ jsonrpc: "2.0", id: 2, result: { content: [{ type: "text", text: JSON.stringify(packet) }] } })
    ].join("\n");

    expect(readMcpStructuredContent(stdout, 2)).toEqual(packet);
  });

  it("ignores terminal prefixes before the JSON-RPC response", () => {
    const packet = { kind: "krn.decisionPacketReadback.v1" };
    const stdout = `\u001b[1;32m${JSON.stringify({ jsonrpc: "2.0", id: 2, result: { structuredContent: packet } })}`;

    expect(readMcpStructuredContent(stdout, 2)).toEqual(packet);
  });
});

describe("trial source preflight", () => {
  it("requires both test and typecheck scripts", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-source-preflight-"));
    try {
      await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { test: "pnpm test" } }), "utf8");
      await expect(observeSourceCommands(root)).resolves.toEqual({ test: true, typecheck: false });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

const manifest: PairedTrialManifest = {
  kind: "krn.pairedLiveCodexRepairManifest.v1",
  scenario: "weak-json-boundary",
  sourcePath: "fixture",
  projectId: "weak-json-boundary-typescript",
  taskId: "weak-json-repair",
  task: "Repair weak-json-boundary-typescript with bounded validation.",
  requiredDecisionIds: ["decision-1", "decision-2"],
  decisionApplications: [
    {
      governingDecisionId: "decision-1",
      sourceDecisionId: "source-decision-1",
      check: "unknown_first",
      changedFiles: ["src/config.ts"]
    },
    {
      governingDecisionId: "decision-2",
      sourceDecisionId: "source-decision-2",
      check: "finite_result_state",
      changedFiles: ["src/userService.ts"]
    }
  ],
  runId: "run-1",
  codex: {
    command: "codex",
    args: [
      "--ask-for-approval",
      "never",
      "exec",
      "--model",
      "gpt-5.6-sol",
      "--profile",
      "trial",
      "--sandbox",
      "workspace-write",
      "--ignore-user-config",
      "--ignore-rules",
      "--ephemeral",
      "{prompt}"
    ],
    model: "gpt-5.6-sol",
    cliVersion: "codex-test",
    profile: { name: "trial", config: profileConfig, hash: sha256(profileConfig) },
    permissions: { sandbox: "workspace-write", approval: "never" },
    networkPolicy: "disabled",
    budget: { timeoutMs: 1000 }
  },
  containment: {
    command: "missing-containment-for-test",
    version: "bwrap-test",
    network: "model_service_egress",
    workspaceWriteRoot: "{targetRoot}",
    homeRoot: "{sandboxRoot}"
  },
  checker: { heldOut: true, outcome: "win|tie|loss|invalid" }
};

const packet = {
  kind: "krn.decisionPacketReadback.v1",
  request: { runId: "run-1" },
  packetIdentity: { checksum: "a".repeat(64) },
  packet: {
    task: {
      id: "weak-json-repair",
      projectId: "weak-json-boundary-typescript",
      objective: "Repair weak-json-boundary-typescript safely."
    },
    governingDecisionIds: ["decision-1", "decision-2"],
    sourceDecisionIds: ["source-decision-1", "source-decision-2"],
    abstentionScore: { status: "ready" }
  }
};
const sourceRoot = resolve(process.cwd(), "../../tests/fixtures/target-repos/weak-json-boundary-typescript");

const writeExecutable = async (path: string, source: string): Promise<void> => {
  await writeFile(path, source, "utf8");
  await chmod(path, 0o755);
};

const makeRunnableTargetSource = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-source-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "target.ts"), "export const target = 'fixture';\n", "utf8");

  return root;
};

const withProcessEnvironment = async <Value>(
  overrides: Readonly<Record<string, string | undefined>>,
  run: () => Promise<Value>
): Promise<Value> => {
  const previous = new Map(Object.keys(overrides).map((key) => [key, process.env[key]]));

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const withNodeEnvironmentFlags = async <Value>(
  flags: ReadonlySet<string>,
  run: () => Promise<Value>
): Promise<Value> => {
  const descriptor = Object.getOwnPropertyDescriptor(process, "allowedNodeEnvironmentFlags");
  Object.defineProperty(process, "allowedNodeEnvironmentFlags", {
    configurable: true,
    value: flags
  });

  try {
    return await run();
  } finally {
    if (descriptor === undefined) delete (process as Partial<NodeJS.Process>).allowedNodeEnvironmentFlags;
    else Object.defineProperty(process, "allowedNodeEnvironmentFlags", descriptor);
  }
};

const makeFakeCodex = async (
  path: string,
  armSource: string,
  versionSource = "printf 'claimed-cli-version %s\\n' \"${KRN_TRIAL_HOST_SENTINEL:-missing}\""
): Promise<void> => {
  await writeFile(join(dirname(path), "auth.json"), "{}\n", { encoding: "utf8", mode: 0o600 });
  await writeExecutable(path, [
    "#!/bin/sh",
    "if [ \"$1\" = \"--version\" ]; then",
    `  ${versionSource}`,
    "  exit 0",
    "fi",
    "if [ \"$1\" = \"login\" ] && [ \"$2\" = \"status\" ]; then",
    "  printf 'Logged in using ChatGPT\\n' >&2",
    "  exit 0",
    "fi",
    armSource
  ].join("\n"));
};

const makeFakeContainment = async (
  path: string,
  armSource: string,
  versionSource = "printf 'claimed-bwrap 1\\n'"
): Promise<void> => {
  await writeExecutable(path, [
    "#!/bin/sh",
    "if [ \"$1\" = \"--version\" ]; then",
    `  ${versionSource}`,
    "  exit 0",
    "fi",
    "if [ \"$1\" = \"--die-with-parent\" ]; then",
    "  while [ \"$1\" != \"--\" ]; do shift; done",
    "  shift",
    `  ${armSource}`,
    "fi",
    "exit 2"
  ].join("\n"));
};

const runnableManifest = (binRoot: string, timeoutMs: number): PairedTrialManifest => ({
  ...manifest,
  runId: "replayed-run",
  codex: {
    ...manifest.codex,
    command: join(binRoot, "codex"),
    cliVersion: "claimed-cli-version missing",
    budget: { timeoutMs }
  },
  containment: {
    ...manifest.containment,
    command: join(binRoot, "bwrap"),
    version: "claimed-bwrap 1"
  }
});

const passingProofCommand = (): CommandResult => ({
  command: "held-out focused-test proof",
  args: [],
  exitCode: 0,
  stdout: "proof passed",
  stderr: ""
});

const passingArm = (): HeldOutArmScore => ({
  status: "pass" as const,
  score: 3,
  checks: [{ name: "focused_tests", passed: true, details: "mutants killed" }],
  changedFiles: [],
  focusedTestControl: passingProofCommand(),
  focusedTestMutations: (["invalid_json", "missing_email", "invalid_role"] as const)
    .map((name) => ({ name, command: passingProofCommand() }))
});

const withoutFocusedTestProof = (arm: HeldOutArmScore): HeldOutArmScore => {
  const {
    focusedTestControl: _focusedTestControl,
    focusedTestMutations: _focusedTestMutations,
    ...legacyArm
  } = arm;
  return legacyArm;
};

const withFocusedCheck = (
  arm: HeldOutArmScore,
  passed: boolean
): HeldOutArmScore => ({
  ...arm,
  checks: arm.checks.map((check) =>
    check.name === "focused_tests" ? { ...check, passed } : check
  )
});

const withFailedFocusedMutation = (arm: HeldOutArmScore): HeldOutArmScore =>
  arm.focusedTestMutations === undefined
    ? arm
    : {
        ...arm,
        focusedTestMutations: arm.focusedTestMutations.map((proof, index) =>
          index === 0 ? { ...proof, command: { ...proof.command, exitCode: 1 } } : proof
        )
      };

const passingChecker = async (): Promise<PairedRepairScore> => ({
  outcome: "tie",
  baseline: passingArm(),
  krn: passingArm(),
  reason: "deterministic held-out checker fixture"
});

describe("tracked paired live Codex repair", () => {
  it("accepts the bounded live obedience output contract", () => {
    expect(parseLiveCodexObedienceOutputJson(JSON.stringify({
      decisionId: "validate-unknown-json-boundary",
      rejectedPath: "cast JSON directly",
      staleBoundary: "markdown notes are not runtime authority",
      nonProof: "does not prove live product readiness",
      action: "validate before domain use"
    }))).toEqual({
      decisionId: "validate-unknown-json-boundary",
      rejectedPath: "cast JSON directly",
      staleBoundary: "markdown notes are not runtime authority",
      nonProof: "does not prove live product readiness",
      action: "validate before domain use"
    });
  });

  it("rejects live output that omits a boundary field", () => {
    expect(() => parseLiveCodexObedienceOutputJson(JSON.stringify({
      decisionId: "validate-unknown-json-boundary",
      rejectedPath: "cast JSON directly",
      staleBoundary: "markdown notes are not runtime authority",
      action: "validate before domain use"
    }))).toThrow("required boundary fields are missing");
  });

  it("accepts multiple governing decisions and rejects invented packet authority", () => {
    const output = parseLiveCodexObedienceOutputJson(JSON.stringify({
      decisionId: ["decision-a", "decision-b"],
      rejectedPath: "rejected-id",
      staleBoundary: "no stale decisions",
      nonProof: "does not prove execution",
      action: "validate"
    }));
    expect(validateLiveCodexObedienceOutputAgainstPacket(output, {
      packet: {
        governingDecisionIds: ["decision-a", "decision-b"],
        rejectedPathIds: ["rejected-id"],
        staleDecisionIds: [],
        doesNotProve: ["execution is not proven"]
      }
    })).toEqual({ valid: true, reasons: [] });
    expect(validateLiveCodexObedienceOutputAgainstPacket({
      ...output,
      decisionId: ["invented-decision"]
    }, {
      packet: {
        governingDecisionIds: ["decision-a"],
        rejectedPathIds: ["rejected-id"],
        staleDecisionIds: [],
        doesNotProve: ["execution is not proven"]
      }
    }).valid).toBe(false);
  });

  it("extracts the final bounded JSON message from Codex logs", () => {
    expect(extractLiveCodexObedienceOutput([
      "codex startup log",
      "not-json",
      JSON.stringify({
        decisionId: "d",
        rejectedPath: "r",
        staleBoundary: "s",
        nonProof: "n",
        action: "a"
      })
    ].join("\n"))).toEqual({
      decisionId: "d",
      rejectedPath: "r",
      staleBoundary: "s",
      nonProof: "n",
      action: "a"
    });
  });

  it("accepts only a run-, project-, task-, and authority-bound packet", () => {
    expect(validateTrialPacket(packet, manifest)).toEqual({
      valid: true,
      reasons: [],
      checksum: "a".repeat(64)
    });

    expect(validateTrialPacket({
      ...packet,
      request: { runId: "other-run" },
      packet: {
        ...packet.packet,
        task: { ...packet.packet.task, projectId: "other-project" },
        abstentionScore: { status: "abstain" }
      }
    }, manifest)).toMatchObject({
      valid: false,
      reasons: expect.arrayContaining([
        "packet runId does not match the trial manifest",
        "packet task is not bound to the manifest project",
        "packet abstains or is not ready for the trial"
      ])
    });

    expect(validateTrialPacket({
      ...packet,
      packet: {
        ...packet.packet,
        sourceDecisionIds: ["source-decision-1"]
      }
    }, manifest)).toMatchObject({
      valid: false,
      reasons: ["packet lacks exact SourceDecision subjects: source-decision-2"]
    });

    expect(validateTrialPacket(packet, {
      ...manifest,
      scenario: "unrelated-boundary"
    })).toMatchObject({
      valid: false,
      reasons: ["packet task does not describe the manifest scenario"]
    });
  });

  it("hashes file content and relative paths, including untracked files", async () => {
    const first = await hashTree(sourceRoot);
    const second = await hashTree(sourceRoot);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("excludes VCS metadata from the source tree identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-trial-tree-vcs-"));

    try {
      await writeFile(join(root, "fixture.txt"), "same source", "utf8");
      const sourceHash = await hashTree(root);
      await mkdir(join(root, ".git"));
      await writeFile(join(root, ".git", "HEAD"), "ref: refs/heads/main\n", "utf8");

      expect(await hashTree(root)).toBe(sourceHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("binds executable modes into the source tree identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-trial-tree-mode-"));

    try {
      const file = join(root, "fixture.sh");
      await writeFile(file, "#!/bin/sh\nexit 0\n", "utf8");
      const sourceHash = await hashTree(root);
      await chmod(file, 0o755);

      expect(await hashTree(root)).not.toBe(sourceHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("binds empty directories and their modes into the source tree identity", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-trial-tree-directory-"));

    try {
      const directory = join(root, "empty");
      await mkdir(directory);
      const sourceHash = await hashTree(root);
      await chmod(directory, 0o700);

      expect(await hashTree(root)).not.toBe(sourceHash);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("rejects malformed and escaped command manifests before starting MCP", async () => {
    const capabilities = {
      baseline: { mode: "baseline" as const, mcpServers: [], skillPaths: [] },
      krn: {
        mode: "krn" as const,
        mcpServers: [{ name: "krn_decision_packet", command: "/bin/krn-mcp", args: ["stdio"] }],
        skillPaths: ["/home/krn/skills/krn-memory-core/SKILL.md"]
      }
    };
    expect(parseTrackedTrialManifest({ ...manifest, capabilities })).toMatchObject({ capabilities });
    expect(() => parseTrackedTrialManifest({
      ...manifest,
      capabilities: { ...capabilities, baseline: { ...capabilities.baseline, skillPaths: ["/tmp/leak"] } }
    })).toThrow("Invalid tracked paired-trial manifest");
    expect(() => parseTrackedTrialManifest({ kind: manifest.kind, codex: {} })).toThrow(
      "Invalid tracked paired-trial manifest"
    );
    expect(() => parseTrackedTrialManifest({
      ...manifest,
      decisionApplications: manifest.decisionApplications.map((rule) => ({
        ...rule,
        check: "unknown_first"
      }))
    })).toThrow("Invalid tracked paired-trial manifest");
    expect(() => parseTrackedTrialManifest({
      ...manifest,
      decisionApplications: manifest.decisionApplications.map((rule) => ({
        ...rule,
        sourceDecisionId: "same-source-decision"
      }))
    })).toThrow("Invalid tracked paired-trial manifest");
    expect(() => parseTrackedTrialManifest({
      ...manifest,
      requiredDecisionIds: ["decision-1", "decision-1"]
    })).toThrow("Invalid tracked paired-trial manifest");
    expect(() => parseTrackedTrialManifest({
      ...manifest,
      decisionApplications: manifest.decisionApplications.map((rule) => ({
        ...rule,
        governingDecisionId: "decision-1"
      }))
    })).toThrow("Invalid tracked paired-trial manifest");

    const root = await mkdtemp(join(process.cwd(), ".krn-tracked-trial-manifest-"));
    const escapedPath = join(root, "escaped.json");
    const symlinkPath = join(root, "escaped-source");
    const manifestSymlinkPath = join(root, "escaped-manifest.json");

    try {
      await writeFile(escapedPath, JSON.stringify({ ...manifest, sourcePath: "../outside" }), "utf8");
      await symlink(tmpdir(), symlinkPath);
      await symlink(tmpdir(), manifestSymlinkPath);
      const symlinkManifestPath = join(root, "symlink.json");
      await writeFile(symlinkManifestPath, JSON.stringify({
        ...manifest,
        sourcePath: relative(resolve(process.cwd(), "../.."), symlinkPath)
      }), "utf8");

      await expect(runTrackedTrialCommand(join(tmpdir(), "outside-trial-manifest.json"))).rejects.toThrow(
        "trial manifest path must stay within the trusted repository root"
      );
      await expect(runTrackedTrialCommand(escapedPath)).rejects.toThrow("trial source path must stay within the trusted repository root");
      await expect(runTrackedTrialCommand(symlinkManifestPath)).rejects.toThrow("trial source path must stay within the trusted repository root");
      await expect(runTrackedTrialCommand(manifestSymlinkPath)).rejects.toThrow("trial manifest path must stay within the trusted repository root");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("records blocked instead of running without an explicit containment boundary", async () => {
    const result = await runTrackedPairedTrial({
      manifest,
      sourceRoot,
      checkerRoot: process.cwd(),
      packet
    });

    expect(result.status).toBe("blocked");
    expect(result.packet.validation.valid).toBe(true);
    expect(result.proof.doesNotProve).toEqual(expect.arrayContaining(["a live Codex repair"]));
  });

  it("rejects unverifiable profile and token-budget declarations before execution", async () => {
    const profileMismatch = await runTrackedPairedTrial({
      manifest: {
        ...manifest,
        codex: {
          ...manifest.codex,
          profile: { ...manifest.codex.profile, hash: "wrong-profile-hash" }
        }
      },
      sourceRoot,
      checkerRoot: process.cwd(),
      packet
    });
    const tokenBudgetClaim = await runTrackedPairedTrial({
      manifest: {
        ...manifest,
        codex: {
          ...manifest.codex,
          budget: { ...manifest.codex.budget, maxTokens: 1000 } as unknown as PairedTrialManifest["codex"]["budget"]
        }
      },
      sourceRoot,
      checkerRoot: process.cwd(),
      packet
    });

    expect(profileMismatch).toMatchObject({
      status: "invalid",
      execution: { invalidReasons: expect.arrayContaining(["Codex profile content does not match its pinned hash"]) }
    });
    expect(tokenBudgetClaim).toMatchObject({
      status: "invalid",
      execution: { invalidReasons: expect.arrayContaining(["Codex maxTokens is not an enforceable CLI budget"]) }
    });
  });

  it("rejects an observed CLI-version mismatch before an arm starts", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-version-"));
    const source = await makeRunnableTargetSource();
    const binRoot = join(root, "bin");
    const armCounter = join(root, "arms.txt");
    await mkdir(binRoot, { recursive: true });
    await makeFakeCodex(join(binRoot, "codex"), `printf x >> \"${armCounter}\"\nexit 0`);
    await makeFakeContainment(join(binRoot, "bwrap"), "exec \"$@\"");

    try {
      const invalidManifest = {
        ...runnableManifest(binRoot, 1_000),
        codex: {
          ...runnableManifest(binRoot, 1_000).codex,
          cliVersion: "another-cli-version"
        }
      };
      const result = await withProcessEnvironment({
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, () => runTrackedPairedTrial({
        manifest: invalidManifest,
        sourceRoot: source,
        checkerRoot: process.cwd(),
        packet: { ...packet, request: { runId: invalidManifest.runId } },
        attemptDirectory: join(root, "attempt")
      }, passingChecker));

      expect(result).toMatchObject({
        status: "invalid",
        execution: { invalidReasons: ["observed Codex CLI version does not match the manifest"] }
      });
      await expect(readFile(armCounter, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(source, { recursive: true, force: true });
    }
  });

  it("accepts a passed artifact only after both arms and the held-out checker are bound", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-passed-"));
    const source = await makeRunnableTargetSource();
    const binRoot = join(root, "bin");
    const packetPromptMarker = join(root, "packet-prompt.txt");
    await mkdir(binRoot, { recursive: true });
    await makeFakeCodex(join(binRoot, "codex"), [
      `if printf '%s\\n' "$@" | grep -q 'BEGIN KRN DECISION PACKET'; then printf packet > "${packetPromptMarker}"; fi`,
      "exit 0"
    ].join("\n"));
    await makeFakeContainment(join(binRoot, "bwrap"), "exec \"$@\"");

    try {
      const passedManifest = runnableManifest(binRoot, 1_000);
      let fetchCalls = 0;
      let applicationRecorderCalls = 0;
      const result = await withProcessEnvironment({
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, () => runTrackedPairedTrial({
        manifest: passedManifest,
        sourceRoot: source,
        checkerRoot: process.cwd(),
        fetchPacket: async () => {
          fetchCalls += 1;
          return { packet: { ...packet, request: { runId: passedManifest.runId } } };
        },
        recordDecisionApplications: async (input) => {
          applicationRecorderCalls += 1;
          expect(input.score.outcome).toBe("tie");
          expect(input.rules).toEqual(passedManifest.decisionApplications);
          expect(await readFile(join(input.krnTarget.targetRoot, "src/target.ts"), "utf8"))
            .toContain("fixture");
          return [{
            sourceDecisionId: passedManifest.decisionApplications[0]!.sourceDecisionId,
            applicationId: "application:tracked-passed",
            appliedAt: "2026-07-18T00:00:00.000Z",
            outcome: "used"
          }];
        },
        attemptDirectory: join(root, "attempt")
      }, passingChecker));

      expect(result.status).toBe("passed");
      expect(result.kind).toBe("krn.pairedLiveCodexRepairArtifact.v2");
      expect(result.score?.outcome).toBe("tie");
      expect(result.execution.decisionApplicationObservation).toBe("observed");
      expect(result.execution.attempt?.phases.map((phase) => phase.name)).toEqual([
        "claimed",
        "conditions_observed",
        "materialized",
        "baseline_executed",
        "krn_executed",
        "checker_scored",
        "finalized"
      ]);
      expect(fetchCalls).toBe(1);
      expect(applicationRecorderCalls).toBe(1);
      expect(await readFile(packetPromptMarker, "utf8")).toBe("packet");
      expect(verifyTrackedTrialArtifact(result)).toBe(true);
      expect(await readTrackedTrialArtifact(join(root, "attempt"))).toEqual(result);

      const { artifactHash: _artifactHash, ...resultContent } = result;
      const legacyScore: PairedRepairScore = {
        ...result.score!,
        baseline: withoutFocusedTestProof(result.score!.baseline),
        krn: withoutFocusedTestProof(result.score!.krn)
      };
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact({
        ...resultContent,
        kind: "krn.pairedLiveCodexRepairArtifact.v1",
        score: legacyScore
      }))).toBe(true);

      const noApplication = await withProcessEnvironment({
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, () => runTrackedPairedTrial({
        manifest: passedManifest,
        sourceRoot: source,
        checkerRoot: process.cwd(),
        packet: { ...packet, request: { runId: passedManifest.runId } },
        recordDecisionApplications: async () => [],
        attemptDirectory: join(root, "no-application-attempt")
      }, passingChecker));
      expect(noApplication).toMatchObject({
        status: "unverified",
        execution: {
          decisionApplicationObservation: "none_observed",
          invalidReasons: ["decision application persistence produced no observed applications"]
        }
      });
      expect(verifyTrackedTrialArtifact(noApplication)).toBe(true);

      const missingFocusedProof: PairedRepairScore = {
        ...result.score!,
        krn: withoutFocusedTestProof(result.score!.krn)
      };
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact({
        ...resultContent,
        score: missingFocusedProof
      }))).toBe(false);

      const failedFocusedProof: PairedRepairScore = {
        ...result.score!,
        krn: withFailedFocusedMutation(result.score!.krn)
      };
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact({
        ...resultContent,
        score: failedFocusedProof
      }))).toBe(false);

      const contradictedFocusedCheck: PairedRepairScore = {
        ...result.score!,
        krn: withFocusedCheck(result.score!.krn, false)
      };
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact({
        ...resultContent,
        score: contradictedFocusedCheck
      }))).toBe(false);

      const failedKrnArm: HeldOutArmScore = {
        ...withFailedFocusedMutation(withFocusedCheck(result.score!.krn, false)),
        status: "fail"
      };
      const differentialScore: PairedRepairScore = {
        ...result.score!,
        outcome: "loss",
        reason: "KRN missed one focused-test mutation.",
        krn: failedKrnArm
      };
      const differentialContent = {
        ...resultContent,
        status: "invalid" as const,
        score: differentialScore
      };
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact(differentialContent))).toBe(true);
      expect(verifyTrackedTrialArtifact(buildTrackedTrialArtifact({
        ...differentialContent,
        score: {
          ...differentialScore,
          krn: withoutFocusedTestProof(failedKrnArm)
        }
      }))).toBe(true);

      const failedPersistence = await withProcessEnvironment({
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, () => runTrackedPairedTrial({
          manifest: passedManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: { ...packet, request: { runId: passedManifest.runId } },
          recordDecisionApplications: async () => {
            throw new Error("simulated persistence failure");
          },
          attemptDirectory: join(root, "failed-persistence-attempt")
        }, passingChecker));
      expect(failedPersistence).toMatchObject({
        status: "unverified",
        execution: {
          invalidReasons: ["decision application persistence could not be verified"]
        },
        score: { outcome: "tie" }
      });
      expect(failedPersistence.execution.decisionApplicationObservation).toBe("persistence_failed");
      expect(await readTrackedTrialArtifact(join(root, "failed-persistence-attempt")))
        .toEqual(failedPersistence);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(source, { recursive: true, force: true });
    }
  });

  it("blocks before either arm when the checker runtime has no filesystem permission model", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-runtime-preflight-"));
    const source = await makeRunnableTargetSource();
    const binRoot = join(root, "bin");
    const armCounter = join(root, "arms.txt");
    await mkdir(binRoot, { recursive: true });
    await makeFakeCodex(join(binRoot, "codex"), `printf x >> "${armCounter}"\nexit 0`);
    await makeFakeContainment(join(binRoot, "bwrap"), "exec \"$@\"");

    try {
      const blockedManifest = runnableManifest(binRoot, 1_000);
      const result = await withNodeEnvironmentFlags(new Set(), () => withProcessEnvironment({
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, () => runTrackedPairedTrial({
        manifest: blockedManifest,
        sourceRoot: source,
        checkerRoot: process.cwd(),
        packet: { ...packet, request: { runId: blockedManifest.runId } },
        attemptDirectory: join(root, "attempt")
      }, passingChecker)));

      expect(result).toMatchObject({
        status: "blocked",
        execution: {
          invalidReasons: ["held-out checker runtime does not support Node filesystem permissions"],
          conditions: {
            observed: {
              checkerRuntime: {
                nodeVersion: process.version,
                permissionFlag: "unsupported"
              }
            }
          }
        }
      });
      expect(result.execution.attempt?.phases.map((phase) => phase.name)).toEqual([
        "claimed",
        "conditions_observed",
        "finalized"
      ]);
      expect(result.execution.baseline).toBeUndefined();
      expect(result.execution.krn).toBeUndefined();
      await expect(readFile(armCounter, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      expect(await readTrackedTrialArtifact(join(root, "attempt"))).toEqual(result);
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(source, { recursive: true, force: true });
    }
  });

  it("rejects unobserved conditions, host environment leakage, failed arms, timeouts, and replay", async () => {
    const root = await mkdtemp(join(tmpdir(), "krn-tracked-trial-fairness-"));
    const source = await makeRunnableTargetSource();
    const binRoot = join(root, "bin");
    const armCounter = join(root, "arms.txt");
    const codexProbeCounter = join(root, "codex-probes.txt");
    const containmentProbeCounter = join(root, "containment-probes.txt");
    const gitCredentialCounter = join(root, "git-credentials.txt");
    await mkdir(binRoot, { recursive: true });
    await makeFakeCodex(join(binRoot, "codex"), [
      "test \"$(cat \"$CODEX_HOME/trial.config.toml\")\" = \"model = \\\"gpt-5.6-sol\\\"\" || exit 3",
      `printf x >> \"${armCounter}\"`,
      "exit 1"
    ].join("\n"), [
      `printf p >> \"${codexProbeCounter}\"`,
      "printf 'claimed-cli-version %s\\n' \"${KRN_TRIAL_HOST_SENTINEL:-missing}\""
    ].join("\n"));
    await makeFakeContainment(
      join(binRoot, "bwrap"),
      "exec \"$@\"",
      `printf p >> \"${containmentProbeCounter}\"\nprintf 'claimed-bwrap 1\\n'`
    );
    await writeExecutable(join(binRoot, "git"), [
      "#!/bin/sh",
      `if [ -n "$OPENAI_API_KEY" ]; then printf x >> "${gitCredentialCounter}"; fi`,
      "if [ \"$1\" = \"rev-parse\" ]; then printf 'fixture-commit\\n'; fi",
      "exit 0"
    ].join("\n"));

    try {
      const nonzeroManifest = runnableManifest(binRoot, 1_000);
      const timeoutManifest = runnableManifest(binRoot, 20);
      const mismatchedManifest = { ...nonzeroManifest, runId: "mismatched-replay-run" };
      const replayPacket = {
        ...packet,
        request: { runId: nonzeroManifest.runId }
      };
      const mismatchedPacket = { ...packet, request: { runId: mismatchedManifest.runId } };
      let checkerCalls = 0;
      let replayFetchCalls = 0;
      let mismatchedFetchCalls = 0;
      const countingChecker = async (): Promise<PairedRepairScore> => {
        checkerCalls += 1;
        return passingChecker();
      };
      const [first, replay, mismatched, timeout] = await withProcessEnvironment({
        KRN_TRIAL_HOST_SENTINEL: "host-secret-visible-to-probe",
        KRN_TRIAL_CODEX_HOME: binRoot,
        PATH: `${binRoot}${delimiter}${process.env.PATH ?? ""}`
      }, async () => {
        const firstResult = await runTrackedPairedTrial({
          manifest: nonzeroManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: replayPacket,
          attemptDirectory: join(root, "first-attempt")
        }, countingChecker);
        const replayResult = await withProcessEnvironment({
          KRN_TRIAL_CODEX_HOME: undefined
        }, () => runTrackedPairedTrial({
          manifest: nonzeroManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          fetchPacket: async () => {
            replayFetchCalls += 1;
            return { packet: replayPacket };
          },
          attemptDirectory: join(root, "first-attempt")
        }, countingChecker));
        const mismatchedResult = await withProcessEnvironment({
          KRN_TRIAL_CODEX_HOME: undefined
        }, () => runTrackedPairedTrial({
          manifest: mismatchedManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          fetchPacket: async () => {
            mismatchedFetchCalls += 1;
            return { packet: mismatchedPacket };
          },
          attemptDirectory: join(root, "first-attempt")
        }, countingChecker));
        await makeFakeContainment(join(binRoot, "bwrap"), "while :; do :; done");
        const timeoutResult = await runTrackedPairedTrial({
          manifest: timeoutManifest,
          sourceRoot: source,
          checkerRoot: process.cwd(),
          packet: replayPacket,
          attemptDirectory: join(root, "timeout-attempt")
        }, countingChecker);
        return [firstResult, replayResult, mismatchedResult, timeoutResult] as const;
      });

      expect(first.execution.conditions.observed).toMatchObject({
        profileHash: sha256(profileConfig),
        credentialProvided: true,
        codex: {
          version: { stdout: "claimed-cli-version missing\n", exitCode: 0 }
        }
      });
      expect(first.execution.conditions.requested.codex).toMatchObject({
        model: "gpt-5.6-sol",
        permissions: { sandbox: "workspace-write", approval: "never" },
        timeoutMs: 1_000
      });
      expect(first.execution.conditions.observed?.environmentVariableNames).not.toContain("KRN_TRIAL_HOST_SENTINEL");
      expect(first.status).toBe("invalid");
      expect(first.execution.baseline?.exitCode).toBe(1);
      expect(first.execution.krn?.exitCode).toBe(1);
      expect(first.execution.baseline?.timedOut).toBe(false);
      expect(first.execution.krn?.timedOut).toBe(false);
      expect(first.execution.baseline?.args).toEqual(expect.arrayContaining([
        "--proc",
        "/proc",
        "--dev",
        "/dev",
        "--tmpfs",
        "/tmp",
        "--dir",
        "/tmp/.git"
      ]));
      expect(first.execution.targets?.baseline.before).toMatchObject({
        status: "known",
        trackedFiles: [],
        untrackedFiles: []
      });
      const baselineAfter = first.execution.targets?.baseline.after;
      if (baselineAfter === undefined) {
        throw new Error("the claimed trial must capture the baseline target after-state");
      }
      expect(baselineAfter.patchHash).toMatch(/^[a-f0-9]{64}$/);
      expect(first.execution.attempt?.phases.map((phase) => phase.name)).toEqual([
        "claimed",
        "conditions_observed",
        "materialized",
        "baseline_executed",
        "krn_executed",
        "finalized"
      ]);
      expect(verifyTrackedTrialArtifact(first)).toBe(true);
      expect(await readTrackedTrialArtifact(join(root, "first-attempt"))).toEqual(first);
      expect(await readFile(armCounter, "utf8")).toBe("xx");
      expect(await readFile(codexProbeCounter, "utf8")).toBe("pp");
      expect(await readFile(containmentProbeCounter, "utf8")).toBe("p");
      await expect(readFile(gitCredentialCounter, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
      expect(checkerCalls).toBe(0);
      expect(replayFetchCalls).toBe(0);
      expect(mismatched).toMatchObject({
        status: "unverified",
        execution: { invalidReasons: ["trial attempt was already claimed without a matching verifiable artifact"] }
      });
      expect(mismatchedFetchCalls).toBe(0);
      expect(replay).toEqual(first);
      expect(timeout.status).toBe("invalid");
      expect(timeout.execution.baseline?.exitCode).toBeNull();
      expect(timeout.execution.krn?.exitCode).toBeNull();
      expect(timeout.execution.baseline?.timedOut).toBe(true);
      expect(timeout.execution.krn?.timedOut).toBe(true);
      expect(timeout.execution.baseline?.durationMs).toBeGreaterThanOrEqual(
        timeoutManifest.codex.budget.timeoutMs - 100
      );
      expect(timeout.execution.krn?.durationMs).toBeGreaterThanOrEqual(
        timeoutManifest.codex.budget.timeoutMs - 100
      );
      expect(timeout.execution.invalidReasons).toEqual([
        "baseline arm timed out",
        "krn arm timed out"
      ]);
      expect(checkerCalls).toBe(0);

      const phasePath = join(root, "first-attempt", "01-claimed.json");
      const artifactPath = join(root, "first-attempt", "artifact.json");
      const phase = await readFile(phasePath, "utf8");
      const artifactText = await readFile(artifactPath, "utf8");
      await writeFile(phasePath, `${phase}tampered`, "utf8");
      expect(await readTrackedTrialArtifact(join(root, "first-attempt"))).toBeUndefined();
      await writeFile(phasePath, phase, "utf8");

      const claimedPhase = JSON.parse(phase) as Record<string, unknown>;
      const forgedPhase = {
        ...claimedPhase,
        detail: { ...(claimedPhase["detail"] as Record<string, unknown>), directoryHash: "forged-directory" }
      };
      const forgedPhaseText = JSON.stringify(forgedPhase);
      const persisted = JSON.parse(artifactText) as Record<string, unknown>;
      const persistedContent = { ...persisted };
      delete persistedContent["artifactHash"];
      const persistedExecution = persisted["execution"] as Record<string, unknown>;
      const persistedAttempt = persistedExecution["attempt"] as Record<string, unknown>;
      const persistedPhases = (persistedAttempt["phases"] as readonly Record<string, unknown>[]).map((entry, index) =>
        index === 0 ? { ...entry, hash: sha256(forgedPhaseText) } : entry
      );
      const forgedArtifact = buildTrackedTrialArtifact({
        ...persistedContent,
        execution: {
          ...persistedExecution,
          attempt: { ...persistedAttempt, phases: persistedPhases }
        }
      } as unknown as Parameters<typeof buildTrackedTrialArtifact>[0]);
      await writeFile(phasePath, forgedPhaseText, "utf8");
      await writeFile(artifactPath, JSON.stringify(forgedArtifact), "utf8");
      expect(verifyTrackedTrialArtifact(forgedArtifact)).toBe(true);
      expect(await readTrackedTrialArtifact(join(root, "first-attempt"))).toBeUndefined();
      await writeFile(phasePath, phase, "utf8");
      await writeFile(artifactPath, artifactText, "utf8");

      const tampered = JSON.parse(artifactText) as Record<string, unknown>;
      tampered["status"] = "passed";
      await writeFile(artifactPath, JSON.stringify(tampered), "utf8");
      expect(verifyTrackedTrialArtifact(tampered)).toBe(false);
      expect(await readTrackedTrialArtifact(join(root, "first-attempt"))).toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
      await rm(source, { recursive: true, force: true });
    }
  });

  it("binds the artifact hash to its immutable content", () => {
    const base = {
      kind: "krn.pairedLiveCodexRepairArtifact.v1",
      status: "blocked",
      manifestHash: "manifest",
      sourceTreeHash: "source",
      runId: "run-1",
      packet: { validation: { valid: false, reasons: ["missing"] } },
      execution: { conditions: {
        requested: {
          codex: {
            command: "codex",
            model: "gpt-5.6-sol",
            cliVersion: "codex-test",
            profileName: "trial",
            profileHash: "profile",
            permissions: { sandbox: "workspace-write", approval: "never" },
            networkPolicy: "disabled",
            timeoutMs: 1_000
          },
          containment: manifest.containment,
          armOrder: ["baseline", "krn"],
          checker: manifest.checker
        }
      } },
      proof: { proves: ["refused"], doesNotProve: ["live repair"] }
    } as const;
    const artifact = buildTrackedTrialArtifact(base);
    const malformedArtifact = buildTrackedTrialArtifact({
      ...base,
      packet: { validation: { valid: "not-a-boolean", reasons: [] } }
    } as unknown as Parameters<typeof buildTrackedTrialArtifact>[0]);
    const impossiblePassedArtifact = buildTrackedTrialArtifact({
      ...base,
      status: "passed",
      packet: {
        checksum: "packet-checksum",
        validation: { valid: true, reasons: [], checksum: "packet-checksum" }
      }
    } as unknown as Parameters<typeof buildTrackedTrialArtifact>[0]);

    expect(artifact.artifactHash).toMatch(/^[a-f0-9]{64}$/);
    expect(buildTrackedTrialArtifact({ ...base, runId: "other-run" })).not.toEqual(artifact);
    expect(verifyTrackedTrialArtifact(malformedArtifact)).toBe(false);
    expect(verifyTrackedTrialArtifact(impossiblePassedArtifact)).toBe(false);
  });
});
