# Verification

Slice 00 preflight:

- `git status --short --branch`: passed. Output showed
  `## main...origin/main` and `M GOAL.md`; this is the user-provided M22 goal
  update, not an unrelated dirty file.
- `git log --oneline -12`: passed. Latest commits:
  `a0bb82d`, `2984d01`, `9afd147`, `6c84e8f`, `36c6f2d`, `2bdd233`,
  `6394c65`, `ef8a749`, `64c4bbf`, `20be514`, `7b04a6c`, `cca472d`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  no forbidden surfaces.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `3/3`, migrations applied, pgvector
  available, and brain store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with readback matched, evidence contract
  commands `3`, run events `1`, and cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with linked evidence/review/feedback
  counts `1/1/1`, run events `2`, and cleanup remaining marker count `0`.

Scope checks:

- No raw onboarding materials were read.
- No external research was performed.
- No dashboard, API, MCP server, crawler, research layer, worker runtime,
  runtime markdown memory, `.krn` runtime truth, separate store, full
  MemoryStore, full SourceStore, or automatic memory mutation was added.

Slice 01 inventory:

- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- Targeted reads of `packages/db/src/schema/sources.ts`: passed.
- Targeted reads of source graph migrations and migration snapshots: passed.
- Targeted reads of `DrizzleSourceRepository`, source mappers, harness source
  repository port, core source types, schema source-claim parser, CLI parser,
  database runtime, and evidence capture behavior: passed.
- Inventory recorded in `SOURCE_GRAPH_INVENTORY.md`.

Slice 02 schema:

- RED: `pnpm --filter @krn/db test -- sources.test.ts` failed because
  `source_trust_tier` exposed only `high`, `medium`, and `low`.
- GREEN: `pnpm --filter @krn/db test -- sources.test.ts`: passed after schema
  updates.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql`.
- SQL inspection of `0003_mushy_shinko_yamashiro.sql`: passed. It creates M22
  enums, extends source support/trust enums, creates `source_decision_edges`,
  adds claim run/status/falsifier/revisit fields, and adds rejection
  title/attempted-claim/reason fields.
- `pnpm --filter @krn/db test -- sources.test.ts mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm db:check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `4/4`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `git diff --check`: passed.

Slice 03 IO schemas:

- RED: `pnpm --filter @krn/schema test -- index.test.ts` failed because
  `parseSourceClaimInput` still accepted old `high/supports` vocabulary.
- GREEN: `pnpm --filter @krn/schema test -- index.test.ts` passed after
  SourceClaim input moved to M22 support/trust vocabulary.
- RED: `pnpm --filter @krn/schema test -- index.test.ts` failed because
  source artifact, decision edge, and rejection parser exports did not exist.
- GREEN: `pnpm --filter @krn/schema test -- index.test.ts` passed after adding
  `parseSourceArtifactInput`, `parseSourceDecisionEdgeInput`, and
  `parseSourceRejectionInput`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.

Slice 04 repository methods:

- RED: `pnpm --filter @krn/db test -- mappers.test.ts` failed because
  `mapSourceDecisionEdge` and `mapSourceRejection` were missing.
- GREEN: `pnpm --filter @krn/db test -- mappers.test.ts` passed after adding
  new source graph mappers.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Live write/read source graph proof is intentionally deferred to Slice 05
  `pnpm db:smoke:source-graph`.

Slice 05 source graph smoke:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn db smoke source-graph` returned usage exit `2`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding
  the source graph smoke target and no-DB skip output.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed.
  - Execution run: `03fe1830-9448-46b5-9b54-eb79c0129a36`.
  - Source artifact: `82887af0-494b-4290-8610-083d15007ea9`.
  - Source claim: `82bcd2ca-1ff6-4d10-a764-581c4ee18774`.
  - Source decision edge: `2eaca23f-9db7-4767-b649-9c30144575c6`.
  - Source rejection: `44bbb1ae-d48a-4c73-8bd1-4f6732f4941a`.
  - Readback: source claim matched.
  - Counts: run source claims `1`, run source decision edges `1`, source
    rejections `1`, outbox events `2`.
  - Cleanup remaining marker count: `0`.
- `pnpm test`: passed.
- `git diff --check`: passed.

Slice 06 source claim add CLI:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source claim add` returned usage exit `2`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding
  parser support, preview behavior, DB-required persist behavior, and fake
  repository persist behavior.
- `pnpm typecheck`: initially failed because `runSourceClaimAddCommand.ts`
  exported `CreateDatabaseRuntime`, conflicting with the existing
  `runPlanCommand.ts` export. Renamed the new type to
  `CreateSourceClaimAddDatabaseRuntime`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- `pnpm --filter @krn/cli krn source claim add --help`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim add ... --persist`: passed.
  - Source artifact: `2638beb8-aeaf-4fa1-90c3-af7d70cc52c4`.
  - Source claim: `3b5540bc-2307-4578-9abb-5bee0805bbdd`.
  - `doesNotProve`: printed as
    `This does not prove source decision edge or rejection CLI behavior`.
