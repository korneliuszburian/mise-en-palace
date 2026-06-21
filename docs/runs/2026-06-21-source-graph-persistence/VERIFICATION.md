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

Slice 07 source decision link CLI:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source decision link` returned usage exit `2`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding
  parser support, preview behavior, DB-required persist behavior, SourceClaim
  existence verification, and fake repository edge creation.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source decision link ... --persist`: passed.
  - Source claim: `3b5540bc-2307-4578-9abb-5bee0805bbdd`.
  - Source decision edge: `af03790e-2ad2-4536-846a-2a4f9720f726`.
  - Target: `architecture_decision/M22.07-source-decision-link`.
  - Support type: `implementation-boundary`.
  - Confidence: `medium`.
- `pnpm test`: passed.
- `git diff --check`: passed.

Slice 08 source claim reject CLI:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source claim reject` returned usage exit `2`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding
  parser support, preview behavior, DB-required persist behavior, and fake
  repository rejection creation that proves no SourceClaim write path is called.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim reject ... --persist`: passed.
  - Source rejection: `9735e09c-fd1e-4ce2-b627-226ce9c09d9b`.
  - Rejected because: `decorative`.
  - Reason: `No mechanism, consumer, falsifier, or decision support`.
  - Output confirmed: `No SourceClaim created`.
- `pnpm test`: passed.
- `git diff --check`: passed.

Slice 09 evidence source candidates:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn evidence capture` did not output `sourceDecisionCandidates` and did not
  pass source decision candidates into persisted `FeedbackDelta.sourceDecisions`.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding a
  source-decision candidate derivation step for source/decision-like changed
  files and explicit `sourceDecisionCandidates` output.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn evidence capture`: passed and printed
  `sourceDecisionCandidates`.
- Root-cwd `./packages/cli/node_modules/.bin/tsx packages/cli/src/index.ts
  evidence capture`: passed before ledger updates and printed
  `sourceDecisionCandidates` with `- none` for code-only changed files.
- Root-cwd `./packages/cli/node_modules/.bin/tsx packages/cli/src/index.ts
  evidence capture`: passed after ledger updates and printed source decision
  candidate `source-decision-candidate-1782077575396-1` with status `defer`,
  consumer `krn evidence capture`, a falsifier, and `No SourceClaim created`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `pnpm test`: passed.

Slice 10 doctor source graph readiness:

- RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn doctor` did not report source graph checks and
  `deriveSourceGraphReadiness` was not exported.
- GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed after adding
  source graph doctor checks, readiness derivation, and a read-only
  `inspectSourceGraphReadiness` DB helper.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config.
  - Source graph schema: skipped (Postgres not configured).
  - Source graph smoke: available (`pnpm db:smoke:source-graph`).
  - Source crawler/research layer: absent.
  - Separate graph DB: absent.
  - Source graph readiness: preview-only.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed.
  - Execution run: `18d51573-6ee6-4626-8fa3-3b2c60a20cc7`.
  - Source artifact: `06b41a98-acf0-493a-bd6f-11e21e7e0845`.
  - Source claim: `d93ec392-f199-4641-b7c3-7b83f6955683`.
  - Source decision edge: `d2f9e63d-0a34-41d3-9274-bd839f819281`.
  - Source rejection: `bd005c99-9088-4546-8251-c45acb5d973e`.
  - Outbox events: `2`.
  - Cleanup remaining marker count: `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed.
  - Source graph schema: ready (8/8 tables present).
  - SourceRepository read path: reachable.
  - Source graph runtime proof: ready (claims 1, edges 1, rejections 1).
  - Source graph readiness: ready.
- `pnpm test`: passed.

Slice 11 source graph dogfood:

- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "persist SourceClaims and source-to-decision edges"
  --persist`: passed.
  - Execution run: `4370785f-b177-45d7-89d9-08053a3e640d`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim add ... --persist`: passed.
  - Source artifact: `4e7d2c27-3a50-4c1e-9d69-25dca221fdb5`.
  - Source claim: `212815bc-477c-4985-8992-31825f5c5897`.
  - Linked run: `4370785f-b177-45d7-89d9-08053a3e640d`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source decision link ... --persist`: passed.
  - Source decision edge: `9869be50-642b-4ddf-b60b-60360f9ea8ce`.
  - Target: `harness_run/4370785f-b177-45d7-89d9-08053a3e640d`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim reject ... --persist`: passed.
  - Source rejection: `c35e59c2-587b-4875-b7b4-32118daf6966`.
  - Output confirmed: `No SourceClaim created`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn evidence capture --run-id ... --persist`: passed.
  - Evidence bundle: `dfa38982-a410-451c-a9e4-473cfaa3ad64`.
  - Review assessment: `39476e2e-b5ee-46a2-9146-d2a33d09f4b9`.
  - Feedback delta: `600c8b44-2df7-4096-8a53-369411b19e50`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported source graph runtime proof
  `ready (claims 2, edges 2, rejections 2)`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with cleanup remaining marker count `0`.
- Dogfood record written to `DOGFOOD.md`.
