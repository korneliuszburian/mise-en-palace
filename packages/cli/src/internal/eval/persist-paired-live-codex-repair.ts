import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { EvalCandidateProposal, TargetEvidenceInput } from "@krn/core";

import {
  pairedRepairEvalCandidate
} from "./paired-live-codex-repair.js";
import {
  observedPairedDecisionApplications,
  pairedDecisionApplicationId
} from "./paired-decision-application.js";
import type {
  CommandResult,
  HeldOutArmScore
} from "./paired-live-codex-repair.js";
import {
  pairedArmScoreSummary,
  pairedCommandEvidence
} from "./paired-command-evidence.js";
import {
  parseTrackedTrialManifest,
  readTrackedTrialArtifact,
  trackedTrialRequestedConditions,
  validateTrialPacket
} from "./tracked-paired-live-codex-repair.js";
import type {
  PairedTrialManifest,
  TrackedTrialArtifact
} from "./tracked-paired-live-codex-repair.js";
import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  runDecisionPacketCommand
} from "../../run-decision-packet-command.js";

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sameJson = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const readCandidate = (value: unknown, candidateId: string): Record<string, unknown> | undefined => {
  if (!isRecord(value)) return undefined;
  const candidates = value["candidates"];
  if (!Array.isArray(candidates)) return undefined;
  return candidates.find((candidate): candidate is Record<string, unknown> =>
    isRecord(candidate) && candidate["id"] === candidateId && candidate["kind"] === "eval_candidate"
  );
};

interface CandidateReadback {
  readonly candidate: Record<string, unknown>;
  readonly feedbackDeltaId: string;
}

export interface DecisionApplicationReadback {
  readonly sourceDecisionId: string;
  readonly applicationId: string;
  readonly appliedAt: string;
  readonly outcome: "used" | "helped";
}

const decisionApplicationOutcomes = (value: unknown): unknown[] => {
  if (!isRecord(value) || !isRecord(value["readModel"])) return [];
  const feedbackDeltas = value["readModel"]["feedbackDeltas"];
  return Array.isArray(feedbackDeltas)
    ? feedbackDeltas.flatMap((feedback) =>
        isRecord(feedback) && Array.isArray(feedback["sourceUsefulnessOutcomes"])
          ? feedback["sourceUsefulnessOutcomes"]
          : [])
    : [];
};

const decodeDecisionApplication = (
  value: unknown,
  applicationId: string
): DecisionApplicationReadback | undefined => {
  if (!isRecord(value) || value["applicationId"] !== applicationId) return undefined;
  const sourceDecisionId = value["sourceDecisionId"];
  const appliedAt = value["appliedAt"];
  const outcome = value["outcome"];
  if (typeof sourceDecisionId !== "string" || (outcome !== "used" && outcome !== "helped")) {
    return undefined;
  }
  if (typeof appliedAt !== "string" || !Number.isFinite(Date.parse(appliedAt))) return undefined;
  return { sourceDecisionId, applicationId, appliedAt, outcome };
};

const readBackDecisionApplication = (
  value: unknown,
  applicationId: string
): DecisionApplicationReadback | undefined => {
  for (const outcome of decisionApplicationOutcomes(value)) {
    const application = decodeDecisionApplication(outcome, applicationId);
    if (application !== undefined) return application;
  }
  return undefined;
};

const readBackCandidate = (
  value: unknown,
  candidateId: string
): CandidateReadback | undefined => {
  if (!isRecord(value)) return undefined;
  const readModel = value["readModel"];
  if (!isRecord(readModel)) return undefined;
  const feedbackDeltas = readModel["feedbackDeltas"];
  if (!Array.isArray(feedbackDeltas)) return undefined;
  for (const feedback of feedbackDeltas) {
    if (!isRecord(feedback) || typeof feedback["id"] !== "string") continue;
    const candidate = readCandidate(feedback, candidateId);
    if (candidate !== undefined) {
      return { candidate, feedbackDeltaId: feedback["id"] };
    }
  }
  return undefined;
};

const commandSucceededWithVersion = (result: CommandResult | undefined, version: string): boolean =>
  result !== undefined &&
  result.exitCode === 0 &&
  `${result.stdout}\n${result.stderr}`.includes(version);

const mismatch = (matches: boolean, reason: string): string | undefined =>
  matches ? undefined : reason;

const optionalEqual = (observed: string | undefined, expected: string | undefined): boolean =>
  observed === undefined || observed === expected;

const optionalVersionMatches = (
  observation: { readonly version: CommandResult } | undefined,
  expected: string
): boolean => observation === undefined || commandSucceededWithVersion(observation.version, expected);

const passedObservedConditionsComplete = (artifact: TrackedTrialArtifact): boolean => {
  if (artifact.status !== "passed") return true;
  const observed = artifact.execution.conditions.observed;
  return artifact.execution.environmentProfileHash !== undefined &&
    observed?.environmentProfileHash === artifact.execution.environmentProfileHash &&
    observed.profileHash !== undefined &&
    observed.codex !== undefined &&
    observed.containment !== undefined;
};

const assertArtifactMatchesManifest = (
  manifest: PairedTrialManifest,
  manifestHash: string,
  artifact: TrackedTrialArtifact
): void => {
  const requested = artifact.execution.conditions.requested;
  const observed = artifact.execution.conditions.observed;
  const expected = trackedTrialRequestedConditions(manifest);

  const reason = [
    mismatch(artifact.manifestHash === manifestHash, "Tracked artifact manifest hash does not match the supplied manifest"),
    mismatch(artifact.runId === manifest.runId, "Tracked artifact runId does not match the supplied manifest"),
    mismatch(sameJson(requested.codex, expected.codex), "Tracked artifact Codex conditions do not match the supplied manifest"),
    mismatch(sameJson(requested.containment, expected.containment), "Tracked artifact containment conditions do not match the supplied manifest"),
    mismatch(sameJson(requested.checker, expected.checker), "Tracked artifact checker does not match the supplied manifest"),
    mismatch(
      optionalEqual(observed?.environmentProfileHash, artifact.execution.environmentProfileHash),
      "Tracked artifact environment identity is inconsistent"
    ),
    mismatch(
      optionalEqual(observed?.profileHash, manifest.codex.profile.hash),
      "Tracked artifact observed profile does not match the supplied manifest"
    ),
    mismatch(
      optionalVersionMatches(observed?.codex, manifest.codex.cliVersion),
      "Tracked artifact observed Codex version does not match the supplied manifest"
    ),
    mismatch(
      optionalVersionMatches(observed?.containment, manifest.containment.version),
      "Tracked artifact observed containment version does not match the supplied manifest"
    ),
    mismatch(
      passedObservedConditionsComplete(artifact),
      "Passed tracked artifact is missing observed execution conditions"
    )
  ].find((item) => item !== undefined);

  if (reason !== undefined) throw new Error(reason);
};

const targetChangedFiles = (
  arm: "baseline" | "krn",
  score: HeldOutArmScore
) => score.changeManifest === undefined
  ? score.changedFiles.map((path) => ({
      status: "modified",
      path: `${arm}/${path}`,
      ownership: "unknown"
    }))
  : [
      ...score.changeManifest.trackedFiles.map((path) => ({
        status: "modified",
        path: `${arm}/${path}`,
        ownership: score.changeManifest?.forbiddenFiles.length === 0
          ? "owned_by_current_krn_run"
          : "partial"
      })),
      ...score.changeManifest.untrackedFiles.map((path) => ({
        status: "untracked",
        path: `${arm}/${path}`,
        ownership: score.changeManifest?.forbiddenFiles.length === 0
          ? "owned_by_current_krn_run"
          : "partial"
      }))
    ];

const dirtyState = (
  state: NonNullable<TrackedTrialArtifact["execution"]["targets"]>["baseline"]["before"] | undefined
): "clean" | "dirty" | "unknown" => {
  if (state?.status !== "known") return "unknown";
  return state.statusOutput.trim().length === 0 &&
    state.trackedFiles.length === 0 &&
    state.untrackedFiles.length === 0
    ? "clean"
    : "dirty";
};

const pairedDirtyState = (
  targets: NonNullable<TrackedTrialArtifact["execution"]["targets"]>,
  phase: "before" | "after"
): "clean" | "dirty" | "unknown" => {
  const states = [dirtyState(targets.baseline[phase]), dirtyState(targets.krn[phase])];
  if (states.includes("unknown")) return "unknown";
  return states.includes("dirty") ? "dirty" : "clean";
};

const targetOwnership = (
  score: TrackedTrialArtifact["score"],
  targets: TrackedTrialArtifact["execution"]["targets"]
): "owned_by_current_krn_run" | "partial" | "unknown" => {
  if (targets === undefined || score === undefined) return "unknown";
  if (
    score.baseline.changeManifest?.status !== "known" ||
    score.krn.changeManifest?.status !== "known"
  ) return "unknown";
  return score.baseline.changeManifest.forbiddenFiles.length === 0 &&
    score.krn.changeManifest.forbiddenFiles.length === 0
    ? "owned_by_current_krn_run"
    : "partial";
};

const targetDirtyField = (
  targets: TrackedTrialArtifact["execution"]["targets"],
  phase: "before" | "after"
): "clean" | "dirty" | "unknown" => targets === undefined
  ? "unknown"
  : pairedDirtyState(targets, phase);

const patchIdentityFields = (
  targets: TrackedTrialArtifact["execution"]["targets"]
): Pick<TargetEvidenceInput, "patchIdentity"> => {
  const baseline = targets?.baseline.after?.patchHash;
  const krn = targets?.krn.after?.patchHash;
  return baseline === undefined || krn === undefined
    ? {}
    : { patchIdentity: `sha256:${sha256(`${baseline}:${krn}`)}` };
};

const targetChangedFilesFor = (
  score: TrackedTrialArtifact["score"]
): NonNullable<TargetEvidenceInput["changedFiles"]> => score === undefined
  ? []
  : [...targetChangedFiles("baseline", score.baseline), ...targetChangedFiles("krn", score.krn)];

const artifactEvidenceRefs = (
  artifact: TrackedTrialArtifact
): readonly string[] => [
  `packet:${artifact.packet.checksum ?? "unknown"}`,
  `artifact:sha256:${artifact.artifactHash}`,
  `manifest:sha256:${artifact.manifestHash}`,
  `checker:paired-live-codex-repair.v1`,
  `environment:sha256:${artifact.execution.environmentProfileHash ?? "unknown"}`,
  ...(artifact.execution.targets?.baseline.after?.patchHash === undefined
    ? []
    : [`target:baseline-patch:sha256:${artifact.execution.targets.baseline.after.patchHash}`]),
  ...(artifact.execution.targets?.krn.after?.patchHash === undefined
    ? []
    : [`target:krn-patch:sha256:${artifact.execution.targets.krn.after.patchHash}`])
];

const observationCandidate = (input: {
  readonly artifact: TrackedTrialArtifact;
  readonly manifest: PairedTrialManifest;
  readonly evidenceRefs: readonly string[];
  readonly createdAt: string;
}): EvalCandidateProposal => input.artifact.score === undefined
  ? {
      id: `paired-target-repair:${input.artifact.runId}`,
      projectId: input.manifest.projectId,
      status: "candidate",
      title: `Paired target repair observation: ${input.artifact.status}`,
      scenario: input.manifest.scenario,
      expectedSignal: "Only a completed, predeclared KRN win may be classified as helped.",
      sourceEvidence: [...input.evidenceRefs],
      metadata: {
        evaluationKind: "paired_live_codex_repair",
        artifactStatus: input.artifact.status,
        outcome: "unknown",
        usefulnessOutcome: "unknown",
        packetChecksum: input.artifact.packet.checksum ?? "unknown",
        artifactHash: input.artifact.artifactHash,
        evidenceRefs: [...input.evidenceRefs],
        doesNotProve: [
          "An incomplete paired trial does not prove memory usefulness.",
          "The candidate is an observation and does not mutate MemoryRecord or SourceClaim truth."
        ]
      },
      createdAt: input.createdAt
    }
  : pairedRepairEvalCandidate({
      score: input.artifact.score,
      runId: input.artifact.runId,
      projectId: input.manifest.projectId,
      packetChecksum: input.artifact.packet.checksum ?? "unknown",
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt
    });

const scoreCommandRows = (artifact: TrackedTrialArtifact) => {
  const score = artifact.score;
  if (score === undefined) return [];
  return (["baseline", "krn"] as const).flatMap((arm) => {
    const armScore = score[arm];
    const rows = [
      ...(armScore.commands === undefined ? [] : [
        pairedCommandEvidence(arm, "test", armScore.commands.test),
        pairedCommandEvidence(arm, "typecheck", armScore.commands.typecheck),
        pairedCommandEvidence(arm, "diff-check", armScore.commands.diffCheck)
      ]),
      ...(armScore.runtimeCommand === undefined
        ? []
        : [pairedCommandEvidence(arm, "held-out-runtime", armScore.runtimeCommand)])
    ];
    return armScore.status === "pass"
      ? rows
      : rows.filter((row) => row.command.status !== "passed");
  });
};

const executionCommandRows = (artifact: TrackedTrialArtifact) =>
  (["baseline", "krn"] as const).flatMap((arm) => {
    const result = artifact.execution[arm];
    if (result === undefined) return [];
    const prompt = result.args.at(-1);
    const boundedResult: CommandResult = prompt === undefined
      ? result
      : {
          ...result,
          args: [
            ...result.args.slice(0, -1),
            `prompt:sha256:${sha256(prompt)}`
          ]
        };
    const row = pairedCommandEvidence(arm, "codex-execution", boundedResult);
    return artifact.score?.[arm].status !== "pass" && row.command.status === "passed"
      ? []
      : [row];
  });

const targetEvidenceFor = (
  manifest: PairedTrialManifest,
  artifact: TrackedTrialArtifact,
  commands: readonly string[]
): TargetEvidenceInput => {
  const targets = artifact.execution.targets;
  const score = artifact.score;

  return {
    targetRepo: `${manifest.sourcePath}#paired:${artifact.runId}`,
    mode: artifact.status === "passed" ? "headless_repair" : "observation_only",
    dirtyBefore: targetDirtyField(targets, "before"),
    dirtyAfter: targetDirtyField(targets, "after"),
    ownedChanges: targetOwnership(score, targets),
    targetStatusFreshness: "fresh_current_task",
    treeIdentity: `sha256:${artifact.sourceTreeHash}`,
    ...patchIdentityFields(targets),
    targetPatchLifecycle: "none",
    handoffArtifact: `artifact:sha256:${artifact.artifactHash}`,
    allowedWrites: ["src/**", "tests/**", "docs/**"],
    forbiddenWrites: ["parent KRN packages", "other target repos", "network", "secrets", "commits", "pushes"],
    changedFiles: targetChangedFilesFor(score),
    commands,
    doesNotProve: [
      "This paired observation does not prove that the DecisionPacket improved the target implementation.",
      "Ephemeral trial patches were not accepted by a target owner.",
      "This single trial does not prove arbitrary-repository portability or product readiness."
    ]
  };
};

export interface PreparedPairedTrialPersistence {
  readonly candidate: EvalCandidateProposal;
  readonly commandRows: ReturnType<typeof scoreCommandRows>;
  readonly targetEvidence: TargetEvidenceInput;
  readonly evidenceRefs: readonly string[];
  readonly decisionApplications: readonly DecisionApplicationReadback[];
  readonly alreadyPersistedFeedbackDeltaId?: string;
}

export const preparePairedTrialPersistence = (input: {
  readonly manifest: PairedTrialManifest;
  readonly manifestHash: string;
  readonly artifact: TrackedTrialArtifact;
  readonly packetReadback: unknown;
  readonly createdAt: string;
}): PreparedPairedTrialPersistence => {
  assertArtifactMatchesManifest(input.manifest, input.manifestHash, input.artifact);
  const packetValidation = validateTrialPacket(input.packetReadback, input.manifest);
  if (!packetValidation.valid || packetValidation.checksum === undefined) {
    throw new Error(`DecisionPacket does not match the tracked trial: ${packetValidation.reasons.join("; ")}`);
  }
  if (
    input.artifact.packet.checksum !== packetValidation.checksum ||
    input.artifact.packet.validation.checksum !== packetValidation.checksum
  ) {
    throw new Error("Tracked artifact packet checksum does not match current DecisionPacket readback");
  }

  const evidenceRefs = artifactEvidenceRefs(input.artifact);
  const observedApplications = input.artifact.score === undefined ||
    input.artifact.score.outcome === "invalid"
    ? []
    : observedPairedDecisionApplications({
        score: input.artifact.score,
        rules: input.manifest.decisionApplications
      });
  const observedByDecision = new Map(
    observedApplications.map((application) => [application.sourceDecisionId, application])
  );
  const decisionApplications = input.manifest.decisionApplications.flatMap((rule) => {
    const application = readBackDecisionApplication(
      input.packetReadback,
      pairedDecisionApplicationId(input.manifest.runId, rule.sourceDecisionId)
    );
    const observed = observedByDecision.get(rule.sourceDecisionId);
    if (observed === undefined) {
      if (application !== undefined) {
        throw new Error(`Unobserved paired decision ${rule.sourceDecisionId} has application evidence`);
      }
      return [];
    }
    if (application === undefined || application.sourceDecisionId !== rule.sourceDecisionId) {
      throw new Error(`Observed paired decision ${rule.sourceDecisionId} has no exact application readback`);
    }
    if (application.outcome === "helped" && !observed.differential) {
      throw new Error(`Paired decision ${rule.sourceDecisionId} cannot be helped without a differential check`);
    }
    return [application];
  });
  const candidate = observationCandidate({
    artifact: input.artifact,
    manifest: input.manifest,
    evidenceRefs,
    createdAt: input.createdAt
  });
  const priorCandidate = readBackCandidate(input.packetReadback, candidate.id);
  if (priorCandidate !== undefined) {
    const priorEvidence = priorCandidate.candidate["sourceEvidence"];
    const artifactRef = `artifact:sha256:${input.artifact.artifactHash}`;
    if (!Array.isArray(priorEvidence) || !priorEvidence.includes(artifactRef)) {
      throw new Error(`EvalCandidate ${candidate.id} already exists for a different tracked artifact`);
    }
  }

  const commandRows = [...executionCommandRows(input.artifact), ...scoreCommandRows(input.artifact)];
  return {
    candidate,
    commandRows,
    decisionApplications,
    evidenceRefs,
    ...(priorCandidate === undefined
      ? {}
      : { alreadyPersistedFeedbackDeltaId: priorCandidate.feedbackDeltaId }),
    targetEvidence: targetEvidenceFor(
      input.manifest,
      input.artifact,
      commandRows.map((row) => row.command.command)
    )
  };
};

const main = async (): Promise<void> => {
  const [manifestPath, attemptDirectory, checkerRoot = process.cwd(), databaseUrl =
    process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn"] = process.argv.slice(2);
  if (manifestPath === undefined || attemptDirectory === undefined) {
    throw new Error(
      "Usage: persist-paired-live-codex-repair <manifest-path> <attempt-directory> [checker-root] [database-url]"
    );
  }

  const manifestRaw = await readFile(resolve(manifestPath), "utf8");
  const manifestValue: unknown = JSON.parse(manifestRaw);
  const manifest = parseTrackedTrialManifest(manifestValue);
  const manifestHash = sha256(JSON.stringify(manifest));
  const artifact = await readTrackedTrialArtifact(resolve(attemptDirectory));
  if (artifact === undefined) {
    throw new Error("Tracked paired-trial artifact or its immutable phase journal is invalid");
  }

  const now = new Date().toISOString();
  const packetReadback = await runDecisionPacketCommand({
    env: { KRN_DATABASE_URL: databaseUrl },
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live-preflight:${manifest.runId}`,
    runId: manifest.runId
  });
  const packetValue: unknown = JSON.parse(packetReadback.stdout);
  const packetIdentity = isRecord(packetValue) && isRecord(packetValue["packetIdentity"])
    ? packetValue["packetIdentity"]
    : undefined;
  const packetGeneratedAt = packetIdentity?.["generatedAt"];
  if (typeof packetGeneratedAt !== "string" || !Number.isFinite(Date.parse(packetGeneratedAt))) {
    throw new Error("Current DecisionPacket readback has no valid generatedAt binding");
  }
  const prepared = preparePairedTrialPersistence({
    manifest,
    manifestHash,
    artifact,
    packetReadback: packetValue,
    createdAt: now
  });
  const packetChecksum = artifact.packet.checksum;
  if (packetChecksum === undefined) {
    throw new Error("Validated tracked artifact has no DecisionPacket checksum");
  }
  const commandOutcomes = prepared.commandRows.map((row) => row.command);
  const commandOutputArtifacts = prepared.commandRows.flatMap((row) =>
    row.commandOutputArtifact === undefined ? [] : [row.commandOutputArtifact]
  );
  const evidence = prepared.alreadyPersistedFeedbackDeltaId === undefined
    ? await runEvidenceCaptureCommand({
        env: { KRN_DATABASE_URL: databaseUrl },
        cwd: resolve(checkerRoot),
        now: () => now,
        createId: (prefix) => `${prefix}:paired-live:${artifact.runId}`,
        persist: true,
        runId: artifact.runId,
        decisionPacketChecksum: packetChecksum,
        decisionPacketGeneratedAt: packetGeneratedAt,
        commandOutcomes,
        commandOutputArtifacts,
        targetEvidence: prepared.targetEvidence,
        evalCandidateProposals: [prepared.candidate],
        readGitStatus: async () => ""
      })
    : undefined;
  const readback = await runDecisionPacketCommand({
    env: { KRN_DATABASE_URL: databaseUrl },
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live-readback:${artifact.runId}`,
    runId: artifact.runId
  });
  const readbackValue: unknown = JSON.parse(readback.stdout);
  const persisted = readBackCandidate(readbackValue, prepared.candidate.id);
  if (persisted === undefined) {
    throw new Error(`Paired repair EvalCandidate ${prepared.candidate.id} was not visible in readback`);
  }

  const evidenceIdentity = evidence === undefined
    ? [`feedbackDelta: ${prepared.alreadyPersistedFeedbackDeltaId}`]
    : evidence.stdout
        .split("\n")
        .filter((line) => line.includes("evidenceBundle:") || line.includes("feedbackDelta:"));
  process.stdout.write(`${JSON.stringify({
    kind: "krn.pairedLiveCodexRepair.persistence.v2",
    artifactStatus: artifact.status,
    outcome: artifact.score?.outcome ?? "unknown",
    candidateId: prepared.candidate.id,
    packetChecksum: artifact.packet.checksum,
    artifactHash: artifact.artifactHash,
    manifestHash: artifact.manifestHash,
    environmentProfileHash: artifact.execution.environmentProfileHash,
    decisionApplications: prepared.decisionApplications,
    persistedInDecisionPacket: true,
    idempotentReplay: evidence === undefined,
    evidenceIdentity,
    ...(artifact.score === undefined ? {} : {
      score: {
        outcome: artifact.score.outcome,
        reason: artifact.score.reason,
        baseline: pairedArmScoreSummary(artifact.score.baseline),
        krn: pairedArmScoreSummary(artifact.score.krn)
      }
    }),
    proof: {
      proves: [
        "the immutable tracked artifact was validated before persistence",
        "recorded arm and checker command outcomes were consumed without rerunning the target",
        "the observed result was stored as a proposal-only EvalCandidate",
        "the candidate was visible after persistence through DecisionPacket readback"
      ],
      doesNotProve: [
        "MemoryRecord or SourceClaim promotion",
        "a KRN causal win or arbitrary-repository portability",
        "product readiness"
      ]
    }
  }, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("persist-paired-live-codex-repair.ts") === true) {
  await main();
}
