import { describe, expect, test } from "vitest";
import { createHash } from "node:crypto";

import {
  assessEvidenceCommandHelpedProof,
  decisionPacketBindingReadbackFromMetadata,
  evidenceBundleProvesHelped,
  isAdmittedCurrentDecisionPacketAuthorityMetadata,
  stampCurrentDecisionPacketAuthorityMetadata,
  stampUnboundDecisionPacketAuthorityMetadata,
  toEvidenceCommandReadback,
  normalizeTargetEvidence,
  parseEvidenceBundleMetadataReadback,
  targetEvidenceFromMetadata,
  type EvidenceBundle,
  type EvidenceCommand,
  type EvidenceCommandHelpedProofFailureReason
} from "../evidence-bundle.js";
import {
  assessCommandOutputArtifactIntegrity,
  createCommandOutputArtifact
} from "../command-output-artifact.js";
import type { CommandOutputArtifact } from "../command-output-artifact.js";
import type { EvidenceContract } from "../evidence-contract.js";
import { isIsoTimestamp } from "../time.js";

const now = "2026-06-23T07:10:00.000Z";
const packetGeneratedAt = "2026-06-23T07:00:00.000Z";
const sha256Hex = (value: string | Uint8Array): string =>
  createHash("sha256").update(value).digest("hex");

const commandOutputArtifact = (input: {
  command?: string;
  exitCode?: number;
  startedAt?: string;
  completedAt?: string;
  stdout?: Uint8Array;
  stderr?: Uint8Array;
} = {}): CommandOutputArtifact => createCommandOutputArtifact({
  command: input.command ?? "pnpm typecheck",
  exitCode: input.exitCode ?? 0,
  startedAt: input.startedAt ?? "2026-06-23T07:09:00.000Z",
  completedAt: input.completedAt ?? now,
  stdout: input.stdout ?? Buffer.from("typecheck passed\n"),
  stderr: input.stderr ?? new Uint8Array()
}, sha256Hex);

const bundle = (overrides: Partial<EvidenceBundle>): EvidenceBundle => ({
  id: "evidence-bundle-1",
  executionRunId: "execution-run-1",
  status: "captured",
  changedFiles: ["packages/core/src/evidence-bundle.ts"],
  commands: [
    {
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0
    },
    {
      command: "pnpm test",
      status: "passed",
      exitCode: 0
    },
    {
      command: "git diff --check",
      status: "passed",
      exitCode: 0
    }
  ],
  diffRisk: "medium",
  reviewBurden: "Review the pure EvidenceBundle domain contract.",
  rollbackPath: "git revert <commit>",
  metadata: {
    diffSummary: "Changed pure EvidenceBundle assessment helper and focused tests.",
    sourceRefs: ["KRN_ROADMAP.md#MM-52"]
  },
  createdAt: now,
  updatedAt: now,
  ...overrides
});

const contractForCommands = (commands: EvidenceContract["commands"]): EvidenceContract => ({
  taskContractId: "task-1",
  commands,
  diffRisk: "low" as const,
  reviewBurden: "review",
  rollbackPath: "revert",
  metadata: {}
});

const helpedEvidenceContract = (required: boolean): EvidenceContract =>
  contractForCommands([{ command: "pnpm typecheck", required }]);

const executionBackedCommands = (
  commands: EvidenceBundle["commands"],
  suppliedArtifacts: readonly CommandOutputArtifact[]
): {
  commands: EvidenceBundle["commands"];
  artifacts: CommandOutputArtifact[];
} => {
  const artifacts = [...suppliedArtifacts];

  return {
    commands: commands.map((command) => {
      if (
        command.provenance !== "command_runner" ||
        command.outputRef !== undefined ||
        command.exitCode === undefined ||
        !isIsoTimestamp(command.capturedAt)
      ) {
        return command;
      }

      const artifact = commandOutputArtifact({
        command: command.command,
        exitCode: command.exitCode,
        startedAt: command.capturedAt,
        completedAt: command.capturedAt
      });
      artifacts.push(artifact);

      return {
        ...command,
        outputRef: artifact.outputRef
      };
    }),
    artifacts
  };
};

const provesHelped = (
  commands: EvidenceBundle["commands"],
  contractCommands: EvidenceContract["commands"] = [
    { command: "pnpm typecheck", required: true }
  ],
  suppliedArtifacts: readonly CommandOutputArtifact[] = []
): boolean => {
  const prepared = executionBackedCommands(commands, suppliedArtifacts);

  return evidenceBundleProvesHelped({
    bundle: bundle({
      metadata: {
        decisionPacketAuthorityAdmission: "current_v1",
        decisionPacketBindingState: "bound_current",
        decisionPacketChecksum: "packet-checksum",
        decisionPacketEvidenceRef: "packet:packet-checksum",
        decisionPacketGeneratedAt: packetGeneratedAt,
        decisionPacketSourceRunLifecycleRevision: 1
      },
      commands: prepared.commands,
      commandOutputArtifacts: prepared.artifacts
    }),
    evidenceContract: contractForCommands(contractCommands),
    packetChecksum: "packet-checksum",
    packetGeneratedAt,
    sourceRunLifecycleRevision: 1,
    sha256Hex
  });
};

const commandProofAssessment = (command: EvidenceCommand) =>
  assessEvidenceCommandHelpedProof({
    command: toEvidenceCommandReadback(command),
    packetGeneratedAt,
    resolveCommandOutputArtifact: () => undefined,
    sha256Hex
  });

describe("evidence bundle completeness", () => {
  test("rejects stale, incoherent, malformed, and timeless command proof with typed reasons", () => {
    const cases = [{
      command: {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "command_runner",
        exitCode: 0,
        capturedAt: "2026-06-23T06:59:59.000Z"
      },
      reason: "captured_before_packet_issuance"
    }, {
      command: {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "command_runner",
        exitCode: 7,
        capturedAt: now
      },
      reason: "passed_nonzero_exit_code"
    }, {
      command: {
        command: "pnpm typecheck",
        status: "failed",
        provenance: "command_runner",
        exitCode: 0,
        capturedAt: now
      },
      reason: "failed_zero_exit_code"
    }, {
      command: {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "command_runner",
        exitCode: 0,
        capturedAt: "June 23, 2026 07:10:00 GMT"
      },
      reason: "invalid_captured_at"
    }, {
      command: {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        outputRef: "missing-output.txt"
      },
      reason: "unresolved_output_reference"
    }] as const satisfies readonly {
      readonly command: EvidenceCommand;
      readonly reason: EvidenceCommandHelpedProofFailureReason;
    }[];

    for (const testCase of cases) {
      expect(commandProofAssessment(testCase.command)).toEqual({
        status: "ineligible",
        reason: testCase.reason
      });
      expect(provesHelped([testCase.command])).toBe(false);
    }
  });

  test("keeps operator-only reports outside the mechanical helped predicate", () => {
    expect(provesHelped([{
      command: "pnpm typecheck",
      status: "passed",
      provenance: "operator_reported"
    }])).toBe(false);
  });

  test("keeps unresolved output references visible but outside helped proof", () => {
    const cases = [{
      command: {
        command: "pnpm typecheck",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        capturedAt: now,
        outputRef: "missing-output.txt"
      } satisfies EvidenceCommand,
      kind: "captured_output_file"
    }, {
      command: {
        command: "pnpm test",
        status: "passed",
        provenance: "captured_output_file",
        exitCode: 0,
        capturedAt: now,
        outputRef: "unreadable-output.txt"
      } satisfies EvidenceCommand,
      kind: "captured_output_file"
    }, {
      command: {
        command: "KRN CI",
        status: "passed",
        provenance: "external_log",
        exitCode: 0,
        capturedAt: now,
        outputRef: "tampered-external-log"
      } satisfies EvidenceCommand,
      kind: "external_log"
    }, {
      command: {
        command: "legacy CI",
        status: "passed",
        provenance: "external_log",
        exitCode: 0,
        capturedAt: now,
        outputRef: "legacy-external-log-reference"
      } satisfies EvidenceCommand,
      kind: "external_log"
    }] as const;

    for (const testCase of cases) {
      expect(toEvidenceCommandReadback(testCase.command)).toMatchObject({
        kind: testCase.kind,
        outputRef: testCase.command.outputRef
      });
      expect(commandProofAssessment(testCase.command)).toEqual({
        status: "ineligible",
        reason: "unresolved_output_reference"
      });
      expect(provesHelped([testCase.command])).toBe(false);
    }
  });

  test("rejects an unresolved command-runner output reference as helped proof", () => {
    expect(provesHelped([{
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now,
      outputRef: "command-output:sha256:missing"
    }])).toBe(false);
  });

  test("accepts a fresh successful command-runner artifact with valid content integrity", () => {
    const artifact = commandOutputArtifact();
    const command: EvidenceCommand = {
      command: artifact.command,
      status: "passed",
      provenance: "command_runner",
      exitCode: artifact.exitCode,
      capturedAt: artifact.completedAt,
      outputRef: artifact.outputRef
    };

    expect(assessCommandOutputArtifactIntegrity(artifact, sha256Hex)).toEqual({
      status: "valid"
    });
    expect(provesHelped([command], [
      { command: artifact.command, required: true }
    ], [artifact])).toBe(true);
  });

  test("rejects tampered command-runner bytes", () => {
    const artifact = commandOutputArtifact();
    const tamperedBytes = artifact.stdout.bytes.slice();
    tamperedBytes[0] = (tamperedBytes[0] ?? 0) ^ 1;
    const tamperedArtifact: CommandOutputArtifact = {
      ...artifact,
      stdout: {
        ...artifact.stdout,
        bytes: tamperedBytes
      }
    };
    const command: EvidenceCommand = {
      command: artifact.command,
      status: "passed",
      provenance: "command_runner",
      exitCode: artifact.exitCode,
      capturedAt: artifact.completedAt,
      outputRef: artifact.outputRef
    };

    expect(assessCommandOutputArtifactIntegrity(tamperedArtifact, sha256Hex)).toEqual({
      status: "invalid",
      reason: "stdout_sha256_mismatch"
    });
    expect(provesHelped([command], [
      { command: artifact.command, required: true }
    ], [tamperedArtifact])).toBe(false);
  });

  test("rejects ambiguous duplicate command output references", () => {
    const artifact = commandOutputArtifact();
    const command: EvidenceCommand = {
      command: artifact.command,
      status: "passed",
      provenance: "command_runner",
      exitCode: artifact.exitCode,
      capturedAt: artifact.completedAt,
      outputRef: artifact.outputRef
    };

    expect(provesHelped([command], [
      { command: artifact.command, required: true }
    ], [artifact, artifact])).toBe(false);
  });

  test("rejects multiple outcomes for the same required command", () => {
    const passedArtifact = commandOutputArtifact({
      completedAt: "2026-06-23T07:09:00.000Z"
    });
    const failedArtifact = commandOutputArtifact({
      exitCode: 1,
      startedAt: "2026-06-23T07:09:30.000Z",
      completedAt: "2026-06-23T07:10:00.000Z"
    });
    const passed: EvidenceCommand = {
      command: passedArtifact.command,
      status: "passed",
      provenance: "command_runner",
      exitCode: passedArtifact.exitCode,
      capturedAt: passedArtifact.completedAt,
      outputRef: passedArtifact.outputRef
    };
    const failed: EvidenceCommand = {
      command: failedArtifact.command,
      status: "failed",
      provenance: "command_runner",
      exitCode: failedArtifact.exitCode,
      capturedAt: failedArtifact.completedAt,
      outputRef: failedArtifact.outputRef
    };
    const contract = [{ command: passed.command, required: true }];
    const artifacts = [passedArtifact, failedArtifact];

    expect(provesHelped([passed, failed], contract, artifacts)).toBe(false);
    expect(provesHelped([failed, passed], contract, artifacts)).toBe(false);
  });

  test("rejects mismatched and pre-packet command-runner artifact metadata", () => {
    const artifact = commandOutputArtifact();
    const command = toEvidenceCommandReadback({
      command: artifact.command,
      status: "passed",
      provenance: "command_runner",
      exitCode: artifact.exitCode,
      capturedAt: artifact.completedAt,
      outputRef: artifact.outputRef
    });

    expect(assessCommandOutputArtifactIntegrity({
      ...artifact,
      completedAt: "2026-06-23T07:11:00.000Z"
    }, sha256Hex)).toEqual({
      status: "invalid",
      reason: "output_ref_mismatch"
    });

    expect(assessEvidenceCommandHelpedProof({
      command,
      packetGeneratedAt,
      resolveCommandOutputArtifact: () => ({
        ...artifact,
        command: "pnpm test"
      }),
      sha256Hex
    })).toEqual({
      status: "ineligible",
      reason: "command_output_artifact_command_mismatch"
    });

    const prePacketArtifact = commandOutputArtifact({
      startedAt: "2026-06-23T06:59:59.000Z"
    });
    expect(assessEvidenceCommandHelpedProof({
      command: toEvidenceCommandReadback({
        command: prePacketArtifact.command,
        status: "passed",
        provenance: "command_runner",
        exitCode: prePacketArtifact.exitCode,
        capturedAt: prePacketArtifact.completedAt,
        outputRef: prePacketArtifact.outputRef
      }),
      packetGeneratedAt,
      resolveCommandOutputArtifact: () => prePacketArtifact,
      sha256Hex
    })).toEqual({
      status: "ineligible",
      reason: "command_output_artifact_started_before_packet_issuance"
    });
  });

  test("requires every distinct required command while optional rows remain informative", () => {
    const passed = (command: string): EvidenceCommand => ({
      command,
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now
    });
    const failed = (command: string): EvidenceCommand => ({
      command,
      status: "failed",
      provenance: "command_runner",
      exitCode: 1,
      capturedAt: now
    });
    const requiredTypecheckAndTest = [
      { command: "pnpm typecheck", required: true },
      { command: "pnpm test", required: true }
    ];

    expect(provesHelped([passed("pnpm typecheck")], requiredTypecheckAndTest)).toBe(false);
    expect(provesHelped([
      passed("pnpm typecheck"),
      failed("pnpm test")
    ], requiredTypecheckAndTest)).toBe(false);
    expect(provesHelped([
      passed("pnpm typecheck"),
      failed("pnpm test")
    ], [
      { command: "pnpm typecheck", required: true },
      { command: "pnpm test", required: false }
    ])).toBe(true);
    expect(provesHelped(
      [passed("pnpm typecheck")],
      [{ command: "pnpm typecheck", required: false }]
    )).toBe(false);
    expect(provesHelped([passed("pnpm typecheck")], [])).toBe(false);
    expect(provesHelped([
      passed("pnpm typecheck"),
      passed("pnpm test")
    ], [
      { command: "pnpm typecheck", required: true },
      { command: "pnpm typecheck", required: true },
      { command: "pnpm test", required: true }
    ])).toBe(true);
  });

  test("requires fresh active-contract execution proof for helped", () => {
    const evidenceContract = {
      taskContractId: "task-1",
      commands: [{ command: "pnpm typecheck", required: true }],
      diffRisk: "low" as const,
      reviewBurden: "review",
      rollbackPath: "revert",
      metadata: {}
    };
    const packetChecksum = "packet-checksum";
    const artifact = commandOutputArtifact();

    expect(evidenceBundleProvesHelped({
      bundle: bundle({
        metadata: {
          decisionPacketChecksum: packetChecksum,
          decisionPacketGeneratedAt: packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision: 1
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "operator_reported"
        }]
      }),
      evidenceContract,
      packetChecksum,
      packetGeneratedAt,
      sourceRunLifecycleRevision: 1,
      sha256Hex
    })).toBe(false);

    expect(evidenceBundleProvesHelped({
      bundle: bundle({
        metadata: {
          decisionPacketChecksum: packetChecksum,
          decisionPacketGeneratedAt: packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision: 1
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "command_runner",
          exitCode: 0,
          capturedAt: now
        }]
      }),
      evidenceContract,
      packetChecksum,
      packetGeneratedAt,
      sourceRunLifecycleRevision: 1,
      sha256Hex
    })).toBe(false);

    expect(evidenceBundleProvesHelped({
      bundle: bundle({
        metadata: {
          decisionPacketAuthorityAdmission: "current_v1",
          decisionPacketBindingState: "bound_current",
          decisionPacketChecksum: packetChecksum,
          decisionPacketEvidenceRef: `packet:${packetChecksum}`,
          decisionPacketGeneratedAt: packetGeneratedAt,
          decisionPacketSourceRunLifecycleRevision: 1
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "command_runner",
          exitCode: 0,
          capturedAt: now,
          outputRef: artifact.outputRef
        }],
        commandOutputArtifacts: [artifact]
      }),
      evidenceContract,
      packetChecksum,
      packetGeneratedAt,
      sourceRunLifecycleRevision: 1,
      sha256Hex
    })).toBe(true);
  });

  test("rejects verification evidence bound to another packet issuance", () => {
    expect(evidenceBundleProvesHelped({
      bundle: bundle({
        metadata: {
          decisionPacketChecksum: "packet-checksum",
          decisionPacketGeneratedAt: "2026-06-23T07:00:00.000Z",
          decisionPacketSourceRunLifecycleRevision: 1
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "command_runner",
          exitCode: 0,
          capturedAt: now
        }]
      }),
      evidenceContract: helpedEvidenceContract(true),
      packetChecksum: "packet-checksum",
      packetGeneratedAt: "2026-06-23T07:01:00.000Z",
      sourceRunLifecycleRevision: 1,
      sha256Hex
    })).toBe(false);
  });

  test("rejects verification evidence from an earlier execution lifecycle revision", () => {
    expect(evidenceBundleProvesHelped({
      bundle: bundle({
        metadata: {
          decisionPacketChecksum: "packet-checksum",
          decisionPacketGeneratedAt: "2026-06-23T07:00:00.000Z",
          decisionPacketSourceRunLifecycleRevision: 1
        },
        commands: [{
          command: "pnpm typecheck",
          status: "passed",
          provenance: "command_runner",
          exitCode: 0,
          capturedAt: now
        }]
      }),
      evidenceContract: helpedEvidenceContract(true),
      packetChecksum: "packet-checksum",
      packetGeneratedAt: "2026-06-23T07:00:00.000Z",
      sourceRunLifecycleRevision: 2,
      sha256Hex
    })).toBe(false);
  });

  test("normalizes legacy command rows with weak default provenance", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "skipped"
    })).toEqual({
      kind: "default_template",
      command: "pnpm test",
      status: "skipped",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes captured output command rows with explicit limits", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0,
      outputPath: ".local-lab/typecheck.txt"
    })).toEqual({
      kind: "captured_output_file",
      command: "pnpm typecheck",
      status: "passed",
      exitCode: 0,
      outputPath: ".local-lab/typecheck.txt",
      outputRef: ".local-lab/typecheck.txt",
      provenance: "captured_output_file",
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });
  });

  test("normalizes operator-reported command rows", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "failed",
      provenance: "operator_reported",
      exitCode: 1,
      assertedBy: " codex ",
      doesNotProve: " Only proves the operator reported this command result. "
    })).toEqual({
      kind: "operator_reported",
      command: "pnpm test",
      status: "failed",
      provenance: "operator_reported",
      exitCode: 1,
      assertedBy: "codex",
      doesNotProve: "Only proves the operator reported this command result."
    });
  });

  test("normalizes external-log command rows with output refs", () => {
    expect(toEvidenceCommandReadback({
      command: "KRN CI",
      status: "passed",
      provenance: "external_log",
      outputRef: " gh-run-28524994922 ",
      exitCode: 0
    })).toEqual({
      kind: "external_log",
      command: "KRN CI",
      status: "passed",
      provenance: "external_log",
      outputRef: "gh-run-28524994922",
      exitCode: 0,
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });
  });

  test("does not allow weak default provenance to become passed proof", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm test",
      status: "passed",
      provenance: "default_template"
    })).toEqual({
      kind: "default_template",
      command: "pnpm test",
      status: "not_run",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes command-runner rows only when runner proof fields exist", () => {
    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now
    })).toEqual({
      kind: "command_runner",
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0,
      capturedAt: now,
      doesNotProve:
        "This command result does not prove memory quality, source truth, review correctness, or production readiness."
    });

    expect(toEvidenceCommandReadback({
      command: "pnpm typecheck",
      status: "passed",
      provenance: "command_runner",
      exitCode: 0
    })).toEqual({
      kind: "default_template",
      command: "pnpm typecheck",
      status: "not_run",
      provenance: "default_template",
      doesNotProve:
        "This command row does not prove the command executed; it is default template evidence only."
    });
  });

  test("normalizes target evidence without treating it as product proof", () => {
    const targetEvidence = normalizeTargetEvidence({
      targetRepo: " ../wilq-seo ",
      mode: "observation-only",
      dirtyBefore: "dirty",
      dirtyAfter: "dirty",
      ownedChanges: "external",
      targetStatusFreshness: "changed-since-selection",
      targetPatchLifecycle: "handed-off-unresolved",
      handoffArtifact: " review-evidence/target/HANDOFF.md ",
      targetOwnerDecision: " stronger verification requested ",
      forbiddenWrites: [" wilq-seo/** "],
      changedFiles: [{
        status: "M",
        path: "apps/dashboard/src/App.tsx"
      }],
      commands: [" wilq-seo scripts/test.sh "]
    });

    expect(targetEvidence).toEqual({
      targetRepo: "../wilq-seo",
      mode: "observation_only",
      dirtyBefore: "dirty",
      dirtyAfter: "dirty",
      ownedChanges: "external",
      targetStatusFreshness: "changed_since_selection",
      targetPatchLifecycle: "handed_off_unresolved",
      handoffArtifact: "review-evidence/target/HANDOFF.md",
      targetOwnerDecision: "stronger verification requested",
      allowedWrites: ["none"],
      forbiddenWrites: ["wilq-seo/**"],
      changedFiles: [{
        status: "M",
        path: "apps/dashboard/src/App.tsx",
        ownership: "external"
      }],
      commands: ["wilq-seo scripts/test.sh"],
      doesNotProve: [
        "Target evidence does not prove KRN source correctness.",
        "Target evidence does not prove full target verification unless every target gate is represented by command evidence.",
        "Target evidence does not prove product readiness or V02-01 second-operator usability."
      ]
    });
  });

  test("defaults observation-only target evidence write boundaries", () => {
    const targetEvidence = normalizeTargetEvidence({
      targetRepo: "../target",
      mode: "observation-only"
    });

    expect(targetEvidence.allowedWrites).toEqual(["none"]);
    expect(targetEvidence.forbiddenWrites).toEqual([
      "target source edits",
      "target commits",
      "target resets or cleans",
      "target production/runtime writes"
    ]);
  });

  test("reads target evidence back from metadata defensively", () => {
    expect(targetEvidenceFromMetadata({
      targetRepo: "../wilq-seo",
      mode: "real-second-operator",
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "partial",
      targetStatusFreshness: "fresh-current-task",
      targetPatchLifecycle: "accepted-by-target-owner",
      handoffArtifact: "review-evidence/target/HANDOFF.md",
      targetOwnerDecision: "accepted after smoke proof",
      changedFiles: [{
        status: "M",
        path: "src/app.ts",
        ownership: "owned-by-current-krn-run"
      }],
      commands: ["target pnpm test"],
      doesNotProve: ["Target evidence does not prove product readiness."]
    })).toMatchObject({
      targetRepo: "../wilq-seo",
      mode: "real_second_operator",
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "partial",
      targetStatusFreshness: "fresh_current_task",
      targetPatchLifecycle: "accepted_by_target_owner",
      handoffArtifact: "review-evidence/target/HANDOFF.md",
      targetOwnerDecision: "accepted after smoke proof",
      changedFiles: [{
        status: "M",
        path: "src/app.ts",
        ownership: "owned_by_current_krn_run"
      }],
      commands: ["target pnpm test"],
      doesNotProve: ["Target evidence does not prove product readiness."]
    });

    expect(targetEvidenceFromMetadata({
      mode: "observation-only"
    })).toBeUndefined();
  });

  test("parses evidence bundle metadata readback as an unknown-first boundary", () => {
    expect(parseEvidenceBundleMetadataReadback({
      diffSummary: " Changed evidence metadata parsing. ",
      sourceRefs: [" packages/core/src/evidence-bundle.ts ", "", 1, "KRN_ROADMAP.md"]
    })).toEqual({
      diffSummary: "Changed evidence metadata parsing.",
      sourceRefs: [
        "packages/core/src/evidence-bundle.ts",
        "KRN_ROADMAP.md"
      ]
    });

    expect(parseEvidenceBundleMetadataReadback({
      diffSummary: 42,
      sourceRefs: [" ", null]
    })).toEqual({
      sourceRefs: []
    });
    expect(parseEvidenceBundleMetadataReadback(null)).toEqual({
      sourceRefs: []
    });
  });

  test("stamps current authority from repository-owned fields and contracts unbound history", () => {
    const callerMetadata = {
      smokeId: "smoke-1",
      decisionPacketAuthorityAdmission: "forged",
      decisionPacketBindingState: "bound_current",
      decisionPacketChecksum: "forged-checksum",
      decisionPacketEvidenceRef: "packet:forged-checksum",
      decisionPacketGeneratedAt: "2026-06-23T06:00:00.000Z",
      decisionPacketSourceRunLifecycleRevision: 99,
      decisionPacketBindingReason: "forged reason"
    };
    const current = stampCurrentDecisionPacketAuthorityMetadata(callerMetadata, {
      checksum: " packet-checksum ",
      generatedAt: "2026-06-23T07:00:00.000Z",
      sourceRunLifecycleRevision: 2
    });

    expect(current).toEqual({
      smokeId: "smoke-1",
      decisionPacketAuthorityAdmission: "current_v1",
      decisionPacketBindingState: "bound_current",
      decisionPacketChecksum: "packet-checksum",
      decisionPacketEvidenceRef: "packet:packet-checksum",
      decisionPacketGeneratedAt: "2026-06-23T07:00:00.000Z",
      decisionPacketSourceRunLifecycleRevision: 2
    });
    expect(decisionPacketBindingReadbackFromMetadata(current)).toEqual({
      status: "bound_current",
      checksum: "packet-checksum",
      evidenceRef: "packet:packet-checksum",
      generatedAt: "2026-06-23T07:00:00.000Z",
      sourceRunLifecycleRevision: 2
    });
    expect(isAdmittedCurrentDecisionPacketAuthorityMetadata(current)).toBe(true);

    const unbound = stampUnboundDecisionPacketAuthorityMetadata(
      current,
      " No canonical packet admission. "
    );
    expect(unbound).toEqual({
      smokeId: "smoke-1",
      decisionPacketBindingState: "unbound",
      decisionPacketBindingReason: "No canonical packet admission."
    });
    expect(decisionPacketBindingReadbackFromMetadata(unbound)).toEqual({
      status: "unbound",
      reason: "No canonical packet admission."
    });
    expect(isAdmittedCurrentDecisionPacketAuthorityMetadata(unbound)).toBe(false);
  });

});
