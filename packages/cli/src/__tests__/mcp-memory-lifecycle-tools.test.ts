import { describe, expect, it, vi } from "vitest";
import type { MemoryRecord, Project } from "@krn/core";
import type { MemoryLifecycleStore } from "@krn/db";
import {
  runBriefTool,
  runRecallTool,
  runRememberTool,
  type MemoryLifecycleContext,
  type MemoryLifecycleToolRuntime
} from "../internal/mcp/memory-lifecycle-tools.js";

const project = { id: "project-1", localPathHint: "/tmp/target" } as Project;
const record = (kind: MemoryRecord["kind"], id: string): MemoryRecord => ({
  id,
  projectId: project.id,
  key: id,
  kind,
  status: "active",
  summary: `${kind} summary`,
  body: `${kind} body`,
  owner: "operator",
  confidence: 90,
  applicationGuidance: `use ${kind}`,
  sourceClaimIds: [],
  sourceLineage: [{ sourceId: `source-${id}` }],
  isUserPreference: kind === "preference",
  validFrom: "2026-01-01T00:00:00.000Z",
  metadata: {},
  negativeFeedbackCount: 0,
  positiveFeedbackCount: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

const runtime = (): MemoryLifecycleToolRuntime => ({
  env: { INIT_CWD: process.cwd() },
  cwd: process.cwd(),
  now: () => "2026-01-01T00:00:00.000Z",
  createId: (prefix) => `${prefix}:test`
});

const context = (store: Partial<MemoryLifecycleStore>): MemoryLifecycleContext => ({
  serverInstanceId: "server-1",
  getStore: async () => store as MemoryLifecycleStore,
  close: async () => undefined
});

describe("MCP memory lifecycle tools", () => {
  it("rejects missing remember content before acquiring the store", async () => {
    const getStore = vi.fn();
    const output = await runRememberTool(runtime(), context({ getStore }), {
      kind: "fact", owner: "operator", confidence: 80
    });
    expect(output.isError).toBe(true);
    expect(getStore).not.toHaveBeenCalled();
  });

  it("creates a SQLite proposal with stable MCP lineage and default guidance", async () => {
    const createMemoryCandidate = vi.fn(async (input: Record<string, unknown>) => ({
      ...(input as object), id: "candidate-1", status: "proposed"
    })) as MemoryLifecycleStore["memoryRepository"]["createMemoryCandidate"];
    const output = await runRememberTool(runtime(), context({
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      sourceRepository: { getSourceClaimForProject: async () => undefined },
      memoryRepository: { createMemoryCandidate }
    }), { content: "keep this", kind: "fact", owner: "operator", confidence: 90 });
    expect(output.isError).toBe(false);
    expect(createMemoryCandidate).toHaveBeenCalledWith(expect.objectContaining({
      projectId: "project-1", proposedBy: "mcp", status: "proposed",
      applicationGuidance: "keep this", sourceLineage: [{
        sourceId: expect.stringMatching(/^mcp-source:/),
        note: expect.stringContaining("not reviewed")
      }]
    }));
  });

  it("keeps recall read-only and maps brief kinds deterministically", async () => {
    const records = [record("risk", "r1"), record("procedure", "r2"), record("preference", "r3")];
    const listActiveMemory = vi.fn(async () => records);
    const store = {
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      memoryRepository: { listActiveMemory },
      withReadOnly: async (operation: () => Promise<unknown>) => operation()
    } as unknown as MemoryLifecycleStore;
    const recall = await runRecallTool(runtime(), context(store), { query: "risk" });
    expect(recall.isError).toBe(false);
    expect(listActiveMemory).toHaveBeenCalledWith("project-1", 20, expect.objectContaining({ terms: ["risk"], now: runtime().now() }));
    const brief = await runBriefTool(runtime(), context(store), { tokenBudget: 1500 });
    expect(brief.isError).toBe(false);
    expect(brief.structuredContent).toMatchObject({
      sections: [
        { name: "constraints", items: [{ kind: "risk" }] },
        { name: "facts", items: [{ kind: "procedure" }] },
        { name: "preferences", items: [{ kind: "preference" }] }
      ]
    });
  });
});
