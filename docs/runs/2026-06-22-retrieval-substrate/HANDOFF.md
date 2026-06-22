# Handoff

Objective:
M24 retrieval/search substrate is complete. The next milestone is M25
Activation Engine V1 integrated into persisted `krn plan --persist`.

Last verified state:
M24 Slices 00-07 are complete. Fresh M24.07 anti-rot passed: clean
`main...origin/main`, `pnpm typecheck`, `pnpm test`,
`krn doctor`, `pnpm db:ready`, all DB smoke commands, `pnpm --filter @krn/db
db:check`, and dogfood marker audit. Doctor reports retrieval substrate
readiness as `ready (schema present; repository reachable; runtime proof
present)`.

Changed files:
This milestone changed retrieval schema/migration, retrieval IO schemas,
RetrievalRepository/Drizzle adapter/mappers, CLI smoke/doctor routing, package
scripts, and the M24 run ledger. The final status ledger is under
`docs/runs/2026-06-22-retrieval-substrate/`, especially `DOGFOOD.md` and
`VERIFICATION.md`.

Decisions:
Keep retrieval in Postgres/pgvector for M24. SearchDocuments, placeholder
Embedding rows, RetrievalRuns, RetrievalCandidates, ActivationDecisions,
ContextItems, and ContextExclusions are first-class durable records. Retrieval
gathers candidates; activation decides inclusion/exclusion. No separate vector
DB/search service, external embedding provider, broad retrieval, naive RAG dump,
dashboard, worker runtime, or markdown runtime memory was added.

Blockers/risks:
No hard blocker for M24. M25 must implement ranking/activation quality; M24
only proves the substrate and audit trail, not final activation behavior or
external embedding quality.

Context selectors:
`GOAL.md` M25 section, `docs/KRN_KERNEL.md`,
`docs/runs/2026-06-22-retrieval-substrate/DOGFOOD.md`,
`docs/runs/2026-06-22-retrieval-substrate/VERIFICATION.md`,
`packages/db/src/schema/retrieval.ts`,
`packages/harness/src/repositories/retrievalRepository.ts`,
`packages/db/src/repositories/DrizzleRetrievalRepository.ts`,
`packages/db/src/retrievalSubstrateReadiness.ts`,
`packages/db/src/retrievalSubstrateSmoke.ts`, and
`packages/cli/src/runDoctorCommand.ts`.

Next action:
Start M25.00 by inventorying the activation engine surface before wiring
anything into `krn plan --persist`.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless M25
explicitly needs raw source/audit material.
