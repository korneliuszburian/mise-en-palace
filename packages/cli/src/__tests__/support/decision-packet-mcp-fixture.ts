import {
  createHash
} from "node:crypto";
import {
  decisionPacketChecksum,
  type DecisionPacket,
  type DecisionPacketIdentity
} from "@krn/core";

export const decisionPacketMcpFixtureNow = "2026-07-07T22:00:00.000Z";

const sha256Hex = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const bindDecisionPacketFixtureIdentity = <T extends {
  request: { runId: string; taskId: string; projectId: string | null };
  packet: unknown;
  packetIdentity: {
    generatedAt: string;
    sourceRunStatus: string;
    sourceRunLifecycleRevision: number;
    sourceRunUpdatedAt: string;
  };
}>(value: T): T => {
  const checksum = decisionPacketChecksum({
    generatedAt: value.packetIdentity.generatedAt,
    packet: value.packet as DecisionPacket,
    request: value.request,
    sourceRunStatus: value.packetIdentity.sourceRunStatus as DecisionPacketIdentity["sourceRunStatus"],
    sourceRunLifecycleRevision: value.packetIdentity.sourceRunLifecycleRevision,
    sourceRunUpdatedAt: value.packetIdentity.sourceRunUpdatedAt
  }, sha256Hex);

  return {
    ...value,
    packetIdentity: {
      ...value.packetIdentity,
      packetId: `decision-packet:${value.request.runId}:${checksum.slice(0, 16)}`,
      checksumAlgorithm: "sha256",
      checksum,
      evidenceRef: `packet:${checksum}`
    }
  } as T;
};

export const decisionPacketMcpFixture = bindDecisionPacketFixtureIdentity({
  kind: "krn.decisionPacketReadback.v1",
  access: "read_only",
  mutation: "none",
  surface: "headless_cli",
  request: {
    runId: "run-agent-1",
    taskId: "task-agent-1",
    projectId: "project-1"
  },
  packetIdentity: {
    packetId: `decision-packet:run-agent-1:${"a".repeat(16)}`,
    checksumAlgorithm: "sha256",
    checksum: "a".repeat(64),
    evidenceRef: `packet:${"a".repeat(64)}`,
    generatedAt: decisionPacketMcpFixtureNow,
    sourceRunStatus: "succeeded",
    sourceRunLifecycleRevision: 2,
    sourceRunUpdatedAt: decisionPacketMcpFixtureNow,
    freshness: {
      status: "current_read_model_snapshot",
      doesNotProve: "Checksum binds this readback only."
    }
  },
  packet: {
    formatVersion: "krn.decisionPacket.v1",
    task: {
      id: "task-agent-1",
      projectId: "project-1",
      title: "Build the governed frontend",
      objective: "Use the governed frontend bootstrap standard.",
      constraints: [],
      nonGoals: [],
      acceptance: ["The governed standard is selected."],
      status: "active"
    },
    contextInclusions: [],
    contextExclusions: [],
    toolBoundaries: ["read_only"],
    nextAction: "Use the governed frontend bootstrap standard.",
    governingDecisionIds: ["frontend-project-standard-packet"],
    sourceDecisionIds: ["source-decision:frontend-project-standard-packet"],
    governingStatements: ["Use the governed frontend bootstrap standard."],
    taskStandardDecisions: [{
      memoryRecordId: "memory:decision:frontend-project-standard-packet",
      key: "decision-packet:frontend-project-standard-packet",
      sourceRefs: ["source-claim:frontend-project-standard-packet"],
      mechanism: "Task scope activates the governed frontend standard.",
      krnImplication: "DecisionPacket should expose this standard before implementation.",
      decision: "Use the governed frontend bootstrap standard.",
      consumer: "krn decision packet",
      falsifier: "DecisionPacket omits the governed frontend standard.",
      validFrom: "2026-07-07T00:00:00.000Z",
      rejectedPath: "Do not install the latest frontend stack without a project decision.",
      doesNotProve: "live Codex obedience"
    }],
    sourceClaimIds: ["source-claim:frontend-project-standard-packet"],
    caveatedSourceClaimIds: [],
    sourceDecisionEdgeIds: ["source-decision-edge:frontend-project-standard-packet"],
    sourceDecisionTargets: [{
      targetType: "architecture_decision",
      targetId: "frontend-project-standard-packet",
      sourceDecisionEdgeIds: ["source-decision-edge:frontend-project-standard-packet"]
    }],
    sourceRejectionIds: ["source-rejection:install-latest-frontend-stack"],
    memoryRefs: ["memory:decision:frontend-project-standard-packet"],
    staleDecisionIds: ["generic-frontend-starter-default"],
    supersededPathIds: [],
    rejectedPathIds: ["install-latest-frontend-stack"],
    falsifiers: ["DecisionPacket omits the governed frontend standard."],
    verificationCommands: ["pnpm --filter frontend test"],
    evidenceGaps: [],
    sourceConsensus: {
      decisionLinkedSourceClaimIds: ["source-claim:frontend-project-standard-packet"],
      caveatedSourceClaimIds: [],
      unsupportedSourceClaimIds: [],
      conflictingSourceClaimIds: [],
      unknownSourceClaimIds: [],
      sourceDecisionEdgeIds: ["source-decision-edge:frontend-project-standard-packet"],
      sourceDecisionTargets: [{
        targetType: "architecture_decision",
        targetId: "frontend-project-standard-packet",
        sourceDecisionEdgeIds: ["source-decision-edge:frontend-project-standard-packet"]
      }],
      staleDecisionIds: ["generic-frontend-starter-default"],
      supersededPathIds: [],
      rejectedPathIds: ["install-latest-frontend-stack"],
      sourceRejectionIds: ["source-rejection:install-latest-frontend-stack"],
      conflictedDecisionIds: [],
      evidenceGapIds: [],
      doesNotProve:
        "DecisionPacket source consensus summarizes selected packet signals; it does not prove source truth, complete graph consensus, or repository-wide conflict resolution."
    },
    abstentionScore: {
      status: "ready",
      score: 100,
      reasons: [],
      evidenceGapIds: [],
      doesNotProve:
        "DecisionPacket abstention score is a deterministic packet-readiness signal; it does not prove source truth, live Codex obedience, or that missing rejected paths are required for every task."
    },
    doesNotProve: ["live Codex obedience"],
    nonProofs: ["live Codex obedience"],
    caveatedMemoryRefs: [],
    staleKnowledgeIds: [],
    severeStaleAuthorityIds: [],
    brief: {
      includedContextCount: 1,
      observationPrefixCount: 0,
      explicitExclusionCount: 2,
      sourceClaimUseCount: 1,
      memoryRecordUseCount: 1,
      includedSourceClaimIds: ["source-claim-agent-1"],
      includedMemoryRecordIds: ["memory-agent-1"],
      excludedSourceClaimIds: ["source-claim-stale-agent-1"],
      excludedMemoryRecordIds: [],
      excludedAntiMemoryRecordIds: ["anti-memory-agent-1"],
      evidenceGapIds: []
    }
  },
  readModel: {
    kind: "fixture-read-model"
  },
  returnChannels: {
    evidence: {
      command: "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --verification test=passed",
      persistedCommand:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --verification test=passed --persist",
      doesNotProve: "Evidence capture does not execute commands."
    },
    feedback: {
      memoryRecordApplyExample: "krn memory record apply --run-id run-agent-1 --memory-id <memory-id> --evidence-bundle-id <evidence-bundle-id>",
      sourceUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --source-usefulness claim:<id>=helped",
      sourceDecisionUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --source-usefulness decision:<id>=selected",
      knowledgeUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --memory-usefulness knowledge=helped",
      doesNotProve: "Feedback does not promote truth without review gates."
    }
  },
  proof: {
    proves: ["a headless consumer can request a read-only DecisionPacket contract through CLI JSON"],
    doesNotProve: ["MCP integration", "live Codex obedience", "memory/source promotion"]
  }
});
