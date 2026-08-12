import { describe, expect, it, vi } from "vitest";
import type {
  MemoryCandidate,
  MemoryRecord,
  SourceClaim
} from "@krn/core";
import type {
  CreateMemoryCandidateInput,
  ProjectRecord
} from "@krn/core/repositories/internal";
import type { MemoryLifecycleStore } from "@krn/db";
import {
  runBriefTool,
  runRecallTool,
  runRememberTool,
  type MemoryLifecycleContext,
  type MemoryLifecycleToolRuntime
} from "../internal/mcp/memory-lifecycle-tools.js";

const project: ProjectRecord = {
  id: "project-1",
  workspaceId: "workspace-1",
  slug: "project-1",
  displayName: "Project 1",
  metadata: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};
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

const sourceClaim = (id: string, status: SourceClaim["status"]): SourceClaim => ({
  id,
  sourceArtifactId: "artifact-1",
  claim: "claim",
  mechanism: "mechanism",
  krnImplication: "implication",
  doesNotProve: "does not prove",
  sourceAuthority: "official",
  supportType: "supports",
  consumer: "mcp-test",
  status,
  metadata: {},
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

describe("MCP memory lifecycle tools", () => {
  it("rejects missing remember content before acquiring the store", async () => {
    const getStore = vi.fn(async () => {
      throw new Error("store should not be acquired");
    });
    const lifecycle: MemoryLifecycleContext = {
      serverInstanceId: "server-1",
      getStore,
      close: async () => undefined
    };
    const output = await runRememberTool(runtime(), lifecycle, {
      kind: "fact", owner: "operator", confidence: 80
    });
    expect(output.isError).toBe(true);
    expect(getStore).not.toHaveBeenCalled();
  });

  it("creates a SQLite proposal with stable MCP lineage and default guidance", async () => {
    const createMemoryCandidate = vi.fn(async (input: CreateMemoryCandidateInput) => ({
      ...input, id: "candidate-1", status: "proposed"
    } as unknown as MemoryCandidate));
    const output = await runRememberTool(runtime(), context({
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      sourceRepository: {
        getSourceClaimById: async () => undefined,
        getSourceClaimForProject: async () => undefined
      },
      memoryRepository: {
        createMemoryCandidate,
        getMemoryCandidateById: async () => undefined,
        promoteReviewedMemoryCandidate: async () => { throw new Error("unused"); },
        listActiveMemory: async () => []
      }
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

  it("attaches accepted project-scoped SourceClaim evidence without mutating the claim", async () => {
    const claim = sourceClaim("claim-local", "accepted");
    const createMemoryCandidate = vi.fn(async (input: CreateMemoryCandidateInput) => ({
      ...input, id: "candidate-with-claim", status: "proposed"
    } as unknown as MemoryCandidate));
    const getSourceClaimForProject = vi.fn(async (projectId: string, id: string) => {
      expect(projectId).toBe(project.id);
      return id === claim.id ? claim : undefined;
    });
    const output = await runRememberTool(runtime(), context({
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      sourceRepository: {
        getSourceClaimById: async () => claim,
        getSourceClaimForProject
      },
      memoryRepository: {
        createMemoryCandidate,
        getMemoryCandidateById: async () => undefined,
        promoteReviewedMemoryCandidate: async () => { throw new Error("unused"); },
        listActiveMemory: async () => []
      }
    }), {
      content: "claim-backed proposal", kind: "fact", owner: "operator", confidence: 90,
      sourceClaimIds: [claim.id]
    });

    expect(output.isError).toBe(false);
    expect(getSourceClaimForProject).toHaveBeenCalledWith(project.id, claim.id);
    expect(createMemoryCandidate).toHaveBeenCalledWith(expect.objectContaining({
      sourceClaimIds: [claim.id],
      metadata: expect.objectContaining({
        provenance: "mcp_reported",
        reflectionCandidateEvidence: {
          provenance: "source_claim",
          evidenceRefs: [claim.id],
          doesNotProve: expect.any(String)
        }
      })
    }));
    expect(claim.status).toBe("accepted");
  });

  it.each([
    ["foreign", undefined],
    ["rejected", sourceClaim("claim-rejected", "rejected")],
    ["unknown", undefined]
  ] as const)("rejects %s SourceClaim evidence without inserting a candidate", async (label, lookupResult) => {
    const claimId = label === "rejected" ? "claim-rejected" : `claim-${label}`;
    const createMemoryCandidate = vi.fn(async (input: CreateMemoryCandidateInput) => ({
      ...input, id: "should-not-exist", status: "proposed"
    } as unknown as MemoryCandidate));
    const output = await runRememberTool(runtime(), context({
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      sourceRepository: {
        getSourceClaimById: async () => lookupResult,
        getSourceClaimForProject: async (_projectId: string, id: string) => id === claimId ? lookupResult : undefined
      },
      memoryRepository: {
        createMemoryCandidate,
        getMemoryCandidateById: async () => undefined,
        promoteReviewedMemoryCandidate: async () => { throw new Error("unused"); },
        listActiveMemory: async () => []
      }
    }), {
      content: "unverified proposal", kind: "fact", owner: "operator", confidence: 90,
      sourceClaimIds: [claimId]
    });

    expect(output.isError).toBe(true);
    expect(String(output.structuredContent)).not.toContain("should-not-exist");
    expect(createMemoryCandidate).not.toHaveBeenCalled();
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

  it("reports a budget error when an empty brief shell cannot fit", async () => {
    const store = {
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => undefined },
      memoryRepository: { listActiveMemory: async () => [] },
      withReadOnly: async (operation: () => Promise<unknown>) => operation()
    } as unknown as MemoryLifecycleStore;
    const brief = await runBriefTool(runtime(), context(store), { tokenBudget: 1 });
    expect(brief.isError).toBe(true);
    expect(brief.structuredContent).toMatchObject({
      error: "budget_too_small_for_required_marker",
      tokenBudget: 1
    });
  });

  it("keeps the complete omitted-id marker within a truncation budget", async () => {
    const records = [record("fact", "record-1"), record("fact", "record-2"), record("fact", "record-3")];
    const listActiveMemory = vi.fn(async () => records);
    const store = {
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      memoryRepository: { listActiveMemory },
      withReadOnly: async (operation: () => Promise<unknown>) => operation()
    } as unknown as MemoryLifecycleStore;
    const expectedRendered = [
      "KRN Memory Brief",
      "Constraints:",
      "Facts:",
      "- [record-1] fact summary",
      "  fact body",
      "  Apply: use fact",
      "Preferences:",
      "[truncated; omitted memory record ids: record-2, record-3]"
    ].join("\n");
    const budget = Math.ceil(expectedRendered.length / 4);
    const brief = await runBriefTool(runtime(), context(store), { tokenBudget: budget });
    expect(brief.isError).toBe(false);
    expect(brief.structuredContent).toMatchObject({
      truncated: true,
      omittedRecordIds: ["record-2", "record-3"]
    });
    const payload = brief.structuredContent as { estimatedTokens: number; tokenBudget: number; text: string };
    expect(payload.estimatedTokens).toBeLessThanOrEqual(payload.tokenBudget);
    expect(payload.text).toContain("record-2, record-3");
  });

  it("reports a budget error when the omission marker itself cannot fit", async () => {
    const records = [record("fact", "record-with-a-long-id")];
    const store = {
      backend: "sqlite",
      projectRepository: { getProjectByRepoPath: async () => project },
      memoryRepository: { listActiveMemory: async () => records },
      withReadOnly: async (operation: () => Promise<unknown>) => operation()
    } as unknown as MemoryLifecycleStore;
    const brief = await runBriefTool(runtime(), context(store), { tokenBudget: 1 });
    expect(brief.isError).toBe(true);
    expect(brief.structuredContent).toMatchObject({ error: "budget_too_small_for_required_marker" });
  });
});
