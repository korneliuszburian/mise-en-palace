import {
  mkdtemp,
  mkdir,
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
  readJsonObject
} from "./cliFileBoundary.js";

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
});
