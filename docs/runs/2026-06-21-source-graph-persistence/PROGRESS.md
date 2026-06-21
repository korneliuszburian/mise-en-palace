# Progress

Goal: M22 - persist SourceClaims and source-to-decision edges.

Current slice: Slice 12 anti-rot and handoff complete.

Completed:

- `GOAL.md` now defines M22 as SourceClaim persistence plus
  source-to-decision edges.
- M21 final state is the baseline: persisted harness plan/evidence/review/
  feedback loop is complete, dogfooded, anti-rot audited, and pushed.
- M22 run ledger was created under
  `docs/runs/2026-06-21-source-graph-persistence/`.
- Slice 01 inventory was recorded in `SOURCE_GRAPH_INVENTORY.md`.
- Slice 02 added/tightened Drizzle source graph schema for M22:
  M22 trust/support enum values, claim status/run linkage, typed
  `source_decision_edges`, and first-class rejection reason/title fields.
- Slice 03 added source graph Zod input parsers for artifacts, claims,
  decision edges, and rejections.
- Slice 04 added SourceRepository methods for claim lookup/run listing,
  source decision edge creation/run listing, and source rejection creation.
- Slice 05 added `pnpm db:smoke:source-graph` and proved live source artifact,
  claim, decision edge, rejection, outbox, readback, and cleanup behavior.
- Slice 06 added `krn source claim add`, including preview mode, `--help`,
  explicit `--persist`, Zod validation, SourceArtifact creation, SourceClaim
  creation, optional run linkage, persisted ID output, and `doesNotProve`
  output.
- Slice 07 added `krn source decision link`, including preview mode, `--help`,
  explicit `--persist`, SourceClaim existence verification, typed
  SourceDecisionEdge creation, target/support/confidence output, and notes
  output.
- Slice 08 added `krn source claim reject`, including preview mode, `--help`,
  explicit `--persist`, SourceRejection creation through SourceRepository,
  rejection reason output, and an explicit guarantee that no SourceClaim is
  created for rejected/decorative material.
- Slice 09 updated `krn evidence capture` to print explicit
  `sourceDecisionCandidates`, derive proposal-only source decision candidates
  from source/decision-like changed files, persist those candidates in
  `FeedbackDelta.sourceDecisions` when `--persist --run-id` is used, and keep
  SourceClaim creation out of evidence capture.
- Slice 10 updated `krn doctor` to report source graph schema readiness,
  SourceRepository read-path reachability, source graph smoke availability,
  runtime proof markers, forbidden source crawler/research infrastructure, and
  derived source graph readiness.
- Slice 11 dogfooded source graph on M22 itself and recorded the run in
  `DOGFOOD.md`.
- Slice 12 completed the M22 anti-rot audit and final handoff update.

Verification:

- `git status --short --branch`: passed with only `GOAL.md` dirty for the new
  M22 goal text before ledger creation.
- `git log --oneline -12`: passed; newest commit was
  `a0bb82d docs(handoff): update persisted harness spine status`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only persistence readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `3/3`, pgvector available, and brain
  store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- Slice 01 targeted source graph reads: schema, migrations, repository port,
  Drizzle adapter, mappers, core source types, IO schema, CLI parser, database
  runtime, and evidence capture source-decision behavior.
- Slice 02 RED: `pnpm --filter @krn/db test -- sources.test.ts` failed on the
  missing M22 source vocabulary.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql`.
- `pnpm --filter @krn/db test -- sources.test.ts mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm db:check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `4/4`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `git diff --check`: passed.
- Slice 03 RED: `pnpm --filter @krn/schema test -- index.test.ts` failed on
  old `high/supports` source claim input vocabulary.
- Slice 03 RED: `pnpm --filter @krn/schema test -- index.test.ts` failed on
  missing source artifact, decision edge, and rejection parser exports.
- `pnpm --filter @krn/schema test -- index.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 04 RED: `pnpm --filter @krn/db test -- mappers.test.ts` failed on
  missing `mapSourceDecisionEdge` and `mapSourceRejection`.
- `pnpm --filter @krn/db test -- mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 05 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn db smoke source-graph` was parsed as usage error.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with claim readback matched, run claims `1`,
  run decision edges `1`, source rejections `1`, outbox events `2`, and cleanup
  remaining marker count `0`.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 06 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source claim add` returned usage exit `2`.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn source claim add --help`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim add ... --persist`: passed with source artifact
  `2638beb8-aeaf-4fa1-90c3-af7d70cc52c4` and source claim
  `3b5540bc-2307-4578-9abb-5bee0805bbdd`.
- `git diff --check`: passed.
- Slice 07 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source decision link` returned usage exit `2`.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source decision link ... --persist`: passed with source decision
  edge `af03790e-2ad2-4536-846a-2a4f9720f726`.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 08 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn source claim reject` returned usage exit `2`.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn source claim reject ... --persist`: passed with source rejection
  `9735e09c-fd1e-4ce2-b627-226ce9c09d9b`.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 09 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn evidence capture` did not output `sourceDecisionCandidates` and did not
  persist candidate source decisions.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn evidence capture`: passed and printed
  `sourceDecisionCandidates`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `pnpm test`: passed.
- Slice 10 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn doctor` did not output source graph readiness and
  `deriveSourceGraphReadiness` did not exist.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  source graph readiness as preview-only.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with execution run
  `18d51573-6ee6-4626-8fa3-3b2c60a20cc7`, source claim
  `d93ec392-f199-4641-b7c3-7b83f6955683`, source decision edge
  `d2f9e63d-0a34-41d3-9274-bd839f819281`, source rejection
  `bd005c99-9088-4546-8251-c45acb5d973e`, outbox events `2`, and cleanup
  remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported `Source graph readiness: ready`.
- `pnpm test`: passed.
- Slice 11 live `krn plan --task "persist SourceClaims and source-to-decision
  edges" --persist`: passed with execution run
  `4370785f-b177-45d7-89d9-08053a3e640d`.
- Slice 11 live `krn source claim add --run-id ... --persist`: passed with
  source artifact `4e7d2c27-3a50-4c1e-9d69-25dca221fdb5` and source claim
  `212815bc-477c-4985-8992-31825f5c5897`.
- Slice 11 live `krn source decision link ... --persist`: passed with source
  decision edge `9869be50-642b-4ddf-b60b-60360f9ea8ce`.
- Slice 11 live `krn source claim reject --run-id ... --persist`: passed with
  source rejection `c35e59c2-587b-4875-b7b4-32118daf6966`.
- Slice 11 live `krn evidence capture --run-id ... --persist`: passed with
  evidence bundle `dfa38982-a410-451c-a9e4-473cfaa3ad64`, review assessment
  `39476e2e-b5ee-46a2-9146-d2a33d09f4b9`, and feedback delta
  `600c8b44-2df7-4096-8a53-369411b19e50`.
- Slice 11 live DB `krn doctor`: passed and reported source graph runtime proof
  `ready (claims 2, edges 2, rejections 2)`.
- Slice 11 live `pnpm db:smoke:source-graph`: passed with cleanup remaining
  marker count `0`.
- Slice 12 `git status --short --branch`: passed with clean
  `## main...origin/main` before final docs edits.
- Slice 12 `git log --oneline -12`: passed.
- Slice 12 `pnpm typecheck`: passed.
- Slice 12 `pnpm test`: passed.
- Slice 12 no-DB `krn doctor`: passed and reported source graph preview-only.
- Slice 12 live DB `krn doctor`: passed and reported source graph readiness
  ready.
- Slice 12 `pnpm db:ready`: passed with migrations `4/4` and pgvector
  available.
- Slice 12 `pnpm db:smoke`: passed.
- Slice 12 `pnpm db:smoke:harness-plan`: passed with cleanup remaining marker
  count `0`.
- Slice 12 `pnpm db:smoke:harness-evidence`: passed with cleanup remaining
  marker count `0`.
- Slice 12 `pnpm db:smoke:source-graph`: passed with cleanup remaining marker
  count `0`.
- Slice 12 forbidden surface scan: passed with no output.
- Slice 12 no-`any` scan: passed with no output.

Skill gates:

- Used: `source-to-decision` for M22 source/claim/decision framing.
- Used: `brain-store-schema` for upcoming source graph persistence boundaries.
- Used: `evidence-review-loop` for Slice 00 command evidence and ledger shape.
- Used: `handoff-compact` for Slice 00 continuation state.
- Used: `typescript-type-safety` for SourceClaim/SourceDecisionEdge/domain
  boundary updates.
- Used: `superpowers:test-driven-development` for the RED/GREEN schema test.
- Used: `superpowers:systematic-debugging` after the expected typecheck
  failure exposed stale domain/repository assumptions.
- Used: `superpowers:systematic-debugging` after the Slice 06 typecheck export
  name conflict.
- Not used yet in M22: `codex-adapter-plan`, `activation-engine`,
  `target-infra-adr`.

Next action:

- M23: MemoryCandidate to reviewed MemoryRecord promotion.
