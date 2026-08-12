import { describe, expect, it } from "vitest";

import {
  deriveActivationReadiness,
  deriveBrainStoreReadiness,
  deriveHarnessPersistenceReadiness,
  deriveMemoryGovernanceReadiness,
  deriveRetrievalSubstrateReadiness,
  deriveSourceGraphReadiness,
  deriveMaintenanceQueueReadiness,
  deriveTargetRepoReadiness
} from "../doctor-readiness.js";
import { runCli } from "../run-cli.js";
import type {
  DoctorCheck
} from "../run-doctor-command.js";

const now = "2026-06-21T12:00:00.000Z";
const currentProof = {
  command: "pnpm krn doctor",
  status: "passed" as const,
  capturedAt: new Date().toISOString(),
  freshness: "current" as const,
  storeIdentity: "postgres://localhost:54329/krn#doctor-test"
};
const currentProjectProof = {
  ...currentProof,
  projectId: "project-fixture"
};

describe("runCli", () => {
  it("prints a read-only doctor report", async () => {
    const result = await runCli(["doctor"], {
      env: { KRN_DB_BACKEND: "postgres" },
      now: () => now,
      createId: (prefix) => `${prefix}-1`
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("KRN Doctor");
    expect(result.stdout).toContain("Postgres mode: preview/no-DB");
    expect(result.stdout).toContain("Postgres config: not configured");
    expect(result.stdout).toContain(
      "Postgres next action: export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn; docker compose up -d krn-postgres; pnpm db:migrate; pnpm db:ready"
    );
    expect(result.stdout).toContain(
      "Memory store readiness: preview only (set KRN_DATABASE_URL and run migrations for persisted harness state)"
    );
    expect(result.stdout).toContain("pgvector: skipped");
    expect(result.stdout).toContain("Harness persistence schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain("Project repository smoke: available (pnpm db:smoke)");
    expect(result.stdout).toContain("Harness plan smoke: available (pnpm db:smoke:harness-plan)");
    expect(result.stdout).toContain(
      "Evidence persistence smoke: available (pnpm db:smoke:harness-evidence)"
    );
    expect(result.stdout).toContain(
      "Harness persistence readiness: preview only (set KRN_DATABASE_URL and run harness smoke commands for persistence proof)"
    );
    expect(result.stdout).toContain("Source graph smoke: available (pnpm db:smoke:source-graph)");
    expect(result.stdout).toContain(
      "Source graph readiness: preview only (set KRN_DATABASE_URL and run source graph smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Memory governance schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain("MemoryRepository read path: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "Memory governance smoke: available (pnpm db:smoke:memory-governance)"
    );
    expect(result.stdout).toContain(
      "Memory governance readiness: preview only (set KRN_DATABASE_URL and run memory governance smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Retrieval substrate schema: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "RetrievalRepository read path: skipped (Postgres not configured)"
    );
    expect(result.stdout).toContain(
      "Retrieval substrate smoke: available (pnpm db:smoke:retrieval-substrate)"
    );
    expect(result.stdout).toContain(
      "Retrieval substrate readiness: preview only (set KRN_DATABASE_URL and run retrieval substrate smoke for persistence proof)"
    );
    expect(result.stdout).toContain("Activation domain contracts: present");
    expect(result.stdout).toContain("Activation smoke: available (pnpm db:smoke:activation)");
    expect(result.stdout).toContain("Activation smoke runtime proof: skipped (Postgres not configured)");
    expect(result.stdout).toContain(
      "Activation readiness: preview only (set KRN_DATABASE_URL and run activation smoke for runtime proof)"
    );
    expect(result.stdout).toContain("Codex adapter renderer: present");
    expect(result.stdout).toContain(
      "Execution brief smoke: available (pnpm db:smoke:codex-adapter)"
    );
    expect(result.stdout).toContain("Codex execution runner: absent");
    expect(result.stdout).toContain("KRN MCP product server: absent");
    expect(result.stdout).toContain(
      "Codex adapter readiness: preview only (set KRN_DATABASE_URL and run codex adapter smoke for proof)"
    );
    expect(result.stdout).toContain("Maintenance queue schema: present");
    expect(result.stdout).toContain("Maintenance queue repository: present");
    expect(result.stdout).toContain(
      "Maintenance queue smoke: available (pnpm db:smoke:maintenance-queue)"
    );
    expect(result.stdout).toContain("Maintenance record executor: present (explicit per-record)");
    expect(result.stdout).toContain("Redis/Kafka queue: absent");
    expect(result.stdout).toContain("Autonomous maintenance daemon: absent");
    expect(result.stdout).toContain(
      "Maintenance queue readiness: preview only (set KRN_DATABASE_URL and run maintenance queue smoke for proof)"
    );
    expect(result.stdout).toContain(
      "Target repo init command: available (krn init --connect --repo <path> --persist)"
    );
    expect(result.stdout).toContain(
      "Target repo fixture smoke: available (tests/fixtures/target-repos/typescript-basic)"
    );
    expect(result.stdout).toContain(
      "Project registration schema: present (Project, RepoInstallation, ProjectKernel)"
    );
    expect(result.stdout).toContain(
      "Init-connect smoke: available (pnpm db:smoke:init-connect; run it for proof)"
    );
    expect(result.stdout).toContain(
      "Target repo harness smoke: available (pnpm db:smoke:target-repo-harness; run it for proof)"
    );
    expect(result.stdout).toContain(
      "Cross-project leakage proof: unverified (run pnpm db:smoke:target-repo-harness)"
    );
    expect(result.stdout).toContain("Target repo forbidden surfaces: absent");
    expect(result.stdout).toContain(
      "Target repo readiness: preview only (set KRN_DATABASE_URL and run init-connect and target repo harness smokes for proof)"
    );
    expect(result.stdout).toContain("Broad context dump: absent");
    expect(result.stdout).toContain("Core requiredSkills field: absent");
    expect(result.stdout).toContain("Separate vector/search DB: absent");
    expect(result.stdout).toContain("Naive RAG dump command: absent");
    expect(result.stdout).toContain("Runtime markdown memory: absent");
    expect(result.stdout).toContain("Automatic memory mutation: absent");
    expect(result.stdout).toContain("AGENTS.md: present");
    expect(result.stdout).toMatch(/\.krn runtime truth: (absent|governed SQLite artifacts only)/u);
    expect(result.stdout).toContain("TypeScript strictness: enabled");
    expect(result.stdout).toContain("Forbidden surfaces: absent");
  });

  it("distinguishes doctor DB readiness blockers", () => {
    expect(
      deriveBrainStoreReadiness([
        { label: "Postgres config", status: "configured and reachable" },
        { label: "pgvector", status: "available" },
        { label: "migrations", status: "unverified (2/3 applied)" }
      ])
    ).toEqual({
      label: "Memory store readiness",
      status: "blocked (migrations unverified)"
    });

    expect(
      deriveBrainStoreReadiness([
        { label: "Postgres config", status: "configured and reachable" },
        { label: "pgvector", status: "missing" },
        { label: "migrations", status: "verified (3/3 applied)" }
      ])
    ).toEqual({
      label: "Memory store readiness",
      status: "blocked (pgvector missing)"
    });

    expect(
      deriveBrainStoreReadiness([
        { label: "Postgres config", status: "configured and reachable" },
        { label: "pgvector", status: "available" },
        { label: "migrations", status: "verified (3/3 applied)" },
        { label: "Source authority integrity", status: "blocked (2 violations)" }
      ])
    ).toEqual({
      label: "Memory store readiness",
      status: "blocked (source authority integrity unverified)"
    });
  });

  it("distinguishes doctor harness persistence readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (3/3 applied)" }
    ];
    const smokeCommandsAvailable = [
      { label: "Harness persistence schema", status: "ready (11/11 tables present)" },
      { label: "Project repository smoke", status: "available (pnpm db:smoke)" },
      { label: "Harness plan smoke", status: "available (pnpm db:smoke:harness-plan)" },
      {
        label: "Evidence persistence smoke",
        status: "available (pnpm db:smoke:harness-evidence)"
      }
    ];

    expect(
      deriveHarnessPersistenceReadiness(postgresReady, smokeCommandsAvailable)
    ).toEqual({
      label: "Harness persistence readiness",
      status: "ready (schema present; smoke commands available)"
    });

    expect(
      deriveHarnessPersistenceReadiness(postgresReady, [
        ...smokeCommandsAvailable.slice(1),
        { label: "Harness persistence schema", status: "missing (feedback_deltas)" }
      ])
    ).toEqual({
      label: "Harness persistence readiness",
      status: "blocked (harness persistence schema missing)"
    });
  });

  it("distinguishes doctor source graph readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (4/4 applied)" }
    ];
    const sourceGraphReady: DoctorCheck[] = [
      { label: "Source graph schema", status: "ready (8/8 tables present)" },
      { label: "SourceRepository read path", status: "reachable" },
      { label: "Source graph smoke", status: "available (pnpm db:smoke:source-graph)" },
      {
        label: "Source graph runtime proof",
        status: "ready (claims 1, edges 1, rejections 1)",
        outcome: "proven",
        severity: "pass",
        proof: currentProof
      },
      { label: "Source crawler/research layer", status: "absent" },
      { label: "Separate graph DB", status: "absent" }
    ];

    expect(
      deriveSourceGraphReadiness(postgresReady, sourceGraphReady)
    ).toEqual({
      label: "Source graph readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveSourceGraphReadiness(postgresReady, [
        ...sourceGraphReady.slice(0, 3),
        { label: "Source graph runtime proof", status: "unverified (run pnpm db:smoke:source-graph)" },
        ...sourceGraphReady.slice(4)
      ])
    ).toEqual({
      label: "Source graph readiness",
      status: "runtime unverified (run pnpm db:smoke:source-graph)"
    });
  });

  it("distinguishes doctor memory governance readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (5/5 applied)" }
    ];
    const memoryGovernanceReady: DoctorCheck[] = [
      { label: "Memory governance schema", status: "ready (7/7 tables present)" },
      { label: "MemoryRepository read path", status: "reachable" },
      { label: "Memory governance smoke", status: "available (pnpm db:smoke:memory-governance)" },
      {
        label: "Memory governance runtime proof",
        status: "ready (candidates 1, records 1, applications 1, anti-memory 1)",
        outcome: "proven",
        severity: "pass",
        proof: currentProof
      },
      { label: "Runtime markdown memory", status: "absent" },
      { label: "Automatic memory mutation", status: "absent" }
    ];

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, memoryGovernanceReady)
    ).toEqual({
      label: "Memory governance readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, [
        ...memoryGovernanceReady.slice(0, 3),
        {
          label: "Memory governance runtime proof",
          status: "unverified (run pnpm db:smoke:memory-governance)"
        },
        ...memoryGovernanceReady.slice(4)
      ])
    ).toEqual({
      label: "Memory governance readiness",
      status: "runtime unverified (run pnpm db:smoke:memory-governance)"
    });

    expect(
      deriveMemoryGovernanceReadiness(postgresReady, [
        ...memoryGovernanceReady.slice(0, 4),
        { label: "Runtime markdown memory", status: "present" },
        { label: "Automatic memory mutation", status: "absent" }
      ])
    ).toEqual({
      label: "Memory governance readiness",
      status: "blocked (forbidden memory runtime present)"
    });
  });

  it("distinguishes doctor retrieval substrate readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (6/6 applied)" }
    ];
    const retrievalReady: DoctorCheck[] = [
      { label: "Retrieval substrate schema", status: "ready (8/8 tables present)" },
      { label: "RetrievalRepository read path", status: "reachable" },
      {
        label: "Retrieval substrate smoke",
        status: "available (pnpm db:smoke:retrieval-substrate)"
      },
      {
        label: "Retrieval substrate runtime proof",
        status: "ready (search documents 4, candidates 2, activation decisions 2, exclusions 1)",
        outcome: "proven",
        severity: "pass",
        proof: currentProof
      },
      { label: "Separate vector/search DB", status: "absent" },
      { label: "Naive RAG dump command", status: "absent" }
    ];

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, retrievalReady)
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "ready (schema present; repository reachable; runtime proof present)"
    });

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, [
        ...retrievalReady.slice(0, 3),
        {
          label: "Retrieval substrate runtime proof",
          status: "unverified (run pnpm db:smoke:retrieval-substrate)"
        },
        ...retrievalReady.slice(4)
      ])
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "runtime unverified (run pnpm db:smoke:retrieval-substrate)"
    });

    expect(
      deriveRetrievalSubstrateReadiness(postgresReady, [
        ...retrievalReady.slice(0, 4),
        { label: "Separate vector/search DB", status: "present" },
        { label: "Naive RAG dump command", status: "absent" }
      ])
    ).toEqual({
      label: "Retrieval substrate readiness",
      status: "blocked (forbidden retrieval infrastructure present)"
    });
  });

  it("distinguishes doctor activation readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (3/3 applied)" }
    ];
    const activationReady: DoctorCheck[] = [
      { label: "Activation domain contracts", status: "present" },
      { label: "Activation engine surface", status: "present" },
      { label: "Activation smoke", status: "available (pnpm db:smoke:activation)" },
      {
        label: "Activation smoke runtime proof",
        status: "ready (decisions 6, inclusions 2, exclusions 4)",
        outcome: "proven",
        severity: "pass",
        proof: currentProof
      },
      { label: "Broad context dump", status: "absent" },
      { label: "Core requiredSkills field", status: "absent" }
    ];

    expect(
      deriveActivationReadiness(
        postgresReady,
        { label: "Source graph readiness", status: "ready (schema present)" },
        { label: "Memory governance readiness", status: "ready (schema present)" },
        { label: "Retrieval substrate readiness", status: "ready (schema present)" },
        activationReady
      )
    ).toEqual({
      label: "Activation readiness",
      status: "ready (domain contracts, dependencies, and runtime proof present)"
    });

    expect(
      deriveActivationReadiness(
        postgresReady,
        { label: "Source graph readiness", status: "ready (schema present)" },
        { label: "Memory governance readiness", status: "ready (schema present)" },
        { label: "Retrieval substrate readiness", status: "ready (schema present)" },
        [
          ...activationReady.slice(0, 3),
          {
            label: "Activation smoke runtime proof",
            status: "unverified (run pnpm db:smoke:activation)"
          },
          ...activationReady.slice(4)
        ]
      )
    ).toEqual({
      label: "Activation readiness",
      status: "runtime unverified (run pnpm db:smoke:activation)"
    });
  });

  it("distinguishes doctor maintenance queue readiness blockers", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (7/7 applied)" }
    ];
    const maintenanceQueueReady = [
      { label: "Maintenance queue schema", status: "present" },
      { label: "Maintenance queue repository", status: "present" },
      { label: "Maintenance queue smoke", status: "available (pnpm db:smoke:maintenance-queue)" },
      { label: "Maintenance record executor", status: "present (explicit per-record)" },
      { label: "Redis/Kafka queue", status: "absent" },
      { label: "Autonomous maintenance daemon", status: "absent" }
    ];

    expect(
      deriveMaintenanceQueueReadiness(postgresReady, maintenanceQueueReady)
    ).toEqual({
      label: "Maintenance queue readiness",
      status:
        "ready (schema, repository, explicit record executor, smoke command, and forbidden daemon checks present)"
    });

    expect(
      deriveMaintenanceQueueReadiness(postgresReady, [
        ...maintenanceQueueReady.slice(0, 4),
        { label: "Redis/Kafka queue", status: "present" },
        { label: "Autonomous maintenance daemon", status: "absent" }
      ])
    ).toEqual({
      label: "Maintenance queue readiness",
      status: "blocked (forbidden autonomous maintenance runtime present)"
    });
  });

  it("distinguishes doctor target repo readiness states", () => {
    const postgresReady = [
      { label: "Postgres config", status: "configured and reachable" },
      { label: "pgvector", status: "available" },
      { label: "migrations", status: "verified (8/8 applied)" }
    ];
    const targetRepoReady: DoctorCheck[] = [
      {
        label: "Target repo init command",
        status: "available (krn init --connect --repo <path> --persist)"
      },
      {
        label: "Target repo fixture smoke",
        status: "available (tests/fixtures/target-repos/typescript-basic)"
      },
      {
        label: "Project registration schema",
        status: "present (Project, RepoInstallation, ProjectKernel)"
      },
      {
        label: "Init-connect smoke",
        status: "proven (pnpm db:smoke:init-connect)",
        outcome: "proven",
        severity: "pass",
        proof: currentProjectProof
      },
      {
        label: "Target repo harness smoke",
        status: "proven (pnpm db:smoke:target-repo-harness)",
        outcome: "proven",
        severity: "pass",
        proof: currentProjectProof
      },
      {
        label: "Cross-project leakage proof",
        status: "known",
        outcome: "proven",
        severity: "pass",
        proof: currentProjectProof
      },
      { label: "Target repo forbidden surfaces", status: "absent" }
    ];

    expect(
      deriveTargetRepoReadiness(postgresReady, targetRepoReady)
    ).toEqual({
      label: "Target repo readiness",
      status:
        "ready (init-connect and target harness smokes proven; source seeds, owner files, evidence readback, and memory usefulness guarded)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 3),
        { label: "Init-connect smoke", status: "unverified (pnpm db:smoke:init-connect missing)" },
        ...targetRepoReady.slice(4)
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "unverified (init-connect smoke missing)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 4),
        {
          label: "Target repo harness smoke",
          status: "unverified (pnpm db:smoke:target-repo-harness missing)"
        },
        ...targetRepoReady.slice(5)
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "partially ready (init-connect smoke proven; target repo harness smoke missing)"
    });

    expect(
      deriveTargetRepoReadiness(postgresReady, [
        ...targetRepoReady.slice(0, 6),
        { label: "Target repo forbidden surfaces", status: "present" }
      ])
    ).toEqual({
      label: "Target repo readiness",
      status: "blocked (forbidden target repo surface present)"
    });
  });
});
