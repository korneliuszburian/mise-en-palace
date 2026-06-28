import {
  mkdir,
  mkdtemp,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";

import {
  runSourceArtifactPreviewCommand
} from "./runSourceArtifactPreviewCommand.js";

const tempRoots: string[] = [];

const createTempRoot = async (): Promise<string> => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "krn-source-preview-"));
  tempRoots.push(tempRoot);

  return tempRoot;
};

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map(async (tempRoot) =>
    rm(tempRoot, {
      force: true,
      recursive: true
    })
  ));
});

describe("runSourceArtifactPreviewCommand", () => {
  it("renders deterministic local artifact chunks with source ranges", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, [
      "# Source",
      "first fact",
      "second fact",
      "third fact",
      "fourth fact"
    ].join("\n"), "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        file: "source.md",
        chunkLines: 2,
        limitChunks: 2
      }
    });

    expect(result.stdout).toContain("KRN Source Artifact Preview");
    expect(result.stdout).toContain("Persistence: disabled (local preview only)");
    expect(result.stdout).toContain("DB writes: none");
    expect(result.stdout).toContain("Memory mutation: none");
    expect(result.stdout).toContain("file: source.md");
    expect(result.stdout).toContain("contentHash: sha256:");
    expect(result.stdout).toContain("chunking: line-based | chunkLines=2 | renderedChunks=2");
    expect(result.stdout).toContain("sourceRange: lines 1-2");
    expect(result.stdout).toContain("sourceRange: lines 3-4");
    expect(result.stdout).toContain("preview: # Source\\nfirst fact");
    expect(result.stdout).toContain("Candidate bridge:");
    expect(result.stdout).toContain("searchDocumentCandidate:");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("subjectType: source_artifact");
    expect(result.stdout).toContain("No SearchDocument row created");
    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("reason: explicit claim/mechanism/consumer/falsifier inputs were not supplied");
    expect(result.stdout).toContain("No SourceClaim created");
    expect(result.stdout).toContain("doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation");
  });

  it("renders incomplete source claim candidates as reviewable missing-evidence output", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, "claim source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        file: "source.md",
        claim: "KRN should bridge preview evidence into candidates."
      }
    });

    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("status: incomplete");
    expect(result.stdout).toContain("reviewability: needs_more_evidence");
    expect(result.stdout).toContain("missing: --mechanism, --krn-implication, --does-not-prove, --support-type, --trust-tier, --consumer, --falsifier");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("renders complete source claim candidates without persistence", async () => {
    const tempRoot = await createTempRoot();
    const sourcePath = path.join(tempRoot, "source.md");

    await writeFile(sourcePath, "candidate source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        file: "source.md",
        claim: "Local artifact previews can feed source candidates.",
        mechanism: "Preview output carries content hash and source ranges.",
        krnImplication: "Use preview output as source candidate evidence before persistence.",
        doesNotProve: "This does not prove source truth.",
        supportType: "implementation-boundary",
        trustTier: "source-code",
        consumer: "ingest v0",
        falsifier: "Candidate output mutates SourceGraph."
      }
    });

    expect(result.stdout).toContain("sourceClaimCandidate:");
    expect(result.stdout).toContain("status: proposed");
    expect(result.stdout).toContain("reviewability: ready");
    expect(result.stdout).toContain("claim: Local artifact previews can feed source candidates.");
    expect(result.stdout).toContain("consumer: ingest v0");
    expect(result.stdout).toContain("No SourceClaim created");
  });

  it("falls back to repo-root-relative paths when cwd is a package directory", async () => {
    const tempRoot = await createTempRoot();
    const packageDir = path.join(tempRoot, "packages", "cli");
    const docsDir = path.join(tempRoot, "docs");

    await writeFile(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
    await mkdir(docsDir, { recursive: true });
    await mkdir(packageDir, { recursive: true });
    await writeFile(path.join(docsDir, "source.md"), "root relative source\n", "utf8");

    const result = await runSourceArtifactPreviewCommand({
      cwd: packageDir,
      command: {
        kind: "sourceArtifactPreview",
        file: "docs/source.md"
      }
    });

    expect(result.stdout).toContain("file: docs/source.md");
    expect(result.stdout).toContain("resolvedFile: ../../docs/source.md");
    expect(result.stdout).toContain("preview: root relative source");
  });

  it("rejects missing files before creating preview truth", async () => {
    const tempRoot = await createTempRoot();

    await expect(runSourceArtifactPreviewCommand({
      cwd: tempRoot,
      command: {
        kind: "sourceArtifactPreview",
        file: "missing.md"
      }
    })).rejects.toThrow("ENOENT");
  });
});
