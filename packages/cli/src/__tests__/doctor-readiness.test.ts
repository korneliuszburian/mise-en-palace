import {
  readFile
} from "node:fs/promises";
import path from "node:path";
import {
  describe,
  expect,
  it
} from "vitest";

import {
  deriveActivationReadiness,
  deriveBrainStoreReadiness,
  deriveCodexAdapterReadiness,
  deriveHarnessPersistenceReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveTargetRepoReadiness,
  deriveWorkerJobReadiness
} from "../doctor-readiness.js";
import type {
  DoctorCheck
} from "../run-doctor-command.js";

const postgresReadyTyped: DoctorCheck[] = [
  {
    label: "Postgres config",
    status: "db reachable after wording change",
    outcome: "configured_reachable",
    severity: "pass"
  },
  {
    label: "pgvector",
    status: "extension ok after wording change",
    outcome: "pgvector_available",
    severity: "pass"
  },
  {
    label: "migrations",
    status: "migration history ok after wording change",
    outcome: "migrations_verified",
    severity: "pass"
  }
];

describe("doctorReadiness", () => {
  it("exports focused readiness derivation helpers", () => {
    expect(deriveBrainStoreReadiness).toEqual(expect.any(Function));
    expect(deriveHarnessPersistenceReadiness).toEqual(expect.any(Function));
    expect(deriveSourceGraphReadiness).toEqual(expect.any(Function));
    expect(deriveMemoryGovernanceReadiness).toEqual(expect.any(Function));
    expect(deriveRetrievalSubstrateReadiness).toEqual(expect.any(Function));
    expect(deriveActivationReadiness).toEqual(expect.any(Function));
    expect(deriveCodexAdapterReadiness).toEqual(expect.any(Function));
    expect(deriveWorkerJobReadiness).toEqual(expect.any(Function));
    expect(deriveTargetRepoReadiness).toEqual(expect.any(Function));
  });

  it("keeps readiness derivation pure and read-only", async () => {
    const repoRoot = path.resolve(process.cwd(), "../..");
    const source = await readFile(
      path.join(repoRoot, "packages", "cli", "src", "doctor-readiness.ts"),
      "utf8"
    );

    expect(source).not.toContain("@krn/db");
    expect(source).not.toContain("node:fs");
    expect(source).not.toContain("node:child_process");
    expect(source).not.toContain("writeFile");
    expect(source).not.toContain("appendFile");
    expect(source).not.toContain("rm(");
  });

  it("uses typed Codex adapter outcomes instead of display wording", () => {
    const codexAdapterChecks: DoctorCheck[] = [
      {
        label: "Codex adapter renderer",
        status: "renderer ok after wording change",
        outcome: "present",
        severity: "pass"
      },
      {
        label: "Execution brief smoke",
        status: "smoke command ok after wording change",
        outcome: "available",
        severity: "pass"
      },
      {
        label: "Codex execution runner",
        status: "runner forbidden surface absent after wording change",
        outcome: "absent",
        severity: "pass"
      },
      {
        label: "KRN MCP server",
        status: "MCP forbidden surface absent after wording change",
        outcome: "absent",
        severity: "pass"
      },
      {
        label: "Codex adapter runtime proof",
        status: "runtime proof ok after wording change",
        outcome: "proven",
        severity: "pass"
      }
    ];

    expect(deriveCodexAdapterReadiness(postgresReadyTyped, codexAdapterChecks)).toEqual({
      label: "Codex adapter readiness",
      status: "ready (renderer, runtime proof, and forbidden surfaces checked)"
    });
    expect(
      deriveCodexAdapterReadiness(
        postgresReadyTyped,
        codexAdapterChecks.map((check) =>
          check.label === "Codex adapter runtime proof"
            ? {
                label: "Codex adapter runtime proof",
                status: "custom unverified wording",
                outcome: "runtime_unverified",
                severity: "warning"
              }
            : check
        )
      )
    ).toEqual({
      label: "Codex adapter readiness",
      status: "runtime unverified (run pnpm db:smoke:codex-adapter)"
    });
    expect(
      deriveCodexAdapterReadiness(
        postgresReadyTyped,
        codexAdapterChecks.map((check) =>
          check.label === "KRN MCP server"
            ? {
                label: "KRN MCP server",
                status: "custom forbidden wording",
                outcome: "present",
                severity: "failure"
              }
            : check
        )
      )
    ).toEqual({
      label: "Codex adapter readiness",
      status: "blocked (forbidden Codex execution or MCP server present)"
    });
  });

  it("uses typed worker job outcomes instead of display wording", () => {
    const workerJobChecks: DoctorCheck[] = [
      {
        label: "Worker job schema",
        status: "schema ok after wording change",
        outcome: "present",
        severity: "pass"
      },
      {
        label: "Worker job repository",
        status: "repository ok after wording change",
        outcome: "present",
        severity: "pass"
      },
      {
        label: "Worker job smoke",
        status: "smoke command ok after wording change",
        outcome: "available",
        severity: "pass"
      },
      {
        label: "Redis/Kafka queue",
        status: "queue forbidden surface absent after wording change",
        outcome: "absent",
        severity: "pass"
      },
      {
        label: "Broad worker daemon",
        status: "daemon forbidden surface absent after wording change",
        outcome: "absent",
        severity: "pass"
      }
    ];

    expect(deriveWorkerJobReadiness(postgresReadyTyped, workerJobChecks)).toEqual({
      label: "Worker job readiness",
      status: "ready (schema, repository, smoke command, and forbidden runtime checks present)"
    });
    expect(
      deriveWorkerJobReadiness(
        postgresReadyTyped,
        workerJobChecks.map((check) =>
          check.label === "Redis/Kafka queue"
            ? {
                label: "Redis/Kafka queue",
                status: "custom forbidden wording",
                outcome: "present",
                severity: "failure"
              }
            : check
        )
      )
    ).toEqual({
      label: "Worker job readiness",
      status: "blocked (forbidden maintenance runtime present)"
    });
  });

  it("uses typed target repo outcomes instead of display wording", () => {
    const targetRepoChecks: DoctorCheck[] = [
      {
        label: "Target repo init command",
        status: "init command ok after wording change",
        outcome: "available",
        severity: "pass"
      },
      {
        label: "Target repo fixture smoke",
        status: "fixture ok after wording change",
        outcome: "available",
        severity: "pass"
      },
      {
        label: "Project registration schema",
        status: "project schema ok after wording change",
        outcome: "present",
        severity: "pass"
      },
      {
        label: "Init-connect smoke",
        status: "init-connect proof ok after wording change",
        outcome: "proven",
        severity: "pass"
      },
      {
        label: "Target repo harness smoke",
        status: "target harness proof ok after wording change",
        outcome: "proven",
        severity: "pass"
      },
      {
        label: "Cross-project leakage proof",
        status: "project scope proof ok after wording change",
        outcome: "known",
        severity: "pass"
      },
      {
        label: "Target repo forbidden surfaces",
        status: "forbidden target surfaces absent after wording change",
        outcome: "absent",
        severity: "pass"
      }
    ];

    expect(deriveTargetRepoReadiness(postgresReadyTyped, targetRepoChecks)).toEqual({
      label: "Target repo readiness",
      status:
        "ready (init-connect and target harness smokes proven; source seeds, owner files, evidence readback, and memory usefulness guarded)"
    });
    expect(
      deriveTargetRepoReadiness(
        postgresReadyTyped,
        targetRepoChecks.map((check) =>
          check.label === "Target repo forbidden surfaces"
            ? {
                label: "Target repo forbidden surfaces",
                status: "custom forbidden wording",
                outcome: "present",
                severity: "failure"
              }
            : check
        )
      )
    ).toEqual({
      label: "Target repo readiness",
      status: "blocked (forbidden target repo surface present)"
    });
  });
});
