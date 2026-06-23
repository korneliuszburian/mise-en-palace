import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  checkRepoFiles
} from "./doctorRepoChecks.js";

describe("doctorRepoChecks", () => {
  it("checks repo files without requiring runtime writes", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "krn-doctor-repo-"));

    await mkdir(path.join(repoRoot, "packages"), { recursive: true });
    await mkdir(path.join(repoRoot, ".agents", "skills"), { recursive: true });
    await writeFile(
      path.join(repoRoot, "AGENTS.md"),
      "# Instructions\n\nUse the kernel.\n",
      "utf8"
    );
    await writeFile(
      path.join(repoRoot, "pnpm-workspace.yaml"),
      "packages:\n  - packages/*\n",
      "utf8"
    );
    await writeFile(
      path.join(repoRoot, "tsconfig.base.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true
        }
      }),
      "utf8"
    );

    expect(await checkRepoFiles(repoRoot)).toEqual([
      {
        label: "AGENTS.md",
        status: "present (2 non-empty lines)"
      },
      {
        label: ".krn runtime truth",
        status: "absent"
      },
      {
        label: "TypeScript strictness",
        status: "enabled"
      },
      {
        label: "workspace packages",
        status: "present"
      },
      {
        label: "skills surface",
        status: "present"
      },
      {
        label: "hooks surface",
        status: "not configured"
      },
      {
        label: "Forbidden surfaces",
        status: "absent"
      }
    ]);
  });

  it("does not import write or shell execution modules", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctorRepoChecks.ts"),
      "utf8"
    );

    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("exec(");
    expect(source).not.toContain("spawn(");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });
});
