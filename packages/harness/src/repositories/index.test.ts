import { describe, expect, expectTypeOf, it } from "vitest";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import type {
  CreateContextAssemblyInput,
  CreateContextAssemblyStatus,
  CreateEvidenceBundleInput,
  CreateEvidenceBundleStatus
} from "./index.js";

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

  it("keeps EvidenceBundle verified and rejected status out of the write input", () => {
    expectTypeOf<CreateEvidenceBundleInput["status"]>()
      .toEqualTypeOf<CreateEvidenceBundleStatus | undefined>();
    expectTypeOf<Extract<CreateEvidenceBundleInput["status"], "verified" | "rejected">>()
      .toEqualTypeOf<never>();
  });

  it("keeps stale and superseded context assembly states out of create input", () => {
    expectTypeOf<CreateContextAssemblyInput["status"]>()
      .toEqualTypeOf<CreateContextAssemblyStatus | undefined>();
    expectTypeOf<Extract<CreateContextAssemblyInput["status"], "stale" | "superseded">>()
      .toEqualTypeOf<never>();
  });
});
