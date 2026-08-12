import { createHash } from "node:crypto";
import {
  memoryRecordKinds,
  type MemoryRecord,
  type MemoryRecordKind
} from "@krn/core";
import {
  openMemoryLifecycleStore,
  resolveBackendConfig
} from "@krn/db";
import type { MemoryLifecycleStore } from "@krn/db";
import { tokenizeActivationText } from "@krn/harness";
import {
  memoryRecordToKnowledgeReadModel
} from "../../memory-record-knowledge-read-model.js";
import { resolveTargetWorkspace } from "../../target-workspace.js";

export interface MemoryLifecycleToolRuntime {
  readonly env: Record<string, string | undefined>;
  readonly cwd?: string;
  now(): string;
  createId(prefix: string): string;
}

export interface MemoryLifecycleContext {
  readonly serverInstanceId: string;
  getStore(): Promise<MemoryLifecycleStore>;
  close(): Promise<void>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (value: unknown, field: string): string => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
};

const optionalString = (value: unknown, field: string): string | undefined => {
  if (value === undefined) return undefined;
  return requiredString(value, field);
};

const assertOnlyKeys = (value: Record<string, unknown>, allowed: readonly string[], tool: string): void => {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).find((key) => !allowedSet.has(key));
  if (unknown !== undefined) throw new Error(`${tool} arguments contain unknown property: ${unknown}`);
};

const parseKind = (value: unknown): MemoryRecordKind => {
  const kind = requiredString(value, "kind");
  if (!memoryRecordKinds.includes(kind as MemoryRecordKind)) {
    throw new Error(`kind must be one of ${memoryRecordKinds.join(", ")}`);
  }
  return kind as MemoryRecordKind;
};

const parseConfidence = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("confidence must be an integer between 0 and 100");
  }
  return value;
};

const parseSourceClaimIds = (value: unknown): string[] => {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error("sourceClaimIds must be an array of strings");
  return value.map((item) => requiredString(item, "sourceClaimIds item"));
};

const parseLimit = (value: unknown, defaultValue: number, maximum: number): number => {
  if (value === undefined) return defaultValue;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`limit must be an integer between 1 and ${maximum}`);
  }
  return value;
};

const targetFor = async (runtime: MemoryLifecycleToolRuntime): Promise<string> =>
  resolveTargetWorkspace({ cwd: runtime.cwd ?? process.cwd(), env: runtime.env });

export const createMemoryLifecycleContext = (
  runtime: MemoryLifecycleToolRuntime
): MemoryLifecycleContext => {
  const serverInstanceId = runtime.createId("mcp-server");
  let storePromise: Promise<MemoryLifecycleStore> | undefined;
  let closed = false;

  const getStore = async (): Promise<MemoryLifecycleStore> => {
    if (closed) throw new Error("MCP memory lifecycle is closed");
    storePromise ??= (async () => {
      const targetWorkspace = await targetFor(runtime);
      const config = resolveBackendConfig({ env: runtime.env, targetWorkspace });
      return openMemoryLifecycleStore(config);
    })();
    return storePromise;
  };

  return {
    serverInstanceId,
    getStore,
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      if (storePromise !== undefined) {
        const store = await storePromise;
        await store.close();
      }
    }
  };
};

const connectedProject = async (
  runtime: MemoryLifecycleToolRuntime,
  store: MemoryLifecycleStore
) => {
  const targetWorkspace = await targetFor(runtime);
  const project = await store.projectRepository.getProjectByRepoPath(targetWorkspace);
  if (project === undefined) {
    throw new Error(`No connected project for canonical target workspace ${targetWorkspace}`);
  }
  return project;
};

const result = (structuredContent: unknown, text: string, isError = false): Record<string, unknown> => ({
  content: [{ type: "text", text }],
  structuredContent,
  isError
});

// fallow-ignore-next-line complexity -- remember ingress exhaustively validates fields, backend capability, project-scoped claims, and atomic candidate authority metadata
export const runRememberTool = async (
  runtime: MemoryLifecycleToolRuntime,
  context: MemoryLifecycleContext,
  args: unknown
): Promise<Record<string, unknown>> => {
  try {
    if (!isRecord(args)) throw new Error("remember arguments must be an object");
    assertOnlyKeys(args, ["content", "kind", "owner", "confidence", "summary", "applicationGuidance", "invalidationRule", "validFrom", "validUntil", "sourceClaimIds"], "remember");
    const content = requiredString(args["content"], "content");
    const kind = parseKind(args["kind"]);
    const owner = requiredString(args["owner"], "owner");
    const confidence = parseConfidence(args["confidence"]);
    const applicationGuidance = optionalString(args["applicationGuidance"], "applicationGuidance") ?? content;
    const invalidationRule = optionalString(args["invalidationRule"], "invalidationRule");
    const validFrom = optionalString(args["validFrom"], "validFrom") ?? runtime.now();
    const validUntil = optionalString(args["validUntil"], "validUntil");
    const sourceClaimIds = parseSourceClaimIds(args["sourceClaimIds"]);
    const store = await context.getStore();
    if (store.backend !== "sqlite") {
      return result({ kind: "krn.memory.remember.error.v1", error: "sqlite_write_capability_required" },
        "remember is unavailable: SQLite write capability required", true);
    }
    const project = await connectedProject(runtime, store);
    for (const sourceClaimId of sourceClaimIds) {
      const claim = await store.sourceRepository.getSourceClaimForProject(project.id, sourceClaimId);
      if (claim === undefined || claim.status !== "accepted") {
        throw new Error(`Accepted project SourceClaim not found: ${sourceClaimId}`);
      }
    }
    const sourceId = `mcp-source:${createHash("sha256")
      .update(`${project.id}\0${context.serverInstanceId}`)
      .digest("hex")}`;
    const metadata: Record<string, unknown> = {
      provenance: "mcp_reported",
      ...(sourceClaimIds.length === 0 ? {} : {
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: sourceClaimIds,
          doesNotProve: "MCP proposal content is not independently reviewed by this tool."
        }
      })
    };
    const candidate = await store.memoryRepository.createMemoryCandidate({
      projectId: project.id,
      proposedBy: "mcp",
      kind,
      status: "proposed",
      summary: optionalString(args["summary"], "summary") ?? content,
      body: content,
      owner,
      confidence,
      applicationGuidance,
      ...(invalidationRule === undefined ? {} : { invalidationRule }),
      sourceClaimIds,
      sourceLineage: [{ sourceId, note: "MCP-reported candidate; not reviewed authority" }],
      isUserPreference: false,
      validFrom,
      ...(validUntil === undefined ? {} : { validUntil }),
      metadata
    });
    return result({ kind: "krn.memory.remember.v1", candidateId: candidate.id, status: candidate.status },
      JSON.stringify({ candidateId: candidate.id, status: candidate.status }));
  } catch (error) {
    return result({ kind: "krn.memory.remember.error.v1", error: error instanceof Error ? error.message : "remember failed" },
      error instanceof Error ? error.message : "remember failed", true);
  }
};

export const runRecallTool = async (
  runtime: MemoryLifecycleToolRuntime,
  context: MemoryLifecycleContext,
  args: unknown
): Promise<Record<string, unknown>> => {
  try {
    if (!isRecord(args)) throw new Error("recall arguments must be an object");
    assertOnlyKeys(args, ["query", "limit"], "recall");
    const query = requiredString(args["query"], "query");
    const terms = tokenizeActivationText(query);
    if (terms.length === 0) throw new Error("query must contain at least one searchable term");
    const limit = parseLimit(args["limit"], 20, 64);
    const store = await context.getStore();
    const project = await connectedProject(runtime, store);
    const records = await store.withReadOnly(() => store.memoryRepository.listActiveMemory(project.id, limit, {
      terms,
      now: runtime.now()
    }));
    const readModels = records.map(memoryRecordToKnowledgeReadModel);
    const payload = {
      kind: "krn.memory.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "memory_store",
      sourceBoundary: "store-backed runtime readback",
      usefulnessSource: "store_backed",
      filter: { text: query },
      readModelFiles: [], decisionFiles: [], usefulnessFeedbackFiles: [], catalogFiles: [],
      totalReadModels: readModels.length, returnedReadModels: readModels.length, limit,
      readModels,
      proof: {
        proves: ["memory recall entries were read from DB-backed MemoryRecord rows", "local readback filters were applied deterministically"],
        doesNotProve: ["source truth", "search ranking quality", "that Memory Core was mutated"]
      }
    };
    return result(payload, JSON.stringify(payload));
  } catch (error) {
    return result({ kind: "krn.memory.recall.error.v1", error: error instanceof Error ? error.message : "recall failed" },
      error instanceof Error ? error.message : "recall failed", true);
  }
};

interface BriefItem {
  recordId: string;
  kind: MemoryRecordKind;
  summary: string;
  content: string;
  applicationGuidance: string;
}

const briefSection = (kind: MemoryRecordKind): "constraints" | "facts" | "preferences" =>
  kind === "constraint" || kind === "risk" ? "constraints" : kind === "preference" ? "preferences" : "facts";

const renderBriefText = (sections: Record<string, BriefItem[]>, omitted: string[]): string => {
  const lines = ["KRN Memory Brief"];
  for (const section of ["constraints", "facts", "preferences"] as const) {
    lines.push(`${section.charAt(0).toUpperCase()}${section.slice(1)}:`);
    for (const item of sections[section] ?? []) {
      lines.push(`- [${item.recordId}] ${item.summary}`, `  ${item.content}`, `  Apply: ${item.applicationGuidance}`);
    }
  }
  if (omitted.length > 0) lines.push(`[truncated; omitted memory record ids: ${omitted.join(", ")}]`);
  return lines.join("\n");
};

const emptyBrief = (tokenBudget: number, reason: string): Record<string, unknown> => {
  const sections = ["constraints", "facts", "preferences"].map((name) => ({ name, items: [] }));
  const text = "KRN Memory Brief\nConstraints:\nFacts:\nPreferences:";
  const estimatedTokens = Math.ceil(text.length / 4);
  if (estimatedTokens > tokenBudget) {
    return result(
      {
        kind: "krn.memory.brief.error.v1",
        error: "budget_too_small_for_required_marker",
        tokenBudget,
        requiredTokens: estimatedTokens
      },
      "budget_too_small_for_required_marker",
      true
    );
  }
  const payload = {
    kind: "krn.memory.brief.v1", access: "read_only", mutation: "none", status: "empty",
    emptyReason: reason, tokenBudget, estimatedTokens, truncated: false,
    sections, omittedRecordIds: [], text
  };
  return result(payload, payload.text);
};

// fallow-ignore-next-line complexity -- brief keeps the fixed section, omission-marker, and hard-budget selection matrix auditable in one renderer
export const runBriefTool = async (
  runtime: MemoryLifecycleToolRuntime,
  context: MemoryLifecycleContext,
  args: unknown
): Promise<Record<string, unknown>> => {
  try {
    if (!isRecord(args)) throw new Error("brief arguments must be an object");
    assertOnlyKeys(args, ["tokenBudget"], "brief");
    const tokenBudget = parseLimit(args["tokenBudget"], 1500, 100000);
    let store: MemoryLifecycleStore;
    try {
      store = await context.getStore();
    } catch (error) {
      const message = error instanceof Error ? error.message : "store unavailable";
      if (message.includes("INIT_CWD") || message.includes("not a directory")) {
        return emptyBrief(tokenBudget, "target_workspace_unavailable");
      }
      if (message.includes("does not exist") || message.includes("unavailable")) {
        return emptyBrief(tokenBudget, "store_uninitialized");
      }
      throw error;
    }
    const project = await connectedProject(runtime, store);
    const records = await store.withReadOnly(() => store.memoryRepository.listActiveMemory(project.id, 1000, { now: runtime.now() }));
    const allItems = records.map((record: MemoryRecord): BriefItem => ({
      recordId: record.id, kind: record.kind, summary: record.summary,
      content: record.body, applicationGuidance: record.applicationGuidance
    }));
    let kept = allItems.length;
    let rendered = "";
    while (kept >= 0) {
      const selected = allItems.slice(0, kept);
      const sections: Record<"constraints" | "facts" | "preferences", BriefItem[]> = {
        constraints: [], facts: [], preferences: []
      };
      selected.forEach((item) => sections[briefSection(item.kind)].push(item));
      const omitted = allItems.slice(kept).map((item) => item.recordId);
      rendered = renderBriefText(sections, omitted);
      if (Math.ceil(rendered.length / 4) <= tokenBudget) {
        const payload = {
          kind: "krn.memory.brief.v1", access: "read_only", mutation: "none",
          status: allItems.length === 0 ? "empty" : "ready", projectId: project.id,
          ...(allItems.length === 0 ? { emptyReason: "no_active_memory" } : {}), tokenBudget,
          estimatedTokens: Math.ceil(rendered.length / 4), truncated: omitted.length > 0,
          sections: (["constraints", "facts", "preferences"] as const).map((name) => ({ name, items: sections[name] })),
          omittedRecordIds: omitted, text: rendered
        };
        return result(payload, rendered);
      }
      kept -= 1;
    }
    throw new Error("budget_too_small_for_required_marker");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("No connected project")) {
      const tokenBudget = isRecord(args) ? parseLimit(args["tokenBudget"], 1500, 100000) : 1500;
      return emptyBrief(tokenBudget, "no_connected_project");
    }
    return result({ kind: "krn.memory.brief.error.v1", error: error instanceof Error ? error.message : "brief failed" },
      error instanceof Error ? error.message : "brief failed", true);
  }
};
