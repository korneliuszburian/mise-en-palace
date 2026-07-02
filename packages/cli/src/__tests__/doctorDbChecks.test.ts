import {
  mkdtemp,
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
  checkActivation,
  checkCodexAdapterRuntimeProof,
  checkHarnessPersistence,
  checkMemoryGovernance,
  checkPostgres,
  checkRetrievalSubstrate,
  checkSourceGraph
} from "../doctorDbChecks.js";
import type {
  DoctorCheck
} from "../runDoctorCommand.js";

const writeDoctorPackageJson = async (): Promise<string> => {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "krn-doctor-db-"));
  const packageJson = {
    scripts: {
      "db:smoke:harness-plan": "krn db smoke harness-plan",
      "db:smoke:harness-evidence": "krn db smoke harness-evidence",
      "db:smoke:source-graph": "krn db smoke source-graph",
      "db:smoke:memory-governance": "krn db smoke memory-governance",
      "db:smoke:retrieval-substrate": "krn db smoke retrieval-substrate",
      "db:smoke:activation": "krn db smoke activation",
      "db:smoke": "krn db smoke"
    }
  };

  await writeFile(path.join(repoRoot, "package.json"), JSON.stringify(packageJson), "utf8");

  return repoRoot;
};

const statusFor = (
  checks: readonly DoctorCheck[],
  label: DoctorCheck["label"]
): string | undefined => checks.find((check) => check.label === label)?.status;

const expectStatuses = (
  checks: readonly DoctorCheck[],
  expected: Readonly<Record<string, string>>
): void => {
  for (const [label, status] of Object.entries(expected)) {
    expect(statusFor(checks, label)).toBe(status);
  }
};

describe("doctorDbChecks", () => {
  it("exports focused DB-backed doctor checks", () => {
    expect(checkPostgres).toEqual(expect.any(Function));
    expect(checkHarnessPersistence).toEqual(expect.any(Function));
    expect(checkSourceGraph).toEqual(expect.any(Function));
    expect(checkMemoryGovernance).toEqual(expect.any(Function));
    expect(checkRetrievalSubstrate).toEqual(expect.any(Function));
    expect(checkActivation).toEqual(expect.any(Function));
    expect(checkCodexAdapterRuntimeProof).toEqual(expect.any(Function));
  });

  it("keeps DB-backed checks read-only at the CLI adapter layer", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctorDbChecks.ts"),
      "utf8"
    );

    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });

  it("keeps not-configured Postgres skips consistent across DB-backed checks", async () => {
    const repoRoot = await writeDoctorPackageJson();
    const postgresChecks = await checkPostgres(undefined, path.join(repoRoot, "migrations"));

    expect(
      postgresChecks.map(({ label, outcome, severity }) => ({
        label,
        outcome,
        severity
      }))
    ).toEqual([
      {
        label: "Postgres mode",
        outcome: "preview_only",
        severity: "warning"
      },
      {
        label: "Postgres config",
        outcome: "not_configured",
        severity: "warning"
      },
      {
        label: "Postgres next action",
        outcome: undefined,
        severity: undefined
      },
      {
        label: "pgvector",
        outcome: "skipped",
        severity: "warning"
      },
      {
        label: "migrations",
        outcome: "skipped",
        severity: "warning"
      }
    ]);

    expectStatuses(await checkHarnessPersistence(repoRoot, undefined, postgresChecks), {
      "Harness persistence schema": "skipped (Postgres not configured)"
    });
    expectStatuses(await checkSourceGraph(repoRoot, undefined, postgresChecks), {
      "Source graph schema": "skipped (Postgres not configured)",
      "SourceRepository read path": "skipped (Postgres not configured)",
      "Source graph runtime proof": "skipped (Postgres not configured)"
    });
    expectStatuses(await checkMemoryGovernance(repoRoot, undefined, postgresChecks), {
      "Memory governance schema": "skipped (Postgres not configured)",
      "MemoryRepository read path": "skipped (Postgres not configured)",
      "Memory governance runtime proof": "skipped (Postgres not configured)"
    });
    expectStatuses(await checkRetrievalSubstrate(repoRoot, undefined, postgresChecks), {
      "Retrieval substrate schema": "skipped (Postgres not configured)",
      "RetrievalRepository read path": "skipped (Postgres not configured)",
      "Retrieval substrate runtime proof": "skipped (Postgres not configured)"
    });
    expectStatuses(await checkActivation(repoRoot, undefined, postgresChecks), {
      "Activation smoke runtime proof": "skipped (Postgres not configured)"
    });
    expectStatuses(await checkCodexAdapterRuntimeProof(repoRoot, undefined, postgresChecks), {
      "Codex adapter runtime proof": "skipped (Postgres not configured)"
    });
  });

  it("keeps unreachable and not-ready Postgres skip reasons explicit", async () => {
    const repoRoot = await writeDoctorPackageJson();
    const unreachableChecks: DoctorCheck[] = [
      {
        label: "Postgres config",
        status: "configured but unreachable (CONNECT_TIMEOUT)"
      },
      {
        label: "pgvector",
        status: "skipped (Postgres unreachable)"
      },
      {
        label: "migrations",
        status: "skipped (Postgres unreachable)"
      }
    ];
    const notReadyChecks: DoctorCheck[] = [
      {
        label: "Postgres config",
        status: "configured and reachable"
      },
      {
        label: "pgvector",
        status: "missing"
      },
      {
        label: "migrations",
        status: "verified (14/14 applied)"
      }
    ];

    expectStatuses(await checkSourceGraph(repoRoot, "postgres://example", unreachableChecks), {
      "Source graph schema": "skipped (Postgres unreachable)",
      "SourceRepository read path": "skipped (Postgres unreachable)",
      "Source graph runtime proof": "skipped (Postgres unreachable)"
    });
    expectStatuses(await checkMemoryGovernance(repoRoot, "postgres://example", notReadyChecks), {
      "Memory governance schema": "skipped (brain store not ready)",
      "MemoryRepository read path": "skipped (brain store not ready)",
      "Memory governance runtime proof": "skipped (brain store not ready)"
    });
    expectStatuses(await checkRetrievalSubstrate(repoRoot, "postgres://example", notReadyChecks), {
      "Retrieval substrate schema": "skipped (brain store not ready)",
      "RetrievalRepository read path": "skipped (brain store not ready)",
      "Retrieval substrate runtime proof": "skipped (brain store not ready)"
    });
    expectStatuses(await checkCodexAdapterRuntimeProof(repoRoot, "postgres://example", unreachableChecks), {
      "Codex adapter runtime proof": "skipped (Postgres unreachable)"
    });
    expectStatuses(await checkCodexAdapterRuntimeProof(repoRoot, "postgres://example", notReadyChecks), {
      "Codex adapter runtime proof": "skipped (brain store not ready)"
    });
  });

  it("reports Codex adapter runtime proof as unverified when DB is ready", async () => {
    const repoRoot = await writeDoctorPackageJson();
    const readyChecks: DoctorCheck[] = [
      {
        label: "Postgres config",
        status: "configured and reachable"
      },
      {
        label: "pgvector",
        status: "available"
      },
      {
        label: "migrations",
        status: "verified (15/15 applied)"
      }
    ];

    expectStatuses(await checkCodexAdapterRuntimeProof(repoRoot, "postgres://example", readyChecks), {
      "Codex adapter runtime proof": "unverified (run pnpm db:smoke:codex-adapter)"
    });
  });
});
