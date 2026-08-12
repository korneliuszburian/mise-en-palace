import {
  mkdtemp,
  mkdir,
  realpath
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  describe,
  expect,
  it
} from "vitest";

import {
  resolveTargetWorkspace
} from "../target-workspace.js";

describe("resolveTargetWorkspace", () => {
  it("uses the canonical explicit repo relative to INIT_CWD", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "krn-target-workspace-"));
    const target = path.join(fixture, "target");
    await mkdir(target);

    await expect(resolveTargetWorkspace({
      cwd: process.cwd(),
      env: { INIT_CWD: fixture },
      repo: "target"
    })).resolves.toBe(await realpath(target));
  });

  it("treats INIT_CWD itself as the target instead of the package checkout root", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "krn-target-workspace-"));
    const nested = path.join(fixture, "packages", "app");
    await mkdir(nested, { recursive: true });

    await expect(resolveTargetWorkspace({
      cwd: process.cwd(),
      env: { INIT_CWD: nested }
    })).resolves.toBe(await realpath(nested));
  });

  it("does not substitute the KRN checkout for an unmarked INIT_CWD target", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "krn-target-workspace-"));

    await expect(resolveTargetWorkspace({
      cwd: process.cwd(),
      env: { INIT_CWD: fixture }
    })).resolves.toBe(await realpath(fixture));
  });

  it("fails instead of resolving a missing relative repo against the KRN checkout", async () => {
    const fixture = await mkdtemp(path.join(os.tmpdir(), "krn-target-workspace-"));

    await expect(resolveTargetWorkspace({
      cwd: process.cwd(),
      env: { INIT_CWD: fixture },
      repo: "missing-target"
    })).rejects.toThrow(`Target workspace is not a directory: ${path.join(fixture, "missing-target")}`);
  });

  it("fails closed instead of treating the KRN process cwd as the target", async () => {
    await expect(resolveTargetWorkspace({
      cwd: process.cwd(),
      env: {}
    })).rejects.toThrow("INIT_CWD must identify the canonical target workspace");
  });
});
