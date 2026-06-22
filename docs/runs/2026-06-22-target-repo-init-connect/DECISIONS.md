# Decisions

- Treat `GOAL.md` M27 as the active execution contract.
- Use `docs/runs/2026-06-22-target-repo-init-connect/` as the compact M27 run
  ledger. It is audit/handoff material only, not runtime memory.
- Keep target repo proof fixture-first. Any file writes must be restricted to a
  disposable fixture target repo and explicitly documented.

## Slice 00 Decisions

- Source: `docs/KRN_KERNEL.md`.
  Mechanism: runtime truth is store/service-backed, while markdown is allowed
  only as docs, exports, audit, seed, or backup.
  KRN implication: M27 may add run ledger and handoff docs, but target repo
  identity and harness state must persist through Postgres-backed objects.
  Decision: use markdown only for this run ledger; do not create `.krn`
  runtime truth or markdown memory in the target repo.
  Rejection/falsifier: if init/connect stores product truth in files instead
  of Project, RepoInstallation, ProjectKernel, and harness tables, the slice
  violates the kernel contract.

- Source: `GOAL.md` M27.
  Mechanism: the target behavior starts with a fixture repo, then dry-run init,
  connect persistence, project-scoped planning, Codex brief readback, and
  evidence capture.
  KRN implication: M27 should tighten existing CLI/DB/harness paths rather than
  introduce dashboard/API/MCP/plugin/runtime systems.
  Decision: implement the smallest final-compatible `krn init --dry-run --repo`
  and `krn init --connect --repo <fixture> --persist` path if current support
  is missing.
  Rejection/falsifier: if M27 requires an external real repo mutation,
  dashboard, API, or new runtime store to prove the flow, the implementation is
  out of scope.

- Source: repo-level `docs/handoff/*` and latest M22-M26 run handoff.
  Mechanism: M22-M26 already prove persisted harness plan/evidence, source
  graph, memory governance, retrieval/search, activation, Codex adapter
  readback, and worker job skeleton smokes.
  KRN implication: M27 should reuse those proven repository and smoke patterns
  instead of rebuilding the prior spine.
  Decision: Slice 01 will inventory the existing schema/repository/CLI support
  and only add missing target-repo registration and project-scoped harness
  behavior.
  Rejection/falsifier: broad historical rereads or copying old topology would
  contradict the repo instructions and the current handoff state.

## Slice 00 Skill Record

- `superpowers:using-superpowers`: used to enforce skill selection before task
  actions.
- `superpowers:test-driven-development`: loaded before behavior changes; later
  code slices must write and run failing tests before production code.
- `typescript-type-safety`: used for upcoming TypeScript/CLI boundary work.
- `brain-store-schema`: used for upcoming Postgres repository/schema checks.

## Slice 01 Inventory

Exists:

- `workspaces`, `projects`, `repo_installations`, and `project_kernels` tables
  exist in `packages/db/src/schema/harness.ts`.
- `repo_installations` has `project_id`, `provider`, `repo_url`,
  `default_branch`, `local_path_hint`, metadata, `created_at`, and
  `updated_at`.
- `project_kernels` has `project_id`, `version`, `summary`,
  `active_context_rule`, metadata, `created_at`, and `updated_at`.
- `DrizzleProjectRepository` supports `createWorkspace`,
  `findWorkspaceBySlug`, `createProject`, `findProjectBySlug`, `getProject`,
  `createRepoInstallation`, `createProjectKernel`, and
  `getLatestProjectKernel`.
- `compileHarnessPlan` already accepts a resolved `projectId`, persists the
  project ID through operator intent/task contract, and starts retrieval with
  project scope.
- Existing DB smokes show the pattern for fixture-scoped workspace/project
  creation, persisted harness run creation, readback, and cleanup.
- `krn codex brief --run-id <id>` can render a read-only brief from a persisted
  execution run.
- `krn evidence capture --run-id <id> --persist` can persist evidence for an
  existing execution run.

Missing:

- No `krn init` command exists.
- No target repo fixture exists under `tests/fixtures/target-repos/`.
- No explicit target repo detection module exists for package manager,
  TypeScript presence, scripts, existing `AGENTS.md`, `.codex`,
  `.agents/skills`, or forbidden surfaces.
- No AGENTS.md/Codex overlay proposal renderer exists.
- No repo installation first-class fingerprint column or lookup method exists.
  `local_path_hint` can carry a path hint, but repo fingerprint is stable query
  state and should not be hidden only in JSON metadata.
- No `getProjectByRepoFingerprint/path`, no
  `listRepoInstallationsForProject`, and no fixture cleanup helper exist.
- No `krn plan --project <project-id>` parser/runtime path exists; the current
  command hardcodes workspace `local` and project `mise-en-palace`.
- No `pnpm db:smoke:init-connect` or
  `pnpm db:smoke:target-repo-harness` script exists.
- `krn doctor` has no target repo readiness section yet.

Command shape for M27:

```sh
krn init --dry-run --repo tests/fixtures/target-repos/typescript-basic
krn init --connect --repo tests/fixtures/target-repos/typescript-basic --persist
krn plan --project <project-id> --task "improve test script readiness" --persist
krn codex brief --run-id <run-id>
krn evidence capture --run-id <run-id> --persist
```

Flag decision:

- `--persist` matches existing CLI write semantics and should remain the write
  gate for `init --connect` and `plan`.
- `--repo <path>` is the explicit target-repo selector for both dry-run and
  connect.
- `--dry-run` is the no-write init mode and must print `No files written`.
- `--connect` is the smallest honest final-compatible init mode for creating or
  reusing Project, RepoInstallation, and ProjectKernel.
- `--project <project-id>` should select an already connected project by ID.
  If the project is missing, the persisted plan must fail instead of falling
  back to the default project.

Intentionally not built:

- Dashboard, `apps/`, public API, MCP server, plugin package, broad worker
  daemon, research layer, source crawler, runtime markdown memory, `.krn`
  runtime truth, separate vector/graph/search store, Redis/Kafka, broad eval
  suite, and real external repo mutation.

## Slice 01 Decisions

- Source: `packages/db/src/schema/harness.ts` and
  `packages/harness/src/repositories/projectRepository.ts`.
  Mechanism: Project, RepoInstallation, and ProjectKernel already have durable
  tables and create/read repository methods, but repo fingerprint is not a
  first-class query field.
  KRN implication: M27 can reuse the existing project model, but connect
  idempotency needs an indexed fingerprint or equivalent relational lookup.
  Decision: add only the minimal repo fingerprint/path lookup support required
  by init/connect instead of adding a broader ProjectRegistry.
  Rejection/falsifier: if M27 stores fingerprint only in metadata and then
  searches JSON ad hoc, it violates the brain-store schema boundary.

- Source: `packages/cli/src/parseArgs.ts` and live unsupported-command probes.
  Mechanism: parser supports `plan --task [--persist]`, `doctor`, DB smokes,
  evidence capture, and Codex brief, but rejects `init` and `plan --project`.
  KRN implication: CLI work should extend the existing manual parser and
  dispatcher, not add a parser dependency for this slice.
  Decision: implement `init` and `plan --project` in the current parser style.
  Rejection/falsifier: adding a broad CLI framework before more command
  complexity exists would be overbuilt for M27.

- Source: `packages/db/src/harnessPlanSmoke.ts`,
  `packages/cli/src/codexAdapterSmoke.ts`, and
  `packages/cli/src/runDbSmokeCommand.ts`.
  Mechanism: smokes already use marker-scoped rows, readback checks, explicit
  cleanup, and cleanup-count reporting.
  KRN implication: M27 smokes should follow the same marker and cleanup pattern.
  Decision: add `db:smoke:init-connect` and `db:smoke:target-repo-harness`
  using the existing smoke conventions.
  Rejection/falsifier: smoke rows left behind or shared unmarked state would
  make the target repo proof unsafe.

## Slice 08 Decisions

- Source: `GOAL.md` Slice 08 and Slice 06 connected fixture output.
  Mechanism: `krn init --connect --repo <fixture> --persist` creates or reuses
  a Project, RepoInstallation, and ProjectKernel; project-scoped planning must
  consume that explicit Project identity.
  KRN implication: `krn plan --project <project-id> --persist` must resolve the
  project by ID, load its ProjectKernel and repo metadata, and pass the resolved
  project ID into `compileHarnessPlan`.
  Decision: extend the existing manual parser/runtime path with optional
  `projectId` instead of introducing a new command family.
  Rejection/falsifier: if `--project` is supplied and missing but the command
  silently creates or uses the default `local/mise-en-palace` project, the
  slice fails.

- Source: `packages/cli/src/databaseRuntime.ts` and
  `packages/harness/src/repositories/projectRepository.ts`.
  Mechanism: the database runtime already creates default workspace/project for
  generic persisted planning, while the project repository can read projects,
  latest ProjectKernel, and repo installations by project ID.
  KRN implication: default project creation remains valid only when no explicit
  `--project` is supplied.
  Decision: explicit project planning uses `getProject`,
  `getLatestProjectKernel`, and `listRepoInstallationsForProject`; missing
  Project or ProjectKernel fails clearly.
  Rejection/falsifier: hiding ProjectKernel absence or repo metadata absence in
  JSON metadata would weaken target-repo readiness proof.

- Type-safety boundary: CLI args and env are external input; parser trims
  `--project`, runtime passes it as an optional string, and DB runtime narrows
  missing/blank values before repository calls.
  Exception record: no `any`, no relaxed strictness, and the only
  `exactOptionalPropertyTypes` issue was fixed with conditional object spreads.

## Slice 09 Decisions

- Source: `GOAL.md` Slice 09.
  Mechanism: the full target repo harness smoke must connect a fixture repo,
  create a project-scoped persisted plan, render a Codex brief, persist
  evidence capture records, verify target-project linkage, and cleanup all
  marker rows.
  KRN implication: this smoke crosses CLI, DB, harness, codex-adapter, and
  evidence persistence, so it belongs in the CLI package as an adapter-level
  smoke helper rather than in `@krn/db` alone.
  Decision: add `packages/cli/src/targetRepoHarnessSmoke.ts` and expose it via
  `krn db smoke target-repo-harness` / `pnpm db:smoke:target-repo-harness`.
  Rejection/falsifier: if the smoke only proves DB project rows or only renders
  a brief without evidence persistence and cleanup, Slice 09 is incomplete.

- Source: existing `codexAdapterSmoke` and `initConnectSmoke` patterns.
  Mechanism: marker-scoped workspace/project rows plus direct SQL cleanup prove
  smokes are self-cleaning and safe to rerun.
  KRN implication: target repo harness smoke should use the same marker
  convention and not mutate the fixture target repo.
  Decision: use a marker-scoped repo path hint and cleanup by marker plus
  retrieval/run-event IDs.
  Rejection/falsifier: cleanup remaining marker count greater than zero blocks
  the smoke.
