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
    expect(result.stdout).toContain("doesNotProve: source truth, claim correctness, DB persistence, embeddings, graph retrieval, crawler readiness, or Memory Core mutation");
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
