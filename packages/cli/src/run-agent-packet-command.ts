import type {
  DecisionPacket,
  SourceUsefulnessOutcome
} from "@krn/core";
import {
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

export interface AgentPacketCommandRuntime extends BaseCommandRuntime {
  readonly runId: string;
  readonly createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
}

export interface AgentPacketCommandResult {
  readonly stdout: string;
}

interface AgentPacketReadModel {
  readonly kind: "krn.agentPacket.v1";
  readonly access: "read_only";
  readonly mutation: "none";
  readonly surface: "headless_cli";
  readonly request: {
    readonly runId: string;
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

const missingAgentPacketDatabaseUrlMessage = [
  "KRN_DATABASE_URL is required for krn agent packet",
  `Next action: export KRN_DATABASE_URL=${localDatabaseUrl} and run pnpm db:ready before readback`,
  "Does not prove: setting KRN_DATABASE_URL does not prove the requested run exists, commands executed, or Memory Core mutated"
].join("\n");

const unique = (values: readonly string[]): string[] =>
  [...new Set(values)];

const sourceDecisionEdgeIdsFor = (
  readModel: DecisionPacketReadModel
): string[] => unique(readModel.context.activationTrace?.candidates.flatMap((candidate) =>
  candidate.sourceDecisionSupportBoost?.sourceDecisionEdgeIds ?? []
) ?? []);

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
  const governingDecisionIds = governingDecisionIdsFor(readModel);
  const staleDecisionIds = staleDecisionIdsFor(readModel);

  return {
    formatVersion: decisionPacketFormatVersion,
    governingDecisionIds,
    governingStatements: governingStatementsFor(readModel),
    sourceClaimIds: unique(inclusions
      .filter((inclusion) => inclusion.subjectType === "source_claim")
      .map((inclusion) => inclusion.subjectId)),
    sourceDecisionEdgeIds: sourceDecisionEdgeIdsFor(readModel),
    sourceRejectionIds: rejectedSourceDecisionIdsFor(readModel),
    memoryRefs: unique(inclusions
      .filter((inclusion) => inclusion.subjectType === "memory_record")
      .map((inclusion) => inclusion.subjectId)),
    staleDecisionIds,
    rejectedPathIds: unique([
      ...inclusions
        .filter((inclusion) => inclusion.subjectType === "anti_memory_record")
        .map((inclusion) => inclusion.subjectId),
      ...antiMemoryBlockedPathIdsFor(readModel),
      ...rejectedSourceDecisionIdsFor(readModel)
    ]),
    falsifiers: readModel.evidenceBundles.flatMap((bundle) =>
      bundle.commands.map((command) => command.command)
    ),
    doesNotProve: readModel.proof.doesNotProve,
    nonProofs: readModel.proof.doesNotProve,
    noiseDecisionIds: noiseDecisionIdsFor(readModel),
    severeStaleAuthorityIds: severeStaleAuthorityIdsFor({
      governingDecisionIds,
      staleDecisionIds
    }),
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

const buildAgentPacket = (
  runId: string,
  readModel: DecisionPacketReadModel
): AgentPacketReadModel => ({
  kind: "krn.agentPacket.v1",
  access: "read_only",
  mutation: "none",
  surface: "headless_cli",
  request: {
    runId
  },
  packet: compactDecisionPacket(readModel),
  readModel,
  returnChannels: {
    evidence: {
      command:
        `krn evidence capture --run-id ${runId} --verification "<command>=passed"`,
      persistedCommand:
        `krn evidence capture --run-id ${runId} --verification "<command>=passed" --persist`,
      doesNotProve:
        "Evidence capture records supplied outcomes; it does not execute commands or prove Codex followed the packet."
    },
    feedback: {
      memoryRecordApplyExample:
        `krn memory record apply --run-id ${runId} --memory-id <memory-id> --outcome helped --notes "<why>" --persist`,
      sourceUsefulnessExample:
        `krn evidence capture --run-id ${runId} --source-usefulness "claim:<id>=helped|<reason>|<evidence-ref>|<does-not-prove>" --persist`,
      sourceDecisionUsefulnessExample:
        `krn evidence capture --run-id ${runId} --source-usefulness "decision:<id>=helped|<reason>|<evidence-ref>|<does-not-prove>" --persist`,
      knowledgeUsefulnessExample:
        `krn evidence capture --run-id ${runId} --knowledge-usefulness "<brain-knowledge-id>=helped|<reason>|<evidence-ref>|<does-not-prove>" --persist`,
      doesNotProve:
        "Feedback commands are return channels; they do not promote memory/source truth without the existing review gates."
    }
  },
  proof: {
    proves: [
      "a headless agent can request a read-only DecisionPacket contract through CLI JSON",
      "the response names evidence and feedback return channels without invoking Codex or mutating memory",
      "the agent surface exposes the compact DecisionPacket separately from the diagnostic read model"
    ],
    doesNotProve: [
      "MCP integration",
      "live Codex obedience",
      "that returned evidence commands were executed",
      "memory/source promotion",
      "product readiness"
    ]
  }
});

export const runAgentPacketCommand = async (
  runtime: AgentPacketCommandRuntime
): Promise<AgentPacketCommandResult> => {
  const databaseUrl = runtime.env.KRN_DATABASE_URL?.trim();

  if (databaseUrl === undefined || databaseUrl.length === 0) {
    throw new Error(missingAgentPacketDatabaseUrlMessage);
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
    stdout: `${JSON.stringify(buildAgentPacket(runtime.runId, readModel), null, 2)}\n`
  };
};
