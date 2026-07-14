import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { describe, expect, it } from "vitest";
import {
  assessCommandOutputArtifactIntegrity,
  commandOutputArtifactStreamByteCap,
  createCommandOutputArtifact,
  currentDecisionPacketBindingForHarnessRun,
  evidenceBundleProvesHelped,
  parseEvidenceContract
} from "@krn/core";
import type { CommandOutputArtifact, EvidenceBundle } from "@krn/core";
import type { CreateEvidenceFeedbackOnceInput } from "@krn/core/repositories";

import { createKrnDatabase } from "../../database.js";
import {
  cleanupActivationSmokeRows,
  countActivationSmokeMarkerRows,
  createSmokeHarnessScaffold
} from "../../dev/smoke/db-smoke-support.js";
import {
  DrizzleHarnessRunRepository,
  validateEvidenceBundleInputForPersistence
} from "../drizzle-harness-run-repository.js";

const databaseUrl = process.env.KRN_DATABASE_URL?.trim();
const postgresIt = it.skipIf(databaseUrl === undefined || databaseUrl.length === 0);
const migrationsFolder = fileURLToPath(new URL("../../migrations", import.meta.url));

const sha256Hex = (value: string | Uint8Array): string =>
  crypto.createHash("sha256").update(value).digest("hex");

const requireValue = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) {
    throw new Error(message);
  }

  return value;
};

const commandOutputArtifactFrom = (
  bundle: EvidenceBundle,
  outputRef?: string
): CommandOutputArtifact =>
  requireValue(
    outputRef === undefined
      ? bundle.commandOutputArtifacts?.[0]
      : bundle.commandOutputArtifacts?.find((artifact) => artifact.outputRef === outputRef),
    `evidence bundle ${bundle.id} did not preload its command output artifact`
  );

const expectArtifactBytes = (
  actual: CommandOutputArtifact,
  expected: CommandOutputArtifact
): void => {
  expect(Buffer.from(actual.stdout.bytes).equals(Buffer.from(expected.stdout.bytes))).toBe(true);
  expect(Buffer.from(actual.stderr.bytes).equals(Buffer.from(expected.stderr.bytes))).toBe(true);
};

describe("command output artifact persistence", () => {
  it("takes ownership of Buffer-backed artifact bytes before persistence", () => {
    const command = "pnpm typecheck";
    const artifact = createCommandOutputArtifact({
      command,
      exitCode: 0,
      startedAt: "2026-07-14T18:00:00.000Z",
      completedAt: "2026-07-14T18:00:01.000Z",
      stdout: Uint8Array.from([65, 66, 67]),
      stderr: Uint8Array.from([68, 69, 70])
    }, sha256Hex);
    const sourceStdout = Buffer.from(artifact.stdout.bytes);
    const sourceStderr = Buffer.from(artifact.stderr.bytes);
    const bufferBackedArtifact: CommandOutputArtifact = {
      ...artifact,
      stdout: { ...artifact.stdout, bytes: sourceStdout },
      stderr: { ...artifact.stderr, bytes: sourceStderr }
    };
    const validated = validateEvidenceBundleInputForPersistence({
      executionRunId: crypto.randomUUID(),
      status: "captured",
      changedFiles: [],
      commands: [{
        command,
        status: "passed",
        provenance: "command_runner",
        exitCode: artifact.exitCode,
        capturedAt: artifact.completedAt,
        outputRef: artifact.outputRef
      }],
      commandOutputArtifacts: [bufferBackedArtifact],
      diffRisk: "low",
      reviewBurden: "Verify repository ownership of mutable input bytes.",
      rollbackPath: "Discard the unit-test value.",
      event: {
        type: "test.command_output_artifact.buffer_ownership",
        message: "buffer ownership validated",
        payload: {}
      }
    });
    const ownedArtifact = requireValue(
      validated.commandOutputArtifacts?.[0],
      "validated input dropped its command output artifact"
    );

    sourceStdout[0] = 90;
    sourceStderr[0] = 91;

    expect(Buffer.isBuffer(ownedArtifact.stdout.bytes)).toBe(false);
    expect(Buffer.isBuffer(ownedArtifact.stderr.bytes)).toBe(false);
    expect([...ownedArtifact.stdout.bytes]).toEqual([65, 66, 67]);
    expect([...ownedArtifact.stderr.bytes]).toEqual([68, 69, 70]);
  });

  postgresIt(
    "round-trips capped bytes through retries and aggregate reads and rejects SQL tampering",
    async () => {
      const marker = `krn_command_output_artifact_${crypto.randomUUID().replaceAll("-", "")}`;
      const command = "pnpm typecheck";
      const capturedFileCommand = "pnpm test";
      const diagnosticSecret = `raw-command-secret-${marker}`;
      const scaffold = await createSmokeHarnessScaffold({
        databaseUrl: databaseUrl!,
        migrationsFolder,
        smokeId: marker,
        smokeName: "command output artifact persistence smoke",
        workspacePrefix: "krn-command-output-artifact",
        projectSlug: "command-output-artifact",
        cleanupRows: cleanupActivationSmokeRows,
        countMarkerRows: countActivationSmokeMarkerRows,
        rawIntent: `persist command output artifact ${marker}`,
        taskContract: {
          title: "Persist bounded command output",
          objective: "Bind execution-backed evidence to integrity-checked command output bytes.",
          constraints: ["real PostgreSQL", "bounded byte storage"],
          nonGoals: ["no protection from unrestricted SQL mutation"],
          acceptance: ["fresh reads expose tampering to the core integrity verifier"]
        },
        harnessPlan: {
          summary: "Persist command output artifact bytes",
          nextAction: "Capture the required command and verify fresh readback.",
          evidenceContract: {
            commands: [{ command, required: true }],
            diffRisk: "low",
            reviewBurden: "Review the byte cap and integrity readback.",
            rollbackPath: "Delete marker-scoped smoke rows."
          }
        }
      });
      let freshClient: ReturnType<typeof postgres> | undefined;

      try {
        const executionRun = await scaffold.harnessRunRepository.createExecutionRun({
          harnessPlanId: scaffold.harnessPlan.id,
          adapter: "command-output-artifact-smoke",
          status: "planned",
          metadata: { smokeId: marker }
        });
        const initialAggregate = requireValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "command output artifact aggregate was not persisted"
        );
        const now = Date.now();
        const packetBinding = currentDecisionPacketBindingForHarnessRun({
          aggregate: initialAggregate,
          packetGeneratedAt: new Date(now - 20_000).toISOString(),
          sha256Hex
        });
        const stdoutPrefix = new Uint8Array(commandOutputArtifactStreamByteCap).fill(65);
        const stderrBytes = new TextEncoder().encode(diagnosticSecret);
        const artifact = createCommandOutputArtifact({
          command,
          exitCode: 0,
          startedAt: new Date(now - 10_000).toISOString(),
          completedAt: new Date(now - 5_000).toISOString(),
          stdout: stdoutPrefix,
          stdoutTotalByteCount: commandOutputArtifactStreamByteCap + 137,
          stderr: stderrBytes
        }, sha256Hex);
        const capturedFileArtifact = createCommandOutputArtifact({
          command: capturedFileCommand,
          exitCode: 0,
          startedAt: new Date(now - 9_000).toISOString(),
          completedAt: new Date(now - 4_000).toISOString(),
          stdout: new TextEncoder().encode("captured file output\n"),
          stderr: new Uint8Array()
        }, sha256Hex);
        const captureInput = {
          executionRunId: executionRun.id,
          sourceRunLifecycleRevision: executionRun.lifecycleRevision,
          projectId: scaffold.project.id,
          captureIdentity: `command-output-artifact:${marker}`,
          decisionPacketClaim: {
            checksum: packetBinding.packetChecksum,
            generatedAt: packetBinding.packetGeneratedAt
          },
          evidence: {
            status: "captured" as const,
            changedFiles: [],
            commands: [
              {
                command,
                status: "passed" as const,
                provenance: "command_runner" as const,
                exitCode: artifact.exitCode,
                capturedAt: artifact.completedAt,
                outputRef: artifact.outputRef,
                doesNotProve: "Command output does not prove memory or source quality."
              },
              {
                command: capturedFileCommand,
                status: "passed" as const,
                provenance: "captured_output_file" as const,
                exitCode: capturedFileArtifact.exitCode,
                capturedAt: capturedFileArtifact.completedAt,
                outputPath: `/tmp/${marker}.stdout`,
                outputRef: capturedFileArtifact.outputRef,
                doesNotProve: "A captured file remains non-proof even when its bytes persist."
              }
            ],
            commandOutputArtifacts: [artifact, capturedFileArtifact],
            diffRisk: "low" as const,
            reviewBurden: "Review persisted command output integrity.",
            rollbackPath: "Delete marker-scoped smoke rows.",
            event: {
              type: "smoke.command_output_artifact.captured",
              message: "command output artifact captured",
              payload: { smokeId: marker }
            },
            metadata: { smokeId: marker }
          },
          review: {
            status: "pending" as const,
            reviewer: "command-output-artifact-smoke",
            summary: "Command output artifact awaits review.",
            findings: [],
            metadata: { smokeId: marker }
          },
          feedback: {
            status: "candidate" as const,
            memoryCandidates: [],
            sourceDecisions: [],
            evalCandidates: [],
            metadata: { smokeId: marker }
          }
        } satisfies CreateEvidenceFeedbackOnceInput;

        const created = await scaffold.harnessRunRepository.createEvidenceFeedbackOnce(
          captureInput
        );
        const createdArtifact = commandOutputArtifactFrom(created.evidenceBundle);
        expect(created.created).toBe(true);
        expect(createdArtifact).toEqual(artifact);
        expectArtifactBytes(createdArtifact, artifact);
        expectArtifactBytes(
          commandOutputArtifactFrom(created.evidenceBundle, capturedFileArtifact.outputRef),
          capturedFileArtifact
        );
        expect(createdArtifact.stdout).toMatchObject({
          storedByteCount: commandOutputArtifactStreamByteCap,
          totalByteCount: commandOutputArtifactStreamByteCap + 137,
          truncated: true
        });

        const retried = await scaffold.harnessRunRepository.createEvidenceFeedbackOnce(
          captureInput
        );
        expect(retried.created).toBe(false);
        expect(retried.evidenceBundle).toEqual(created.evidenceBundle);
        expectArtifactBytes(commandOutputArtifactFrom(retried.evidenceBundle), artifact);

        const aggregateBeforeTamper = requireValue(
          await scaffold.harnessRunRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "command output artifact aggregate disappeared"
        );
        const aggregateBundle = requireValue(
          aggregateBeforeTamper.evidenceBundles.find(
            (bundle) => bundle.id === created.evidenceBundle.id
          ),
          "aggregate did not preload the evidence bundle"
        );
        expectArtifactBytes(commandOutputArtifactFrom(aggregateBundle), artifact);
        expectArtifactBytes(
          commandOutputArtifactFrom(aggregateBundle, capturedFileArtifact.outputRef),
          capturedFileArtifact
        );
        const evidenceContract = parseEvidenceContract(
          aggregateBeforeTamper.harnessPlan.metadata.evidenceContract
        );
        expect(evidenceContract).toBeDefined();
        expect(evidenceBundleProvesHelped({
          bundle: aggregateBundle,
          evidenceContract,
          packetChecksum: packetBinding.packetChecksum,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          sourceRunLifecycleRevision: packetBinding.sourceRunLifecycleRevision,
          sha256Hex
        })).toBe(true);
        expect(evidenceBundleProvesHelped({
          bundle: aggregateBundle,
          evidenceContract: evidenceContract === undefined
            ? undefined
            : {
                ...evidenceContract,
                commands: [{ command: capturedFileCommand, required: true }]
              },
          packetChecksum: packetBinding.packetChecksum,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          sourceRunLifecycleRevision: packetBinding.sourceRunLifecycleRevision,
          sha256Hex
        })).toBe(false);

        const [bundleJson] = await scaffold.client<{ diagnosticJson: string }[]>`
          select (commands::text || metadata::text) as "diagnosticJson"
          from evidence_bundles
          where id = ${created.evidenceBundle.id}
        `;
        expect(requireValue(bundleJson, "evidence bundle JSON was not persisted").diagnosticJson)
          .not.toContain(diagnosticSecret);

        await scaffold.client`
          update evidence_command_artifacts
          set stdout_bytes = set_byte(stdout_bytes, 0, 66)
          where evidence_bundle_id = ${created.evidenceBundle.id}
        `;

        freshClient = postgres(databaseUrl!, { max: 1 });
        const freshRepository = new DrizzleHarnessRunRepository(
          createKrnDatabase(freshClient)
        );
        const aggregateAfterTamper = requireValue(
          await freshRepository.getHarnessRunByExecutionRunId(executionRun.id),
          "fresh repository did not load the command output artifact aggregate"
        );
        const tamperedBundle = requireValue(
          aggregateAfterTamper.evidenceBundles.find(
            (bundle) => bundle.id === created.evidenceBundle.id
          ),
          "fresh aggregate did not preload the tampered evidence bundle"
        );
        const tamperedArtifact = commandOutputArtifactFrom(tamperedBundle);
        expect(tamperedArtifact.stdout.bytes[0]).toBe(66);
        expect(assessCommandOutputArtifactIntegrity(tamperedArtifact, sha256Hex)).toEqual({
          status: "invalid",
          reason: "stdout_sha256_mismatch"
        });
        expect(evidenceBundleProvesHelped({
          bundle: tamperedBundle,
          evidenceContract,
          packetChecksum: packetBinding.packetChecksum,
          packetGeneratedAt: packetBinding.packetGeneratedAt,
          sourceRunLifecycleRevision: packetBinding.sourceRunLifecycleRevision,
          sha256Hex
        })).toBe(false);
      } finally {
        await scaffold.cleanup();
        await Promise.all([
          scaffold.client.end(),
          ...(freshClient === undefined ? [] : [freshClient.end()])
        ]);
      }
    }
  );
});
