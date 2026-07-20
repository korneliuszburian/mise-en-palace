import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import postgres from "postgres";
import {
  createKrnDatabase
} from "@krn/db";
import {
  DrizzleHarnessRunRepository
} from "@krn/db/adapters";
import type {
  EvalCandidateProposal,
  RecordPairedLiveEvalEvidenceInput,
  RecordPairedLiveEvalEvidenceResult,
  TargetEvidenceInput
} from "@krn/core";

import {
  pairedRepairEvalCandidate,
  resolvePairedEvalFamily,
  targetChangeManifestClaimsOwnedChanges
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
        ownership: targetChangeManifestClaimsOwnedChanges(score.changeManifest)
          ? "owned_by_current_krn_run"
          : "partial"
      })),
      ...score.changeManifest.untrackedFiles.map((path) => ({
        status: "untracked",
        path: `${arm}/${path}`,
        ownership: targetChangeManifestClaimsOwnedChanges(score.changeManifest)
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
  return targetChangeManifestClaimsOwnedChanges(score.baseline.changeManifest) &&
    targetChangeManifestClaimsOwnedChanges(score.krn.changeManifest)
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

const checkerEvidenceRef = (artifact: TrackedTrialArtifact): string =>
  artifact.checkerRevision === undefined
    ? artifact.kind === "krn.pairedLiveCodexRepairArtifact.v2"
      ? "checker:paired-live-codex-repair.v2"
      : "checker:paired-live-codex-repair.v1"
    : `checker:${artifact.checkerRevision}`;

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
  checkerEvidenceRef(artifact),
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
        ...(input.artifact.execution.liveOutput === undefined
          ? {}
          : { liveOutput: input.artifact.execution.liveOutput }),
        ...(input.artifact.execution.liveOutputValidation === undefined
          ? {}
          : { liveOutputValidation: input.artifact.execution.liveOutputValidation }),
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
      scenario: input.manifest.scenario,
      packetChecksum: input.artifact.packet.checksum ?? "unknown",
      evidenceRefs: input.evidenceRefs,
      createdAt: input.createdAt,
      ...(input.artifact.execution.liveOutput === undefined
        ? {}
        : { liveOutput: input.artifact.execution.liveOutput }),
      ...(input.artifact.execution.liveOutputValidation === undefined
        ? {}
        : { liveOutputValidation: input.artifact.execution.liveOutputValidation })
    });

const scoreCommandRows = (artifact: TrackedTrialArtifact) => {
  const score = artifact.score;
  if (score === undefined) return [];
  return (["baseline", "krn"] as const).flatMap((arm) => {
    const armScore = score[arm];
    const ordinaryRows = [
      ...(armScore.commands === undefined ? [] : [
        pairedCommandEvidence(arm, "test", armScore.commands.test),
        pairedCommandEvidence(arm, "typecheck", armScore.commands.typecheck),
        pairedCommandEvidence(arm, "diff-check", armScore.commands.diffCheck)
      ]),
      ...(armScore.runtimeCommand === undefined
        ? []
        : [pairedCommandEvidence(arm, "held-out-runtime", armScore.runtimeCommand)])
    ];
    const proofRows = [
      ...(armScore.focusedTestControl === undefined
        ? []
        : [pairedCommandEvidence(arm, "focused-test-control", armScore.focusedTestControl)]),
      ...(armScore.focusedTestMutations ?? []).map((mutation) =>
        pairedCommandEvidence(arm, `focused-test-mutation-${mutation.name}`, mutation.command)
      )
    ];
    return armScore.status === "pass"
      ? [...ordinaryRows, ...proofRows]
      : [...ordinaryRows.filter((row) => row.command.status !== "passed"), ...proofRows];
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

const targetPatchCommandRows = (artifact: TrackedTrialArtifact) =>
  (["baseline", "krn"] as const).flatMap((arm) => {
    const patch = artifact.execution.targets?.[arm].after?.commands.patch;
    return patch === undefined ? [] : [pairedCommandEvidence(arm, "target-patch", patch)];
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

  const commandRows = [
    ...executionCommandRows(input.artifact),
    ...targetPatchCommandRows(input.artifact),
    ...scoreCommandRows(input.artifact)
  ];
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

const pairedLiveEvidenceUsefulnessOutcome = (
  artifact: TrackedTrialArtifact,
  candidate: EvalCandidateProposal
): RecordPairedLiveEvalEvidenceInput["usefulnessOutcome"] => {
  const value = candidate.metadata["usefulnessOutcome"];
  const candidateOutcome =
    value === "helped" ||
    value === "neutral" ||
    value === "hurt" ||
    value === "unknown"
      ? value
      : "unknown";
  const outcome = artifact.score?.outcome ?? "unknown";

  if (
    artifact.status !== "passed" &&
    candidateOutcome === "helped"
  ) {
    return "unknown";
  }

  return outcome === "invalid" && candidateOutcome === "helped"
    ? "unknown"
    : candidateOutcome;
};

export const pairedLiveEvalEvidenceInputForPersistence = (input: {
  readonly manifest: PairedTrialManifest;
  readonly artifact: TrackedTrialArtifact;
  readonly candidate: EvalCandidateProposal;
  readonly packetChecksum: string;
  readonly evidenceRefs: readonly string[];
  readonly feedbackDeltaId: string;
  readonly decisionApplications: readonly DecisionApplicationReadback[];
}): RecordPairedLiveEvalEvidenceInput => {
  const checkerRef = checkerEvidenceRef(input.artifact);
  const checkerRevision = checkerRef.slice("checker:".length);
  const environmentProfileHash = input.artifact.execution.environmentProfileHash ?? "unknown";

  return {
    projectId: input.manifest.projectId,
    runId: input.artifact.runId,
    feedbackDeltaId: input.feedbackDeltaId,
    candidateId: input.candidate.id,
    candidateStatus: input.candidate.status,
    title: input.candidate.title,
    scenario: input.candidate.scenario,
    family: resolvePairedEvalFamily(input.candidate.scenario),
    expectedSignal: input.candidate.expectedSignal,
    artifactStatus: input.artifact.status,
    outcome: input.artifact.score?.outcome ?? "unknown",
    usefulnessOutcome: pairedLiveEvidenceUsefulnessOutcome(
      input.artifact,
      input.candidate
    ),
    packetChecksum: input.packetChecksum,
    packetEvidenceRef: `packet:${input.packetChecksum}`,
    artifactHash: input.artifact.artifactHash,
    artifactRef: `artifact:sha256:${input.artifact.artifactHash}`,
    manifestHash: input.artifact.manifestHash,
    manifestRef: `manifest:sha256:${input.artifact.manifestHash}`,
    checkerRevision,
    checkerEvidenceRef: checkerRef,
    environmentProfileHash,
    environmentEvidenceRef: `environment:sha256:${environmentProfileHash}`,
    sourceEvidence: [...input.candidate.sourceEvidence],
    evidenceRefs: [...input.evidenceRefs],
    metadata: {
      evaluationKind: "paired_live_codex_repair",
      candidateMetadata: input.candidate.metadata,
      artifactKind: input.artifact.kind,
      artifactStatus: input.artifact.status,
      ...(input.manifest.treatment === undefined ? {} : { treatment: input.manifest.treatment }),
      ...(input.manifest.packetContextMode === undefined
        ? {}
        : { packetContextMode: input.manifest.packetContextMode }),
      decisionApplications: [...input.decisionApplications],
      proof: input.artifact.proof
    }
  };
};

const recordPairedLiveEvalEvidence = async (
  databaseUrl: string,
  input: RecordPairedLiveEvalEvidenceInput
): Promise<RecordPairedLiveEvalEvidenceResult> => {
  const client = postgres(databaseUrl, { max: 1 });
  try {
    const repository = new DrizzleHarnessRunRepository(createKrnDatabase(client));

    return repository.recordPairedLiveEvalEvidenceOnce(input);
  } finally {
    await client.end();
  }
};

interface PersistPairedTrialArgs {
  readonly manifestPath: string;
  readonly attemptDirectory: string;
  readonly checkerRoot: string;
  readonly databaseUrl: string;
}

type EvidenceCaptureResult = Awaited<ReturnType<typeof runEvidenceCaptureCommand>>;

const parsePersistPairedTrialArgs = (
  args: readonly string[]
): PersistPairedTrialArgs => {
  const [manifestPath, attemptDirectory, checkerRoot = process.cwd(), databaseUrl =
    process.env.KRN_DATABASE_URL ?? "postgres://krn:krn@localhost:54329/krn"] = args;
  if (manifestPath === undefined || attemptDirectory === undefined) {
    throw new Error(
      "Usage: persist-paired-live-codex-repair <manifest-path> <attempt-directory> [checker-root] [database-url]"
    );
  }

  return {
    manifestPath,
    attemptDirectory,
    checkerRoot,
    databaseUrl
  };
};

const readRequiredTrackedTrialArtifact = async (
  attemptDirectory: string
): Promise<TrackedTrialArtifact> => {
  const artifact = await readTrackedTrialArtifact(resolve(attemptDirectory));
  if (artifact === undefined) {
    throw new Error("Tracked paired-trial artifact or its immutable phase journal is invalid");
  }

  return artifact;
};

const packetGeneratedAtFromReadback = (packetValue: unknown): string => {
  const packetIdentity = isRecord(packetValue) && isRecord(packetValue["packetIdentity"])
    ? packetValue["packetIdentity"]
    : undefined;
  const packetGeneratedAt = packetIdentity?.["generatedAt"];
  if (typeof packetGeneratedAt !== "string" || !Number.isFinite(Date.parse(packetGeneratedAt))) {
    throw new Error("Current DecisionPacket readback has no valid generatedAt binding");
  }

  return packetGeneratedAt;
};

const capturePreparedPairedEvidence = async (input: {
  readonly artifact: TrackedTrialArtifact;
  readonly checkerRoot: string;
  readonly commandOutcomes: readonly PreparedPairedTrialPersistence["commandRows"][number]["command"][];
  readonly commandOutputArtifacts: readonly NonNullable<
    PreparedPairedTrialPersistence["commandRows"][number]["commandOutputArtifact"]
  >[];
  readonly databaseUrl: string;
  readonly now: string;
  readonly packetChecksum: string;
  readonly packetGeneratedAt: string;
  readonly prepared: PreparedPairedTrialPersistence;
}): Promise<EvidenceCaptureResult | undefined> => {
  if (input.prepared.alreadyPersistedFeedbackDeltaId !== undefined) {
    return undefined;
  }

  return runEvidenceCaptureCommand({
    env: { KRN_DATABASE_URL: input.databaseUrl },
    cwd: resolve(input.checkerRoot),
    now: () => input.now,
    createId: (prefix) => `${prefix}:paired-live:${input.artifact.runId}`,
    persist: true,
    runId: input.artifact.runId,
    decisionPacketChecksum: input.packetChecksum,
    decisionPacketGeneratedAt: input.packetGeneratedAt,
    commandOutcomes: input.commandOutcomes,
    commandOutputArtifacts: input.commandOutputArtifacts,
    targetEvidence: input.prepared.targetEvidence,
    evalCandidateProposals: [input.prepared.candidate],
    readGitStatus: async () => ""
  });
};

const persistedFeedbackIdentityLines = (
  evidence: EvidenceCaptureResult | undefined,
  prepared: PreparedPairedTrialPersistence
): readonly string[] => evidence === undefined
  ? [`feedbackDelta: ${prepared.alreadyPersistedFeedbackDeltaId}`]
  : evidence.stdout
      .split("\n")
      .filter((line) => line.includes("evidenceBundle:") || line.includes("feedbackDelta:"));

const scoreReport = (
  artifact: TrackedTrialArtifact
): Record<string, unknown> => artifact.score === undefined
  ? {}
  : {
      score: {
        outcome: artifact.score.outcome,
        reason: artifact.score.reason,
        baseline: pairedArmScoreSummary(artifact.score.baseline),
        krn: pairedArmScoreSummary(artifact.score.krn)
      }
    };

const pairedTrialPersistenceReport = (input: {
  readonly artifact: TrackedTrialArtifact;
  readonly evidence: EvidenceCaptureResult | undefined;
  readonly evidenceIdentity: readonly string[];
  readonly pairedEvalEvidence: RecordPairedLiveEvalEvidenceResult;
  readonly prepared: PreparedPairedTrialPersistence;
}): Record<string, unknown> => ({
  kind: "krn.pairedLiveCodexRepair.persistence.v3",
  artifactStatus: input.artifact.status,
  outcome: input.artifact.score?.outcome ?? "unknown",
  candidateId: input.prepared.candidate.id,
  packetChecksum: input.artifact.packet.checksum,
  artifactHash: input.artifact.artifactHash,
  manifestHash: input.artifact.manifestHash,
  environmentProfileHash: input.artifact.execution.environmentProfileHash,
  decisionApplications: input.prepared.decisionApplications,
  persistedInDecisionPacket: true,
  persistedInPairedLiveEvalEvidence: true,
  pairedLiveEvalEvidence: {
    id: input.pairedEvalEvidence.evidence.id,
    created: input.pairedEvalEvidence.created,
    storeScope: "paired_live_eval_evidence",
    projectId: input.pairedEvalEvidence.evidence.projectId,
    runId: input.pairedEvalEvidence.evidence.runId,
    candidateId: input.pairedEvalEvidence.evidence.candidateId,
    checkerEvidenceRef: input.pairedEvalEvidence.evidence.checkerEvidenceRef,
    usefulnessOutcome: input.pairedEvalEvidence.evidence.usefulnessOutcome
  },
  idempotentReplay: input.evidence === undefined,
  evidenceIdentity: input.evidenceIdentity,
  ...scoreReport(input.artifact),
  proof: {
    proves: [
      "the immutable tracked artifact was validated before persistence",
      "recorded arm and checker command outcomes were consumed without rerunning the target",
      "the observed result was stored as a proposal-only EvalCandidate",
      "the candidate was visible after persistence through DecisionPacket readback",
      "the paired-live eval evidence row was stored for readback without relying on .local-lab artifacts or retained fixture rows"
    ],
    doesNotProve: [
      "MemoryRecord or SourceClaim promotion",
      "a KRN causal win or arbitrary-repository portability",
      "product readiness"
    ]
  }
});

const main = async (): Promise<void> => {
  const args = parsePersistPairedTrialArgs(process.argv.slice(2));

  const manifestRaw = await readFile(resolve(args.manifestPath), "utf8");
  const manifestValue: unknown = JSON.parse(manifestRaw);
  const manifest = parseTrackedTrialManifest(manifestValue);
  const manifestHash = sha256(JSON.stringify(manifest));
  const artifact = await readRequiredTrackedTrialArtifact(args.attemptDirectory);

  const now = new Date().toISOString();
  const packetReadback = await runDecisionPacketCommand({
    env: { KRN_DATABASE_URL: args.databaseUrl },
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live-preflight:${manifest.runId}`,
    runId: manifest.runId
  });
  const packetValue: unknown = JSON.parse(packetReadback.stdout);
  const packetGeneratedAt = packetGeneratedAtFromReadback(packetValue);
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
  const evidence = await capturePreparedPairedEvidence({
    artifact,
    checkerRoot: args.checkerRoot,
    commandOutcomes,
    commandOutputArtifacts,
    databaseUrl: args.databaseUrl,
    now,
    packetChecksum,
    packetGeneratedAt,
    prepared
  });
  const readback = await runDecisionPacketCommand({
    env: { KRN_DATABASE_URL: args.databaseUrl },
    now: () => now,
    createId: (prefix) => `${prefix}:paired-live-readback:${artifact.runId}`,
    runId: artifact.runId
  });
  const readbackValue: unknown = JSON.parse(readback.stdout);
  const persisted = readBackCandidate(readbackValue, prepared.candidate.id);
  if (persisted === undefined) {
    throw new Error(`Paired repair EvalCandidate ${prepared.candidate.id} was not visible in readback`);
  }
  const pairedEvalEvidence = await recordPairedLiveEvalEvidence(
    args.databaseUrl,
    pairedLiveEvalEvidenceInputForPersistence({
      manifest,
      artifact,
      candidate: prepared.candidate,
      packetChecksum,
      evidenceRefs: prepared.evidenceRefs,
      feedbackDeltaId: persisted.feedbackDeltaId,
      decisionApplications: prepared.decisionApplications
    })
  );
  const report = pairedTrialPersistenceReport({
    artifact,
    evidence,
    evidenceIdentity: persistedFeedbackIdentityLines(evidence, prepared),
    pairedEvalEvidence,
    prepared
  });

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

if (process.argv[1]?.endsWith("persist-paired-live-codex-repair.ts") === true) {
  await main();
}
