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
const weakContextEvidenceGapId = "evidence-gap:run-agent-weak:no-governing-decision";

const packetJson = {
  kind: "krn.decisionPacketReadback.v1",
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
    noiseDecisionIds: [],
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
      memoryRecordApplyExample: "krn memory record apply --run-id run-agent-1 --memory-id <memory-id>",
      sourceUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --source-usefulness claim:<id>=helped",
      sourceDecisionUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --source-usefulness decision:<id>=helped",
      knowledgeUsefulnessExample:
        "krn evidence capture --run-id run-agent-1 --decision-packet-checksum current --memory-usefulness knowledge=helped",
      doesNotProve: "Feedback does not promote truth without review gates."
    }
  },
  proof: {
    proves: ["a headless consumer can request a read-only DecisionPacket contract through CLI JSON"],
    doesNotProve: ["MCP integration", "live Codex obedience", "memory/source promotion"]
  }
};

const weakPacketJson = {
  ...packetJson,
  request: {
    runId: "run-agent-weak"
  },
  packetIdentity: {
    ...packetJson.packetIdentity,
    packetId: "decision-packet:run-agent-weak:def",
    checksum: "b".repeat(64),
    evidenceRef: `packet:${"b".repeat(64)}`
  },
  packet: {
    ...packetJson.packet,
    governingDecisionIds: [],
    governingStatements: [],
    taskStandardDecisions: [],
    sourceClaimIds: [],
    sourceDecisionEdgeIds: [],
    sourceDecisionTargets: [],
    memoryRefs: [],
    falsifiers: [],
    verificationCommands: [],
    evidenceGaps: [{
      id: weakContextEvidenceGapId,
      reason: "No governed decision is present in this read-only packet.",
      verificationRequired:
        "Capture or promote source-backed decision evidence before treating this packet as task guidance."
    }],
    sourceConsensus: {
      ...packetJson.packet.sourceConsensus,
      decisionLinkedSourceClaimIds: [],
      sourceDecisionEdgeIds: [],
      sourceDecisionTargets: [],
      evidenceGapIds: [weakContextEvidenceGapId]
    },
    abstentionScore: {
      ...packetJson.packet.abstentionScore,
      status: "abstain",
      score: 0,
      reasons: [
        "missing_governing_decision",
        "evidence_gap"
      ],
      evidenceGapIds: [weakContextEvidenceGapId]
    },
    brief: {
      ...packetJson.packet.brief,
      evidenceGapIds: [weakContextEvidenceGapId]
    }
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
          kind: "krn.decisionPacketReadback.v1",
          packetIdentity: {
            checksum: "a".repeat(64),
            evidenceRef: `packet:${"a".repeat(64)}`
          },
          returnChannels: {
            evidence: {
              persistedCommand: expect.stringContaining("--decision-packet-checksum")
            },
            feedback: {
              sourceDecisionUsefulnessExample: expect.stringContaining("decision:<id>=helped")
            }
          },
          proof: {
            proves: expect.arrayContaining([
              "DecisionPacket was served through the read-only krn_decision_packet MCP tool"
            ]),
            doesNotProve: expect.arrayContaining(["memory/source promotion", "broad MCP product readiness"])
          },
          packet: {
            abstentionScore: {
              status: "ready",
              reasons: []
            }
          }
        }
      }
    });
  });

  it("preserves abstention and evidence gaps in structured tool output", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-weak",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-weak"
        }
      }
    }, runtime(async () => ({
      stdout: `${JSON.stringify(weakPacketJson)}\n`
    })));
    const result = isRecord(reply) ? reply["result"] : undefined;
    const structuredContent = isRecord(result) ? result["structuredContent"] : undefined;

    expect(structuredContent).toMatchObject({
      kind: "krn.decisionPacketReadback.v1",
      packetIdentity: {
        checksum: "b".repeat(64),
        evidenceRef: `packet:${"b".repeat(64)}`
      },
      proof: {
        proves: expect.arrayContaining([
          "DecisionPacket was served through the read-only krn_decision_packet MCP tool"
        ]),
        doesNotProve: expect.arrayContaining(["broad MCP product readiness"])
      },
      packet: {
        governingDecisionIds: [],
        evidenceGaps: [{
          id: weakContextEvidenceGapId,
          reason: "No governed decision is present in this read-only packet.",
          verificationRequired:
            "Capture or promote source-backed decision evidence before treating this packet as task guidance."
        }],
        sourceConsensus: {
          evidenceGapIds: [weakContextEvidenceGapId]
        },
        abstentionScore: {
          status: "abstain",
          score: 0,
          reasons: [
            "missing_governing_decision",
            "evidence_gap"
          ],
          evidenceGapIds: [weakContextEvidenceGapId]
        },
        brief: {
          evidenceGapIds: [weakContextEvidenceGapId]
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
        kind: "krn.decisionPacketReadback.v1",
        packetIdentity: {
          checksum: "a".repeat(64)
        }
      });
  });

  it("replaces the CLI-only MCP non-proof with the transport proof", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-2",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1"
        }
      }
    }, runtime());
    const result = isRecord(reply) ? reply["result"] : undefined;
    const structuredContent = isRecord(result) ? result["structuredContent"] : undefined;
    const proof = isRecord(structuredContent) ? structuredContent["proof"] : undefined;
    const proves = isRecord(proof) && Array.isArray(proof["proves"]) ? proof["proves"] : [];
    const doesNotProve = isRecord(proof) && Array.isArray(proof["doesNotProve"]) ? proof["doesNotProve"] : [];

    expect(proves).toContain("DecisionPacket was served through the read-only krn_decision_packet MCP tool");
    expect(doesNotProve).not.toContain("MCP integration");
    expect(doesNotProve).toContain("broad MCP product readiness");
  });
});
