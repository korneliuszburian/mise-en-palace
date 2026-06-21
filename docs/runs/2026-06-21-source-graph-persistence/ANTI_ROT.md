# Anti-Rot Audit

Date: 2026-06-21.

Objective: verify M22 source graph persistence after dogfood and before final
handoff.

## Repo State

- `git status --short --branch`: passed with clean `## main...origin/main`
  before final anti-rot documentation edits.
- `git log --oneline -12`: passed. The newest M22 commits were:
  - `bcb5806 docs(run): record source graph dogfood pass`
  - `6692eea feat(cli): report source graph readiness in doctor`
  - `54a5213 feat(cli): surface source candidates in evidence capture`
  - `10d1a59 feat(cli): add source rejection command`
  - `4094707 feat(cli): add source-to-decision link command`
  - `9baa20b feat(cli): add source claim persistence command`
  - `e489c74 test(db): add source graph persistence smoke path`
  - `f1d1d93 feat(db): add source graph repository methods`
  - `d27bc00 feat(schema): add source graph IO schemas`
  - `c13c459 feat(db): add source graph persistence schema`
  - `3740f67 docs(run): record source graph persistence inventory`
  - `a22694c docs(run): add source graph persistence ledger`

## Static Verification

- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- Forbidden surface scan for `apps`, `packages/api`, `packages/dashboard`,
  `.krn`, `packages/source-crawler`, `packages/research`, `packages/graph-db`,
  and `packages/neo4j`: passed with no output.
- No-`any` scan over KRN source packages: passed with no output.

## Doctor

No-DB doctor:

- `pnpm --filter @krn/cli krn doctor`: passed.
- Source graph readiness: preview-only.
- Source graph smoke command: available.
- Source crawler/research layer: absent.
- Separate graph DB: absent.
- Forbidden surfaces: absent.

Live DB doctor:

- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor`: passed.
- Postgres: configured and reachable.
- pgvector: available.
- migrations: verified (4/4 applied).
- Harness persistence readiness: ready.
- Source graph schema: ready (8/8 tables present).
- SourceRepository read path: reachable.
- Source graph runtime proof: ready (claims 2, edges 2, rejections 2).
- Source graph readiness: ready.

## DB Smoke

- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`: passed.
  - Migrations expected/applied: 4/4.
  - pgvector: available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`: passed.
  - Project readback: matched.
  - Cleanup: completed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-plan`: passed.
  - Execution run: `72a0b153-4303-40c8-9b2b-130a418b8375`.
  - Evidence contract commands: 3.
  - Run events: 1.
  - Cleanup remaining marker count: 0.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:harness-evidence`: passed.
  - Execution run: `2700d990-3556-45d2-b7ce-d20dadeb0796`.
  - Evidence bundle: `3cc2a102-265f-40a3-ad73-4bd6e8da5975`.
  - Review assessment: `bb74b916-9751-4b3f-b5da-391c0ea17a10`.
  - Feedback delta: `ca383bcd-1779-4ad2-a7a7-03560578aeb6`.
  - Run events: 2.
  - Cleanup remaining marker count: 0.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:source-graph`: passed.
  - Execution run: `2e50659f-bba7-42f4-aa71-0bcc78525455`.
  - Source artifact: `c24e224f-254b-41a2-b929-80724a5664c5`.
  - Source claim: `30dea17d-aca9-4033-a5ce-4cb85806364b`.
  - Source decision edge: `19f7b6c9-86e1-41c6-a191-596c9219ffb3`.
  - Source rejection: `fd75defb-a109-41e0-9a05-982e7887d2b0`.
  - Outbox events: 2.
  - Cleanup remaining marker count: 0.

## M22 Completion Check

- Source artifacts persisted: proven by CLI dogfood and source graph smoke.
- Source claims persisted: proven by CLI dogfood and source graph smoke.
- Source-to-decision edges persisted: proven by CLI dogfood and source graph
  smoke.
- Source rejections persisted: proven by CLI dogfood and source graph smoke.
- Smoke cleanup proven: project, harness-plan, harness-evidence, and
  source-graph smoke paths passed with cleanup marker count 0 where applicable.
- Doctor reports source graph readiness: proven in live DB doctor.
- No forbidden surfaces: proven by doctor plus direct forbidden-surface scan.

## Residual Risk

- M22 does not prove retrieval ranking, vector/lexical search quality, or graph
  traversal quality.
- M22 does not promote MemoryRecords; that starts in M23.
- M22 does not add API, dashboard, MCP server, crawler, separate graph DB, or
  runtime markdown memory.

## Next Safest Action

M23: MemoryCandidate to reviewed MemoryRecord promotion.
