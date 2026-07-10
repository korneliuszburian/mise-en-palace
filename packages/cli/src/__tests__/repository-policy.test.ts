import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const readRootFile = (path: string): string => readFileSync(`${repoRoot}/${path}`, "utf8");
const pgvectorImage =
  "pgvector/pgvector:pg16@sha256:131dcf7ff6a900545df8e7e092c270aa8c6db2f2c818e408cb45ec21316b74e6";

describe("repository policy boundaries", () => {
  it("keeps development Postgres loopback-bound and image-pinned", () => {
    const compose = readRootFile("compose.yaml");
    const ci = readRootFile(".github/workflows/ci.yml");

    expect(compose).toContain(`image: ${pgvectorImage}`);
    expect(compose).toContain('"${KRN_POSTGRES_BIND_ADDRESS:-127.0.0.1}:54329:5432"');
    expect(compose).not.toContain('"54329:5432"');
    expect(ci).toContain(`image: ${pgvectorImage}`);
  });

  it("ignores local secret/generated artifacts while tracking the example env", () => {
    const gitignore = readRootFile(".gitignore");
    const trackedExample = execFileSync(
      "git",
      ["ls-files", "--error-unmatch", ".env.example"],
      { cwd: repoRoot, encoding: "utf8" }
    ).trim();

    expect(gitignore).toContain(".env.*");
    expect(gitignore).toContain("!.env.example");
    expect(gitignore).toContain("coverage/");
    expect(gitignore).toContain("*.log");
    expect(trackedExample).toBe(".env.example");
    expect(gitignore).not.toContain("tests/fixtures/");
    expect(gitignore).not.toContain("packages/db/src/migrations/");
  });
});

