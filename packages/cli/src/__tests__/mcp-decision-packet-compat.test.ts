import {
  Buffer
} from "node:buffer";
import {
  createRequire
} from "node:module";
import {
  fileURLToPath
} from "node:url";
import {
  Client
} from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport
} from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema
} from "@modelcontextprotocol/sdk/types.js";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  decisionPacketMcpFixture
} from "./support/decision-packet-mcp-fixture.js";

const moduleRequire = createRequire(import.meta.url);
const requestTimeoutMs = 5_000;

describe("DecisionPacket official MCP client compatibility", () => {
  it("completes stdio lifecycle, schema-validated call, and fail-closed vectors", async () => {
    const serverEntry = fileURLToPath(new URL(
      "./fixtures/decision-packet-mcp-compat-server.ts",
      import.meta.url
    ));
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [moduleRequire.resolve("tsx/cli"), serverEntry],
      stderr: "pipe"
    });
    const client = new Client({
      name: "krn-official-sdk-compat",
      version: "0.0.0"
    });
    let stderr = "";

    transport.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    try {
      await client.connect(transport, { timeout: requestTimeoutMs });

      expect(client.getServerCapabilities()).toEqual({
        tools: { listChanged: false }
      });
      expect(client.getInstructions()).toContain(
        "does not execute Codex, mutate target repos, promote memory/source truth, or capture feedback by side effect"
      );

      const listed = await client.listTools(undefined, { timeout: requestTimeoutMs });
      expect(listed.tools).toHaveLength(1);
      expect(listed.tools[0]).toMatchObject({
        name: "krn_decision_packet",
        annotations: {
          readOnlyHint: true,
          destructiveHint: false
        },
        inputSchema: {
          required: ["runId"],
          additionalProperties: false
        },
        outputSchema: {
          required: [
            "packetId",
            "checksumAlgorithm",
            "checksum",
            "evidenceRef",
            "generatedAt",
            "sourceRunStatus",
            "sourceRunLifecycleRevision",
            "sourceRunUpdatedAt",
            "freshness"
          ]
        }
      });

      const call = (runId: string) => client.callTool({
        name: "krn_decision_packet",
        arguments: { runId }
      }, undefined, { timeout: requestTimeoutMs });
      const valid = await call(decisionPacketMcpFixture.request.runId);
      const parsedValid = CallToolResultSchema.parse(valid);
      const validText = parsedValid.content.find((item) => item.type === "text");

      expect(parsedValid.isError).toBe(false);
      expect(parsedValid.structuredContent).toMatchObject({
        checksum: decisionPacketMcpFixture.packetIdentity.checksum,
        evidenceRef: decisionPacketMcpFixture.packetIdentity.evidenceRef,
        generatedAt: decisionPacketMcpFixture.packetIdentity.generatedAt
      });
      expect(validText).toEqual({
        type: "text",
        text: expect.stringContaining(
          `KRN DecisionPacket checksum: ${decisionPacketMcpFixture.packetIdentity.checksum}.`
        )
      });
      expect(validText).toMatchObject({
        text: expect.stringContaining("Objective: Use the governed frontend bootstrap standard.")
      });
      expect(validText).not.toMatchObject({
        text: expect.stringContaining("source-decision-edge:frontend-project-standard-packet")
      });

      await expect(call("r".repeat(257))).rejects.toMatchObject({ code: -32602 });

      await expect(call("run-malformed-output")).resolves.toMatchObject({
        isError: true,
        content: [{
          type: "text",
          text: "krn decision packet command returned an invalid DecisionPacket contract"
        }]
      });
      await expect(call("run-oversize-output")).resolves.toMatchObject({
        isError: true,
        content: [{
          type: "text",
          text: "KRN DecisionPacket output exceeds the MCP transport budget (error_class=decision_packet_output_limit_exceeded)."
        }]
      });
      await expect(call("run-execution-error")).resolves.toMatchObject({
        isError: true,
        content: [{
          type: "text",
          text: "KRN DecisionPacket execution failed (error_class=decision_packet_execution_failed). Verify the runId and KRN database readiness, then retry."
        }]
      });

      await expect(call(decisionPacketMcpFixture.request.runId)).resolves.toMatchObject({
        isError: false
      });
    } finally {
      await client.close();
    }

    expect(stderr).toBe("");
  }, 15_000);
});
