# Verification

## Slice 00

Commands run:

```sh
git status --short --branch
sed -n '1,220p' docs/KRN_KERNEL.md
sed -n '1,520p' packages/db/src/schema/retrieval.ts
sed -n '1,320p' packages/db/src/repositories/DrizzleRetrievalRepository.ts
sed -n '130,210p' packages/harness/src/repositories/types.ts
sed -n '780,850p' packages/db/src/repositories/mappers.ts
sed -n '1,230p' packages/db/src/migrations/0002_shocking_post.sql
rg -n "fullTextSearch|tsvector|to_tsvector|plainto_tsquery|websearch_to_tsquery|vector readiness|pgvector|embedding" packages/db/src packages/cli/src packages/harness/src -g '*.ts'
rg -n "smoke|readiness|memory-governance|source-graph|harness-evidence|harness-plan" packages/cli/src packages/db/src packages/harness/src -g '*.ts'
cat package.json
```

Results:

- Repository was clean before Slice 00 docs were created.
- Kernel contract confirms M24 must select/apply/verify/forget context rather
  than build broader context.
- Retrieval schema and migration already contain the M24 durable tables.
- Repository port/adapter already cover retrieval runs, candidates, activation
  decisions, and context selection.
- Repository port/adapter do not yet cover search document creation, lexical
  search, embedding model creation, or embedding row storage.
- Root scripts and CLI DB smoke routing do not yet expose
  `retrieval-substrate`.

Post-doc verification:

- `pnpm typecheck`: passed.
- `git diff --check`: passed.

## Slice 01

Commands run:

```sh
pnpm --filter @krn/db test -- retrieval.test.ts
pnpm db:generate
sed -n '1,260p' packages/db/src/migrations/0005_young_outlaw_kid.sql
pnpm typecheck
pnpm --filter @krn/db db:check
git diff --check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
pnpm test
```

Results:

- RED retrieval schema test failed before the schema patch on missing M24 enum
  values and fields.
- GREEN retrieval schema test passed after the schema patch.
- Generated SQL is additive: enum values, nullable linkage columns, defaulted
  non-null run mode/search text/created timestamp, FKs, and indexes.
- `pnpm typecheck` initially failed at the DB mapper boundary because the
  widened Drizzle row vocabulary exceeded harness read-model unions.
- Harness retrieval/activation unions were expanded without casts or `any`.
- Final `pnpm typecheck`, `pnpm test`, `pnpm --filter @krn/db db:check`,
  `git diff --check`, and live `pnpm db:ready` all passed.

## Slice 02

Commands run:

```sh
pnpm --filter @krn/schema test
pnpm typecheck
pnpm test
git diff --check
```

Results:

- RED schema test failed because retrieval parser exports were absent.
- `SearchDocumentInput`, `RetrievalRunInput`, `RetrievalCandidateInput`,
  `ActivationDecisionInput`, `ContextItemInput`, and `ContextExclusionInput`
  parser exports were added.
- Parsers accept `unknown`, default metadata objects, constrain mode/decision
  enums, constrain context exclusion reasons, and bound numeric scores.
- Final targeted schema tests, typecheck, full test suite, and diff hygiene
  passed.

## Slice 03

Commands run:

```sh
pnpm --filter @krn/db test -- DrizzleRetrievalRepository.test.ts mappers.test.ts
pnpm typecheck
pnpm test
pnpm --filter @krn/db db:check
git diff --check
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx -e '<one-off lexical repository check>'
```

Results:

- RED DB tests failed on missing M24 repository methods and mapper read models.
- SearchDocument, EmbeddingModel, Embedding, retrieval run/candidate, and
  activation decision mapper tests passed after implementation.
- DrizzleRetrievalRepository now exposes the M24 method surface.
- Final typecheck, full test suite, DB schema check, and diff hygiene passed.
- One-off live repository check proved `createSearchDocument` plus
  `searchLexical` can find the inserted document and marker cleanup can delete
  it. This is a narrow repository proof; M24.04 still needs the full smoke
  chain.

## Slice 04

Commands run:

```sh
pnpm --filter @krn/db test -- retrievalSubstrateSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
pnpm test
pnpm --filter @krn/db db:check
git diff --check
```

Results:

- RED DB export test failed before `runRetrievalSubstrateSmokeCheck` existed.
- RED CLI test failed before `krn db smoke retrieval-substrate` routing existed.
- Typecheck caught the missing CLI target union value and passed after the
  union was widened.
- Live retrieval substrate smoke passed with SearchDocument count `4`, lexical
  results `1`, retrieval candidates `2`, activation decisions `2`, context
  items `1`, context exclusions `1`, and cleanup remaining marker count `0`.
- Final full test suite, DB schema check, and diff hygiene passed.

## Slice 05

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
pnpm test
pnpm --filter @krn/db db:check
git diff --check
```

Results:

- RED CLI test failed before retrieval doctor readiness existed.
- Doctor preview output now includes retrieval schema, repository read path,
  smoke availability, runtime proof, forbidden vector/search DB, naive RAG dump
  command, and derived retrieval readiness.
- Live doctor with DB configured reports retrieval schema ready, repository
  reachable, smoke available, forbidden infrastructure absent, and runtime
  proof unverified.
- Running the self-cleaning retrieval smoke does not make doctor claim durable
  runtime proof. This is intentional; M24.06 dogfood should create durable proof
  rows.
- Final typecheck, full test suite, DB schema check, and diff hygiene passed.

## Slice 06

Commands run:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "prove retrieval substrate for KRN activation engine" --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx - <<'TS'
# dogfood marker audit
TS
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx - <<'TS'
# lexical query diagnosis
TS
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx - <<'TS'
# durable dogfood retrieval proof creation
TS
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:retrieval-substrate
pnpm typecheck
pnpm --filter @krn/db db:check
pnpm test
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx - <<'TS'
# post-smoke dogfood marker audit
TS
```

Results:

- Persisted plan/run command passed and created operator intent
  `d1f92b0a-6a7b-4b02-bc81-07b4b26bb720`, task contract
  `26a9e961-f462-4e29-b97d-0705309fe93f`, harness plan
  `fb01f089-9640-4881-913e-a276be0891c0`, context assembly
  `b3aba586-5158-4149-aee6-ef58a5cacaa6`, and execution run
  `83722c20-f897-4335-a7b1-d1d64046b3cf`.
- Initial dogfood DB audit found SearchDocuments `2`, EmbeddingModels `0`,
  Embeddings `0`, RetrievalRuns `0`, RetrievalCandidates `0`,
  ActivationDecisions `0`, ContextItems `3`, and ContextExclusions `0`.
- The first durable proof attempt failed before inserts because lexical query
  `source graph postgres edge tables` did not match the existing source
  SearchDocument. Diagnosis showed the document matched
  `Postgres backed relational edges`, so the proof query was narrowed to the
  actual retained source text.
- Durable dogfood creation passed. It created embedding model
  `6d57fc7b-4922-4a6c-9ac5-fa25fd6957cc`, embedding row
  `ebc314e9-f5f7-4daa-99e3-0a1139832f9b`, retrieval run
  `76d529b2-2a3e-45bf-b710-e94ee074a539`, two candidates, two activation
  decisions, one context item, and one context exclusion.
- Dogfood marker counts after creation were SearchDocuments `2`,
  EmbeddingModels `1`, Embeddings `1`, RetrievalRuns `1`,
  RetrievalCandidates `2`, ActivationDecisions `2`, ContextItems `4`, and
  ContextExclusions `1`.
- Live doctor passed and now reports retrieval substrate readiness as
  `ready (schema present; repository reachable; runtime proof present)`.
- Retrieval substrate smoke passed after durable dogfood creation and still
  cleaned its marker rows to `0`.
- Post-smoke dogfood marker audit proved durable dogfood rows remained present.
- Final typecheck, full test suite, and DB schema check passed.
