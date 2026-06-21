# Goal: M20 — Prove KRN local brain-store runtime

Repository root:

`/home/krn/coding/krn/active/mise-en-palace`

## Context

M19 is complete.

Final verified commit:

`4b86738 docs(run): add final KRN infra handoff`

Clean HEAD audit passed:

- `pnpm typecheck`
- `pnpm test`
- `krn plan --task "improve KRN doctor brain store readiness"`
- `krn doctor`
- `krn evidence capture`
- forbidden-surface checks

Known residual:

Local `KRN_DATABASE_URL` is absent, so live Postgres/pgvector/migration persistence is not proven. This is documented in:

- `docs/handoff/blockers.md`
- `docs/handoff/verification.md`

## Mission

Prove the local KRN brain-store runtime path without expanding product scope.

This goal must close the explicit residual:

`Postgres/pgvector/migrations are unproven locally.`

Do not build dashboard, API, MCP server, broad workers, research swarm, plugin package, or memory automation.

## Target outcome

A reviewer can run one documented local brain-store smoke path and see:

1. database config is detected;
2. migrations can be applied or verified;
3. pgvector availability is checked;
4. a minimal harness/runtime persistence smoke test passes;
5. `krn doctor` reports DB readiness accurately;
6. if DB is unavailable, the failure is explicit and actionable.

## Hard boundaries

Do not create:

- dashboard;
- apps/;
- KRN MCP server;
- public API;
- broad worker system;
- broad eval suite;
- runtime markdown memory;
- `.krn` runtime truth;
- separate Qdrant/LanceDB/Neo4j/Elastic store;
- Redis/Kafka queue;
- MemoryStore auto-mutation;
- SourceStore crawler;
- research layer.

Allowed:

- local DB setup docs;
- `.env.example` if absent;
- Docker Compose for Postgres + pgvector if consistent with repo direction;
- migration verification command;
- doctor DB readiness checks;
- minimal DB smoke test;
- compact handoff update.

## Required reading

Read only:

1. `AGENTS.md`
2. `GOAL.md`
3. `PLAN.md`
4. `docs/handoff/handoff.md`
5. `docs/handoff/blockers.md`
6. `docs/handoff/verification.md`
7. latest `docs/runs/**/HANDOFF.md` if needed
8. package manifests
9. db/schema/migration files directly relevant to this goal

Do not reread raw onboarding materials.
Do not read all historical docs.

## Required repo-local skills

Use the matching repo-local operational skill before work that triggers it:

- `brain-store-schema`: DB schema, migrations, repository adapters, runtime
  persistence smoke paths, or migration ledgers.
- `target-infra-adr`: local Postgres/pgvector setup, storage/runtime boundary
  decisions, migration policy, or package topology decisions.
- `typescript-type-safety`: TypeScript source, tests, validators, CLI/env IO,
  or any change that touches external data boundaries.
- `handoff-compact`: meaningful handoff, blocker closure, or compaction-ready
  state after this goal changes repo state.

## Slice 00 — Preflight

Run:

- `git status --short --branch`
- `git log --oneline -8`
- `pnpm typecheck`
- `pnpm test`

Record current state in a new compact run ledger:

`docs/runs/2026-06-21-brain-store-proof/`

Create/update:

- `PROGRESS.md`
- `HANDOFF.md`
- `DECISIONS.md`
- `BLOCKERS.md`
- `VERIFICATION.md`

Commit only if files changed:

`docs(run): add brain-store proof ledger`

## Slice 01 — DB runtime inventory

Inspect existing DB-related files:

- package scripts;
- Drizzle config if present;
- migration folders;
- db package;
- schema package;
- doctor DB checks;
- environment variable names;
- existing tests.

Record:

- how DB is expected to be configured;
- whether `KRN_DATABASE_URL` is canonical;
- whether migrations exist;
- whether pgvector extension is represented;
- what is currently unproven.

Update `DECISIONS.md` if needed.

Verification:

- `pnpm typecheck`

Commit if docs changed:

`docs(run): record brain-store runtime inventory`

## Slice 02 — Local DB setup path

Add the smallest useful local setup path.

Preferred:

- `docker-compose.yml` or `compose.yaml` for Postgres with pgvector, only if absent and acceptable;
- `.env.example` with `KRN_DATABASE_URL`;
- docs section explaining how to start local DB and run migrations.

Do not introduce separate stores.

Do not add cloud config.

Verification:

- config/docs are compact;
- no runtime markdown memory;
- `pnpm typecheck`

Commit:

`docs(db): add local brain-store setup path`

or, if compose/config added:

`chore(db): add local Postgres pgvector setup`

## Slice 03 — Migration verification command

Add or verify scripts for:

- checking DB connection;
- applying migrations;
- verifying migration status;
- checking `vector` extension availability.

Prefer existing tooling/scripts if already present.

Do not overbuild migration framework.

Verification:

- command exists;
- command fails clearly without `KRN_DATABASE_URL`;
- command succeeds if local DB is available;
- `pnpm typecheck`;
- `pnpm test`.

Commit:

`feat(db): add migration readiness check`

## Slice 04 — Doctor DB readiness

Update `krn doctor` so DB readiness is explicit.

Doctor must distinguish:

- DB not configured;
- DB configured but unreachable;
- DB reachable but migrations unverified;
- DB reachable with pgvector missing;
- DB ready.

If `KRN_DATABASE_URL` is absent, doctor should not fail the whole no-store spine; it should report a clear warning/blocker for runtime persistence proof.

Verification:

- `krn doctor` without DB reports actionable DB warning;
- `pnpm typecheck`;
- `pnpm test`.

Commit:

`feat(cli): report brain-store readiness in doctor`

## Slice 05 — Minimal persistence smoke test

Add a minimal test or script that proves the runtime path when DB is available.

It should cover only the smallest useful path, for example:

- connect;
- ensure migrations applied;
- insert one project or harness run smoke row;
- read it back;
- clean up or use transaction/schema isolation.

It must not:

- auto-apply memory candidates;
- implement full MemoryStore behavior;
- implement SourceStore crawler;
- require dashboard/API.

If no local DB is available in the environment, the test/script may skip with a clear reason, but the run should document that live proof remains blocked.

Verification:

- smoke command behavior documented;
- with no DB, skip/fail reason is explicit;
- `pnpm typecheck`;
- `pnpm test`.

Commit:

`test(db): add brain-store persistence smoke path`

## Slice 06 — Handoff and blocker closure

Update:

- `docs/handoff/blockers.md`
- `docs/handoff/verification.md`
- `docs/handoff/handoff.md`
- current run `HANDOFF.md`

If live DB proof passed, mark the residual closed.

If live DB proof could not run due to missing local DB, keep it open but make the next action mechanical:

- set `KRN_DATABASE_URL`;
- start local pgvector Postgres;
- run exact command.

Run final audit:

- `git status --short --branch`
- `git log --oneline -8`
- `pnpm typecheck`
- `pnpm test`
- `krn doctor`

Commit:

`docs(handoff): update brain-store proof status`

## Final output

Return:

Completed:
- ...

Commits:
- ...

Verification:
- ...

DB proof status:
- configured / unconfigured
- migrations proven / unproven
- pgvector proven / unproven
- smoke persistence proven / unproven

Residual blockers:
- ...

Not built:
- dashboard
- API
- MCP server
- broad workers
- research layer
- runtime markdown memory
- separate vector/graph DB

Next safest action:
- one concrete action only
