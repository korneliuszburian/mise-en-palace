import {
  describe,
  expect,
  it
} from "vitest";

import {
  handleDecisionPacketMcpMessage,
  serveDecisionPacketMcpStdio,
  type DecisionPacketMcpRuntime
} from "../internal/mcp/decision-packet-mcp-server.js";

const now = "2026-07-07T22:00:00.000Z";

const packetJson = {
  kind: "krn.agentPacket.v1",
  access: "read_only",
  mutation: "none",
  surface: "headless_cli",
  request: {
    runId: "run-agent-1"
  },
  packetIdentity: {
    packetId: "decision-packet:run-agent-1:abc",
    checksumAlgorithm: "sha256",
    checksum: "a".repeat(64),
    evidenceRef: `packet:${"a".repeat(64)}`,
    generatedAt: now,
    sourceRunUpdatedAt: now,
    freshness: {
      status: "current_read_model_snapshot",
      doesNotProve: "Checksum binds this readback only."
    }
  },
  packet: {
    formatVersion: "krn.decisionPacket.v1",
    governingDecisionIds: ["frontend-project-standard-packet"],
    governingStatements: ["Use the governed frontend bootstrap standard."],
    sourceClaimIds: ["source-claim:frontend-project-standard-packet"],
    caveatedSourceClaimIds: [],
    sourceDecisionEdgeIds: ["source-decision-edge:frontend-project-standard-packet"],
    sourceRejectionIds: ["source-rejection:install-latest-frontend-stack"],
    memoryRefs: ["memory:decision:frontend-project-standard-packet"],
    staleDecisionIds: ["generic-frontend-starter-default"],
    rejectedPathIds: ["install-latest-frontend-stack"],
    falsifiers: ["Agent packet omits the governed frontend standard."],
    doesNotProve: ["live Codex obedience"],
    nonProofs: ["live Codex obedience"],
    noiseDecisionIds: [],
    severeStaleAuthorityIds: [],
    brief: {
      includedContextCount: 1,
      observationPrefixCount: 0,
      explicitExclusionCount: 2,
      sourceClaimUseCount: 1,
      memoryRecordUseCount: 1
    }
  },
  readModel: {
    kind: "fixture-read-model"
  },
  returnChannels: {
    evidence: {
      command: "krn evidence capture --run-id run-agent-1 --agent-packet-checksum current --verification test=passed",
      persistedCommand:
        "krn evidence capture --run-id run-agent-1 --agent-packet-checksum current --verification test=passed --persist",
      doesNotProve: "Evidence capture does not execute commands."
    },
    feedback: {
      memoryRecordApplyExample: "krn memory record apply --run-id run-agent-1 --memory-id <memory-id>",
      sourceUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --agent-packet-checksum current --source-usefulness claim:<id>=helped",
      sourceDecisionUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --agent-packet-checksum current --source-usefulness decision:<id>=helped",
      knowledgeUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --agent-packet-checksum current --knowledge-usefulness knowledge=helped",
      doesNotProve: "Feedback does not promote truth without review gates."
    }
  },
  proof: {
    proves: ["MCP wrapper returns the existing DecisionPacket contract."],
    doesNotProve: ["live Codex obedience", "memory/source promotion"]
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const runtime = (
  handler: DecisionPacketMcpRuntime["runDecisionPacket"] = async () => ({
    stdout: `${JSON.stringify(packetJson)}\n`
  })
): DecisionPacketMcpRuntime => ({
  env: {
    KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
  },
  now: () => now,
  createId: (prefix) => `${prefix}:test`,
  runDecisionPacket: handler
});

describe("DecisionPacket MCP wrapper", () => {
  it("advertises a tools-only MCP wrapper and the decision packet tool", async () => {
    const initialized = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "0.0.0"
        }
      }
    }, runtime());

    expect(initialized).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2025-06-18",
        capabilities: {
          tools: {
            listChanged: false
          }
        },
        serverInfo: {
          name: "krn-decision-packet-mcp",
          title: "KRN DecisionPacket MCP"
        },
        instructions: expect.stringContaining("does not execute Codex, mutate target repos, promote memory/source truth, or capture feedback by side effect")
      }
    });

    const listed = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list"
    }, runtime());

    expect(listed).toMatchObject({
      result: {
        tools: [
          {
            name: "krn_decision_packet",
            inputSchema: {
              required: ["runId"],
              additionalProperties: false
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false
            }
          }
        ]
      }
    });
  });

  it("wraps the existing DecisionPacket contract as structured tool output", async () => {
    const seenRunIds: string[] = [];
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-1",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1"
        }
      }
    }, runtime(async (commandRuntime) => {
      seenRunIds.push(commandRuntime.runId);

      return {
        stdout: `${JSON.stringify(packetJson)}\n`
      };
    }));

    expect(seenRunIds).toEqual(["run-agent-1"]);
    expect(reply).toMatchObject({
      jsonrpc: "2.0",
      id: "call-1",
      result: {
        isError: false,
        structuredContent: {
          kind: "krn.agentPacket.v1",
          packetIdentity: {
            checksum: "a".repeat(64),
            evidenceRef: `packet:${"a".repeat(64)}`
          },
          returnChannels: {
            evidence: {
              persistedCommand: expect.stringContaining("--agent-packet-checksum")
            },
            feedback: {
              sourceDecisionUsefulnessExample: expect.stringContaining("decision:<id>=helped")
            }
          },
          proof: {
            doesNotProve: expect.arrayContaining(["memory/source promotion"])
          }
        }
      }
    });
  });

  it("reports invalid tool input as a tool error instead of inventing a packet", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {}
      }
    }, runtime());

    expect(reply).toMatchObject({
      result: {
        isError: true,
        content: [{
          type: "text",
          text: "krn_decision_packet requires a non-empty runId argument"
        }]
      }
    });
  });

  it("serves newline-delimited JSON-RPC over stdio without non-MCP stdout", async () => {
    async function* input(): AsyncIterable<string> {
      yield "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}\n";
      yield "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"krn_decision_packet\",\"arguments\":{\"runId\":\"run-agent-1\"}}}\n";
    }

    const output: string[] = [];

    await serveDecisionPacketMcpStdio(input(), {
      write: (chunk) => output.push(chunk)
    }, runtime());

    const messages = output.map((line) => JSON.parse(line) as unknown);
    const toolCall = messages[1];

    expect(output).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      result: {
        tools: [{
          name: "krn_decision_packet"
        }]
      }
    });
    expect(isRecord(toolCall) && isRecord(toolCall["result"])
      ? toolCall["result"]["structuredContent"]
      : undefined).toMatchObject({
        kind: "krn.agentPacket.v1",
        packetIdentity: {
          checksum: "a".repeat(64)
        }
      });
  });
});
