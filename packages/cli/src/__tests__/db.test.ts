import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../run-cli.js";
import {
  assertAllRealRecallAdvantageWins
} from "../internal/smoke/run-real-recall-advantage-db-smoke.js";

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
  it("prints missing DB guidance for target repo init-connect smoke", async () => {
    const result = await runCli(["db", "smoke", "init-connect"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN Target Repo Init-Connect Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Init-connect smoke: skipped (database not configured)");
  });

  it("prints missing DB guidance for target repo harness smoke", async () => {
    const result = await runCli(["db", "smoke", "target-repo-harness"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN Target Repo Harness Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Target repo harness smoke: skipped (database not configured)"
    );
  });

  it("prints missing DB guidance for run-show smoke", async () => {
    const result = await runCli(["db", "smoke", "run-show"], {
      env: {},
      cwd: path.resolve(process.cwd(), "../.."),
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("KRN Run Show Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Run show smoke: skipped (database not configured)");
  });

  it("exposes the run-show smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:run-show"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke run-show"
    );
  });

  it("exposes the target repo init-connect smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:init-connect"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke init-connect"
    );
  });

  it("exposes the target repo harness smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:target-repo-harness"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke target-repo-harness"
    );
  });

  it("exposes the real recall advantage smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:real-recall-advantage"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke real-recall-advantage"
    );
    expect(packageJson.scripts?.["eval:real-recall"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli eval:real-recall"
    );
  });

  it("exposes the decision packet return-loop smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:decision-packet-return-loop"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke decision-packet-return-loop"
    );
  });

  it("keeps the canonical DB product-loop eval in full verification and CI", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);
    const workflow = await readFile(path.join(repoRoot, ".github/workflows/ci.yml"), "utf8");

    expect(packageJson.scripts?.["alpha:verify:full"]).toBe(
      "pnpm verify:fast && pnpm verify:db"
    );
    expect(packageJson.scripts?.["verify:db"]).toContain(
      "pnpm db:smoke:memory-governance"
    );
    expect(packageJson.scripts?.["verify:db"]).toContain(
      "pnpm db:smoke:eval-feedback-persistence"
    );
    expect(packageJson.scripts?.["db:smoke:eval-feedback-persistence"]).toContain(
      "db smoke eval-feedback-persistence"
    );
    expect(workflow).toContain("run: pnpm verify:db");
  });

  it("fails real recall eval when any distractor-competition case loses", () => {
    expect(() => assertAllRealRecallAdvantageWins([
      {
        decisionId: "case-1",
        advantageWin: true
      },
      {
        decisionId: "case-2",
        advantageWin: false
      }
    ])).toThrow("Real-recall eval requires every distractor-competition case to win; missed: case-2");
  });

  it("exposes the decision corpus import smoke script", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const packageJson = await readRootPackageJson(repoRoot);

    expect(packageJson.scripts?.["db:smoke:decision-corpus-import"]).toBe(
      "KRN_DATABASE_URL=${KRN_DATABASE_URL:-postgres://krn:krn@localhost:54329/krn} pnpm --filter @krn/cli krn db smoke decision-corpus-import"
    );
  });

  it("prints DB help as an internal dev surface", async () => {
    const result = await runCli(["db", "--help"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Internal/dev commands:");
    expect(result.stdout).toContain("krn db readiness");
    expect(result.stdout).toContain("krn db migrate");
    expect(result.stdout).toContain("krn db smoke [target]");
    expect(result.stdout).toContain("eval-feedback-persistence");
    expect(result.stdout).toContain("decision-corpus-import");
    expect(result.stdout).toContain("real-recall-advantage");
    expect(result.stdout).toContain(
      "They are not public operator workflow, product quality authority, or Memory Core readiness proof."
    );
  });

  it("reports DB readiness missing configuration", async () => {
    const result = await runCli(["db", "readiness"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN DB Readiness");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Memory store readiness: blocked (database not configured)");
  });

  it("reports DB smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN DB Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Persistence smoke: skipped (database not configured)");
  });

  it("reports decision corpus import smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "decision-corpus-import"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Decision Corpus Import Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Decision corpus import smoke: skipped (database not configured)");
  });

  it("reports harness plan smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "harness-plan"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Harness Plan Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Harness plan smoke: skipped (database not configured)");
  });

  it("reports harness evidence smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "harness-evidence"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Harness Evidence Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Harness evidence smoke: skipped (database not configured)");
  });

  it("reports source graph smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "source-graph"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Source Graph Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Source graph smoke: skipped (database not configured)");
  });

  it("reports memory governance smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "memory-governance"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Governance Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Memory governance smoke: skipped (database not configured)"
    );
  });

  it("reports retrieval substrate smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "retrieval-substrate"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Retrieval Substrate Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "Retrieval substrate smoke: skipped (database not configured)"
    );
  });

  it("reports activation smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "activation"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Activation Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Activation smoke: skipped (database not configured)");
  });

  it("reports memory loop smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "memory-loop"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Loop Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Memory loop smoke: skipped (database not configured)");
  });

  it("reports memory search smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "memory-search"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Memory Search Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Memory search smoke: skipped (database not configured)");
  });

  it("reports real recall advantage smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "real-recall-advantage"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Real Recall Advantage Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Real recall advantage smoke: skipped (database not configured)");
  });

  it("reports decision packet return-loop smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "decision-packet-return-loop"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Decision Packet Return Loop Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain(
      "DecisionPacket return-loop smoke: skipped (database not configured)"
    );
  });

  it("reports maintenance queue smoke missing configuration", async () => {
    const result = await runCli(["db", "smoke", "maintenance-queue"], {
      env: {},
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Maintenance Queue Smoke");
    expect(result.stdout).toContain("Postgres config: missing KRN_DATABASE_URL");
    expect(result.stdout).toContain("Maintenance queue smoke: skipped (database not configured)");
  });
});
