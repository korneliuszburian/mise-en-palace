import {
  mkdtemp,
  mkdir,
  symlink,
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
  findRepoRoot,
  pathExists,
  pathExistsWithin,
  readJsonObject,
  readJsonObjectResult,
  resolveRepoInputFile
} from "../cli-file-boundary.js";

describe("cliFileBoundary", () => {
  it("reads JSON objects as unknown-first records and rejects non-objects", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-cli-boundary-"));
    const objectPath = path.join(directory, "object.json");
    const arrayPath = path.join(directory, "array.json");
    const invalidPath = path.join(directory, "invalid.json");

    await writeFile(objectPath, JSON.stringify({ name: "krn", scripts: { test: "vitest" } }));
    await writeFile(arrayPath, JSON.stringify(["not", "an", "object"]));
    await writeFile(invalidPath, "{not-json");

    await expect(readJsonObject(objectPath)).resolves.toEqual({
      name: "krn",
      scripts: {
        test: "vitest"
      }
    });
    await expect(readJsonObject(arrayPath)).resolves.toBeUndefined();
    await expect(readJsonObject(invalidPath)).resolves.toBeUndefined();
    await expect(readJsonObject(path.join(directory, "missing.json"))).resolves.toBeUndefined();
  });

  it("exposes finite JSON read result states for callers that need failure reasons", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "krn-cli-boundary-state-"));
    const objectPath = path.join(directory, "object.json");
    const arrayPath = path.join(directory, "array.json");
    const invalidPath = path.join(directory, "invalid.json");

    await writeFile(objectPath, JSON.stringify({ name: "krn" }));
    await writeFile(arrayPath, JSON.stringify(["not", "an", "object"]));
    await writeFile(invalidPath, "{not-json");

    await expect(readJsonObjectResult(objectPath)).resolves.toEqual({
      status: "ok",
      value: {
        name: "krn"
      }
    });
    await expect(readJsonObjectResult(arrayPath)).resolves.toMatchObject({
      status: "not_object",
      reason: "JSON value must be an object"
    });
    await expect(readJsonObjectResult(invalidPath)).resolves.toMatchObject({
      status: "invalid_json"
    });
    await expect(readJsonObjectResult(path.join(directory, "missing.json"))).resolves.toMatchObject({
      status: "missing_or_unreadable"
    });
  });

  it("finds the nearest pnpm workspace root and falls back to the start path", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "krn-cli-workspace-"));
    const nested = path.join(workspace, "packages", "cli", "src");
    const outside = await mkdtemp(path.join(os.tmpdir(), "krn-cli-no-workspace-"));

    await mkdir(nested, { recursive: true });
    await writeFile(path.join(workspace, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");

    await expect(pathExists(path.join(workspace, "pnpm-workspace.yaml"))).resolves.toBe(true);
    await expect(pathExists(path.join(workspace, "missing.yaml"))).resolves.toBe(false);
    await expect(findRepoRoot(nested)).resolves.toBe(workspace);
    await expect(findRepoRoot(outside)).resolves.toBe(outside);
  });

  it("accepts only existing paths whose real target stays inside the repo root", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "krn-cli-contained-"));
    const outside = await mkdtemp(path.join(os.tmpdir(), "krn-cli-outside-"));

    await writeFile(path.join(workspace, "owner.ts"), "export {};\n");
    await writeFile(path.join(outside, "outside.ts"), "export {};\n");
    await symlink(path.join(outside, "outside.ts"), path.join(workspace, "linked.ts"));

    await expect(pathExistsWithin(workspace, "owner.ts")).resolves.toBe(true);
    await expect(pathExistsWithin(workspace, "missing.ts")).resolves.toBe(false);
    await expect(pathExistsWithin(workspace, "../outside.ts")).resolves.toBe(false);
    await expect(pathExistsWithin(workspace, "linked.ts")).resolves.toBe(false);
  });

  it("resolves input files from cwd first and then workspace root", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "krn-cli-resolve-"));
    const packageDir = path.join(workspace, "packages", "cli");
    const localFile = path.join(packageDir, "local.md");
    const rootFile = path.join(workspace, "docs", "source.md");

    await mkdir(path.dirname(rootFile), { recursive: true });
    await mkdir(packageDir, { recursive: true });
    await writeFile(path.join(workspace, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n");
    await writeFile(localFile, "local\n");
    await writeFile(rootFile, "root\n");

    await expect(resolveRepoInputFile(packageDir, "local.md")).resolves.toBe(localFile);
    await expect(resolveRepoInputFile(packageDir, "docs/source.md")).resolves.toBe(rootFile);
  });
});
