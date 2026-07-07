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
  readonly decisionPacket: DecisionPacketReadModel;
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

const buildAgentPacket = (
  runId: string,
  decisionPacket: DecisionPacketReadModel
): AgentPacketReadModel => ({
  kind: "krn.agentPacket.v1",
  access: "read_only",
  mutation: "none",
  surface: "headless_cli",
  request: {
    runId
  },
  decisionPacket,
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
        `krn evidence capture --run-id ${runId} --pattern-usefulness "pattern:<id>=helped|<reason>|<evidence-ref>|<does-not-prove>" --persist`,
      doesNotProve:
        "Feedback commands are return channels; they do not promote memory/source truth without the existing review gates."
    }
  },
  proof: {
    proves: [
      "a headless agent can request a read-only DecisionPacket contract through CLI JSON",
      "the response names evidence and feedback return channels without invoking Codex or mutating memory",
      "the agent surface wraps the DecisionPacket read model instead of making the Codex adapter the product core"
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

  const decisionPacket = await readDecisionPacketReadModel({
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
    stdout: `${JSON.stringify(buildAgentPacket(runtime.runId, decisionPacket), null, 2)}\n`
  };
};
