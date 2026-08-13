import {
  spawnSync
} from "node:child_process";
import {
  createRequire
} from "node:module";
import {
  fileURLToPath
} from "node:url";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  z
} from "zod";

import {
  handleDecisionPacketMcpMessage,
  serveDecisionPacketMcpStdio,
  type DecisionPacketMcpRuntime
} from "../internal/mcp/decision-packet-mcp-server.js";
import {
  decisionPacketTransportBudget,
  measureDecisionPacketTransport
} from "../internal/mcp/decision-packet-transport-measurement.js";
import {
  bindDecisionPacketFixtureIdentity as bindFixtureIdentity,
  decisionPacketMcpFixture as packetJson,
  decisionPacketMcpFixtureNow as now
} from "./support/decision-packet-mcp-fixture.js";

const weakContextEvidenceGapId = "evidence-gap:run-agent-weak:no-governing-decision";
const moduleRequire = createRequire(import.meta.url);
const weakPacketJson = bindFixtureIdentity({
  ...packetJson,
  request: {
    ...packetJson.request,
    runId: "run-agent-weak"
  },
  packetIdentity: {
    ...packetJson.packetIdentity,
    packetId: `decision-packet:run-agent-weak:${"b".repeat(16)}`,
    checksum: "b".repeat(64),
    evidenceRef: `packet:${"b".repeat(64)}`
  },
  packet: {
    ...packetJson.packet,
    governingDecisionIds: [],
    sourceDecisionIds: [],
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
});

const unresolvedSourceDissentEvidenceGapId =
  "evidence-gap:run-agent-source-dissent:unresolved-accepted-source-dissent:claim-candidate";

const unresolvedSourceDissentPacketJson = bindFixtureIdentity({
  ...weakPacketJson,
  request: {
    ...packetJson.request,
    runId: "run-agent-source-dissent"
  },
  packetIdentity: {
    ...packetJson.packetIdentity,
    packetId: `decision-packet:run-agent-source-dissent:${"d".repeat(16)}`,
    checksum: "d".repeat(64),
    evidenceRef: `packet:${"d".repeat(64)}`
  },
  packet: {
    ...weakPacketJson.packet,
    sourceClaimIds: ["claim-candidate", "claim-dissenting"],
    evidenceGaps: [{
      id: unresolvedSourceDissentEvidenceGapId,
      reason:
        "SourceClaim claim-candidate is selected with accepted dissent that has no reviewed canonical resolution.",
      verificationRequired:
        "Record a reviewed canonical resolution before treating either path as governing authority."
    }],
    sourceConsensus: {
      ...weakPacketJson.packet.sourceConsensus,
      conflictingSourceClaimIds: ["claim-candidate"],
      evidenceGapIds: [unresolvedSourceDissentEvidenceGapId]
    },
    abstentionScore: {
      ...weakPacketJson.packet.abstentionScore,
      reasons: [
        "missing_governing_decision",
        "evidence_gap",
        "conflicting_authority",
        "unresolved_accepted_source_dissent"
      ],
      evidenceGapIds: [unresolvedSourceDissentEvidenceGapId]
    },
    brief: {
      ...weakPacketJson.packet.brief,
      includedSourceClaimIds: ["claim-candidate", "claim-dissenting"],
      evidenceGapIds: [unresolvedSourceDissentEvidenceGapId]
    }
  }
});

const noFormalNegativePacketJson = bindFixtureIdentity({
  ...packetJson,
  request: {
    ...packetJson.request,
    runId: "run-agent-unsafe"
  },
  packetIdentity: {
    ...packetJson.packetIdentity,
    packetId: `decision-packet:run-agent-unsafe:${"c".repeat(16)}`,
    checksum: "c".repeat(64),
    evidenceRef: `packet:${"c".repeat(64)}`
  },
  packet: {
    ...packetJson.packet,
    contextExclusions: [{
      subjectType: "source_claim",
      subjectId: "source-claim:unsafe",
      reason: "unsafe",
      explanation: "Unsafe source remains explicit but is not formal rejection evidence.",
      sourceAuthority: "project-decision"
    }],
    sourceRejectionIds: [],
    supersededPathIds: [],
    rejectedPathIds: [],
    sourceConsensus: {
      ...packetJson.packet.sourceConsensus,
      sourceRejectionIds: [],
      supersededPathIds: [],
      rejectedPathIds: []
    },
    abstentionScore: {
      ...packetJson.packet.abstentionScore,
      status: "weak_context",
      score: 90,
      reasons: ["missing_rejected_path_evidence"],
      evidenceGapIds: []
    }
  }
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredRecord = (value: unknown, name: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${name} must be an object`);
  }

  return value;
};

const requiredArray = (value: unknown, name: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }

  return value;
};

const requiredString = (value: unknown, name: string): string => {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }

  return value;
};

const runtime = (
  handler: DecisionPacketMcpRuntime["runDecisionPacket"] = async () => ({
    stdout: `${JSON.stringify(packetJson)}\n`
  }),
  initialized = true
): DecisionPacketMcpRuntime => ({
  env: {
    KRN_DATABASE_URL: "postgres://krn:krn@localhost:54329/krn"
  },
  now: () => now,
  createId: (prefix) => `${prefix}:test`,
  session: { phase: initialized ? "ready" : "new" },
  runDecisionPacket: handler
});

const validInitializeParams = {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: {
    name: "test-client",
    version: "0.0.0"
  }
} as const;

describe("DecisionPacket MCP wrapper", () => {
  // Pinned protocol rationale:
  // https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle
  // https://modelcontextprotocol.io/specification/2025-06-18/schema
  // https://www.jsonrpc.org/specification
  it.each([
    {
      id: "missing-capabilities",
      params: {
        protocolVersion: validInitializeParams.protocolVersion,
        clientInfo: validInitializeParams.clientInfo
      }
    },
    {
      id: "missing-client-info",
      params: {
        protocolVersion: validInitializeParams.protocolVersion,
        capabilities: validInitializeParams.capabilities
      }
    },
    {
      id: "numeric-protocol-version",
      params: {
        ...validInitializeParams,
        protocolVersion: 20250618
      }
    },
    {
      id: "array-capabilities",
      params: {
        ...validInitializeParams,
        capabilities: []
      }
    },
    {
      id: "incomplete-client-info",
      params: {
        ...validInitializeParams,
        clientInfo: { name: "test-client" }
      }
    }
  ])("falsifies initialize schema divergence: $id", async (testCase) => {
    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: testCase.id,
      method: "initialize",
      params: testCase.params
    }, runtime(undefined, false))).resolves.toMatchObject({
      id: testCase.id,
      error: {
        code: -32602,
        message: "Invalid initialize params"
      }
    });
  });

  it("falsifies initialize version negotiation divergence", async () => {
    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "negotiate-version",
      method: "initialize",
      params: {
        ...validInitializeParams,
        protocolVersion: "2025-03-26"
      }
    }, runtime(undefined, false))).resolves.toMatchObject({
      id: "negotiate-version",
      result: { protocolVersion: "2025-06-18" }
    });
  });

  it("falsifies initialize notification ordering", async () => {
    const sessionRuntime = runtime(undefined, false);

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "initialize-once",
      method: "initialize",
      params: validInitializeParams
    }, sessionRuntime)).resolves.toMatchObject({
      id: "initialize-once",
      result: { protocolVersion: "2025-06-18" }
    });

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "before-initialized-notification",
      method: "tools/list"
    }, sessionRuntime)).resolves.toMatchObject({
      id: "before-initialized-notification",
      error: {
        code: -32002,
        message: "Server not initialized"
      }
    });

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-before-initialized-notification",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: { runId: "run-agent-1" }
      }
    }, sessionRuntime)).resolves.toMatchObject({
      id: "call-before-initialized-notification",
      error: {
        code: -32002,
        message: "Server not initialized"
      }
    });

  });

  it("falsifies duplicate initialize", async () => {
    const sessionRuntime = runtime(undefined, false);

    await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "initialize-once",
      method: "initialize",
      params: validInitializeParams
    }, sessionRuntime);

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "initialize-twice",
      method: "initialize",
      params: validInitializeParams
    }, sessionRuntime)).resolves.toMatchObject({
      id: "initialize-twice",
      error: {
        code: -32600,
        message: "Initialize request is not allowed after initialization has started"
      }
    });
  });

  it("round-trips a fractional JSON-RPC request id", async () => {
    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: 1.5,
      method: "ping"
    }, runtime())).resolves.toEqual({
      jsonrpc: "2.0",
      id: 1.5,
      result: {}
    });

  });

  it.each([
    { name: "array params", params: [] },
    { name: "non-string cursor", params: { cursor: 7 } },
    { name: "array metadata", params: { _meta: [] } },
    { name: "unknown property", params: { extra: true } }
  ])("rejects malformed tools list params: $name", async ({ params }) => {
    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "malformed-tools-list",
      method: "tools/list",
      params
    }, runtime())).resolves.toMatchObject({
      id: "malformed-tools-list",
      error: {
        code: -32602,
        message: "Invalid tools/list params"
      }
    });
  });

  it("makes the one-page tools list cursor contract explicit", async () => {
    for (const params of [undefined, {}, { _meta: { progressToken: "progress-1" } }]) {
      await expect(handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id: "initial-tools-list",
        method: "tools/list",
        ...(params === undefined ? {} : { params })
      }, runtime())).resolves.toMatchObject({
        id: "initial-tools-list",
        result: { tools: [{ name: "krn_decision_packet" }, { name: "remember" }, { name: "recall" }, { name: "brief" }, { name: "feedback" }] }
      });
    }

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "unsupported-cursor",
      method: "tools/list",
      params: { cursor: "no-next-page-exists" }
    }, runtime())).resolves.toMatchObject({
      id: "unsupported-cursor",
      error: {
        code: -32602,
        message: "Invalid tools/list cursor"
      }
    });
  });

  it("requires the pinned initialize lifecycle before tools are available", async () => {
    const sessionRuntime = runtime(undefined, false);

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "before-init",
      method: "tools/list"
    }, sessionRuntime)).resolves.toMatchObject({
      error: {
        code: -32002,
        message: "Server not initialized"
      }
    });

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "initialize",
      method: "initialize",
      params: validInitializeParams
    }, sessionRuntime)).resolves.toMatchObject({
      result: { protocolVersion: "2025-06-18" }
    });

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    }, sessionRuntime)).resolves.toBeUndefined();

    await expect(handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "after-init",
      method: "tools/list"
    }, sessionRuntime)).resolves.toMatchObject({
      result: { tools: [{ name: "krn_decision_packet" }, { name: "remember" }, { name: "recall" }, { name: "brief" }, { name: "feedback" }] }
    });
  });

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
    }, runtime(undefined, false));

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
        instructions: expect.stringContaining("feedback without verified packet binding")
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
          },
          { name: "remember" },
          { name: "recall" },
          { name: "brief" },
          { name: "feedback" }
        ]
      }
    });
  });

  it("round-trips string and numeric request IDs and rejects invalid IDs", async () => {
    const validIds: Array<string | number> = ["request-id", 0, 1.5, 7];

    for (const id of validIds) {
      const reply = await handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id,
        method: "ping"
      }, runtime());

      expect(reply).toMatchObject({
        jsonrpc: "2.0",
        id,
        result: {}
      });
    }

    for (const id of [null, true, { nested: "id" }]) {
      const reply = await handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id,
        method: "ping"
      }, runtime());

      expect(reply).toEqual({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32600,
          message: "Invalid JSON-RPC request"
        }
      });
    }
  });

  it("does not respond to any notification, including unknown notifications", async () => {
    const messages: unknown[] = [
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", method: "ping" },
      { jsonrpc: "2.0", method: "unknown/method" },
      {
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "missing-tool"
        }
      }
    ];

    for (const message of messages) {
      await expect(handleDecisionPacketMcpMessage(message, runtime())).resolves.toBeUndefined();
    }
  });

  it("requires an initialize protocol version and distinguishes unknown tools from execution errors", async () => {
    const missingVersion = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "initialize-missing-version",
      method: "initialize",
      params: {}
    }, runtime(undefined, false));

    expect(missingVersion).toMatchObject({
      id: "initialize-missing-version",
      error: {
        code: -32602,
        message: "Invalid initialize params"
      }
    });

    const unknownTool = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "unknown-tool",
      method: "tools/call",
      params: {
        name: "missing-tool",
        arguments: {}
      }
    }, runtime());

    expect(unknownTool).toMatchObject({
      id: "unknown-tool",
      error: {
        code: -32602,
        message: "Unknown tool: missing-tool"
      }
    });

    const executionError = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "execution-error",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1"
        }
      }
    }, runtime(async () => {
      throw new Error("database unavailable");
    }));

    expect(executionError).toMatchObject({
      id: "execution-error",
      result: {
        isError: true,
        content: [{
          type: "text",
          text: "KRN DecisionPacket execution failed (error_class=decision_packet_execution_failed). Verify the runId and KRN database readiness, then retry."
        }]
      }
    });
  });

  it("redacts execution errors from MCP results and stderr", async () => {
    const secretMarkers = [
      "audit_user:audit_password",
      "sk-test-secret",
      "select * from private_table"
    ];
    const downstreamErrors = [
      new Error("connect postgres://audit_user:audit_password@db.invalid:5432/krn"),
      new Error("provider rejected token=sk-test-secret"),
      new Error("SQL select * from private_table failed")
    ];
    const safeText = "KRN DecisionPacket execution failed (error_class=decision_packet_execution_failed). Verify the runId and KRN database readiness, then retry.";

    for (const [index, downstreamError] of downstreamErrors.entries()) {
      const response = await handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id: `secret-vector-${index}`,
        method: "tools/call",
        params: {
          name: "krn_decision_packet",
          arguments: { runId: "run-agent-1" }
        }
      }, runtime(async () => {
        throw downstreamError;
      }));
      const serialized = JSON.stringify(response);

      expect(response).toMatchObject({
        result: {
          isError: true,
          content: [{ type: "text", text: safeText }]
        }
      });
      for (const marker of secretMarkers) {
        expect(serialized).not.toContain(marker);
      }
    }

    async function* input(): AsyncIterable<string> {
      yield "{\"jsonrpc\":\"2.0\",\"id\":\"stdio-secret\",\"method\":\"tools/call\",\"params\":{\"name\":\"krn_decision_packet\",\"arguments\":{\"runId\":\"run-agent-1\"}}}\n";
    }

    const output: string[] = [];
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    try {
      await serveDecisionPacketMcpStdio(input(), {
        write: (chunk) => output.push(chunk)
      }, runtime(async () => {
        throw new Error(secretMarkers.join(" "));
      }));
      expect(stderrWrite).not.toHaveBeenCalled();
    } finally {
      stderrWrite.mockRestore();
    }

    expect(output).toHaveLength(1);
    expect(JSON.parse(output[0] ?? "null")).toMatchObject({
      result: {
        isError: true,
        content: [{ type: "text", text: safeText }]
      }
    });
    for (const marker of secretMarkers) {
      expect(output.join("")).not.toContain(marker);
    }
  });

  it("owns only read-only DecisionPacket transport, not evidence capture", async () => {
    const listed = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "list-ownership",
      method: "tools/list"
    }, runtime());
    const result = requiredRecord(requiredRecord(listed, "tools/list response")["result"], "tools/list result");
    const tools = requiredArray(result["tools"], "tools/list tools");
    const names = tools.map((tool) => requiredRecord(tool, "tool")["name"]);
    expect(names).toContain("krn_decision_packet");
    expect(names).not.toContain("krn_evidence_capture");
    expect(names).not.toContain("krn_candidate_persist");
  });

  it("advertises one read-only text tool and renders exact packet identity", async () => {
    const listed = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "list-output-schema",
      method: "tools/list"
    }, runtime());

    const listedResponse = requiredRecord(listed, "tools/list response");
    const listedResult = requiredRecord(listedResponse["result"], "tools/list result");
    const tools = requiredArray(listedResult["tools"], "tools/list tools");
    const tool = requiredRecord(tools[0], "listed tool");
    const outputSchema = requiredRecord(tool["outputSchema"], "identity output schema");
    const identityValidator = z.fromJSONSchema(outputSchema);

    for (const fixture of [
      packetJson,
      weakPacketJson,
      unresolvedSourceDissentPacketJson,
      noFormalNegativePacketJson
    ]) {
      const called = await handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id: `call-output-schema:${fixture.request.runId}`,
        method: "tools/call",
        params: {
          name: "krn_decision_packet",
          arguments: { runId: fixture.request.runId }
        }
      }, runtime(async () => ({ stdout: JSON.stringify(fixture) })));
      const calledResponse = requiredRecord(called, "tools/call response");
      const callResult = requiredRecord(calledResponse["result"], "tools/call result");
      const content = requiredArray(callResult["content"], "tool result content");
      const contentItem = requiredRecord(content[0], "tool content item");
      const text = requiredString(contentItem["text"], "tool content text");

      expect(identityValidator.safeParse(callResult["structuredContent"]).success).toBe(true);
      expect(text).toContain(`KRN DecisionPacket checksum: ${fixture.packetIdentity.checksum}.`);
      expect(text).toContain("KRN Codex Execution Brief");
    }
  });

  it("measures packet bounds across successful fixtures", async () => {
    const measurements = [];

    for (const fixture of [
      packetJson,
      weakPacketJson,
      unresolvedSourceDissentPacketJson,
      noFormalNegativePacketJson
    ]) {
      const called = await handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id: `measure-output:${fixture.request.runId}`,
        method: "tools/call",
        params: {
          name: "krn_decision_packet",
          arguments: { runId: fixture.request.runId }
        }
      }, runtime(async () => ({ stdout: JSON.stringify(fixture) })));
      const calledResponse = requiredRecord(called, "measured tools/call response");
      const result = requiredRecord(calledResponse["result"], "measured tools/call result");
      measurements.push({
        messageUtf8Bytes: measureDecisionPacketTransport(called).utf8Bytes,
        content: measureDecisionPacketTransport(result["content"])
      });
    }

    for (const measured of measurements) {
      expect(measured.messageUtf8Bytes).toBeLessThan(
        decisionPacketTransportBudget.maximumMessageUtf8Bytes
      );
      expect(measured.content.collectionLength.maximum).toBe(1);
    }

    const unboundedProbe = measureDecisionPacketTransport({
      values: Array.from({ length: 10_000 }, () => "element")
    });

    expect(unboundedProbe.utf8Bytes).toBeGreaterThan(
      decisionPacketTransportBudget.maximumMessageUtf8Bytes
    );
    expect(unboundedProbe.collectionLength.maximum).toBeGreaterThan(
      decisionPacketTransportBudget.maximumCollectionElements
    );
  });

  it("rejects oversize messages without truncating packets and remains usable", async () => {
    const {
      maximumInputLineUtf8Bytes,
      maximumRunIdUtf8Bytes
    } = decisionPacketTransportBudget;
    const outputLimitText = "KRN DecisionPacket output exceeds the MCP transport budget (error_class=decision_packet_output_limit_exceeded).";
    let runCount = 0;

    const oversizedRunId = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "oversize-run-id",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: { runId: "r".repeat(maximumRunIdUtf8Bytes + 1) }
      }
    }, runtime(async () => {
      runCount += 1;
      return { stdout: JSON.stringify(packetJson) };
    }));

    expect(runCount).toBe(0);
    expect(oversizedRunId).toMatchObject({
      error: {
        code: -32602,
        message: "krn_decision_packet runId exceeds 256 UTF-8 bytes"
      }
    });

    const boundaryRunId = "r".repeat(maximumRunIdUtf8Bytes);
    await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "boundary-run-id",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: { runId: boundaryRunId }
      }
    }, runtime(async () => {
      runCount += 1;
      return { stdout: JSON.stringify(packetJson) };
    }));
    expect(runCount).toBe(1);

    const callPacket = async (fixture: typeof packetJson, id: string) =>
      handleDecisionPacketMcpMessage({
        jsonrpc: "2.0",
        id,
        method: "tools/call",
        params: {
          name: "krn_decision_packet",
          arguments: { runId: fixture.request.runId }
        }
      }, runtime(async () => ({ stdout: JSON.stringify(fixture) })));

    const baseResponse = await callPacket(packetJson, "output-byte-boundary");
    const baseBytes = measureDecisionPacketTransport(baseResponse).utf8Bytes;
    const outputPaddingBytes =
      decisionPacketTransportBudget.maximumMessageUtf8Bytes - baseBytes;

    const boundaryPacket = bindFixtureIdentity({
      ...packetJson,
      packet: {
        ...packetJson.packet,
        task: {
          ...packetJson.packet.task,
          objective: `${packetJson.packet.task.objective}${"x".repeat(
            outputPaddingBytes
          )}`
        }
      }
    });
    const boundaryResponse = await callPacket(boundaryPacket, "output-byte-boundary");
    const boundaryResult = requiredRecord(
      requiredRecord(boundaryResponse, "boundary response")["result"],
      "boundary result"
    );

    expect(measureDecisionPacketTransport(boundaryResponse).utf8Bytes).toBeLessThan(
      decisionPacketTransportBudget.maximumMessageUtf8Bytes
    );
    expect(boundaryResult).toMatchObject({
      isError: true,
      content: [{ type: "text", text: outputLimitText }]
    });

    const oversizedByteResponse = await callPacket(
      boundaryPacket,
      "output-byte-boundaryxx"
    );

    expect(oversizedByteResponse).toMatchObject({
      result: {
        isError: true,
        content: [{ type: "text", text: outputLimitText }]
      }
    });
    expect(JSON.stringify(oversizedByteResponse)).not.toContain(
      boundaryPacket.packetIdentity.checksum
    );

    const collectionPacket = (length: number) => bindFixtureIdentity({
      ...packetJson,
      packet: {
        ...packetJson.packet,
        toolBoundaries: Array.from({ length }, (_, index) => `boundary-${index}`)
      }
    });
    const boundaryCollectionPacket = collectionPacket(
      decisionPacketTransportBudget.maximumCollectionElements
    );
    const boundaryCollectionResponse = await callPacket(
      boundaryCollectionPacket,
      "output-collection-boundary"
    );
    const boundaryCollectionResult = requiredRecord(
      requiredRecord(boundaryCollectionResponse, "boundary collection response")["result"],
      "boundary collection result"
    );

    expect(boundaryCollectionResult).toMatchObject({
      isError: false
    });
    expect(JSON.stringify(boundaryCollectionResult)).toContain(
      boundaryCollectionPacket.packetIdentity.checksum
    );

    const oversizedCollectionPacket = collectionPacket(
      decisionPacketTransportBudget.maximumCollectionElements + 1
    );
    const oversizedCollectionResponse = await callPacket(
      oversizedCollectionPacket,
      "output-collection-boundary"
    );

    expect(oversizedCollectionResponse).toMatchObject({ result: { isError: false } });
    expect(JSON.stringify(oversizedCollectionResponse)).toContain(
      oversizedCollectionPacket.packetIdentity.checksum
    );

    const pingLine = (bytes: number, id: string): string => {
      const prefix = `{"jsonrpc":"2.0","id":"${id}","method":"ping","params":{"padding":"`;
      const suffix = "\"}}";
      return `${prefix}${"p".repeat(bytes - Buffer.byteLength(prefix + suffix, "utf8"))}${suffix}`;
    };
    async function* input(): AsyncIterable<string> {
      yield `${pingLine(maximumInputLineUtf8Bytes, "line-boundary")}\n`;
      yield `${pingLine(maximumInputLineUtf8Bytes + 1, "line-oversize")}\n`;
      yield "{\"jsonrpc\":\"2.0\",\"id\":\"after-oversize\",\"method\":\"ping\"}\n";
    }
    const output: string[] = [];

    await serveDecisionPacketMcpStdio(input(), {
      write: (chunk) => output.push(chunk)
    }, runtime());

    expect(output.map((line) => JSON.parse(line))).toEqual([
      { jsonrpc: "2.0", id: "line-boundary", result: {} },
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: "MCP input line exceeds 16384 UTF-8 bytes"
        }
      },
      { jsonrpc: "2.0", id: "after-oversize", result: {} }
    ]);
  });

  it("rejects a megabyte line in spawned MCP stdio within a timeout", () => {
    const serverEntry = fileURLToPath(new URL(
      "../internal/mcp/decision-packet-mcp-server.ts",
      import.meta.url
    ));
    const afterOversize = "{\"jsonrpc\":\"2.0\",\"id\":\"spawn-after-oversize\",\"method\":\"ping\"}\n";
    const child = spawnSync(
      process.execPath,
      [moduleRequire.resolve("tsx/cli"), serverEntry],
      {
        encoding: "utf8",
        input: `${"x".repeat(1024 * 1024)}\n${afterOversize}`,
        maxBuffer: 2 * 1024 * 1024,
        timeout: 10_000
      }
    );

    expect(child.error).toBeUndefined();
    expect(child.status).toBe(0);
    expect(child.stderr).toBe("");
    expect(child.stdout.trim().split("\n").map((line) => JSON.parse(line))).toEqual([
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: "MCP input line exceeds 16384 UTF-8 bytes"
        }
      },
      { jsonrpc: "2.0", id: "spawn-after-oversize", result: {} }
    ]);
  });

  it("renders the exact DecisionPacket as compact Codex-facing text", async () => {
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
        isError: false
      }
    });

    const result = isRecord(reply) ? reply["result"] : undefined;
    expect(JSON.stringify(isRecord(result) ? result["content"] : undefined)).toContain(
      `KRN DecisionPacket checksum: ${packetJson.packetIdentity.checksum}.`
    );
    expect(JSON.stringify(result)).toContain("Objective: Use the governed frontend bootstrap standard.");
    expect(JSON.stringify(isRecord(result) ? result["content"] : undefined)).not.toContain(
      "source-decision-edge:frontend-project-standard-packet"
    );
    expect(isRecord(result) ? result["structuredContent"] : undefined).toMatchObject({
      checksum: packetJson.packetIdentity.checksum,
      evidenceRef: packetJson.packetIdentity.evidenceRef
    });
    expect(isRecord(result) ? result["_meta"] : undefined).toBeUndefined();
  });

  it.each([
    {
      name: "array output",
      output: []
    },
    {
      name: "incomplete packet",
      output: {
        kind: "krn.decisionPacketReadback.v1",
        proof: {
          proves: [],
          doesNotProve: []
        }
      }
    },
    {
      name: "wrong run",
      output: {
        ...packetJson,
        request: {
          ...packetJson.request,
          runId: "run-agent-other"
        }
      }
    },
    {
      name: "wrong task",
      output: {
        ...packetJson,
        request: {
          ...packetJson.request,
          taskId: "task-other"
        }
      }
    },
    {
      name: "wrong project",
      output: {
        ...packetJson,
        request: {
          ...packetJson.request,
          projectId: "project-other"
        }
      }
    },
    {
      name: "checksum mismatch",
      output: {
        ...packetJson,
        packet: {
          ...packetJson.packet,
          nextAction: "Use unchecksummed packet content."
        }
      }
    },
    {
      name: "fabricated transport proof",
      output: {
        ...packetJson,
        proof: {
          ...packetJson.proof,
          proves: [
            ...packetJson.proof.proves,
            "DecisionPacket was served through the read-only krn_decision_packet MCP tool"
          ]
        }
      }
    }
  ])("rejects malformed packet output: $name", async ({ output }) => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "malformed-packet",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1"
        }
      }
    }, runtime(async () => ({
      stdout: `${JSON.stringify(output)}\n`
    })));

    expect(reply).toEqual({
      jsonrpc: "2.0",
      id: "malformed-packet",
      result: {
        content: [{
          type: "text",
          text: "krn decision packet command returned an invalid DecisionPacket contract"
        }],
        isError: true
      }
    });
  });

  it("preserves abstention and evidence gaps in compact tool output", async () => {
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
    const text = JSON.stringify(isRecord(result) ? result["content"] : undefined);
    expect(text).toContain(`KRN DecisionPacket checksum: ${weakPacketJson.packetIdentity.checksum}.`);
    expect(text).toContain("Packet Status: abstain");
    expect(text).toContain("No governed decision is present in this read-only packet.");
  });

  it("preserves unresolved accepted source dissent as abstaining review context", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-source-dissent",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-source-dissent"
        }
      }
    }, runtime(async () => ({
      stdout: `${JSON.stringify(unresolvedSourceDissentPacketJson)}\n`
    })));
    const result = isRecord(reply) ? reply["result"] : undefined;
    const text = JSON.stringify(isRecord(result) ? result["content"] : undefined);
    expect(text).toContain("Packet Status: abstain");
    expect(text).toContain("unresolved_accepted_source_dissent");
    expect(text).toContain("selected with accepted dissent");
  });

  it("preserves typed unsafe context without inventing formal rejection evidence", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-unsafe",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-unsafe"
        }
      }
    }, runtime(async () => ({
      stdout: `${JSON.stringify(noFormalNegativePacketJson)}\n`
    })));
    const result = isRecord(reply) ? reply["result"] : undefined;
    const text = JSON.stringify(isRecord(result) ? result["content"] : undefined);
    expect(text).toContain("Packet Status: abstain");
    expect(text).toContain("Unsafe source remains explicit but is not formal rejection evidence.");
    expect(text).toContain("missing_rejected_path_evidence");
  });

  it("reports invalid tool input as a protocol error instead of inventing a packet", async () => {
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
      error: {
        code: -32602,
        message: "krn_decision_packet requires a non-empty runId argument"
      }
    });
  });

  it("rejects unknown tool argument properties before packet execution", async () => {
    let executed = false;
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "extra-argument",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1",
          mutate: true
        }
      }
    }, runtime(async () => {
      executed = true;
      return { stdout: `${JSON.stringify(packetJson)}\n` };
    }));

    expect(executed).toBe(false);
    expect(reply).toMatchObject({
      error: {
        code: -32602,
        message: "krn_decision_packet requires a non-empty runId argument"
      }
    });
  });

  it("accepts standard tools-call metadata without widening tool arguments", async () => {
    const reply = await handleDecisionPacketMcpMessage({
      jsonrpc: "2.0",
      id: "call-with-meta",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: {
          runId: "run-agent-1"
        },
        _meta: {
          progressToken: "codex-progress-1"
        }
      }
    }, runtime(async () => ({ stdout: `${JSON.stringify(packetJson)}\n` })));

    expect(reply).toMatchObject({
      id: "call-with-meta",
      result: {
        isError: false
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
          tools: [
            { name: "krn_decision_packet" },
            { name: "remember" },
            { name: "recall" },
            { name: "brief" },
            { name: "feedback" }
          ]
        }
      });
    expect(JSON.stringify(toolCall)).toContain(
      `KRN DecisionPacket checksum: ${packetJson.packetIdentity.checksum}.`
    );
  });

  it("preserves a multibyte runId at every stdio byte split", async () => {
    const expectedRunId = "run-żółw";
    const request = Buffer.from(`${JSON.stringify({
      jsonrpc: "2.0",
      id: "split-utf8",
      method: "tools/call",
      params: {
        name: "krn_decision_packet",
        arguments: { runId: expectedRunId }
      }
    })}\n`);

    for (let split = 0; split <= request.length; split += 1) {
      let observedRunId: string | undefined;

      async function* input(): AsyncIterable<Buffer> {
        yield request.subarray(0, split);
        yield request.subarray(split);
      }

      await serveDecisionPacketMcpStdio(input(), { write() {} }, runtime(async (command) => {
        observedRunId = command.runId;
        return { stdout: `${JSON.stringify(packetJson)}\n` };
      }));

      expect(observedRunId, `byte split ${split}`).toBe(expectedRunId);
    }
  });

  it("fails explicitly on invalid UTF-8 instead of executing replacement text", async () => {
    const prefix = Buffer.from(
      "{\"jsonrpc\":\"2.0\",\"id\":\"invalid-utf8\",\"method\":\"tools/call\",\"params\":{\"name\":\"krn_decision_packet\",\"arguments\":{\"runId\":\"run-"
    );
    const suffix = Buffer.from("\"}}}\n");
    const request = Buffer.concat([prefix, Buffer.from([0xff]), suffix]);
    const output: string[] = [];
    let executed = false;

    async function* input(): AsyncIterable<Buffer> {
      yield request;
    }

    await serveDecisionPacketMcpStdio(input(), {
      write: (chunk) => output.push(chunk)
    }, runtime(async () => {
      executed = true;
      return { stdout: `${JSON.stringify(packetJson)}\n` };
    }));

    expect(executed).toBe(false);
    expect(output.map((line) => JSON.parse(line))).toEqual([{
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error"
      }
    }]);
  });

  it("states the read-only MCP boundary in compact output", async () => {
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
    expect(JSON.stringify(result)).toContain("Read-only context; no memory or source authority was mutated.");
  });

  it("keeps stdio framing deterministic for notifications, malformed input, and invalid IDs", async () => {
    async function* input(): AsyncIterable<string> {
      yield "{\"jsonrpc\":\"2.0\",\"method\":\"notifications/initialized\"}\n";
      yield "{not-json}\n";
      yield "{\"jsonrpc\":\"2.0\",\"id\":null,\"method\":\"ping\"}\n";
      yield "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"ping\"}\n";
    }

    const output: string[] = [];

    await serveDecisionPacketMcpStdio(input(), {
      write: (chunk) => output.push(chunk)
    }, runtime());

    expect(output.map((line) => JSON.parse(line))).toEqual([
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error"
        }
      },
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32600,
          message: "Invalid JSON-RPC request"
        }
      },
      {
        jsonrpc: "2.0",
        id: 3,
        result: {}
      }
    ]);
  });
});
