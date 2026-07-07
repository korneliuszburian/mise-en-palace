import {
  randomUUID
} from "node:crypto";
import {
  isCliEntrypoint
} from "../eval/eval-main.js";
import {
  runAgentPacketCommand,
  type AgentPacketCommandResult,
  type AgentPacketCommandRuntime
} from "../../run-agent-packet-command.js";
import type {
  CreateRunShowDatabaseRuntime
} from "../../run-run-show-command.js";

type JsonRpcId = string | number | null;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | JsonObject;

type JsonObject = { readonly [key: string]: JsonValue };

interface JsonRpcRequest {
  readonly jsonrpc: "2.0";
  readonly id?: JsonRpcId;
  readonly method: string;
  readonly params?: unknown;
}

interface JsonRpcResponse {
  readonly jsonrpc: "2.0";
  readonly id: JsonRpcId;
  readonly result?: JsonValue;
  readonly error?: {
    readonly code: number;
    readonly message: string;
  };
}

type ToolCallResult = JsonObject & {
  readonly content: readonly [{
    readonly type: "text";
    readonly text: string;
  }];
  readonly structuredContent?: JsonValue;
  readonly isError?: boolean;
};

export interface AgentPacketMcpRuntime {
  readonly env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  readonly createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
  readonly runAgentPacket?: (
    runtime: AgentPacketCommandRuntime
  ) => Promise<AgentPacketCommandResult>;
}

const protocolVersion = "2025-06-18";
const serverName = "krn-agent-packet-mcp";
const serverVersion = "0.0.0";
const agentPacketToolName = "krn_agent_packet";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  return isRecord(value) && Object.values(value).every(isJsonValue);
};

const textResult = (
  text: string,
  isError = false
): ToolCallResult => ({
  content: [{
    type: "text",
    text
  }],
  ...(isError ? { isError: true } : {})
});

const jsonResult = (
  value: JsonValue
): ToolCallResult => ({
  content: [{
    type: "text",
    text: JSON.stringify(value)
  }],
  structuredContent: value,
  isError: false
});

const response = (
  id: JsonRpcId,
  result: JsonValue
): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id,
  result
});

const errorResponse = (
  id: JsonRpcId,
  code: number,
  message: string
): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id,
  error: {
    code,
    message
  }
});

const requestId = (
  message: JsonRpcRequest
): JsonRpcId => message.id === undefined ? null : message.id;

const toolDefinition = (): JsonValue => ({
  name: agentPacketToolName,
  title: "KRN Agent Decision Packet",
  description:
    "Return the existing read-only KRN DecisionPacket contract and evidence/feedback return channels for a persisted run.",
  inputSchema: {
    type: "object",
    properties: {
      runId: {
        type: "string",
        description: "Persisted KRN execution run id."
      }
    },
    required: ["runId"],
    additionalProperties: false
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
});

const initializeResult = (
  params: unknown
): JsonValue => {
  const requestedVersion = isRecord(params) && typeof params["protocolVersion"] === "string"
    ? params["protocolVersion"]
    : protocolVersion;

  return {
    protocolVersion: requestedVersion === protocolVersion ? requestedVersion : protocolVersion,
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    serverInfo: {
      name: serverName,
      title: "KRN Agent Packet MCP",
      version: serverVersion
    },
    instructions:
      "Use krn_agent_packet to fetch a read-only DecisionPacket. Evidence and feedback remain explicit return channels; this MCP server does not execute Codex or promote memory/source truth."
  };
};

const runAgentPacket = async (
  runtime: AgentPacketMcpRuntime,
  runId: string
): Promise<ToolCallResult> => {
  const commandRuntime: AgentPacketCommandRuntime = {
    env: runtime.env,
    now: runtime.now,
    createId: runtime.createId,
    runId,
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime })
  };
  const result = await (runtime.runAgentPacket ?? runAgentPacketCommand)(commandRuntime);
  const parsed: unknown = JSON.parse(result.stdout);

  if (!isJsonValue(parsed)) {
    return textResult("krn agent packet returned non-JSON tool content", true);
  }

  return jsonResult(parsed);
};

const runToolCall = async (
  runtime: AgentPacketMcpRuntime,
  params: unknown
): Promise<ToolCallResult> => {
  if (!isRecord(params)) {
    return textResult("tools/call params must be an object", true);
  }

  if (params["name"] !== agentPacketToolName) {
    return textResult(`Unknown tool: ${String(params["name"])}`, true);
  }

  const args = params["arguments"];

  if (!isRecord(args) || typeof args["runId"] !== "string" || args["runId"].trim().length === 0) {
    return textResult("krn_agent_packet requires a non-empty runId argument", true);
  }

  try {
    return await runAgentPacket(runtime, args["runId"].trim());
  } catch (error) {
    return textResult(error instanceof Error ? error.message : String(error), true);
  }
};

const parseRequest = (
  value: unknown
): JsonRpcRequest | undefined =>
  isRecord(value) &&
  value["jsonrpc"] === "2.0" &&
  typeof value["method"] === "string"
    ? {
        jsonrpc: "2.0",
        method: value["method"],
        ...(value["id"] === undefined ? {} : { id: value["id"] as JsonRpcId }),
        ...(value["params"] === undefined ? {} : { params: value["params"] })
      }
    : undefined;

export const handleAgentPacketMcpMessage = async (
  value: unknown,
  runtime: AgentPacketMcpRuntime
): Promise<JsonRpcResponse | undefined> => {
  const message = parseRequest(value);

  if (message === undefined) {
    return errorResponse(null, -32600, "Invalid JSON-RPC request");
  }

  if (message.id === undefined && message.method === "notifications/initialized") {
    return undefined;
  }

  switch (message.method) {
    case "initialize":
      return response(requestId(message), initializeResult(message.params));
    case "ping":
      return response(requestId(message), {});
    case "tools/list":
      return response(requestId(message), {
        tools: [toolDefinition()]
      });
    case "tools/call":
      return response(requestId(message), await runToolCall(runtime, message.params));
    default:
      return errorResponse(requestId(message), -32601, `Method not found: ${message.method}`);
  }
};

interface WritableOutput {
  write(chunk: string): void;
}

const defaultRuntime = (): AgentPacketMcpRuntime => ({
  env: process.env,
  now: () => new Date().toISOString(),
  createId: (prefix) => `${prefix}:${randomUUID()}`
});

export const serveAgentPacketMcpStdio = async (
  input: AsyncIterable<Buffer | string>,
  output: WritableOutput,
  runtime: AgentPacketMcpRuntime = defaultRuntime()
): Promise<void> => {
  let buffer = "";

  for await (const chunk of input) {
    buffer += chunk.toString();

    for (;;) {
      const lineEnd = buffer.indexOf("\n");

      if (lineEnd === -1) {
        break;
      }

      const line = buffer.slice(0, lineEnd).trim();
      buffer = buffer.slice(lineEnd + 1);

      if (line.length === 0) {
        continue;
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(line);
      } catch {
        output.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error"))}\n`);
        continue;
      }

      const reply = await handleAgentPacketMcpMessage(parsed, runtime);

      if (reply !== undefined) {
        output.write(`${JSON.stringify(reply)}\n`);
      }
    }
  }
};

if (isCliEntrypoint(import.meta.url)) {
  await serveAgentPacketMcpStdio(process.stdin, process.stdout);
}
