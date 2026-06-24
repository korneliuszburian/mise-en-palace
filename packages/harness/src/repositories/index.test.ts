import { describe, expect, expectTypeOf, it } from "vitest";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import type {
  CreateContextAssemblyInput,
  CreateContextAssemblyStatus,
  CreateAntiMemoryCandidateInput,
  CreateEvidenceBundleInput,
  CreateEvidenceBundleStatus,
  CreateFeedbackDeltaInput,
  CreateMemoryCandidateInput,
  CreateSourceClaimInput
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

  it("keeps post-create feedback delta lifecycle states out of create input", () => {
    expectTypeOf<CreateFeedbackDeltaInput["status"]>()
      .toEqualTypeOf<"candidate" | undefined>();
    expectTypeOf<Extract<CreateFeedbackDeltaInput["status"], "accepted" | "rejected" | "applied">>()
      .toEqualTypeOf<never>();
  });

  it("keeps post-review memory candidate lifecycle states out of create inputs", () => {
    expectTypeOf<CreateMemoryCandidateInput["status"]>()
      .toEqualTypeOf<"proposed" | "candidate" | undefined>();
    expectTypeOf<CreateAntiMemoryCandidateInput["status"]>()
      .toEqualTypeOf<"proposed" | "candidate" | undefined>();
    expectTypeOf<
      Extract<
        CreateMemoryCandidateInput["status"] | CreateAntiMemoryCandidateInput["status"],
        "accepted" | "rejected" | "applied" | "superseded"
      >
    >().toEqualTypeOf<never>();
  });

  it("keeps reviewed source claim lifecycle states out of create input", () => {
    expectTypeOf<CreateSourceClaimInput["status"]>()
      .toEqualTypeOf<"proposed" | undefined>();
    expectTypeOf<Extract<CreateSourceClaimInput["status"], "accepted" | "rejected" | "deprecated">>()
      .toEqualTypeOf<never>();
  });
});
