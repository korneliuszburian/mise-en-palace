import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { FeedbackDelta } from "@krn/core";

import {
  preparePairedTrialPersistence
} from "../internal/eval/persist-paired-live-codex-repair.js";
import {
  decisionPacketReadModelCandidates,
  decisionPacketReadModelSourceUsefulnessOutcomes
} from "../decision-packet-read-model-builders.js";
import {
  pairedDecisionApplicationId
} from "../internal/eval/paired-decision-application.js";
import type {
  CommandResult,
  PairedRepairScore
} from "../internal/eval/paired-live-codex-repair.js";
import type {
  PairedTrialManifest,
  TrackedTrialArtifact
} from "../internal/eval/tracked-paired-live-codex-repair.js";

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
const checksum = "a".repeat(64);
const environmentHash = "b".repeat(64);
const profileHash = "c".repeat(64);

const manifest: PairedTrialManifest = {
  kind: "krn.pairedLiveCodexRepairManifest.v1",
  scenario: "weak-json-boundary",
  sourcePath: "fixture",
  projectId: "project-1",
  taskId: "task-1",
  task: "Repair the weak-json-boundary controlled target.",
  requiredDecisionIds: ["decision-1"],
  decisionApplications: [{
    governingDecisionId: "decision-1",
    sourceDecisionId: "source-decision-1",
    check: "finite_result_state",
    changedFiles: ["src/index.ts"]
  }],
  runId: "run-1",
  codex: {
    command: "codex",
    args: ["exec", "{prompt}"],
    model: "gpt-test",
    cliVersion: "codex-cli 1.0.0",
    profile: { name: "trial", config: "model = \"gpt-test\"\n", hash: profileHash },
    permissions: { sandbox: "workspace-write", approval: "never" },
    networkPolicy: "disabled",
    budget: { timeoutMs: 1000 }
  },
  containment: {
    command: "bwrap",
    version: "bubblewrap 1.0.0",
    network: "model_service_egress",
    workspaceWriteRoot: "{targetRoot}",
    homeRoot: "{sandboxRoot}"
  },
  checker: { heldOut: true, outcome: "win|tie|loss|invalid" }
};

const command = (overrides: Partial<CommandResult> = {}): CommandResult => ({
  command: "pnpm",
  args: ["test"],
  exitCode: 0,
  stdout: "ok",
  stderr: "",
  startedAt: "2026-07-16T10:00:00.000Z",
  completedAt: "2026-07-16T10:00:01.000Z",
  durationMs: 1000,
  ...overrides
});

const arm = (status: "pass" | "fail" = "pass") => ({
  status,
  score: status === "pass" ? 3 : 0,
  checks: [],
  changedFiles: ["src/index.ts"],
  changeManifest: {
    status: "known" as const,
    headMatchesInitialCommit: true,
    trackedFiles: ["src/index.ts"],
    untrackedFiles: [],
    changedFiles: ["src/index.ts"],
    forbiddenFiles: [],
    statusOutput: " M src/index.ts"
  },
  commands: {
    test: command(status === "pass" ? {} : { exitCode: 1 }),
    typecheck: command({ args: ["typecheck"] }),
    diffCheck: command({ args: ["diff-check"] })
  },
  runtimeCommand: command({ command: "node", args: ["held-out.mjs"] }),
  focusedTestControl: command({ command: "node", args: ["focused-control.mjs"] }),
  focusedTestMutations: (["invalid_json", "missing_email", "invalid_role"] as const)
    .map((name) => ({
      name,
      command: command({ command: "held-out focused-test mutation", args: [name] })
    }))
});

const score: PairedRepairScore = {
  outcome: "tie",
  baseline: arm(),
  krn: arm(),
  reason: "both arms passed with equal score"
};

const targetState = (clean: boolean) => ({
  status: "known" as const,
  treeHash: "d".repeat(64),
  statusOutput: clean ? "" : " M src/index.ts",
  trackedFiles: clean ? [] : ["src/index.ts"],
  untrackedFiles: [],
  ...(clean ? {} : { patchHash: "e".repeat(64) }),
  commands: {
    status: command({ command: "git", args: ["status"] }),
    tracked: command({ command: "git", args: ["diff", "--name-only"] }),
    untracked: command({ command: "git", args: ["ls-files"] }),
    patch: command({ command: "git", args: ["diff", "--binary"] })
  }
});

const artifact = (overrides: Partial<TrackedTrialArtifact> = {}): TrackedTrialArtifact => ({
  kind: "krn.pairedLiveCodexRepairArtifact.v1",
  status: "passed",
  artifactHash: "f".repeat(64),
  manifestHash: sha256(JSON.stringify(manifest)),
  sourceTreeHash: "d".repeat(64),
  baselineTreeHash: "d".repeat(64),
  krnTreeHash: "d".repeat(64),
  runId: manifest.runId,
  packet: { checksum, validation: { valid: true, reasons: [], checksum } },
  execution: {
    environmentProfileHash: environmentHash,
    conditions: {
      requested: {
        codex: {
          command: manifest.codex.command,
          model: manifest.codex.model,
          cliVersion: manifest.codex.cliVersion,
          profileName: manifest.codex.profile.name,
          profileHash: manifest.codex.profile.hash,
          permissions: manifest.codex.permissions,
          networkPolicy: manifest.codex.networkPolicy,
          timeoutMs: manifest.codex.budget.timeoutMs
        },
        containment: manifest.containment,
        armOrder: ["baseline", "krn"],
        checker: manifest.checker
      },
      observed: {
        codex: {
          command: "codex --version",
          version: command({ command: "codex", args: ["--version"], stdout: manifest.codex.cliVersion })
        },
        containment: {
          command: "bwrap --version",
          version: command({ command: "bwrap", args: ["--version"], stdout: manifest.containment.version })
        },
        profileHash,
        environmentProfileHash: environmentHash,
        credentialProvided: true
      }
    },
    baseline: command({ command: "codex", args: ["exec", "PROMPT_SENTINEL"] }),
    krn: command({ command: "codex", args: ["exec", "PROMPT_SENTINEL"] }),
    targets: {
      baseline: { before: targetState(true), after: targetState(false) },
      krn: { before: targetState(true), after: targetState(false) }
    }
  },
  score,
  proof: { proves: [], doesNotProve: [] },
  ...overrides
});

const packetReadback = (overrides: Record<string, unknown> = {}) => ({
  kind: "krn.decisionPacketReadback.v1",
  request: { runId: manifest.runId },
  packetIdentity: { checksum },
  packet: {
    task: {
      id: manifest.taskId,
      projectId: manifest.projectId,
      title: manifest.task,
      objective: manifest.task
    },
    governingDecisionIds: manifest.requiredDecisionIds,
    sourceDecisionIds: manifest.decisionApplications.map((rule) => rule.sourceDecisionId),
    abstentionScore: { status: "ready" }
  },
  readModel: { feedbackDeltas: [] },
  ...overrides
});

const prepare = (
  trackedArtifact = artifact(),
  readback: unknown = packetReadback()
) => preparePairedTrialPersistence({
  manifest,
  manifestHash: sha256(JSON.stringify(manifest)),
  artifact: trackedArtifact,
  packetReadback: readback,
  createdAt: "2026-07-16T12:00:00.000Z"
});

describe("paired live Codex repair persistence", () => {
  it("derives a neutral proposal and exact command evidence from the immutable artifact", () => {
    const liveOutput = {
      decisionId: "decision-1",
      rejectedPath: "cast JSON directly",
      staleBoundary: "markdown notes are not runtime authority",
      nonProof: "does not prove live product readiness",
      action: "validate before domain use"
    };
    const prepared = prepare(artifact({ execution: { ...artifact().execution, liveOutput } }));

    expect(prepared.candidate).toMatchObject({
      id: "paired-target-repair:run-1",
      projectId: "project-1",
      metadata: { outcome: "tie", usefulnessOutcome: "neutral", liveOutput }
    });
    expect(prepared.evidenceRefs).toEqual(expect.arrayContaining([
      `artifact:sha256:${"f".repeat(64)}`,
      `manifest:sha256:${sha256(JSON.stringify(manifest))}`,
      "checker:paired-live-codex-repair.v1",
      `environment:sha256:${environmentHash}`
    ]));
    expect(prepared.commandRows).toHaveLength(18);
    expect(prepared.commandRows.every((row) => row.command.status === "passed")).toBe(true);
    expect(JSON.stringify(prepared.commandRows)).not.toContain("PROMPT_SENTINEL");
    expect(prepared.commandRows[0]?.command.command).toContain(
      `prompt:sha256:${sha256("PROMPT_SENTINEL")}`
    );
    expect(prepared.targetEvidence).toMatchObject({
      dirtyBefore: "clean",
      dirtyAfter: "dirty",
      ownedChanges: "owned_by_current_krn_run",
      targetPatchLifecycle: "none",
      handoffArtifact: `artifact:sha256:${"f".repeat(64)}`
    });
  });

  it("attributes mutation-backed v2 artifacts to the v2 checker", () => {
    const prepared = prepare(artifact({ kind: "krn.pairedLiveCodexRepairArtifact.v2" }));

    expect(prepared.evidenceRefs).toContain("checker:paired-live-codex-repair.v2");
    expect(prepared.evidenceRefs).not.toContain("checker:paired-live-codex-repair.v1");
  });

  it("never turns a failed arm command into a passed row", () => {
    const failedScore: PairedRepairScore = {
      outcome: "invalid",
      baseline: arm("fail"),
      krn: {
        ...arm(),
        checks: [{ name: "finite_result_state", passed: true, details: "partial observation" }]
      },
      reason: "baseline failed"
    };
    const prepared = prepare(artifact({ status: "invalid", score: failedScore }));
    const baselineTest = prepared.commandRows.find((row) =>
      row.command.command.startsWith("baseline:test ")
    );

    expect(baselineTest?.command).toMatchObject({ status: "failed", exitCode: 1 });
    expect(prepared.commandRows.filter((row) =>
      row.command.command.startsWith("baseline:focused-test-")
    )).toHaveLength(4);
    expect(prepared.commandRows.filter((row) =>
      row.command.command.startsWith("baseline:focused-test-")
    ).every((row) => row.command.status === "passed")).toBe(true);
    expect(prepared.commandRows.some((row) =>
      row.command.command.startsWith("baseline:typecheck ") ||
      row.command.command.startsWith("baseline:diff-check ") ||
      row.command.command.startsWith("baseline:held-out-runtime ")
    )).toBe(false);
    expect(prepared.candidate.metadata).toMatchObject({
      outcome: "invalid",
      usefulnessOutcome: "unknown"
    });
    expect(prepared.decisionApplications).toEqual([]);
  });

  it("persists a blocked attempt only as an unknown observation", () => {
    const { score: _score, ...completedArtifact } = artifact();
    const blocked: TrackedTrialArtifact = {
      ...completedArtifact,
      status: "blocked",
      execution: {
        conditions: {
          requested: artifact().execution.conditions.requested
        }
      }
    };
    const prepared = prepare(blocked);

    expect(prepared.commandRows).toEqual([]);
    expect(prepared.candidate.metadata).toMatchObject({
      artifactStatus: "blocked",
      outcome: "unknown",
      usefulnessOutcome: "unknown"
    });
    expect(prepared.targetEvidence.mode).toBe("observation_only");
  });

  it("rejects mismatched packet, manifest, checker, environment, and prior artifact identity", () => {
    expect(() => prepare(artifact({ runId: "other-run" }))).toThrow("runId");
    expect(() => prepare(artifact({ manifestHash: "0".repeat(64) }))).toThrow("manifest hash");
    expect(() => prepare(artifact({
      execution: {
        ...artifact().execution,
        conditions: {
          ...artifact().execution.conditions,
          requested: {
            ...artifact().execution.conditions.requested,
            checker: { heldOut: true, outcome: "other" as "win|tie|loss|invalid" }
          }
        }
      }
    }))).toThrow("checker");
    expect(() => prepare(artifact({
      execution: {
        ...artifact().execution,
        environmentProfileHash: "1".repeat(64)
      }
    }))).toThrow("environment identity");
    expect(() => prepare(artifact(), packetReadback({
      packetIdentity: { checksum: "2".repeat(64) }
    }))).toThrow("packet checksum");
    expect(() => prepare(artifact(), packetReadback({
      readModel: {
        feedbackDeltas: [{
          id: "feedback-different",
          candidates: [{
            id: "paired-target-repair:run-1",
            kind: "eval_candidate",
            sourceEvidence: ["artifact:sha256:different"]
          }]
        }]
      }
    }))).toThrow("different tracked artifact");
  });

  it("accepts exact candidate replay before repository-level idempotent persistence", () => {
    const prepared = prepare(artifact(), packetReadback({
      readModel: {
        feedbackDeltas: [{
          id: "feedback-existing",
          candidates: [{
            id: "paired-target-repair:run-1",
            kind: "eval_candidate",
            sourceEvidence: [`artifact:sha256:${"f".repeat(64)}`]
          }]
        }]
      }
    }));

    expect(prepared.candidate.id).toBe("paired-target-repair:run-1");
    expect(prepared.alreadyPersistedFeedbackDeltaId).toBe("feedback-existing");
  });

  it("requires exact application readback and never accepts helped for a tied mapped check", () => {
    const mappedCheck = { name: "finite_result_state" as const, passed: true, details: "observed" };
    const mappedScore: PairedRepairScore = {
      ...score,
      baseline: { ...score.baseline, checks: [mappedCheck] },
      krn: { ...score.krn, checks: [mappedCheck] }
    };
    const applicationId = pairedDecisionApplicationId(manifest.runId, "source-decision-1");
    const applicationOutcome = {
      sourceDecisionId: "source-decision-1",
      applicationId,
      appliedAt: "2026-07-16T11:00:00.000Z",
      outcome: "used"
    };
    const readback = packetReadback({
      readModel: {
        feedbackDeltas: [{ sourceUsefulnessOutcomes: [applicationOutcome] }]
      }
    });

    expect(prepare(artifact({ score: mappedScore }), readback).decisionApplications).toEqual([
      applicationOutcome
    ]);
    expect(() => prepare(artifact({ score: mappedScore }), packetReadback())).toThrow(
      "no exact application readback"
    );
    expect(() => prepare(artifact({ score: mappedScore }), packetReadback({
      readModel: {
        feedbackDeltas: [{
          sourceUsefulnessOutcomes: [{ ...applicationOutcome, outcome: "selected" }]
        }]
      }
    }))).toThrow("no exact application readback");
    expect(() => prepare(artifact({ score: mappedScore }), packetReadback({
      readModel: {
        feedbackDeltas: [{
          sourceUsefulnessOutcomes: [{ ...applicationOutcome, outcome: "helped" }]
        }]
      }
    }))).toThrow("cannot be helped without a differential check");
  });

  it("keeps the observed outcome and full artifact refs in DecisionPacket readback", () => {
    const prepared = prepare();
    const [candidate] = decisionPacketReadModelCandidates({
      id: "feedback-1",
      reviewAssessmentId: "review-1",
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [prepared.candidate],
      metadata: {},
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z"
    } as unknown as FeedbackDelta);

    expect(candidate).toMatchObject({
      kind: "eval_candidate",
      observedOutcome: "tie",
      usefulnessOutcome: "neutral",
      artifactHash: "f".repeat(64),
      sourceEvidence: prepared.evidenceRefs
    });

    expect(decisionPacketReadModelSourceUsefulnessOutcomes({
      id: "feedback-application",
      reviewAssessmentId: "review-application",
      status: "candidate",
      memoryCandidates: [],
      sourceDecisions: [],
      evalCandidates: [],
      metadata: {
        decisionPacketAuthorityAdmission: "current_v1",
        decisionPacketBindingState: "bound_current",
        decisionPacketChecksum: checksum,
        decisionPacketEvidenceRef: `packet:${checksum}`,
        decisionPacketGeneratedAt: "2026-07-16T10:00:00.000Z",
        decisionPacketSourceRunLifecycleRevision: 1,
        sourceUsefulnessOutcomes: [{
          sourceDecisionId: "decision-1",
          applicationId: "application-1",
          appliedAt: "2026-07-16T11:00:00.000Z",
          outcome: "used",
          reason: "observed",
          evidenceRefs: ["packet:abc"],
          doesNotProve: "benefit"
        }]
      },
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z"
    } as unknown as FeedbackDelta)).toEqual([
      expect.objectContaining({
        sourceDecisionId: "decision-1",
        applicationId: "application-1",
        appliedAt: "2026-07-16T11:00:00.000Z",
        outcome: "used"
      })
    ]);
  });
});
