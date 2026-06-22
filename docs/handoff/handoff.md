# Handoff

Objective:
M27 Target Repo Init/Connect Dogfood is implemented and verified. KRN can
initialize a disposable target repo fixture, connect it into the
Postgres-backed brain store, create/reuse Project, RepoInstallation, and
ProjectKernel records, compile a project-scoped persisted plan, render a Codex
brief from the persisted run, persist evidence/review/feedback records, report
target repo readiness in `krn doctor`, and pass anti-rot.

Last verified state:
Latest M27 anti-rot commit before this handoff is
`e9b12f2 docs(run): record target repo anti-rot audit`. Anti-rot passed with
`pnpm typecheck`, `pnpm test`, DB-aware `krn doctor`, live `pnpm db:ready`, all
M22-M27 DB smokes, forbidden directory scan, forbidden dependency scan, core
library-safety scan, and `git diff --check`. Typecheck passed across 7
workspace packages. Tests passed across 29 files and 134 tests. Live DB
readiness proved 8/8 migrations and pgvector. All smoke cleanup counts that
report marker counts were `0`.

Current dirty context:
`GOAL.md` remains modified user-owned planning context. The research inputs
`docs/materials/2026-06-22-big-brain.md` and
`docs/materials/2026-06-22-big-brain-part-2.md` remain untracked user-owned
materials. They are intentionally not part of M27 implementation commits.

Milestone status:
- M22 source graph: complete and proven.
- M23 memory governance: complete and proven.
- M24 retrieval/search substrate: complete and proven.
- M25 activation engine: complete and proven.
- M26 Codex adapter + hook expectations + worker skeleton: complete and
  proven.
- M27 target repo init/connect dogfood: complete and proven through anti-rot.

M27 commit spine:
- `0de15dd docs(run): add target repo init-connect ledger`
- `29e469a docs(run): record init-connect inventory`
- `6f85894 test(fixtures): add basic target repo fixture`
- `2c8076d feat(db): add target repo project registration schema`
- `764a8eb feat(db): add target repo registration repository methods`
- `a353e9e feat(cli): support target repo init dry run`
- `0ee6979 feat(cli): connect target repo to brain store`
- `c94888e test(db): add target repo init-connect smoke path`
- `cf33aaa feat(cli): support project-scoped persisted planning`
- `462486a test(cli): add target repo harness smoke path`
- `0bca19c feat(cli): report target repo readiness in doctor`
- `0dc761c docs(run): record target repo init-connect dogfood`
- `e9b12f2 docs(run): record target repo anti-rot audit`
- final handoff commit follows this file.

Runtime proof status:
- DB configured: proven with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.
- migrations: proven, 8/8 applied.
- pgvector: proven available.
- target repo dry-run: proven; no files written.
- target repo connect persistence: proven.
- Project, RepoInstallation, ProjectKernel persistence/reuse: proven.
- project-scoped persisted plan: proven.
- project-scoped Codex brief readback: proven without Codex invocation.
- project-scoped evidence capture: proven without memory mutation.
- target repo harness smoke: proven with target project linked `yes`.
- cleanup: proven with marker counts `0` where emitted.
- doctor target repo readiness: proven as
  `ready (init-connect smoke proven; target repo harness smoke proven)`.

Key proof IDs:
- Direct fixture Project: `9da67341-0124-407e-b3fa-197f7f850a57`.
- Direct fixture RepoInstallation: `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`.
- Direct fixture ProjectKernel: `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`.
- Direct fixture ExecutionRun: `eb16411b-d304-420e-adc7-1fdb86857c1d`.
- Direct fixture EvidenceBundle: `6c85abdd-7b6d-468a-833e-0e12a445b6a6`.
- Latest anti-rot target harness ExecutionRun:
  `ece37032-cb48-477d-bc41-07eb2e742a99`.

Residual blockers:
No M27 blocker remains. Remaining work is later product scope or the required
post-M27 memory ideal-state planning slice.

Not built:
dashboard, API, MCP server, plugin package, broad workers runtime, research
layer, source crawler, runtime markdown memory, `.krn` runtime truth, separate
vector/graph/search DB, Redis/Kafka, broad eval suite, real external repo
mutation, actual Codex execution, automatic memory promotion, and production
worker throughput.

Next safest action:
Run Slice 14 and produce `docs/plans/memory-ideal-state/GOAL.md` from the two
2026-06-22 memory research files and current repo evidence.

Do not reread:
Broad historical docs or old repo topology unless a future task explicitly
asks for raw source/audit material.
