import {
  mkdtemp,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import {
  runBrainRecallCommand
} from "../run-brain-recall-command.js";

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
const cliPackageRoot = fileURLToPath(new URL("../..", import.meta.url));
const readModelFile = "tests/fixtures/brain-knowledge/read-models/ts-boundary-unknown-first-result-state.json";
const knowledgeFile = "corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json";
const catalogFile = "corpus/brain-knowledge/catalog.json";

describe("runBrainRecallCommand", () => {
  it("renders a read-only brain recall preview", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [readModelFile],
      decisionFiles: [],
      catalogFiles: [],
      filter: {
        kind: "pattern",
        status: "active",
        reviewability: "ready",
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("KRN Brain Recall");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Source: explicit_files");
    expect(result.stdout).toContain("Source boundary: bootstrap/fixture/migration input only; not runtime memory");
    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("sourceRefs:");
    expect(result.stdout).toContain("evidenceRefs:");
    expect(result.stdout).toContain("falsifier:");
    expect(result.stdout).toContain("doesNotProve:");
    expect(result.stdout).toContain("does not prove: KRN is product-ready");
  });

  it("renders json preview without mutation authority", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [readModelFile],
      decisionFiles: [],
      catalogFiles: [],
      filter: {
        text: "unknown-first"
      },
      format: "json"
    });
    const parsed: unknown = JSON.parse(result.stdout);

    if (!isRecord(parsed)) {
      throw new Error("knowledge JSON output must be an object");
    }

    expect(parsed).toMatchObject({
      kind: "krn.brain.recall.readback.v1",
      access: "read_only",
      mutation: "none",
      source: "explicit_files",
      sourceBoundary: "bootstrap/fixture/migration input only; not runtime memory"
    });

    const readModels = parsed["readModels"];
    const proof = parsed["proof"];

    expect(Array.isArray(readModels)).toBe(true);
    if (!Array.isArray(readModels)) {
      throw new Error("knowledge JSON output readModels must be an array");
    }
    expect(readModels).toHaveLength(1);
    expect(isRecord(readModels[0]) ? readModels[0]["id"] : undefined).toBe(
      "pattern:ts-boundary-unknown-first-result-state"
    );
    expect(isRecord(proof) && Array.isArray(proof["doesNotProve"])
      ? proof["doesNotProve"]
      : []).toContain("KRN is product-ready");
  });

  it("rejects invalid readModel files", async () => {
    await expect(runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: ["package.json"],
      decisionFiles: [],
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid KnowledgeReadModel file: package.json");
  });

  it("renders brain recall produced from knowledge decision files", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [knowledgeFile],
      catalogFiles: [],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Decision files: corpus/brain-knowledge/knowledge/ts-boundary-unknown-first-result-state.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("does not prove: brain recall readback was produced from live DB state");
    expect(result.stdout).toContain("does not prove: explicit file or catalog-backed knowledge is runtime memory");
  });

  it("rejects invalid decision files", async () => {
    await expect(runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: ["package.json"],
      catalogFiles: [],
      filter: {},
      format: "text"
    })).rejects.toThrow("Invalid decision file: package.json");
  });

  it("renders brain recall from explicit catalog files", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: corpus/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("Source boundary: bootstrap/fixture/migration input only; not runtime memory");
    expect(result.stdout).toContain(
      "corpus/brain-knowledge/catalog.json:knowledge/source-to-decision-retention-gate.json"
    );
    expect(result.stdout).toContain(
      "corpus/brain-knowledge/catalog.json:knowledge/ts-boundary-unknown-first-result-state.json"
    );
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("renders self-contained html preview with proof boundaries", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("<title>KRN Brain Recall</title>");
    expect(result.stdout).toContain("type=\"search\"");
    expect(result.stdout).toContain("id=\"kindFilter\"");
    expect(result.stdout).toContain("id=\"statusFilter\"");
    expect(result.stdout).toContain("id=\"reviewabilityFilter\"");
    expect(result.stdout).toContain("id=\"usefulnessOutcomeFilter\"");
    expect(result.stdout).toContain("id=\"nextActionFilter\"");
    expect(result.stdout).toContain("Kind: pattern");
    expect(result.stdout).toContain("Status: active");
    expect(result.stdout).toContain("Reviewability: ready");
    expect(result.stdout).toContain("Next action: use");
    expect(result.stdout).toContain("Access: read-only");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("Source boundary: bootstrap/fixture/migration input only; not runtime memory");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("data-kind=\"pattern\"");
    expect(result.stdout).toContain("data-status=\"active\"");
    expect(result.stdout).toContain("data-reviewability=\"ready\"");
    expect(result.stdout).toContain("data-usefulness-outcome=");
    expect(result.stdout).toContain("data-next-action=\"use\"");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("matchesFilter(readModel, \"kind\", kindFilter.value)");
    expect(result.stdout).toContain("matchesFilter(readModel, \"usefulnessOutcome\", usefulnessOutcomeFilter.value)");
    expect(result.stdout).toContain("search.addEventListener");
    expect(result.stdout).toContain("kindFilter.addEventListener");
  });

  it("renders every catalog readModel in html with proof-boundary fields", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "html"
    });

    expect(result.stdout).toContain("pattern:evidence-proof-non-proof-boundary");
    expect(result.stdout).toContain("pattern:knowledge-read-only-preview-boundary");
    expect(result.stdout).toContain("pattern:consensus-relation-maintenance-review-boundary");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("pattern:graph-relation-readback-boundary");
    expect(result.stdout).toContain("pattern:maintenance-candidate-only-runtime-boundary");
    expect(result.stdout).toContain("pattern:target-repo-write-authority-boundary");
    expect(result.stdout).toContain("pattern:untrusted-context-warning-boundary");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
    expect(result.stdout).toContain("Brain recall readback/search remains read-only until usefulness proof");
    expect(result.stdout).toContain("Consensus relation maintenance review boundary");
    expect(result.stdout).toContain("Evidence proof and non-proof boundary");
    expect(result.stdout).toContain("Graph relation readback boundary");
    expect(result.stdout).toContain("Maintenance candidate-only runtime boundary");
    expect(result.stdout).toContain("Source-to-decision retention gate");
    expect(result.stdout).toContain("Target repo writes require explicit authority and rollback");
    expect(result.stdout).toContain("Untrusted selected context is labeled before Codex use");
    expect(result.stdout).toContain("Unknown-first external boundary with explicit result state");
    expect(result.stdout).toContain("Source refs");
    expect(result.stdout).toContain("Evidence refs");
    expect(result.stdout).toContain("Falsifier");
    expect(result.stdout).toContain("Does not prove");
    expect(result.stdout).toContain("Proof Boundaries");
    expect(result.stdout).toContain("Mutation: none");
    expect(result.stdout).toContain("does not prove:");
    expect(result.stdout).toContain("This knowledge decision does not prove command truth");
  });

  it("executes static html text and field filters in a DOM-capable smoke", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-knowledge-preview-"));
    const patternReadModelPath = path.join(directory, "pattern-readModel.json");
    const memoryReadModelPath = path.join(directory, "memory-readModel.json");

    await writeFile(patternReadModelPath, JSON.stringify(knowledgeReadModel({
      id: "pattern:skill-routing",
      kind: "pattern",
      status: "active",
      title: "Skill routing",
      summary: "Use progressive-disclosure skills for repeated workflows.",
      reviewability: "ready",
      usefulnessOutcome: "helped",
      nextAction: "use"
    })));
    await writeFile(memoryReadModelPath, JSON.stringify(knowledgeReadModel({
      id: "memory:stale-dashboard",
      kind: "memory",
      status: "stale",
      title: "Stale dashboard plan",
      summary: "Do not treat old dashboard plans as active product truth.",
      reviewability: "needs_more_evidence",
      nextAction: "defer"
    })));

    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [patternReadModelPath, memoryReadModelPath],
      decisionFiles: [],
      catalogFiles: [],
      filter: {},
      format: "html"
    });
    const smoke = executeKnowledgePreviewHtml(result.stdout);

    expect(smoke.count()).toBe("Results: 2");

    smoke.setSearch("skill");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setSearch("");
    smoke.setFilter("usefulnessOutcomeFilter", "helped");
    expect(smoke.visibleIds()).toEqual(["pattern:skill-routing"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("usefulnessOutcomeFilter", "");
    smoke.setFilter("kindFilter", "memory");
    expect(smoke.visibleIds()).toEqual(["memory:stale-dashboard"]);
    expect(smoke.count()).toBe("Results: 1");

    smoke.setFilter("reviewabilityFilter", "ready");
    expect(smoke.visibleIds()).toEqual([]);
    expect(smoke.count()).toBe("Results: 0");
    expect(smoke.emptyDisplay()).toBe("block");
  });

  it("resolves root-relative catalog files from a package cwd", async () => {
    const result = await runBrainRecallCommand({
      cwd: cliPackageRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown-first"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Catalog files: corpus/brain-knowledge/catalog.json");
    expect(result.stdout).toContain("pattern:ts-boundary-unknown-first-result-state");
  });

  it("searches the second brain recall through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("pattern:source-to-decision-retention-gate");
    expect(result.stdout).toContain("Source-to-decision retention gate");
  });

  it("searches the evidence proof boundary pattern through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "command provenance"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:evidence-proof-non-proof-boundary"]);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("searches the graph relation readback pattern through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "SourceClaimEdge relationSupport GraphRAG"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:graph-relation-readback-boundary"]);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("searches the maintenance candidate-only runtime pattern through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "maintenance scheduler daemon automatic memory source mutation"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:maintenance-candidate-only-runtime-boundary"]);
    expect(preview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(preview.mutation).toBe("none");
  });

  it("searches the consensus relation maintenance review pattern through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "consensus relation maintenance review boundary"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:consensus-relation-maintenance-review-boundary"]);
    expect(preview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(preview.mutation).toBe("none");
  });

  it("filters brain recall readModels by usefulness outcome", async () => {
    const helpedResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped"
      },
      format: "json"
    });
    const noiseResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "noise"
      },
      format: "json"
    });

    const helpedPreview = parsePreviewResource(helpedResult.stdout);
    const noisePreview = parsePreviewResource(noiseResult.stdout);

    expect(readModelIds(helpedPreview)).toEqual([]);
    expect(readModelIds(noisePreview)).toEqual([]);
  });

  it("limits filtered catalog readback without hiding total result count", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none"
      },
      format: "json",
      limit: 2
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalReadModels).toBe(13);
    expect(preview.returnedReadModels).toBe(2);
    expect(preview.limit).toBe(2);
    expect(preview.readModels).toHaveLength(2);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text preview limit with total filtered result boundary", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none"
      },
      format: "text",
      limit: 1
    });

    expect(result.stdout).toContain("Results: 1");
    expect(result.stdout).toContain("Total filtered results: 13");
    expect(result.stdout).toContain("Limit: 1");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("filters brain recall readModels with no usefulness feedback", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toHaveLength(13);
  });

  it("combines missing usefulness feedback and text filters", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "none",
        text: "untrusted"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:untrusted-context-warning-boundary"]);
  });

  it("renders no-match guidance for over-filtered pattern queries", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "brain recall pattern gate source slice operator UX TypeScript"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(preview.totalReadModels).toBe(0);
    expect(preview.returnedReadModels).toBe(0);
    expect(readModelIds(preview)).toEqual([]);
    expect(preview.noMatchGuidance).toContain("No brain recall entries matched the current filters.");
    expect(preview.noMatchGuidance).toContain(
      "Try a shorter --text query or split the query into one mechanism term."
    );
    expect(preview.noMatchGuidance).toContain(
      "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
    );
    expect(preview.noMatchGuidance).toContain(
      "If no recalled memory applies after retry, record an explicit rejected_or_deferred_memory reason before coding."
    );
    expect(preview.noMatchGuidance).toContain(
      "Zero results do not prove that no relevant pattern exists or that search ranking is good."
    );
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.mutation).toBe("none");
  });

  it("renders text no-match guidance with proof boundaries", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "brain recall pattern gate source slice operator UX TypeScript"
      },
      format: "text"
    });

    expect(result.stdout).toContain("Results: 0");
    expect(result.stdout).toContain("Total filtered results: 0");
    expect(result.stdout).toContain("No-match guidance:");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("record an explicit rejected_or_deferred_memory reason");
    expect(result.stdout).toContain("does not prove: search ranking quality is good");
  });

  it("guards BQ-015 broad no-match retrying with a shorter mechanism query", async () => {
    const broadResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "brain qa source decision retrieval memory anti memory evidence graph"
      },
      format: "json"
    });
    const mechanismResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "source-to-decision"
      },
      format: "json"
    });

    const broadPreview = parsePreviewResource(broadResult.stdout);
    const mechanismPreview = parsePreviewResource(mechanismResult.stdout);

    expect(broadPreview.totalReadModels).toBe(0);
    expect(broadPreview.returnedReadModels).toBe(0);
    expect(readModelIds(broadPreview)).toEqual([]);
    expect(broadPreview.noMatchGuidance).toContain(
      "Try a shorter --text query or split the query into one mechanism term."
    );
    expect(broadPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(broadPreview.mutation).toBe("none");

    expect(readModelIds(mechanismPreview)).toContain("pattern:source-to-decision-retention-gate");
    expect(mechanismPreview.totalReadModels).toBeGreaterThan(0);
    expect(mechanismPreview.returnedReadModels).toBeGreaterThan(0);
    expect(mechanismPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(mechanismPreview.mutation).toBe("none");
  });

  it("includes no-match guidance in the static html preview", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        usefulnessOutcome: "helped",
        text: "brain recall pattern gate source slice operator UX TypeScript"
      },
      format: "html"
    });

    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("No brain recall entries match the current filters.");
    expect(result.stdout).toContain("Try a shorter --text query");
    expect(result.stdout).toContain("Zero results do not prove");
    expect(result.stdout).toContain("Mutation: none");
  });

  it("guards deterministic catalog search results and proof boundaries", async () => {
    const typeScriptResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "explicit result state"
      },
      format: "json"
    });
    const sourceDecisionResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "retention gate"
      },
      format: "json"
    });

    const typeScriptPreview = parsePreviewResource(typeScriptResult.stdout);
    const sourceDecisionPreview = parsePreviewResource(sourceDecisionResult.stdout);

    expect(readModelIds(typeScriptPreview)).toEqual(["pattern:ts-boundary-unknown-first-result-state"]);
    expect(readModelIds(sourceDecisionPreview)).toEqual(["pattern:source-to-decision-retention-gate"]);
    expect(typeScriptPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(sourceDecisionPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(typeScriptPreview.access).toBe("read_only");
    expect(typeScriptPreview.mutation).toBe("none");
    expect(sourceDecisionPreview.access).toBe("read_only");
    expect(sourceDecisionPreview.mutation).toBe("none");
  });

  it("matches natural multi-token catalog queries without semantic ranking claims", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "unknown first result state"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:ts-boundary-unknown-first-result-state"]);
    expect(preview.totalReadModels).toBe(1);
    expect(preview.returnedReadModels).toBe(1);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.access).toBe("read_only");
    expect(preview.mutation).toBe("none");
  });

  it("searches the knowledge parser exemplar through the catalog", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "knowledge parser exemplar unknown-first recipe"
      },
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview)).toEqual(["pattern:ts-boundary-knowledge-parser-exemplar"]);
    expect(preview.totalReadModels).toBe(1);
    expect(preview.returnedReadModels).toBe(1);
    expect(preview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(preview.access).toBe("read_only");
    expect(preview.mutation).toBe("none");
  });

  it("retains the KRN brain layer model for worker and naming boundary queries", async () => {
    const workerBoundaryResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "maintenance preview not Codex exec candidate contracts"
      },
      format: "json"
    });
    const namingBoundaryResult = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {
        text: "naming standard no vanity rename helper extraction rule"
      },
      format: "json"
    });

    const workerBoundaryPreview = parsePreviewResource(workerBoundaryResult.stdout);
    const namingBoundaryPreview = parsePreviewResource(namingBoundaryResult.stdout);

    expect(readModelIds(workerBoundaryPreview)).toEqual(["pattern:krn-brain-layer-model-boundary"]);
    expect(readModelIds(namingBoundaryPreview)).toEqual(["pattern:krn-brain-layer-model-boundary"]);
    expect(workerBoundaryPreview.proof.doesNotProve).toContain("search ranking quality is good");
    expect(namingBoundaryPreview.proof.doesNotProve).toContain("KRN is product-ready");
    expect(workerBoundaryPreview.access).toBe("read_only");
    expect(namingBoundaryPreview.mutation).toBe("none");
  });

  it("returns every catalog readModel without a text filter", async () => {
    const result = await runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: [catalogFile],
      filter: {},
      format: "json"
    });
    const preview = parsePreviewResource(result.stdout);

    expect(readModelIds(preview).sort()).toEqual([
      "pattern:knowledge-read-only-preview-boundary",
      "pattern:consensus-relation-maintenance-review-boundary",
      "pattern:cost-aware-acquisition-escalation-boundary",
      "pattern:evidence-proof-non-proof-boundary",
      "pattern:graph-relation-readback-boundary",
      "pattern:maintenance-candidate-only-runtime-boundary",
      "pattern:krn-brain-layer-model-boundary",
      "pattern:reference-implementation-recipe-clone-boundary",
      "pattern:source-to-decision-retention-gate",
      "pattern:target-repo-write-authority-boundary",
      "pattern:ts-boundary-knowledge-parser-exemplar",
      "pattern:untrusted-context-warning-boundary",
      "pattern:ts-boundary-unknown-first-result-state"
    ].sort());
  });

  it("rejects invalid catalog files", async () => {
    await expect(runBrainRecallCommand({
      cwd: repoRoot,
      readModelFiles: [],
      decisionFiles: [],
      catalogFiles: ["package.json"],
      filter: {},
      format: "text"
    })).rejects.toThrow(
      "Invalid brain recall catalog file: package.json (catalog must include non-empty readModelFiles, knowledgeFiles, or usefulnessFeedbackFiles arrays)"
    );
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type PreviewResourceForTest = {
  access: "read_only";
  mutation: "none";
  totalReadModels?: number;
  returnedReadModels?: number;
  limit?: number;
  noMatchGuidance?: string[];
  readModels: {
    id: string;
  }[];
  proof: {
    doesNotProve: string[];
  };
};

type ParsedPreviewRoot = {
  root: Record<string, unknown>;
  access: "read_only";
  mutation: "none";
  readModels: unknown[];
  proof: Record<string, unknown>;
};

function parsePreviewRoot(value: string): ParsedPreviewRoot {
  const parsed: unknown = JSON.parse(value);

  if (!isRecord(parsed)) {
    throw new Error("knowledge JSON output must be an object");
  }

  const access = parsed["access"];
  const mutation = parsed["mutation"];
  const readModels = parsed["readModels"];
  const proof = parsed["proof"];

  if (access !== "read_only" || mutation !== "none" || !Array.isArray(readModels) || !isRecord(proof)) {
    throw new Error("knowledge JSON output does not match preview resource shape");
  }

  return {
    root: parsed,
    access,
    mutation,
    readModels,
    proof
  };
}

function optionalIntegerField(
  root: Record<string, unknown>,
  field: "totalReadModels" | "returnedReadModels" | "limit"
): number | undefined {
  const value = root[field];

  if (value !== undefined && (typeof value !== "number" || !Number.isSafeInteger(value))) {
    throw new Error(`knowledge JSON output ${field} must be an integer when present`);
  }

  return value;
}

function optionalStringArrayField(
  root: Record<string, unknown>,
  field: "noMatchGuidance"
): string[] | undefined {
  const value = root[field];

  if (value !== undefined && (!Array.isArray(value) || !value.every((item) => typeof item === "string"))) {
    throw new Error(`knowledge JSON output ${field} must be string array when present`);
  }

  return value;
}

function parseProofBoundaries(proof: Record<string, unknown>): string[] {
  const doesNotProve = proof["doesNotProve"];

  if (!Array.isArray(doesNotProve) || !doesNotProve.every((item) => typeof item === "string")) {
    throw new Error("knowledge JSON output must include doesNotProve proof boundaries");
  }

  return doesNotProve;
}

function parsePreviewReadModels(readModels: readonly unknown[]): PreviewResourceForTest["readModels"] {
  return readModels.map((readModel) => {
    if (!isRecord(readModel) || typeof readModel["id"] !== "string") {
      throw new Error("knowledge JSON output readModels must include ids");
    }

    return {
      id: readModel["id"]
    };
  });
}

function parsePreviewResource(value: string): PreviewResourceForTest {
  const preview = parsePreviewRoot(value);
  const totalReadModels = optionalIntegerField(preview.root, "totalReadModels");
  const returnedReadModels = optionalIntegerField(preview.root, "returnedReadModels");
  const limit = optionalIntegerField(preview.root, "limit");
  const noMatchGuidance = optionalStringArrayField(preview.root, "noMatchGuidance");

  return {
    access: preview.access,
    mutation: preview.mutation,
    ...(totalReadModels === undefined ? {} : { totalReadModels }),
    ...(returnedReadModels === undefined ? {} : { returnedReadModels }),
    ...(limit === undefined ? {} : { limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
    readModels: parsePreviewReadModels(preview.readModels),
    proof: {
      doesNotProve: parseProofBoundaries(preview.proof)
    }
  };
}

function readModelIds(resource: PreviewResourceForTest): string[] {
  return resource.readModels.map((readModel) => readModel.id);
}

type KnowledgeReadModelInputForTest = {
  id: string;
  kind: string;
  status: string;
  title: string;
  summary: string;
  reviewability: string;
  usefulnessOutcome?: string;
  nextAction: string;
};

function knowledgeReadModel(input: KnowledgeReadModelInputForTest): Record<string, unknown> {
  return {
    ...input,
    confidence: "high",
    sourceRefs: ["test:source"],
    evidenceRefs: ["test:evidence"],
    consumers: ["test consumer"],
    falsifier: "A filter smoke cannot find this readModel by its stable fields.",
    doesNotProve: "This knowledge read model does not prove product readiness.",
    temporal: {
      kind: "current",
      observedAt: "2026-06-28"
    },
    dissent: {
      kind: "none"
    },
    ...(input.usefulnessOutcome === undefined ? {} : {
      usefulnessFeedback: {
        knowledgeId: input.id,
        outcome: input.usefulnessOutcome,
        summary: `Usefulness outcome for ${input.id}.`,
        evidenceRefs: ["test:usefulness"],
        doesNotProve: "This usefulness feedback does not prove product readiness.",
        observedAt: "2026-06-28"
      }
    })
  };
}

type FakeControl = {
  value: string;
  textContent: string;
  style: {
    display: string;
  };
  addEventListener: (event: string, listener: () => void) => void;
  dispatch: (event: string) => void;
};

type FakeReadModel = {
  hidden: boolean;
  dataset: {
    id: string;
    search: string;
    kind: string;
    status: string;
    reviewability: string;
    usefulnessOutcome: string;
    nextAction: string;
  };
};

type KnowledgePreviewSmoke = {
  count: () => string;
  emptyDisplay: () => string;
  setFilter: (id: string, value: string) => void;
  setSearch: (value: string) => void;
  visibleIds: () => string[];
};

function executeKnowledgePreviewHtml(html: string): KnowledgePreviewSmoke {
  const scriptStart = html.indexOf("<script>\n    const readModels");
  const scriptEnd = html.indexOf("\n  </script>", scriptStart);

  if (scriptStart === -1 || scriptEnd === -1) {
    throw new Error("Expected knowledge preview HTML to include executable filter script.");
  }

  const script = html.slice(scriptStart + "<script>\n".length, scriptEnd);
  const readModels: FakeReadModel[] = [...html.matchAll(/<article data-read-model ([^>]+)>/gu)].map((match) => {
    const attributes = match[1] ?? "";

    return {
      hidden: false,
      dataset: {
        id: attr(attributes, "data-read-model-id"),
        search: attr(attributes, "data-search"),
        kind: attr(attributes, "data-kind"),
        status: attr(attributes, "data-status"),
        reviewability: attr(attributes, "data-reviewability"),
        usefulnessOutcome: attr(attributes, "data-usefulness-outcome"),
        nextAction: attr(attributes, "data-next-action")
      }
    };
  });

  const controls: Record<string, FakeControl> & {
    count: FakeControl;
    empty: FakeControl;
    search: FakeControl;
  } = {
    search: fakeControl(),
    kindFilter: fakeControl(),
    statusFilter: fakeControl(),
    reviewabilityFilter: fakeControl(),
    usefulnessOutcomeFilter: fakeControl(),
    nextActionFilter: fakeControl(),
    count: fakeControl(),
    empty: fakeControl()
  } satisfies Record<string, FakeControl>;

  runInNewContext(script, {
    document: {
      querySelectorAll: (selector: string): FakeReadModel[] => selector === "[data-read-model]" ? readModels : [],
      getElementById: (id: string): FakeControl => controls[id] ?? fakeControl()
    }
  });

  return {
    count: () => controls.count.textContent,
    emptyDisplay: () => controls.empty.style.display,
    setFilter: (id, value) => {
      controls[id]!.value = value;
      controls[id]!.dispatch("change");
    },
    setSearch: (value) => {
      controls.search.value = value;
      controls.search.dispatch("input");
    },
    visibleIds: () => readModels.filter((readModel) => !readModel.hidden).map((readModel) => readModel.dataset.id)
  };
}

function fakeControl(): FakeControl {
  const listeners = new Map<string, () => void>();

  return {
    value: "",
    textContent: "",
    style: {
      display: ""
    },
    addEventListener: (event, listener) => {
      listeners.set(event, listener);
    },
    dispatch: (event) => {
      listeners.get(event)?.();
    }
  };
}

function attr(attributes: string, name: string): string {
  const match = new RegExp(`${name}="([^"]*)"`, "u").exec(attributes);

  return match?.[1] ?? "";
}
