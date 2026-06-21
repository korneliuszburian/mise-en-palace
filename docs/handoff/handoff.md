# Handoff

Objective:
M22 persisted the first KRN Source Graph path through the existing
Postgres/Drizzle infrastructure.

Last verified state:
M22 is complete. Source artifacts, SourceClaims, typed SourceDecisionEdges, and
SourceRejections persist through SourceRepository-backed CLI commands.
`krn evidence capture` now surfaces proposal-only source decision candidates in
feedback deltas, and `krn doctor` reports source graph readiness read-only.

Dogfood execution run `4370785f-b177-45d7-89d9-08053a3e640d` has source claim
`212815bc-477c-4985-8992-31825f5c5897`, source decision edge
`9869be50-642b-4ddf-b60b-60360f9ea8ce`, source rejection
`c35e59c2-587b-4875-b7b4-32118daf6966`, evidence bundle
`dfa38982-a410-451c-a9e4-473cfaa3ad64`, review assessment
`39476e2e-b5ee-46a2-9146-d2a33d09f4b9`, and feedback delta
`600c8b44-2df7-4096-8a53-369411b19e50`.

Final M22 anti-rot passed clean `git status`, `git log --oneline -12`,
`pnpm typecheck`, `pnpm test`, no-DB doctor, live DB doctor, `pnpm db:ready`,
`pnpm db:smoke`, `pnpm db:smoke:harness-plan`,
`pnpm db:smoke:harness-evidence`, `pnpm db:smoke:source-graph`,
forbidden-surface scan, no-`any` scan, and `git diff --check`.

Changed files:
M22 changed `GOAL.md` only as the user-provided long-run contract, the run
ledger under `docs/runs/2026-06-21-source-graph-persistence/`, source graph
DB schema/migrations/repositories/mappers/smoke/readiness helpers, source graph
Zod IO schemas, core source types, CLI source commands, evidence capture,
doctor readiness, package scripts, and related tests.

Decisions:
M22 stays inside the existing Postgres/Drizzle boundary. Source graph records
are explicit: claims require mechanism, does-not-prove, support type, trust
tier, and consumer; decision links do not imply proof of the whole target; and
decorative/unsupported material becomes SourceRejection, not SourceClaim.
Markdown run docs are audit/handoff material only, not runtime Memory Core.

Blockers/risks:
No M22 blocker remains. Residual later scope starts in M23: MemoryCandidate to
reviewed MemoryRecord promotion, anti-memory, source/evidence-linked memory,
then retrieval/search and durable activation.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`,
`docs/runs/2026-06-21-source-graph-persistence/`, package manifests, DB
schema/migrations/repositories, source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`/`source`/`db smoke`, and M22 smoke/readiness
helpers.

Next action:
M23: MemoryCandidate to reviewed MemoryRecord promotion.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
