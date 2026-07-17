import { readFile } from "node:fs/promises";
import type {
  PairedEvalFamily,
  PairedRepairOutcome
} from "./paired-live-codex-repair.js";
import {
  readTrackedTrialArtifact,
  type TrackedTrialArtifact
} from "./tracked-paired-live-codex-repair.js";

export type PairedEvalArtifactInput = {
  readonly family: PairedEvalFamily;
  readonly artifact: TrackedTrialArtifact;
};

export type PairedEvalOutcomeCounts = {
  readonly wins: number;
  readonly ties: number;
  readonly losses: number;
  readonly qualityTrials: number;
  readonly invalidTrials: number;
  readonly totalInputs: number;
  readonly winRateAmongQuality: number | null;
};

export type PairedEvalFamilyAggregate = PairedEvalOutcomeCounts & {
  readonly family: PairedEvalFamily;
  readonly duplicateRunIds: readonly string[];
};

export type PairedEvalAggregate = {
  readonly kind: "krn.pairedEvalAggregate.v1";
  readonly families: readonly PairedEvalFamilyAggregate[];
  readonly overall: PairedEvalOutcomeCounts;
  readonly proves: readonly string[];
  readonly doesNotProve: readonly string[];
};

export type PairedEvalArtifactDirectory = {
  readonly family: PairedEvalFamily;
  readonly directory: string;
};

export type PairedEvalResultFile = {
  readonly family: PairedEvalFamily;
  readonly file: string;
};

export type PairedEvalUnreadableInput = PairedEvalArtifactDirectory & {
  readonly reason: "artifact_or_phase_journal_failed_validation";
};

export type PairedEvalReadback = PairedEvalAggregate & {
  readonly unreadableInputs: readonly PairedEvalUnreadableInput[];
};

export type PairedEvalUnreadableFile = PairedEvalResultFile & {
  readonly reason: "generic_result_failed_validation";
};

export type PairedEvalFileReadback = PairedEvalAggregate & {
  readonly unreadableFiles: readonly PairedEvalUnreadableFile[];
};

const families: readonly PairedEvalFamily[] = ["env-config", "async-job", "weak-json"];
const qualityOutcomes: readonly PairedRepairOutcome[] = ["win", "tie", "loss"];

const emptyCounts = (): PairedEvalOutcomeCounts => ({
  wins: 0,
  ties: 0,
  losses: 0,
  qualityTrials: 0,
  invalidTrials: 0,
  totalInputs: 0,
  winRateAmongQuality: null
});

const finalizeCounts = (counts: PairedEvalOutcomeCounts): PairedEvalOutcomeCounts => ({
  ...counts,
  winRateAmongQuality: counts.qualityTrials === 0
    ? null
    : counts.wins / counts.qualityTrials
});

const addOutcome = (
  counts: PairedEvalOutcomeCounts,
  outcome: PairedRepairOutcome | undefined,
  invalid: boolean
): PairedEvalOutcomeCounts => {
  if (invalid || outcome === undefined || !qualityOutcomes.includes(outcome)) {
    return { ...counts, invalidTrials: counts.invalidTrials + 1 };
  }

  return {
    ...counts,
    qualityTrials: counts.qualityTrials + 1,
    ...(outcome === "win" ? { wins: counts.wins + 1 } : {}),
    ...(outcome === "tie" ? { ties: counts.ties + 1 } : {}),
    ...(outcome === "loss" ? { losses: counts.losses + 1 } : {})
  };
};

const isQualityArtifact = (artifact: TrackedTrialArtifact): boolean =>
  artifact.status === "passed" &&
  artifact.score !== undefined &&
  qualityOutcomes.includes(artifact.score.outcome);

const aggregateFamily = (
  family: PairedEvalFamily,
  inputs: readonly { readonly input: PairedEvalArtifactInput; readonly index: number }[],
  duplicateIndices: ReadonlySet<number>
): PairedEvalFamilyAggregate => {
  const duplicateRunIds = new Set<string>();
  let counts = emptyCounts();

  for (const { input, index } of inputs) {
    counts = { ...counts, totalInputs: counts.totalInputs + 1 };
    if (duplicateIndices.has(index)) {
      duplicateRunIds.add(input.artifact.runId);
      counts = { ...counts, invalidTrials: counts.invalidTrials + 1 };
      continue;
    }
    counts = addOutcome(
      counts,
      input.artifact.score?.outcome,
      !isQualityArtifact(input.artifact)
    );
  }

  return {
    family,
    ...finalizeCounts(counts),
    duplicateRunIds: [...duplicateRunIds].sort()
  };
};

export const aggregatePairedEvalArtifacts = (
  inputs: readonly PairedEvalArtifactInput[]
): PairedEvalAggregate => {
  const seenRunIds = new Set<string>();
  const duplicateIndices = new Set<number>();
  for (const [index, input] of inputs.entries()) {
    if (seenRunIds.has(input.artifact.runId)) duplicateIndices.add(index);
    else seenRunIds.add(input.artifact.runId);
  }
  const indexedInputs = inputs.map((input, index) => ({ input, index }));
  const familyAggregates = families.map((family) => aggregateFamily(
    family,
    indexedInputs.filter(({ input }) => input.family === family),
    duplicateIndices
  ));
  const overall = finalizeCounts(familyAggregates.reduce<PairedEvalOutcomeCounts>(
    (sum, family) => ({
      wins: sum.wins + family.wins,
      ties: sum.ties + family.ties,
      losses: sum.losses + family.losses,
      qualityTrials: sum.qualityTrials + family.qualityTrials,
      invalidTrials: sum.invalidTrials + family.invalidTrials,
      totalInputs: sum.totalInputs + family.totalInputs,
      winRateAmongQuality: null
    }),
    emptyCounts()
  ));

  return {
    kind: "krn.pairedEvalAggregate.v1",
    families: familyAggregates,
    overall,
    proves: [
      "quality outcome counts are deterministic for unique validated run ids",
      "invalid, blocked, unverified, and duplicate inputs are excluded from quality outcomes"
    ],
    doesNotProve: [
      "causal KRN advantage or arbitrary-repository portability",
      "comparability of differently designed evaluation families",
      "Codex obedience outside the observed bounded trials"
    ]
  };
};

export const aggregatePairedEvalArtifactDirectories = async (
  inputs: readonly PairedEvalArtifactDirectory[]
): Promise<PairedEvalReadback> => {
  const readable: PairedEvalArtifactInput[] = [];
  const unreadableInputs: PairedEvalUnreadableInput[] = [];

  for (const input of inputs) {
    const artifact = await readTrackedTrialArtifact(input.directory);
    if (artifact === undefined) {
      unreadableInputs.push({
        ...input,
        reason: "artifact_or_phase_journal_failed_validation"
      });
    } else {
      readable.push({ family: input.family, artifact });
    }
  }

  const aggregate = aggregatePairedEvalArtifacts(readable);
  const unreadableByFamily = new Map<PairedEvalFamily, number>();
  for (const input of unreadableInputs) {
    unreadableByFamily.set(input.family, (unreadableByFamily.get(input.family) ?? 0) + 1);
  }
  const addUnreadable = (counts: PairedEvalOutcomeCounts, family: PairedEvalFamily) => ({
    ...counts,
    totalInputs: counts.totalInputs + (unreadableByFamily.get(family) ?? 0),
    invalidTrials: counts.invalidTrials + (unreadableByFamily.get(family) ?? 0)
  });
  const familyAggregates = aggregate.families.map((family) => ({
    ...family,
    ...addUnreadable(family, family.family)
  }));
  const overall = finalizeCounts(familyAggregates.reduce<PairedEvalOutcomeCounts>(
    (sum, family) => ({
      wins: sum.wins + family.wins,
      ties: sum.ties + family.ties,
      losses: sum.losses + family.losses,
      qualityTrials: sum.qualityTrials + family.qualityTrials,
      invalidTrials: sum.invalidTrials + family.invalidTrials,
      totalInputs: sum.totalInputs + family.totalInputs,
      winRateAmongQuality: null
    }),
    emptyCounts()
  ));

  return {
    ...aggregate,
    families: familyAggregates,
    overall,
    unreadableInputs
  };
};

const isGenericResult = (value: unknown): value is {
  readonly kind: "krn.genericPairedCodexEval.v1";
  readonly runId: string;
  readonly score: { readonly outcome: PairedRepairOutcome };
  readonly promptDelta: { readonly packetOnlyByConstruction: true };
} => {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  const score = result.score;
  const promptDelta = result.promptDelta;
  return result.kind === "krn.genericPairedCodexEval.v1" &&
    typeof result.runId === "string" &&
    typeof score === "object" && score !== null &&
    qualityOutcomes.includes((score as Record<string, unknown>).outcome as PairedRepairOutcome) &&
    typeof promptDelta === "object" && promptDelta !== null &&
    (promptDelta as Record<string, unknown>).packetOnlyByConstruction === true;
};

export const aggregatePairedEvalResultFiles = async (
  inputs: readonly PairedEvalResultFile[]
): Promise<PairedEvalFileReadback> => {
  const readable: PairedEvalArtifactInput[] = [];
  const unreadableFiles: PairedEvalUnreadableFile[] = [];
  for (const input of inputs) {
    try {
      const parsed: unknown = JSON.parse(await readFile(input.file, "utf8"));
      if (!isGenericResult(parsed)) throw new Error("invalid generic result");
      readable.push({
        family: input.family,
        artifact: {
          runId: parsed.runId,
          status: "passed",
          score: {
            outcome: parsed.score.outcome,
            baseline: { status: "pass", score: 0, checks: [], changedFiles: [] },
            krn: { status: "pass", score: 0, checks: [], changedFiles: [] },
            reason: "validated generic paired result"
          }
        } as unknown as TrackedTrialArtifact
      });
    } catch {
      unreadableFiles.push({
        ...input,
        reason: "generic_result_failed_validation"
      });
    }
  }
  const aggregate = aggregatePairedEvalArtifacts(readable);
  const invalidByFamily = new Map<PairedEvalFamily, number>();
  for (const input of unreadableFiles) {
    invalidByFamily.set(input.family, (invalidByFamily.get(input.family) ?? 0) + 1);
  }
  const familiesWithInvalid = aggregate.families.map((family) => ({
    ...family,
    totalInputs: family.totalInputs + (invalidByFamily.get(family.family) ?? 0),
    invalidTrials: family.invalidTrials + (invalidByFamily.get(family.family) ?? 0)
  }));
  const overall = finalizeCounts(familiesWithInvalid.reduce<PairedEvalOutcomeCounts>(
    (sum, family) => ({
      wins: sum.wins + family.wins,
      ties: sum.ties + family.ties,
      losses: sum.losses + family.losses,
      qualityTrials: sum.qualityTrials + family.qualityTrials,
      invalidTrials: sum.invalidTrials + family.invalidTrials,
      totalInputs: sum.totalInputs + family.totalInputs,
      winRateAmongQuality: null
    }),
    emptyCounts()
  ));
  return {
    ...aggregate,
    families: familiesWithInvalid,
    overall,
    unreadableFiles
  };
};
