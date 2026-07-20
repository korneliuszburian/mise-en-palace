import {
  serveDecisionPacketMcpStdio,
  type DecisionPacketMcpRuntime
} from "../../internal/mcp/decision-packet-mcp-server.js";
import {
  bindDecisionPacketFixtureIdentity,
  decisionPacketMcpFixture,
  decisionPacketMcpFixtureNow
} from "../support/decision-packet-mcp-fixture.js";

const fixtureForRun = (runId: string): unknown => {
  if (runId === "run-malformed-output") {
    return { kind: "not-a-decision-packet" };
  }

  if (runId === "run-oversize-output") {
    return bindDecisionPacketFixtureIdentity({
      ...decisionPacketMcpFixture,
      request: {
        ...decisionPacketMcpFixture.request,
        runId
      },
      packet: {
        ...decisionPacketMcpFixture.packet,
        toolBoundaries: ["boundary-" + "x".repeat(40_000)]
      }
    });
  }

  return decisionPacketMcpFixture;
};

const runtime: DecisionPacketMcpRuntime = {
  env: {},
  now: () => decisionPacketMcpFixtureNow,
  createId: (prefix) => `${prefix}:mcp-compat`,
  session: { phase: "new" },
  runDecisionPacket: async ({ runId }) => {
    if (runId === "run-execution-error") {
      throw new Error("synthetic downstream failure");
    }

    return { stdout: `${JSON.stringify(fixtureForRun(runId))}\n` };
  }
};

await serveDecisionPacketMcpStdio(process.stdin, process.stdout, runtime);
