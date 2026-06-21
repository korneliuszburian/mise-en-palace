# Decisions

- Use `docs/runs/2026-06-21-persisted-harness-spine/` as the compact M21 run
  ledger. This is audit/handoff material only, not runtime Memory Core.
- Treat `a312afe docs(goal): define persisted harness spine` as the M21 start
  commit.
- Keep `--persist` as the explicit write boundary for M21. Existing preview or
  no-store command behavior must keep working when `KRN_DATABASE_URL` is absent.
- Enforce repo-local skills from `GOAL.md` when their triggers apply. Record
  both used and intentionally unused skills in the run ledger.
- Do not add dashboard, API, MCP server, broad workers, research layer, runtime
  markdown memory, `.krn` runtime truth, separate vector/graph/search/queue
  store, full MemoryStore, full SourceStore, or broad eval suite in M21.
- M21 should stay inside the existing Postgres/Drizzle boundary unless a future
  finding proves a new durable surface is required. If that happens, stop and
  use `target-infra-adr` before implementation.
- Reuse the existing harness tables for M21. `operator_intents`,
  `task_contracts`, `harness_plans`, `context_assemblies`, `execution_runs`,
  `evidence_bundles`, `review_assessments`, `feedback_deltas`, `run_events`,
  and `outbox_events` already exist.
- Do not add a schema migration for the primary run spine tables in Slice 02
  unless implementation disproves the inventory.
- Treat evidence contract persistence as the only schema question. The default
  minimal path is a typed `harness_plans.metadata.evidenceContract` field; add a
  dedicated table only if independent lifecycle/querying becomes necessary.
- Slice 02 adopted that default: no new migration now; persist evidence
  contract expectations through typed `harness_plans.metadata.evidenceContract`
  during the `--persist` implementation.
- Change CLI write semantics in implementation: `krn plan --task "..."` should
  remain preview/no-store by default, and `krn plan --task "..." --persist`
  should be the explicit DB write path.
- Add readback repository surface for a persisted run aggregate before claiming
  M21 proof.
- Readback identity is keyed by `executionRunId`, because this is the natural
  `--run-id` for future `krn evidence capture --run-id <id> --persist`.
- Persisted feedback delta readback now narrows `memoryCandidates` and
  `sourceDecisions` from JSONB instead of dropping them.
- Slice 04 implements the explicit write boundary: DB config alone no longer
  makes `krn plan` write state.
- Persisted plan output includes `operatorIntent`, `taskContract`,
  `harnessPlan`, `contextAssembly`, and `executionRun` IDs.
- `execution_runs` is the persisted identity handed to future
  `evidence capture --run-id`.
- Add smoke commands under `krn db smoke ...` and root `pnpm db:smoke:*`
  scripts, keeping read/write proof explicit and operator-invoked.
- `pnpm db:smoke:harness-plan` must use deterministic markers and cleanup,
  because local proof runs should not leave smoke workspace rows or marked run
  events behind.
- `krn evidence capture --run-id <id> --persist` uses `executionRunId` as the
  write anchor and appends sequence `max(run_events.sequence) + 1`.
- Persisted evidence capture creates candidate records only; it does not apply
  memory, source, or eval updates.
- `pnpm db:smoke:harness-evidence` is the explicit live proof command for the
  persisted evidence loop. It creates its own marked run, writes linked
  evidence/review/feedback records, verifies counts through repository
  readback, and cleans up marker rows.
- Smoke cleanup remains marker-scoped. It must not delete earlier persisted
  dogfood/proof rows such as the Slice 04/06 execution run.
- `krn doctor` reports harness persistence readiness from read-only inspection
  only. It checks table presence and root script availability, but it does not
  execute smoke commands or write proof rows.
- Doctor "ready" means required schema tables are present and smoke command
  surfaces are available. It does not replace running the smoke commands during
  dogfood or anti-rot audit.
- Slice 09 dogfood rows are intentionally retained as local proof rows. Smoke
  rows remain marker-scoped and cleaned up.

Slice 00 skill record:

- `codex-adapter-plan`: used for the GOAL/skill-gate update before Slice 00.
- `evidence-review-loop`: used for preflight command evidence and ledger shape.
- `brain-store-schema`: not used yet; required before schema/repository work.
- `typescript-type-safety`: not used yet; required before TypeScript changes.
- `source-to-decision`: not used yet; required before source-backed decisions.
- `handoff-compact`: not used yet; required for final or paused handoff.
- `target-infra-adr`: not used; no new durable surface in Slice 00.
- `activation-engine`: not used; no activation behavior change in Slice 00.

Slice 01 skill record:

- `brain-store-schema`: used for schema, migration, repository, and mapper
  inventory.
- `source-to-decision`: used because local code evidence drives the schema and
  CLI decisions above.
- `evidence-review-loop`: used for verification and residual risk recording.
- `target-infra-adr`: not used; inventory reuses the existing Postgres/Drizzle
  boundary.
- `activation-engine`: not used; no activation behavior change in Slice 01.

Slice 02 skill record:

- `brain-store-schema`: used for the no-migration schema decision.
- `source-to-decision`: used to map local inventory and DB verification into a
  decision.
- `target-infra-adr`: not used; no new storage, queue, worker, package, or
  runtime authority was added.
- `activation-engine`: not used; no activation behavior change in Slice 02.

Slice 03 skill record:

- `brain-store-schema`: used for repository aggregate and mapper changes.
- `typescript-type-safety`: used for public repository type changes and JSONB
  narrowing.
- `test-driven-development`: used; RED tests failed before implementation and
  passed after.
- `evidence-review-loop`: used for command evidence and residual risk.
- `target-infra-adr`: not used; no new runtime surface was added.

Slice 04 skill record:

- `codex-adapter-plan`: used for persisted ID output and Codex-facing plan
  behavior.
- `typescript-type-safety`: used for CLI args, env, and runtime dependency
  injection boundaries.
- `test-driven-development`: used; RED CLI tests failed before implementation
  and passed after.
- `brain-store-schema`: used for execution run and evidence contract
  persistence behavior.

Slice 05 skill record:

- `brain-store-schema`: used for persisted harness plan smoke/readback/cleanup.
- `typescript-type-safety`: used for DB smoke IO and typed report boundary.
- `test-driven-development`: used; RED CLI test failed before parser support
  and passed after.
- `evidence-review-loop`: used for smoke proof and cleanup evidence.

Slice 06 skill record:

- `evidence-review-loop`: used for evidence bundle, review assessment, feedback
  delta, command proof, and residual-risk handling.
- `typescript-type-safety`: used for CLI parser/run-id/env boundaries and DB
  runtime injection.
- `test-driven-development`: used; RED CLI tests failed before implementation
  and passed after.
- `brain-store-schema`: used for linked evidence/review/feedback persistence.

Slice 07 skill record:

- `brain-store-schema`: used for persisted smoke readback and cleanup behavior.
- `evidence-review-loop`: used for evidence/review/feedback smoke proof.
- `typescript-type-safety`: used for CLI parser and typed DB smoke report
  boundaries.
- `test-driven-development`: used; RED CLI test failed before parser support
  and passed after.

Slice 08 skill record:

- `brain-store-schema`: used for read-only harness persistence table checks.
- `codex-adapter-plan`: used for operator-facing doctor readiness wording.
- `typescript-type-safety`: used for exported DB report types and CLI readiness
  derivation.
- `test-driven-development`: used; RED CLI tests failed before doctor output
  support and passed after.

Slice 09 skill record:

- `evidence-review-loop`: used for persisted run/evidence proof, command proof,
  review burden, rollback path, and residual risk recording.
- `handoff-compact`: used to refresh current state and next action without
  broad historical reread.
