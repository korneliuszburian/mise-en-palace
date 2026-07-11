import {
  randomUUID
} from "node:crypto";
import {
  isCliEntrypoint
} from "../eval/eval-main.js";
import {
  runDecisionPacketCommand,
  type DecisionPacketCommandResult,
  type DecisionPacketCommandRuntime
} from "../../run-decision-packet-command.js";
import type {
  CreateRunShowDatabaseRuntime
} from "../../run-run-show-command.js";

type JsonRpcId = string | number;

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
  readonly id: JsonRpcId | null;
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

interface ProtocolError {
  readonly code: number;
  readonly message: string;
}

type ToolCallOutcome =
  | {
      readonly kind: "result";
      readonly result: ToolCallResult;
    }
  | {
      readonly kind: "protocol_error";
      readonly error: ProtocolError;
    };

export interface DecisionPacketMcpRuntime {
  readonly env: Record<string, string | undefined>;
  now(): string;
  createId(prefix: string): string;
  readonly session?: DecisionPacketMcpSession;
  readonly createDatabaseRuntime?: CreateRunShowDatabaseRuntime;
  readonly runDecisionPacket?: (
    runtime: DecisionPacketCommandRuntime
  ) => Promise<DecisionPacketCommandResult>;
}

export interface DecisionPacketMcpSession {
  initialized: boolean;
}

const protocolVersion = "2025-06-18";
const serverName = "krn-decision-packet-mcp";
const serverVersion = "0.0.0";
const decisionPacketToolName = "krn_decision_packet";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isJsonRpcRequestId = (value: unknown): value is JsonRpcId =>
  typeof value === "string" || (typeof value === "number" && Number.isInteger(value));

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
    text: packetSummary(value)
  }],
  structuredContent: value,
  isError: false
});

// fallow-ignore-next-line complexity -- bounded text rendering validates several optional packet fields without copying structured payload
const packetSummary = (value: JsonValue): string => {
  if (!isJsonObject(value)) {
    return "KRN DecisionPacket result";
  }

  const identity = isJsonObject(value["packetIdentity"]) ? value["packetIdentity"] : undefined;
  const packet = isJsonObject(value["packet"]) ? value["packet"] : undefined;
  const packetId = identity?.["packetId"];
  const checksum = identity?.["checksum"];
  const governing = stringArray(packet?.["governingDecisionIds"]);
  const gaps = Array.isArray(packet?.["evidenceGaps"]) ? packet["evidenceGaps"].length : 0;

  return `KRN DecisionPacket ${String(packetId ?? "unknown")} checksum=${String(checksum ?? "unknown")} governing=${governing.length} evidenceGaps=${gaps}`;
};

const isJsonObject = (
  value: JsonValue | undefined
): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringArray = (
  value: JsonValue | undefined
): string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? [...value]
    : [];

const appendUnique = (
  values: string[],
  value: string
): string[] =>
  values.includes(value) ? values : [...values, value];

const annotateMcpTransportProof = (
  value: JsonValue
): JsonValue => {
  if (!isJsonObject(value) || value["kind"] !== "krn.decisionPacketReadback.v1") {
    return value;
  }

  const proof = value["proof"];

  if (!isJsonObject(proof)) {
    return value;
  }

  return {
    ...value,
    proof: {
      ...proof,
      proves: appendUnique(
        stringArray(proof["proves"]),
        "DecisionPacket was served through the read-only krn_decision_packet MCP tool"
      ),
      doesNotProve: appendUnique(
        stringArray(proof["doesNotProve"]).filter((item) => item !== "MCP integration"),
        "broad MCP product readiness"
      )
    }
  };
};

const boundedReadback = (value: JsonValue): JsonValue => {
  if (!isJsonObject(value)) {
    return value;
  }

  const allowedKeys = new Set([
    "kind",
    "access",
    "mutation",
    "surface",
    "request",
    "packetIdentity",
    "packet",
    "returnChannels",
    "proof"
  ]);

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => allowedKeys.has(key))
  ) as JsonObject;
};

const response = (
  id: JsonRpcId | null,
  result: JsonValue
): JsonRpcResponse => ({
  jsonrpc: "2.0",
  id,
  result
});

const errorResponse = (
  id: JsonRpcId | null,
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
): JsonRpcId | null => message.id === undefined ? null : message.id;

const toolDefinition = (): JsonValue => ({
  name: decisionPacketToolName,
  title: "KRN DecisionPacket",
  description:
    "Return the read-only KRN DecisionPacket contract and evidence/feedback return channels for a persisted run.",
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
  _params: unknown
): JsonValue => {
  return {
    protocolVersion,
    capabilities: {
      tools: {
        listChanged: false
      }
    },
    serverInfo: {
      name: serverName,
      title: "KRN DecisionPacket MCP",
      version: serverVersion
    },
    instructions:
      "Use krn_decision_packet to fetch a read-only KRN DecisionPacket for an existing runId. Treat KRN as context authority, not an executor: this server does not execute Codex, mutate target repos, promote memory/source truth, or capture feedback by side effect. Evidence and feedback remain explicit return channels in the response."
  };
};

const runDecisionPacket = async (
  runtime: DecisionPacketMcpRuntime,
  runId: string
): Promise<ToolCallResult> => {
  const commandRuntime: DecisionPacketCommandRuntime = {
    env: runtime.env,
    now: runtime.now,
    createId: runtime.createId,
    runId,
    ...(runtime.createDatabaseRuntime === undefined
      ? {}
      : { createDatabaseRuntime: runtime.createDatabaseRuntime })
  };
  const result = await (runtime.runDecisionPacket ?? runDecisionPacketCommand)(commandRuntime);
  const parsed: unknown = JSON.parse(result.stdout);

  if (!isJsonValue(parsed)) {
    return textResult("krn decision packet command returned non-JSON tool content", true);
  }

  return jsonResult(boundedReadback(annotateMcpTransportProof(parsed)));
};

// fallow-ignore-next-line complexity -- protocol boundary distinguishes schema, tool, argument, and execution failure channels
const runToolCall = async (
  runtime: DecisionPacketMcpRuntime,
  params: unknown
): Promise<ToolCallOutcome> => {
  if (!isRecord(params)) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: "tools/call params must be an object"
      }
    };
  }

  if (Object.keys(params).some((key) => key !== "name" && key !== "arguments")) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: "tools/call params contain an unknown property"
      }
    };
  }

  if (params["name"] !== decisionPacketToolName) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: `Unknown tool: ${String(params["name"])}`
      }
    };
  }

  const args = params["arguments"];

  if (
    !isRecord(args) ||
    Object.keys(args).some((key) => key !== "runId") ||
    typeof args["runId"] !== "string" ||
    args["runId"].trim().length === 0
  ) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: "krn_decision_packet requires a non-empty runId argument"
      }
    };
  }

  try {
    return {
      kind: "result",
      result: await runDecisionPacket(runtime, args["runId"].trim())
    };
  } catch (error) {
    return {
      kind: "result",
      result: textResult(error instanceof Error ? error.message : String(error), true)
    };
  }
};

const parseRequest = (
  value: unknown
): JsonRpcRequest | undefined => {
  if (!isRecord(value) || value["jsonrpc"] !== "2.0" || typeof value["method"] !== "string") {
    return undefined;
  }

  const id = value["id"];

  if (id !== undefined && !isJsonRpcRequestId(id)) {
    return undefined;
  }

  return {
    jsonrpc: "2.0",
    method: value["method"],
    ...(id === undefined ? {} : { id }),
    ...(value["params"] === undefined ? {} : { params: value["params"] })
  };
};

export const handleDecisionPacketMcpMessage = async (
  value: unknown,
  runtime: DecisionPacketMcpRuntime
): Promise<JsonRpcResponse | undefined> => {
  const message = parseRequest(value);

  if (message === undefined) {
    return errorResponse(null, -32600, "Invalid JSON-RPC request");
  }

  if (message.id === undefined) {
    return undefined;
  }

  const session = sessionFor(runtime);

  switch (message.method) {
    case "initialize":
      if (!isRecord(message.params) || message.params["protocolVersion"] !== protocolVersion) {
        return errorResponse(
          requestId(message),
          -32602,
          `initialize requires protocolVersion ${protocolVersion}`
        );
      }
      session.initialized = true;
      return response(requestId(message), initializeResult(message.params));
    case "ping":
      return response(requestId(message), {});
    case "tools/list":
      if (!session.initialized) {
        return errorResponse(requestId(message), -32002, "Server not initialized");
      }
      return response(requestId(message), {
        tools: [toolDefinition()]
      });
    case "tools/call": {
      if (!session.initialized) {
        return errorResponse(requestId(message), -32002, "Server not initialized");
      }
      const outcome = await runToolCall(runtime, message.params);
      return outcome.kind === "protocol_error"
        ? errorResponse(requestId(message), outcome.error.code, outcome.error.message)
        : response(requestId(message), outcome.result);
    }
    default:
      return errorResponse(requestId(message), -32601, `Method not found: ${message.method}`);
  }
};

interface WritableOutput {
  write(chunk: string): void;
}

const defaultRuntime = (): DecisionPacketMcpRuntime => ({
  env: process.env,
  now: () => new Date().toISOString(),
  createId: (prefix) => `${prefix}:${randomUUID()}`,
  session: { initialized: false }
});

const sessions = new WeakMap<object, DecisionPacketMcpSession>();

const sessionFor = (runtime: DecisionPacketMcpRuntime): DecisionPacketMcpSession => {
  if (runtime.session !== undefined) {
    return runtime.session;
  }

  const existing = sessions.get(runtime);
  if (existing !== undefined) {
    return existing;
  }

  const created = { initialized: false };
  sessions.set(runtime, created);
  return created;
};

export const serveDecisionPacketMcpStdio = async (
  input: AsyncIterable<Buffer | string>,
  output: WritableOutput,
  runtime: DecisionPacketMcpRuntime = defaultRuntime()
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
        const message: unknown = JSON.parse(line);
        parsed = message;
      } catch {
        output.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error"))}\n`);
        continue;
      }

      const reply = await handleDecisionPacketMcpMessage(parsed, runtime);

      if (reply !== undefined) {
        output.write(`${JSON.stringify(reply)}\n`);
      }
    }
  }
};

if (isCliEntrypoint(import.meta.url)) {
  await serveDecisionPacketMcpStdio(process.stdin, process.stdout);
}
