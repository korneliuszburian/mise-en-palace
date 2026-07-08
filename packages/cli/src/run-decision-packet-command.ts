import {
  createHash
} from "node:crypto";
import type {
  DecisionPacket,
  DecisionPacketTaskStandard,
  SourceUsefulnessOutcome
} from "@krn/core";
import {
  buildDecisionPacketAbstentionScore,
  buildDecisionPacketSourceConsensus,
  decisionPacketFormatVersion
} from "@krn/core";
import type {
  DecisionPacketReadModel
} from "./run-show-readback.js";
import {
  readDecisionPacketReadModel
} from "./run-run-show-command.js";
import type {
  CreateRunShowDatabaseRuntime
} from "./run-run-show-command.js";
import type {
  BaseCommandRuntime
} from "./command-runtime-support.js";

export interface DecisionPacketCommandRuntime extends BaseCommandRuntime {
  readonly runId: string;
  readonly createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface DecisionPacketCommandResult {
  readonly stdout: string;
}

interface DecisionPacketCommandReadback {
  readonly kind: "krn.decisionPacketReadback.v1";
  readonly access: "read_only";
  readonly mutation: "none";
  readonly surface: "headless_cli";
  readonly request: {
    readonly runId: string;
  };
  readonly packetIdentity: {
    readonly packetId: string;
    readonly checksumAlgorithm: "sha256";
    readonly checksum: string;
    readonly evidenceRef: string;
    readonly generatedAt: string;
    readonly sourceRunUpdatedAt: string;
    readonly freshness: {
      readonly status: "current_read_model_snapshot";
      readonly doesNotProve: string;
    };
  };
  readonly packet: DecisionPacket;
  readonly readModel: DecisionPacketReadModel;
  readonly returnChannels: {
    readonly evidence: {
      readonly command: string;
      readonly persistedCommand: string;
      readonly doesNotProve: string;
    };
    readonly feedback: {
      readonly memoryRecordApplyExample: string;
      readonly sourceUsefulnessExample: string;
      readonly sourceDecisionUsefulnessExample: string;
      readonly knowledgeUsefulnessExample: string;
      readonly doesNotProve: string;
    };
  };
  readonly proof: {
    readonly proves: readonly string[];
    readonly doesNotProve: readonly string[];
  };
}

const localDatabaseUrl = "postgres://krn:krn@localhost:54329/krn";

const missingDecisionPacketDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn decision packet",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const unique = (values: readonly string[]): string[] =>
  [...new Set(values)];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "null";
};

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const sourceDecisionEdgeIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
  candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds ?? []
) ?? []);

const sourceClaimIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.context.inclusionDetails
  .filter((inclusion) => inclusion.subjectType === "source_claim")
  .map((inclusion) => inclusion.subjectId));

const sourceClaimIdsWithDecisionSupportFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
  candidate.subjectType === "source_claim" &&
  (candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds.length ?? 0) > 0
    ? [candidate.subjectId]
    : []
) ?? []);

const sourceClaimIdsWithUsefulness = (
  readModel: DecisionPacketReadModel,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceClaimId !== undefined && outcomes.includes(outcome.outcome)
      ? [outcome.sourceClaimId]
      : []
  )
));

const caveatedSourceClaimIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => {
  const supportedSourceClaimIds = new Set(sourceClaimIdsWithDecisionSupportFor(readModel));
  const maintenanceFeedbackSourceClaimIds = new Set(
    sourceClaimIdsWithUsefulness(readModel, ["noise", "stale", "unknown"])
  );

  return sourceClaimIdsFor(readModel).filter((sourceClaimId) =>
    !supportedSourceClaimIds.has(sourceClaimId) ||
    maintenanceFeedbackSourceClaimIds.has(sourceClaimId)
  );
};

const sourceDecisionIdsWithUsefulness = (
  readModel: DecisionPacketReadModel,
  outcomes: readonly SourceUsefulnessOutcome[]
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
    outcome.sourceDecisionId !== undefined && outcomes.includes(outcome.outcome)
      ? [outcome.sourceDecisionId]
      : []
  )
));

const governingDecisionIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => sourceDecisionIdsWithUsefulness(readModel, ["selected", "used", "helped"]);

const staleDecisionIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => sourceDecisionIdsWithUsefulness(readModel, ["stale"]);

const noiseDecisionIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => sourceDecisionIdsWithUsefulness(readModel, ["noise"]);

const rejectedSourceDecisionIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.feedbackDeltas.flatMap((feedback) =>
  feedback.candidates.flatMap((candidate) =>
    candidate.kind === "source_decision_candidate" && candidate.status === "reject"
      ? [candidate.id]
      : []
  )
));

const verificationCommandsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.evidenceBundles.flatMap((bundle) =>
  bundle.commands.map((command) => command.command)
));

const taskStandardDecisionsFor = (
  readModel: DecisionPacketReadModel
): DecisionPacketTaskStandard[] => {
  const decisions = readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.projectStandardDecision === undefined
      ? []
      : [{
          memoryRecordId: candidate.projectStandardDecision.memoryRecordId,
          key: candidate.projectStandardDecision.key,
          sourceRefs: candidate.projectStandardDecision.sourceRefs,
          mechanism: candidate.projectStandardDecision.mechanism,
          krnImplication: candidate.projectStandardDecision.krnImplication,
          decision: candidate.projectStandardDecision.decision,
          consumer: candidate.projectStandardDecision.consumer,
          falsifier: candidate.projectStandardDecision.falsifier,
          validFrom: candidate.projectStandardDecision.validFrom,
          ...(candidate.projectStandardDecision.validUntil === undefined
            ? {}
            : { validUntil: candidate.projectStandardDecision.validUntil }),
          ...(candidate.projectStandardDecision.rejectedPath === undefined
            ? {}
            : { rejectedPath: candidate.projectStandardDecision.rejectedPath }),
          doesNotProve: candidate.projectStandardDecision.doesNotProve
        }]
  ) ?? [];
  const byKey = new Map<string, DecisionPacketTaskStandard>();

  for (const decision of decisions) {
    const key = `${decision.key}:${decision.validFrom}:${decision.decision}`;

    if (!byKey.has(key)) {
      byKey.set(key, decision);
    }
  }

  return [...byKey.values()];
};

const governingStatementsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique([
  ...readModel.context.activationTrace?.candidates.flatMap((candidate) =>
    candidate.projectStandardDecision === undefined ? [] : [candidate.projectStandardDecision.decision]
  ) ?? [],
  ...readModel.feedbackDeltas.flatMap((feedback) =>
    feedback.sourceUsefulnessOutcomes.flatMap((outcome) =>
      ["selected", "used", "helped"].includes(outcome.outcome) ? [outcome.reason] : []
    )
  )
]);

const antiMemoryBlockedPathIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.context.activationTrace?.decisions.flatMap((decision) =>
  decision.reason === "anti_memory_block" && decision.antiMemoryRecordId !== undefined
    ? [decision.antiMemoryRecordId]
    : []
) ?? []);

const severeStaleAuthorityIdsFor = (input: {
  readonly governingDecisionIds: readonly string[];
  readonly staleDecisionIds: readonly string[];
}): string[] => {
  const staleDecisionIds = new Set(input.staleDecisionIds);

  return input.governingDecisionIds.filter((id) => staleDecisionIds.has(id));
};

const compactDecisionPacket = (
  readModel: DecisionPacketReadModel
): DecisionPacket => {
  const inclusions = readModel.context.inclusionDetails;
  const sourceClaimIds = sourceClaimIdsFor(readModel);
  const caveatedSourceClaimIds = caveatedSourceClaimIdsFor(readModel);
  const sourceDecisionEdgeIds = sourceDecisionEdgeIdsFor(readModel);
  const governingDecisionIds = governingDecisionIdsFor(readModel);
  const staleDecisionIds = staleDecisionIdsFor(readModel);
  const sourceRejectionIds = rejectedSourceDecisionIdsFor(readModel);
  const rejectedPathIds = unique([
    ...inclusions
      .filter((inclusion) => inclusion.subjectType === "anti_memory_record")
      .map((inclusion) => inclusion.subjectId),
    ...antiMemoryBlockedPathIdsFor(readModel),
    ...sourceRejectionIds
  ]);
  const evidenceGaps = governingDecisionIds.length === 0
    ? [{
        id: `evidence-gap:${readModel.run.id}:no-governing-decision`,
        reason: "No governed decision is present in this read-only packet.",
        verificationRequired:
          "Capture or promote source-backed decision evidence before treating this packet as task guidance."
      }]
    : [];
  const severeStaleAuthorityIds = severeStaleAuthorityIdsFor({
    governingDecisionIds,
    staleDecisionIds
  });
  const sourceConsensus = buildDecisionPacketSourceConsensus({
    sourceClaimIds,
    caveatedSourceClaimIds,
    sourceDecisionEdgeIds,
    staleDecisionIds,
    rejectedPathIds,
    sourceRejectionIds,
    conflictedDecisionIds: severeStaleAuthorityIds,
    evidenceGapIds: evidenceGaps.map((gap) => gap.id)
  });

  return {
    formatVersion: decisionPacketFormatVersion,
    governingDecisionIds,
    governingStatements: governingStatementsFor(readModel),
    taskStandardDecisions: taskStandardDecisionsFor(readModel),
    sourceClaimIds,
    caveatedSourceClaimIds,
    sourceDecisionEdgeIds,
    sourceRejectionIds,
    memoryRefs: unique(inclusions
      .filter((inclusion) => inclusion.subjectType === "memory_record")
      .map((inclusion) => inclusion.subjectId)),
    staleDecisionIds,
    rejectedPathIds,
    falsifiers: readModel.evidenceBundles.flatMap((bundle) =>
      bundle.commands.map((command) => command.command)
    ),
    verificationCommands: verificationCommandsFor(readModel),
    evidenceGaps,
    sourceConsensus,
    abstentionScore: buildDecisionPacketAbstentionScore({
      governingDecisionIds,
      sourceConsensus
    }),
    doesNotProve: readModel.proof.doesNotProve,
    nonProofs: readModel.proof.doesNotProve,
    noiseDecisionIds: noiseDecisionIdsFor(readModel),
    severeStaleAuthorityIds,
    brief: {
      includedContextCount: readModel.context.inclusions,
      observationPrefixCount: 0,
      explicitExclusionCount: readModel.context.exclusions,
      sourceClaimUseCount: inclusions.filter((inclusion) =>
        inclusion.subjectType === "source_claim"
      ).length,
      memoryRecordUseCount: inclusions.filter((inclusion) =>
        inclusion.subjectType === "memory_record"
      ).length
    }
  };
};

const packetIdentityFor = (
  runId: string,
  readModel: DecisionPacketReadModel,
  packet: DecisionPacket,
  generatedAt: string
): DecisionPacketCommandReadback["packetIdentity"] => {
  const checksum = sha256Hex(canonicalJson({
    packet,
    request: {
      runId
    },
    sourceRunUpdatedAt: readModel.run.updatedAt
  }));

  return {
    packetId: `decision-packet:${runId}:${checksum.slice(0, 16)}`,
    checksumAlgorithm: "sha256",
    checksum,
    evidenceRef: `packet:${checksum}`,
    generatedAt,
    sourceRunUpdatedAt: readModel.run.updatedAt,
    freshness: {
      status: "current_read_model_snapshot",
      doesNotProve:
        "Packet checksum binds feedback to this CLI readback snapshot; it does not prove the DB state stayed unchanged after the packet was rendered."
    }
  };
};

const buildDecisionPacket = (
  runId: string,
  readModel: DecisionPacketReadModel,
  generatedAt: string
): DecisionPacketCommandReadback => {
  const packet = compactDecisionPacket(readModel);
  const packetIdentity = packetIdentityFor(runId, readModel, packet, generatedAt);
  const packetChecksumOption = `--decision-packet-checksum ${packetIdentity.checksum}`;

  return {
    kind: "krn.decisionPacketReadback.v1",
    access: "read_only",
    mutation: "none",
    surface: "headless_cli",
    request: {
      runId
    },
    packetIdentity,
    packet,
    readModel,
    returnChannels: {
      evidence: {
        command:
          `krn evidence capture --run-id ${runId} ${packetChecksumOption} --verification "<command>=passed"`,
        persistedCommand:
          `krn evidence capture --run-id ${runId} ${packetChecksumOption} --verification "<command>=passed" --persist`,
        doesNotProve:
          "Evidence capture records supplied outcomes; it does not execute commands, prove Codex followed the packet, or prove the packet remained current after render time."
      },
      feedback: {
        memoryRecordApplyExample:
          `krn memory record apply --run-id ${runId} --memory-id <memory-id> --outcome helped --notes "packet=${packetIdentity.evidenceRef}; <why>" --persist`,
        sourceUsefulnessExample:
          `krn evidence capture --run-id ${runId} ${packetChecksumOption} --source-usefulness "claim:<id>=helped|<reason>|${packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
        sourceDecisionUsefulnessExample:
          `krn evidence capture --run-id ${runId} ${packetChecksumOption} --source-usefulness "decision:<id>=helped|<reason>|${packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
        knowledgeUsefulnessExample:
          `krn evidence capture --run-id ${runId} ${packetChecksumOption} --knowledge-usefulness "<brain-knowledge-id>=helped|<reason>|${packetIdentity.evidenceRef},<evidence-ref>|<does-not-prove>" --persist`,
        doesNotProve:
          "Feedback commands are return channels; they do not promote memory/source truth without the existing review gates. Packet checksum evidence only binds feedback to the rendered packet snapshot."
      }
    },
    proof: {
      proves: [
        "a headless consumer can request a read-only DecisionPacket contract through CLI JSON",
        "the response names evidence and feedback return channels without invoking Codex or mutating memory",
        "the DecisionPacket command exposes the compact DecisionPacket separately from the diagnostic read model",
        "return-channel commands carry a packet checksum evidence ref for later freshness checks"
      ],
      doesNotProve: [
        "MCP integration",
        "live Codex obedience",
        "that returned evidence commands were executed",
        "memory/source promotion",
        "product readiness",
        "that the persisted run state stayed unchanged after this packet was rendered"
      ]
    }
  };
};

export const runDecisionPacketCommand = async (
  runtime: DecisionPacketCommandRuntime
): Promise<DecisionPacketCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingDecisionPacketDatabaseUrlMessage);
  }

  const readModel = await readDecisionPacketReadModel({
    env: runtime.env,
    now: runtime.now,
    createId: runtime.createId,
    runId: runtime.runId,
    format: "json",
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime })
  });

  return {
    stdout: `${JSON.stringify(buildDecisionPacket(runtime.runId, readModel, runtime.now()), null, 2)}\n`
  };
};
