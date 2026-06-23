import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const repositoryFile = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

describe("repository package surfaces", () => {
  it("keeps raw Memory Core write ports out of the public repository index", async () => {
    const publicIndex = await readFile(repositoryFile("index.ts"), "utf8");
    const internalIndex = await readFile(repositoryFile("internal/index.ts"), "utf8");

    expect(publicIndex).not.toContain("CreateMemoryRecordInput");
    expect(publicIndex).not.toContain("CreateAntiMemoryRecordInput");
    expect(publicIndex).not.toContain("MemoryRepository,");
    expect(publicIndex).toContain("MemoryCandidateReviewRepository");
    expect(internalIndex).toContain("../memoryRepository.js");
  });
});
