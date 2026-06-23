# Verification

Latest verified slice: MM-32B audit CLI semantic snapshot ingestion.

Passed:

- Focused RED CLI audit test failed because `--fail-on warning` was rejected as
  usage error.
- Focused GREEN CLI audit `--fail-on warning` test passed with 6 files and 91
  tests.
- Focused AuditBundle/semantic snapshot ingestion test passed with injected DB
  runtime and JSON `semanticSnapshotCounts`.
- Focused RED handoff test failed because repo handoff docs were not converted
  into an `AuditHandoffSnapshot`; focused GREEN handoff test passed with 6 files
  and 92 tests.
- Focused DB, harness, and CLI typechecks passed.
- `pnpm typecheck` passed across all workspace packages.
- `pnpm test` passed across 45 files and 230 tests.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- `git diff --check` passed.
- Forbidden directory scan found no added dashboard/API/MCP/research/pattern
  surfaces.
- Final `krn audit slice --since origin/main ...` passed with 0 findings after
  explicit intended files, verification commands, and handoff docs were
  supplied.

MM-32B behavior proof:

- `krn audit slice` can merge explicit `--intended-file` values with
  AuditBundle intended files.
- `krn audit slice` can merge explicit `--verification <command=status>` values
  with AuditBundle verification command states.
- Missing, failed, and absent verification evidence produce audit findings.
- DB-backed semantic snapshot ingestion covers MemoryCandidate, MemoryRecord,
  SourceClaim, SourceDecision, EvalCandidate, ObservationGroup, and
  ActivationDecision where project/retrieval IDs are supplied.
- Repo-local `docs/handoff/*` files are converted into an `AuditHandoffSnapshot`
  so slice audit can inspect last verified state, changed files, verification,
  rollback path, and next action.
- JSON/text reports expose semantic snapshot counts so file-scan proof is
  distinguishable from semantic memory governance proof.
- `--fail-on warning` keeps the audit verdict advisory but returns exit code 1
  when warning findings exist.

Not proven by MM-32B:

- Fuzzy semantic anti-memory matching.
- Golden memory behavior runner.
- API/MCP/dashboard readiness.
