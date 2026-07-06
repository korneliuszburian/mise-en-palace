import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../run-cli.js";

const now = "2026-06-21T12:00:00.000Z";

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringRecord = (value: unknown): Record<string, string> | undefined => {
  if (!isJsonObject(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string"
    )
  );
};

const readRootPackageJson = async (
  repoRoot: string
): Promise<{ scripts?: Record<string, string> }> => {
  const raw = await readFile(path.join(repoRoot, "package.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);

  if (!isJsonObject(parsed)) {
    return {};
  }

  const scripts = stringRecord(parsed.scripts);

  return scripts === undefined ? {} : { scripts };
};

describe("runCli", () => {
  it("exposes the heartbeat worker boundary smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:heartbeat-worker-boundary"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke heartbeat-worker-boundary"
    );
  });

  it("reports heartbeat worker boundary smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "heartbeat-worker-boundary"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Heartbeat Worker Boundary Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Heartbeat worker boundary smoke: skipped (database not configured)"
    );
  });
});
