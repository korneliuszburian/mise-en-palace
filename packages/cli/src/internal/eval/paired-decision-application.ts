import { createHash } from "node:crypto";

import type {
  SourceUsefulnessOutcomeFeedback,
  TargetEvidenceInput
} from "@krn/core";

import {
  runEvidenceCaptureCommand
} from "../../run-evidence-capture-command.js";
import {
  pairedCommandEvidence
} from "./paired-command-evidence.js";
import {
  runHeldOutTargetRepairChecker
} from "./paired-live-codex-repair.js";
import type {
  HeldOutArmScore,
  HeldOutCheckerInput,
  PairedRepairScore
} from "./paired-live-codex-repair.js";
import type {
  PairedDecisionApplicationRule
} from "./tracked-paired-live-codex-repair.js";

export interface ObservedPairedDecisionApplication {
  readonly governingDecisionId: string;
  readonly sourceDecisionId: string;
  readonly check: PairedDecisionApplicationRule["check"];
  readonly changedFiles: readonly string[];
  readonly differential: boolean;
}

export interface PairedDecisionApplicationRecorderInput {
  readonly runId: string;
  readonly packet: unknown;
  readonly score: PairedRepairScore;
  readonly rules: readonly PairedDecisionApplicationRule[];
  readonly krnTarget: HeldOutCheckerInput;
  readonly databaseUrl: string;
}

export interface PairedDecisionApplicationRecord {
  readonly sourceDecisionId: string;
  readonly applicationId: string;
  readonly appliedAt: string;
  readonly outcome: SourceUsefulnessOutcomeFeedback["outcome"];
}

type EvidenceCapture = typeof runEvidenceCaptureCommand;
type TargetVerifier = typeof runHeldOutTargetRepairChecker;

interface RecorderDependencies {
  readonly captureEvidence?: EvidenceCapture;
  readonly verifyTarget?: TargetVerifier;
  readonly now?: () => string;
}

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const passedCheck = (
  score: HeldOutArmScore,
  name: PairedDecisionApplicationRule["check"]
): boolean => score.checks.some((check) => check.name === name && check.passed);

const ownedChangedFiles = (score: HeldOutArmScore): ReadonlySet<string> => {
  const manifest = score.changeManifest;
  return manifest?.status === "known" && manifest.forbiddenFiles.length === 0
    ? new Set(manifest.changedFiles)
    : new Set();
};

export const observedPairedDecisionApplications = (input: {
  readonly score: PairedRepairScore;
  readonly rules: readonly PairedDecisionApplicationRule[];
}): ObservedPairedDecisionApplication[] => {
  const krnChangedFiles = ownedChangedFiles(input.score.krn);

  return input.rules.flatMap((rule) =>
    passedCheck(input.score.krn, rule.check) &&
    rule.changedFiles.every((path) => krnChangedFiles.has(path))
      ? [{
          governingDecisionId: rule.governingDecisionId,
          sourceDecisionId: rule.sourceDecisionId,
          check: rule.check,
          changedFiles: [...rule.changedFiles],
          differential: input.score.outcome === "win" &&
            !passedCheck(input.score.baseline, rule.check)
        }]
      : []
  );
};

const recordField = (value: unknown, field: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Paired decision applications require ${field}`);
  }
  return value as Record<string, unknown>;
};

const packetIdentity = (packet: unknown): {
  readonly checksum: string;
  readonly generatedAt: string;
} => {
  const packetRecord = recordField(packet, "a DecisionPacket readback");
  const identity = recordField(packetRecord["packetIdentity"], "packet identity");
  const checksum = identity["checksum"];
  const generatedAt = identity["generatedAt"];
  if (typeof checksum !== "string" || !/^[a-f0-9]{64}$/u.test(checksum)) {
    throw new Error("Paired decision applications require an exact packet checksum");
  }
  if (typeof generatedAt !== "string" || !Number.isFinite(Date.parse(generatedAt))) {
    throw new Error("Paired decision applications require exact packet checksum and generatedAt");
  }
  return { checksum, generatedAt };
};

export const pairedDecisionApplicationId = (
  runId: string,
  sourceDecisionId: string
): string =>
  `paired-source-decision:${runId}:${sha256(sourceDecisionId).slice(0, 24)}`;

const targetEvidence = (
  targetRoot: string,
  score: HeldOutArmScore
): TargetEvidenceInput => {
  const changedFiles = score.changeManifest?.status === "known"
    ? score.changeManifest.changedFiles
    : score.changedFiles;
  const untrackedFiles = new Set(score.changeManifest?.status === "known"
    ? score.changeManifest.untrackedFiles
    : []);
  return {
    targetRepo: targetRoot,
    mode: "headless_repair",
    dirtyBefore: "clean",
    dirtyAfter: changedFiles.length === 0 ? "clean" : "dirty",
    ownedChanges: score.changeManifest?.status === "known" &&
      score.changeManifest.forbiddenFiles.length === 0
      ? "owned_by_current_krn_run"
      : "unknown",
    targetStatusFreshness: "fresh_current_task",
    targetPatchLifecycle: "none",
    allowedWrites: ["src/**", "tests/**", "docs/**"],
    forbiddenWrites: ["parent repository", "other repositories", "network", "secrets", "commits", "pushes"],
    changedFiles: changedFiles.map((path) => ({
      status: untrackedFiles.has(path) ? "??" : "modified",
      path,
      ownership: "owned_by_current_krn_run"
    })),
    doesNotProve: [
      "A mapped target change proves application only for the named DecisionPacket subject.",
      "Application does not prove that the decision helped or caused the paired outcome."
    ]
  };
};

const applicationReadback = (
  result: Awaited<ReturnType<EvidenceCapture>>
): Map<string, string> => {
  return new Map(
    (result.persistence?.usefulnessApplications ?? []).map((application) => [
      application.applicationId,
      application.appliedAt
    ])
  );
};

const checkerEvidence = (score: HeldOutArmScore) => [
  ...(score.commands === undefined ? [] : [
    pairedCommandEvidence("krn", "post-application-test", score.commands.test),
    pairedCommandEvidence("krn", "post-application-typecheck", score.commands.typecheck),
    pairedCommandEvidence("krn", "post-application-diff-check", score.commands.diffCheck)
  ]),
  ...(score.runtimeCommand === undefined
    ? []
    : [pairedCommandEvidence("krn", "post-application-held-out-runtime", score.runtimeCommand)]),
  ...(score.focusedTestControl === undefined
    ? []
    : [pairedCommandEvidence(
        "krn",
        "post-application-focused-test-control",
        score.focusedTestControl
      )]),
  ...(score.focusedTestMutations ?? []).map((mutation) =>
    pairedCommandEvidence(
      "krn",
      `post-application-focused-test-mutation-${mutation.name}`,
      mutation.command
    )
  )
];

const applicationEvidenceRefs = (
  checksum: string,
  changedFiles: readonly string[],
  additional: readonly string[] = []
): string[] => [`packet:${checksum}`, ...changedFiles, ...additional];

export const recordPairedDecisionApplications = async (
  input: PairedDecisionApplicationRecorderInput,
  dependencies: RecorderDependencies = {}
): Promise<PairedDecisionApplicationRecord[]> => {
  const observed = observedPairedDecisionApplications(input);
  if (observed.length === 0) {
    return [];
  }
  const identity = packetIdentity(input.packet);
  const captureEvidence = dependencies.captureEvidence ?? runEvidenceCaptureCommand;
  const verifyTarget = dependencies.verifyTarget ?? runHeldOutTargetRepairChecker;
  const now = dependencies.now ?? (() => new Date().toISOString());
  const evidenceTarget = targetEvidence(input.krnTarget.targetRoot, input.score.krn);
  const captureRuntime = {
    env: { KRN_DATABASE_URL: input.databaseUrl },
    cwd: input.krnTarget.targetRoot,
    persist: true,
    runId: input.runId,
    decisionPacketChecksum: identity.checksum,
    decisionPacketGeneratedAt: identity.generatedAt,
    intendedFiles: [...new Set(observed.flatMap((application) => application.changedFiles))],
    targetEvidence: evidenceTarget,
    now
  } as const;
  const initialOutcomes: SourceUsefulnessOutcomeFeedback[] = observed.map((application) => ({
    sourceDecisionId: application.sourceDecisionId,
    applicationId: pairedDecisionApplicationId(input.runId, application.sourceDecisionId),
    outcome: "selected",
    reason: `Mapped check ${application.check} and its owned target files were observed before application admission.`,
    evidenceRefs: applicationEvidenceRefs(identity.checksum, application.changedFiles),
    doesNotProve: "Observed application does not prove benefit or causal attribution."
  }));
  const firstCapture = await captureEvidence({
    ...captureRuntime,
    sourceUsefulnessOutcomes: initialOutcomes,
    createId: (prefix) => `${prefix}:paired-applications:${input.runId}`
  });
  const persistedApplications = applicationReadback(firstCapture);
  const applied = observed.map((application) => {
    const id = pairedDecisionApplicationId(input.runId, application.sourceDecisionId);
    const appliedAt = persistedApplications.get(id);
    if (appliedAt === undefined) {
      throw new Error(`Paired decision application ${id} was not persisted`);
    }
    return { ...application, applicationId: id, appliedAt };
  });

  const verification = await verifyTarget(input.krnTarget);
  const evidence = checkerEvidence(verification);
  const evidenceRefs = evidence.flatMap((item) => [
    item.command.command,
    ...(item.commandOutputArtifact === undefined ? [] : [item.commandOutputArtifact.outputRef])
  ]);
  const outcomes: SourceUsefulnessOutcomeFeedback[] = applied.map((application) => {
    const helped = application.differential && passedCheck(verification, application.check);
    return {
      sourceDecisionId: application.sourceDecisionId,
      applicationId: application.applicationId,
      appliedAt: application.appliedAt,
      outcome: helped ? "helped" : "used",
      reason: helped
        ? `The mapped ${application.check} check remained green after application while the baseline failed it.`
        : `The mapped ${application.check} application was observed; the paired result does not prove decision-specific benefit.`,
      evidenceRefs: applicationEvidenceRefs(
        identity.checksum,
        application.changedFiles,
        evidenceRefs
      ),
      doesNotProve: helped
        ? "One differential check does not prove arbitrary-task causality or portability."
        : "Application evidence does not prove that the decision improved the paired result."
    };
  });
  const secondCapture = await captureEvidence({
    ...captureRuntime,
    commandOutcomes: evidence.map((item) => item.command),
    commandOutputArtifacts: evidence.flatMap((item) =>
      item.commandOutputArtifact === undefined ? [] : [item.commandOutputArtifact]
    ),
    sourceUsefulnessOutcomes: outcomes,
    createId: (prefix) => `${prefix}:paired-outcomes:${input.runId}`
  });
  const admitted = new Map(
    (secondCapture.persistence?.sourceUsefulnessOutcomes ?? []).flatMap((outcome) =>
      outcome.sourceDecisionId === undefined ? [] : [[outcome.sourceDecisionId, outcome.outcome]]
    )
  );

  return applied.map((application) => {
    const outcome = admitted.get(application.sourceDecisionId);
    if (outcome === undefined) {
      throw new Error(
        `Paired decision application ${application.applicationId} has no persisted outcome readback`
      );
    }
    return {
      sourceDecisionId: application.sourceDecisionId,
      applicationId: application.applicationId,
      appliedAt: application.appliedAt,
      outcome
    };
  });
};
