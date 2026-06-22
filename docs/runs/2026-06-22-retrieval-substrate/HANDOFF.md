# Handoff

Objective:
Make retrieval/search substrate real enough to support M25 activation.

Last verified state:
M23 memory governance is complete and pushed. M24 Slices 00-06 are complete.
The DB schema, typed parser boundary, retrieval repository methods, smoke
command, doctor readiness check, and durable dogfood proof rows now exist.
Doctor reports retrieval substrate readiness as ready because durable runtime
proof rows exist in Postgres.

M24 Slice 01 is complete. The retrieval schema now has M24 source vocabulary,
`retrieval_run_mode`, search document search text and evidence/review/decision
and run event linkage, embedding-to-search-document linkage, retrieval run
execution/mode/budget/created fields, candidate-to-search-document linkage and
score, activation retrieval-candidate linkage, context budget cost, and expected
decision impact. Migration `0005_young_outlaw_kid.sql` was generated and
applied locally through `pnpm db:ready`.

M24 Slice 02 is complete. `packages/schema/src/retrieval.ts` now exports Zod
schemas, inferred input types, and parse functions for search documents,
retrieval runs, retrieval candidates, activation decisions, context items, and
context exclusions. The parser boundary keeps input as `unknown`, defaults
metadata, constrains retrieval mode and activation/exclusion vocabulary, and
bounds score fields to `0..1000`.

M24 Slice 03 is complete. `RetrievalRepository` now has typed M24 methods for
SearchDocument creation, lexical search, EmbeddingModel creation, Embedding
storage, retrieval run/candidate/activation aliases, list-by-run readback, and
marker cleanup. DrizzleRetrievalRepository implements them, with FTS SQL kept in
the DB adapter. A one-off live check inserted a SearchDocument, found it through
`searchLexical`, and cleaned the marker row.

M24 Slice 04 is complete. `pnpm db:smoke:retrieval-substrate` now routes through
`krn db smoke retrieval-substrate` and proves SearchDocument persistence,
lexical search, pgvector placeholder embedding storage, RetrievalRun,
RetrievalCandidate, ActivationDecision, ContextItem, ContextExclusion, and
cleanup count zero. The smoke also indexes SourceClaim, MemoryRecord,
EvidenceBundle, and SourceDecision as search documents.

M24 Slice 05 is complete. `krn doctor` now reports retrieval substrate schema
readiness, RetrievalRepository read path reachability, retrieval smoke command
availability, runtime proof ready/unverified status, absence of separate
vector/search DB, and absence of a naive RAG dump command. Doctor remains
read-only: after self-cleaning smoke, retrieval runtime proof remains
`unverified` until M24.06 creates durable dogfood rows.

M24 Slice 06 is complete. A persisted KRN plan/run created operator intent
`d1f92b0a-6a7b-4b02-bc81-07b4b26bb720`, task contract
`26a9e961-f462-4e29-b97d-0705309fe93f`, harness plan
`fb01f089-9640-4881-913e-a276be0891c0`, context assembly
`b3aba586-5158-4149-aee6-ef58a5cacaa6`, and execution run
`83722c20-f897-4335-a7b1-d1d64046b3cf`. Dogfood rows under
`m24-retrieval-dogfood-2026-06-22` now include two SearchDocuments, one
EmbeddingModel, one Embedding, one completed RetrievalRun, two
RetrievalCandidates, two ActivationDecisions, one dogfood ContextItem, and one
ContextExclusion. `DOGFOOD.md` records the exact durable IDs. `krn doctor`
now reports retrieval runtime proof as ready. `pnpm db:smoke:retrieval-substrate`
still passes and cleans marker rows to zero.

Changed files:

- `docs/runs/2026-06-22-retrieval-substrate/RETRIEVAL_SUBSTRATE_INVENTORY.md`
- `docs/runs/2026-06-22-retrieval-substrate/DECISIONS.md`
- `docs/runs/2026-06-22-retrieval-substrate/PROGRESS.md`
- `docs/runs/2026-06-22-retrieval-substrate/VERIFICATION.md`
- `docs/runs/2026-06-22-retrieval-substrate/BLOCKERS.md`
- `docs/runs/2026-06-22-retrieval-substrate/HANDOFF.md`
- `docs/runs/2026-06-22-retrieval-substrate/DOGFOOD.md`
- `packages/db/src/schema/retrieval.ts`
- `packages/db/src/schema/retrieval.test.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/db/src/migrations/0005_young_outlaw_kid.sql`
- `packages/db/src/migrations/meta/0005_snapshot.json`
- `packages/db/src/migrations/meta/_journal.json`
- `packages/schema/src/retrieval.ts`
- `packages/schema/src/index.ts`
- `packages/schema/src/index.test.ts`
- `packages/harness/src/repositories/retrievalRepository.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/cli/src/noStoreRepositories.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.test.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `packages/db/src/retrievalSubstrateSmoke.ts`
- `packages/db/src/retrievalSubstrateSmoke.test.ts`
- `packages/db/src/index.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.test.ts`
- `package.json`
- `packages/db/src/retrievalSubstrateReadiness.ts`
- `packages/cli/src/runDoctorCommand.ts`

Decisions:
Reuse the existing Postgres/Drizzle retrieval schema. Keep FTS/vector raw SQL
inside the DB package. Do not add external embedding services, worker runtime,
separate search/vector stores, dashboard, or broad context dump behavior for
M24. Slice 01 keeps `subject_type`/`subject_id` as the canonical generic source
pointer instead of adding duplicate required `source_type`/`source_id` columns,
then expands the enum and adds concrete FKs where first-class tables already
exist.

Blockers/risks:
No hard blocker for M24.06. M24.07 still needs anti-rot verification and final
handoff refresh.

Context selectors:
`GOAL.md`, `docs/KRN_KERNEL.md`, `packages/db/src/schema/retrieval.ts`,
`packages/db/src/migrations/0002_shocking_post.sql`,
`packages/harness/src/repositories/retrievalRepository.ts`,
`packages/harness/src/repositories/types.ts`,
`packages/db/src/repositories/DrizzleRetrievalRepository.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, `packages/cli/src/runDoctorCommand.ts`,
and `package.json`.

Next action:
M24.07 should run the full anti-rot pass, refresh final retrieval substrate
handoff status, commit the ledger update, and push.

Do not reread:
`docs/materials/` or broad historical docs unless the next task explicitly
requires raw source/audit material.
