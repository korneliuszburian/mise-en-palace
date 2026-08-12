import {
  randomUUID
} from "node:crypto";
import {
  Buffer
} from "node:buffer";
import {
  ExecutionBriefRenderBudgetError,
  renderExecutionBrief
} from "@krn/codex-adapter";
import type {
  DecisionPacketContractReadback
} from "@krn/core";
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
import {
  decisionPacketIdentityOutputSchema,
  parseDecisionPacketContractReadback,
  type DecisionPacketJsonObject as JsonObject,
  type DecisionPacketJsonValue as JsonValue
} from "./decision-packet-contract-parser.js";
import {
  decisionPacketTransportBudget,
  measureDecisionPacketTransport
} from "./decision-packet-transport-measurement.js";
import type { MemoryLifecycleContext } from "./memory-lifecycle-tools.js";

type JsonRpcId = string | number;

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
  readonly memoryLifecycle?: MemoryLifecycleContext;
}

const memoryLifecycleContexts = new WeakMap<object, Promise<MemoryLifecycleContext>>();

const memoryLifecycleFor = async (
  runtime: DecisionPacketMcpRuntime
): Promise<MemoryLifecycleContext> => {
  if (runtime.memoryLifecycle !== undefined) return runtime.memoryLifecycle;
  const key = runtime as object;
  let context = memoryLifecycleContexts.get(key);
  if (context === undefined) {
    context = import("./memory-lifecycle-tools.js").then(({ createMemoryLifecycleContext }) =>
      createMemoryLifecycleContext({
        env: runtime.env,
        cwd: process.cwd(),
        now: runtime.now,
        createId: runtime.createId
      })
    );
    memoryLifecycleContexts.set(key, context);
  }
  return context;
};

const closeMemoryLifecycleFor = async (runtime: DecisionPacketMcpRuntime): Promise<void> => {
  if (runtime.memoryLifecycle !== undefined) return;
  const context = memoryLifecycleContexts.get(runtime as object);
  if (context !== undefined) await (await context).close();
  memoryLifecycleContexts.delete(runtime as object);
};

export interface DecisionPacketMcpSession {
  phase: "new" | "initialize_responded" | "ready";
}

const protocolVersion = "2025-06-18";
const serverName = "krn-decision-packet-mcp";
const serverVersion = "0.0.0";
const decisionPacketToolName = "krn_decision_packet";
const decisionPacketExecutionErrorClass = "decision_packet_execution_failed";
const decisionPacketExecutionErrorText =
  `KRN DecisionPacket execution failed (error_class=${decisionPacketExecutionErrorClass}). `
  + "Verify the runId and KRN database readiness, then retry.";
const decisionPacketOutputLimitErrorText =
  "KRN DecisionPacket output exceeds the MCP transport budget "
  + "(error_class=decision_packet_output_limit_exceeded).";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface InitializeRequestParams {
  readonly protocolVersion: string;
  readonly capabilities: Record<string, unknown>;
  readonly clientInfo: {
    readonly name: string;
    readonly title?: string;
    readonly version: string;
  };
}

const isString = (value: unknown): value is string => typeof value === "string";

const decodeClientInfo = (
  value: unknown
): InitializeRequestParams["clientInfo"] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = value["name"];
  const title = value["title"];
  const version = value["version"];

  if (!isString(name) || !isString(version)) {
    return undefined;
  }
  if (title !== undefined && !isString(title)) {
    return undefined;
  }

  return {
    name,
    ...(title === undefined ? {} : { title }),
    version
  };
};

const decodeInitializeRequestParams = (
  value: unknown
): InitializeRequestParams | undefined => {
  if (!isRecord(value) || !isRecord(value["capabilities"])) {
    return undefined;
  }

  const protocolVersionValue = value["protocolVersion"];
  const clientInfo = decodeClientInfo(value["clientInfo"]);

  if (!isString(protocolVersionValue) || clientInfo === undefined) {
    return undefined;
  }

  return {
    protocolVersion: protocolVersionValue,
    capabilities: value["capabilities"],
    clientInfo
  };
};

const isJsonRpcRequestId = (value: unknown): value is JsonRpcId =>
  typeof value === "string" || (typeof value === "number" && Number.isFinite(value));

interface ListToolsParams {
  readonly _meta?: Record<string, unknown>;
  readonly cursor?: string;
}

const listToolsParamKeys = new Set(["_meta", "cursor"]);

const hasOnlyListToolsParamKeys = (value: Record<string, unknown>): boolean =>
  Object.keys(value).every((key) => listToolsParamKeys.has(key));

const isOptionalRecord = (value: unknown): value is Record<string, unknown> | undefined =>
  value === undefined || isRecord(value);

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === "string";

const decodeListToolsParams = (value: unknown): ListToolsParams | undefined => {
  if (value === undefined) {
    return {};
  }

  if (!isRecord(value)) {
    return undefined;
  }
  if (!hasOnlyListToolsParamKeys(value)) {
    return undefined;
  }
  if (!isOptionalRecord(value["_meta"])) {
    return undefined;
  }
  if (!isOptionalString(value["cursor"])) {
    return undefined;
  }

  return {
    ...(value["_meta"] === undefined ? {} : { _meta: value["_meta"] }),
    ...(value["cursor"] === undefined ? {} : { cursor: value["cursor"] })
  };
};

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

const requireJsonValue = (value: unknown): JsonValue => {
  if (!isJsonValue(value)) {
    throw new Error("DecisionPacket MCP output must be JSON-serializable");
  }

  return value;
};

const textResult = (
  text: string,
  isError = false
): ToolCallResult => ({
  content: [{
    type: "text",
    text
  }],
  isError
});

const outputLimitResult = (): ToolCallResult =>
  textResult(decisionPacketOutputLimitErrorText, true);

const briefResult = (
  readback: DecisionPacketContractReadback,
  brief: string
): ToolCallResult => ({
  content: [{
    type: "text",
    text: [
      `KRN DecisionPacket checksum: ${readback.packetIdentity.checksum}.`,
      "Read-only context; no memory or source authority was mutated.",
      "",
      brief.trimEnd()
    ].join("\n")
  }],
  structuredContent: requireJsonValue(readback.packetIdentity),
  isError: false
});

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

const decisionPacketToolDefinition = (): JsonValue => ({
  name: decisionPacketToolName,
  title: "KRN DecisionPacket",
  description:
    "Return a compact read-only DecisionPacket execution brief and exact issuance identity for a persisted run.",
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
  outputSchema: decisionPacketIdentityOutputSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  }
});

const memoryToolDefinitions = (): readonly JsonValue[] => [
  {
    name: "remember",
    title: "KRN Remember",
    description: "Propose a governed SQLite memory candidate; never creates a MemoryRecord.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" }, kind: { type: "string", enum: ["fact", "preference", "constraint", "procedure", "risk"] },
        owner: { type: "string" }, confidence: { type: "integer", minimum: 0, maximum: 100 },
        summary: { type: "string" }, applicationGuidance: { type: "string" }, invalidationRule: { type: "string" },
        validFrom: { type: "string" }, validUntil: { type: "string" }, sourceClaimIds: { type: "array", items: { type: "string" } }
      }, required: ["content", "kind", "owner", "confidence"], additionalProperties: false
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  },
  {
    name: "recall", title: "KRN Recall", description: "Read active governed memory for the connected project.",
    inputSchema: {
      type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 64 } },
      required: ["query"], additionalProperties: false
    },
    outputSchema: { type: "object", properties: { kind: { const: "krn.memory.recall.readback.v1" } }, required: ["kind"] },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "brief", title: "KRN Memory Brief", description: "Read a deterministic, token-budgeted memory brief.",
    inputSchema: {
      type: "object", properties: { tokenBudget: { type: "integer", minimum: 1, maximum: 100000 } }, additionalProperties: false
    },
    outputSchema: { type: "object", properties: { kind: { const: "krn.memory.brief.v1" } }, required: ["kind"] },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

const allToolDefinitions = (): readonly JsonValue[] => [
  decisionPacketToolDefinition(),
  ...memoryToolDefinitions()
];

const initializeResult = (
  requestedVersion: string
): JsonValue => {
  return {
    protocolVersion: requestedVersion === protocolVersion
      ? requestedVersion
      : protocolVersion,
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
      "Use krn_decision_packet to fetch a compact read-only DecisionPacket execution brief for an existing runId. Use recall and brief for governed reads; remember proposes SQLite candidates only. Treat KRN as context authority, not an executor: this server does not execute Codex, mutate target repos, promote memory/source truth, or capture feedback by side effect. Exact issuance identity remains structured; detailed operator readback stays on the CLI surface."
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
  const commandResult = await (runtime.runDecisionPacket ?? runDecisionPacketCommand)(commandRuntime);

  const parsed: unknown = JSON.parse(commandResult.stdout);
  const readback = parseDecisionPacketContractReadback(parsed, runId);

  if (readback === undefined) {
    return textResult(
      "krn decision packet command returned an invalid DecisionPacket contract",
      true
    );
  }

  const brief = renderExecutionBrief({ packet: readback.packet });

  const result = briefResult(readback, brief);

  if (
    measureDecisionPacketTransport(result).utf8Bytes
      > decisionPacketTransportBudget.maximumMessageUtf8Bytes
  ) {
    return outputLimitResult();
  }

  return result;
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

  if (
    Object.keys(params).some((key) => key !== "name" && key !== "arguments" && key !== "_meta") ||
    (params["_meta"] !== undefined && !isRecord(params["_meta"]))
  ) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: "tools/call params contain an unknown property"
      }
    };
  }

  const toolName = params["name"];
  if (toolName !== decisionPacketToolName && toolName !== "remember" && toolName !== "recall" && toolName !== "brief") {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message: `Unknown tool: ${String(params["name"])}`
      }
    };
  }

  const args = params["arguments"];

  if (toolName === "remember" || toolName === "recall" || toolName === "brief") {
    if (args !== undefined && !isRecord(args)) {
      return { kind: "protocol_error", error: { code: -32602, message: `${toolName} arguments must be an object` } };
    }
    const memoryContext = await memoryLifecycleFor(runtime);
    const tools = await import("./memory-lifecycle-tools.js");
    const toolResult = toolName === "remember"
      ? await tools.runRememberTool(runtime, memoryContext, args ?? {})
      : toolName === "recall"
        ? await tools.runRecallTool(runtime, memoryContext, args ?? {})
        : await tools.runBriefTool(runtime, memoryContext, args ?? {});
    return { kind: "result", result: toolResult as ToolCallResult };
  }

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

  const runId = args["runId"].trim();

  if (
    Buffer.byteLength(runId, "utf8")
      > decisionPacketTransportBudget.maximumRunIdUtf8Bytes
  ) {
    return {
      kind: "protocol_error",
      error: {
        code: -32602,
        message:
          `krn_decision_packet runId exceeds ${decisionPacketTransportBudget.maximumRunIdUtf8Bytes} UTF-8 bytes`
      }
    };
  }

  try {
    return {
      kind: "result",
      result: await runDecisionPacket(runtime, runId)
    };
  } catch (error) {
    return {
      kind: "result",
      result: error instanceof ExecutionBriefRenderBudgetError
        ? outputLimitResult()
        : textResult(decisionPacketExecutionErrorText, true)
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

const advanceSessionForNotification = (
  message: JsonRpcRequest,
  session: DecisionPacketMcpSession
): void => {
  if (message.method !== "notifications/initialized") {
    return;
  }
  if (session.phase !== "initialize_responded") {
    return;
  }
  if (message.params !== undefined && !isRecord(message.params)) {
    return;
  }

  session.phase = "ready";
};

const requestAllowedInPhase = (
  method: string,
  phase: DecisionPacketMcpSession["phase"]
): boolean => phase === "ready" || method === "initialize" || method === "ping";

const handleInitializeRequest = (
  message: JsonRpcRequest,
  session: DecisionPacketMcpSession
): JsonRpcResponse => {
  if (session.phase !== "new") {
    return errorResponse(
      requestId(message),
      -32600,
      "Initialize request is not allowed after initialization has started"
    );
  }

  const initializeParams = decodeInitializeRequestParams(message.params);

  if (initializeParams === undefined) {
    return errorResponse(requestId(message), -32602, "Invalid initialize params");
  }

  session.phase = "initialize_responded";
  return response(
    requestId(message),
    initializeResult(initializeParams.protocolVersion)
  );
};

const handleListToolsRequest = (message: JsonRpcRequest): JsonRpcResponse => {
  const params = decodeListToolsParams(message.params);

  if (params === undefined) {
    return errorResponse(requestId(message), -32602, "Invalid tools/list params");
  }
  if (params.cursor !== undefined) {
    return errorResponse(requestId(message), -32602, "Invalid tools/list cursor");
  }

  return response(requestId(message), {
    tools: [...allToolDefinitions()]
  });
};

export const handleDecisionPacketMcpMessage = async (
  value: unknown,
  runtime: DecisionPacketMcpRuntime
): Promise<JsonRpcResponse | undefined> => {
  const message = parseRequest(value);

  if (message === undefined) {
    return errorResponse(null, -32600, "Invalid JSON-RPC request");
  }

  const session = sessionFor(runtime);

  if (message.id === undefined) {
    advanceSessionForNotification(message, session);
    return undefined;
  }

  if (!requestAllowedInPhase(message.method, session.phase)) {
    return errorResponse(requestId(message), -32002, "Server not initialized");
  }

  switch (message.method) {
    case "initialize":
      return handleInitializeRequest(message, session);
    case "ping":
      return response(requestId(message), {});
    case "tools/list":
      return handleListToolsRequest(message);
    case "tools/call": {
      const outcome = await runToolCall(runtime, message.params);
      if (outcome.kind === "protocol_error") {
        return errorResponse(requestId(message), outcome.error.code, outcome.error.message);
      }

      const reply = response(requestId(message), outcome.result);
      return outcome.result.isError === true ||
        measureDecisionPacketTransport(reply).utf8Bytes
          <= decisionPacketTransportBudget.maximumMessageUtf8Bytes
        ? reply
        : response(requestId(message), outputLimitResult());
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
  session: { phase: "new" }
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

  const created: DecisionPacketMcpSession = { phase: "new" };
  sessions.set(runtime, created);
  return created;
};

export const serveDecisionPacketMcpStdio = async (
  input: AsyncIterable<Buffer | string>,
  output: WritableOutput,
  runtime: DecisionPacketMcpRuntime = defaultRuntime()
): Promise<void> => {
  const serverRuntime: DecisionPacketMcpRuntime = runtime;
  const shutdown = (): void => {
    void closeMemoryLifecycleFor(serverRuntime).catch(() => {
      process.exitCode = 1;
    });
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  let lineChunks: Buffer[] = [];
  let lineUtf8Bytes = 0;
  let discardingOversizeLine = false;

  const writeParseError = (): void => {
    output.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error"))}\n`);
  };
  const writeInputLimitError = (): void => {
    output.write(`${JSON.stringify(errorResponse(
      null,
      -32001,
      `MCP input line exceeds ${decisionPacketTransportBudget.maximumInputLineUtf8Bytes} UTF-8 bytes`
    ))}\n`);
  };

  const resetLine = (): void => {
    lineChunks = [];
    lineUtf8Bytes = 0;
    discardingOversizeLine = false;
  };

  const appendLineBytes = (bytes: Buffer): void => {
    if (discardingOversizeLine) {
      return;
    }

    const nextLineUtf8Bytes = lineUtf8Bytes + bytes.byteLength;
    if (nextLineUtf8Bytes > decisionPacketTransportBudget.maximumInputLineUtf8Bytes) {
      lineChunks = [];
      lineUtf8Bytes = 0;
      discardingOversizeLine = true;
      writeInputLimitError();
      return;
    }

    if (bytes.byteLength > 0) {
      lineChunks.push(bytes);
    }
    lineUtf8Bytes = nextLineUtf8Bytes;
  };

  const processCompleteLine = async (): Promise<void> => {
    if (discardingOversizeLine) {
      resetLine();
      return;
    }

    const bytes = Buffer.concat(lineChunks, lineUtf8Bytes);
    resetLine();

    let line: string;
    try {
      line = new TextDecoder("utf-8", { fatal: true }).decode(bytes).trim();
    } catch {
      writeParseError();
      return;
    }

    if (line.length === 0) {
      return;
    }

    let parsed: unknown;
    try {
      const decoded: unknown = JSON.parse(line);
      parsed = decoded;
    } catch {
      writeParseError();
      return;
    }

    const reply = await handleDecisionPacketMcpMessage(parsed, serverRuntime);
    if (reply !== undefined) {
      output.write(`${JSON.stringify(reply)}\n`);
    }
  };

  try {
    for await (const chunk of input) {
      const bytes = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;
      let offset = 0;

      for (;;) {
        const lineEnd = bytes.indexOf(0x0a, offset);
        if (lineEnd === -1) {
          appendLineBytes(bytes.subarray(offset));
          break;
        }

        appendLineBytes(bytes.subarray(offset, lineEnd));
        await processCompleteLine();
        offset = lineEnd + 1;

        if (offset === bytes.byteLength) {
          break;
        }
      }
    }
  } finally {
    process.removeListener("SIGINT", shutdown);
    process.removeListener("SIGTERM", shutdown);
    await closeMemoryLifecycleFor(serverRuntime);
  }
};

if (isCliEntrypoint(import.meta.url)) {
  await serveDecisionPacketMcpStdio(process.stdin, process.stdout);
}
