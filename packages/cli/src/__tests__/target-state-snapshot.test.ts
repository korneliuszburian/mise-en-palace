import { execFileSync } from "node:child_process";
import { mkdtemp, rm, symlink, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { collectTargetStateSnapshot } from "@krn/core";

describe("collectTargetStateSnapshot", () => {
  const repositories: string[] = [];

  afterEach(async () => {
    await Promise.all(repositories.splice(0).map((repo) =>
      rm(repo, { recursive: true, force: true })
    ));
  });

  const createRepository = async (): Promise<string> => {
    const repo = await mkdtemp(path.join(tmpdir(), "krn-target-state-"));
    repositories.push(repo);
    execFileSync("git", ["init", "--quiet", "--initial-branch=main"], { cwd: repo });
    execFileSync("git", ["config", "user.email", "fixture@example.test"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Fixture"], { cwd: repo });
    await writeFile(path.join(repo, "tracked.txt"), "base\n");
    execFileSync("git", ["add", "tracked.txt"], { cwd: repo });
    execFileSync("git", ["commit", "--quiet", "-m", "base"], { cwd: repo });
    return repo;
  };

  it("changes patch identity when a verified tracked target mutates", async () => {
    const repo = await createRepository();
    await writeFile(path.join(repo, "tracked.txt"), "application patch\n");
    const application = await collectTargetStateSnapshot(repo);

    await writeFile(path.join(repo, "tracked.txt"), "mutated after verification\n");
    const capture = await collectTargetStateSnapshot(repo);

    expect(capture.treeIdentity).toBe(application.treeIdentity);
    expect(capture.patchIdentity).not.toBe(application.patchIdentity);
  });

  it("content-addresses untracked target bytes", async () => {
    const repo = await createRepository();
    await writeFile(path.join(repo, "new.txt"), "first contents\n");
    const first = await collectTargetStateSnapshot(repo);

    await writeFile(path.join(repo, "new.txt"), "second contents\n");
    const second = await collectTargetStateSnapshot(repo);

    expect(second.treeIdentity).toBe(first.treeIdentity);
    expect(second.patchIdentity).not.toBe(first.patchIdentity);
  });

  it("content-addresses an untracked symbolic link without following it", async () => {
    const repo = await createRepository();
    const link = path.join(repo, "external-link");
    await symlink("../first-target", link);
    const first = await collectTargetStateSnapshot(repo);

    await unlink(link);
    await symlink("../second-target", link);
    const second = await collectTargetStateSnapshot(repo);

    expect(second.changedPaths).toEqual(["external-link"]);
    expect(second.patchIdentity).not.toBe(first.patchIdentity);
  });
});
