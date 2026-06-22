# Verification

Latest final anti-rot:

- `git status --short --branch`: passed with `## main...origin/main [ahead 12]`
  before Slice 12 audit docs edits; only user-owned `GOAL.md` and untracked
  memory research materials remained outside commits.
- `git log --oneline -20`: passed with latest M27 base
  `0dc761c docs(run): record target repo init-connect dogfood`.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 29 test files and 134 tests.
- live DB `krn doctor`: passed with target repo readiness ready and forbidden
  surfaces absent.
- live `pnpm db:ready`: passed with 8/8 migrations and pgvector available.
- live DB smokes passed: `db:smoke`, `db:smoke:harness-plan`,
  `db:smoke:harness-evidence`, `db:smoke:source-graph`,
  `db:smoke:memory-governance`, `db:smoke:retrieval-substrate`,
  `db:smoke:activation`, `db:smoke:codex-adapter`, `db:smoke:worker-jobs`,
  `db:smoke:init-connect`, and `db:smoke:target-repo-harness`.
- forbidden directory scan printed no matches.
- forbidden dependency scan printed no matches.
- core library-safety scan printed no Node/DB runtime imports.
- `git diff --check`: passed.

DB proof status:

- configured: proven with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.
- migrations: proven, 8/8 applied.
- pgvector: proven.

Persisted harness status:

- plan persistence: proven.
- evidence persistence: proven.
- project-scoped run identity: proven.

Target repo status:

- fixture dry-run: proven.
- connect persistence: proven.
- Project persisted/reused: proven.
- RepoInstallation persisted/reused: proven.
- ProjectKernel persisted/reused: proven.
- project-scoped planning: proven.
- Codex brief readback: proven.
- evidence capture persistence: proven.
- target project linkage in full smoke: proven.
- cleanup counts: proven as `0` where emitted.

Source graph status:

- source artifacts persisted: proven.
- source claims persisted: proven.
- source-to-decision edges persisted: proven.
- source rejections persisted: proven.

Memory governance status:

- candidates persisted: proven.
- reviewed promotion: proven.
- memory records/versions persisted: proven.
- application feedback persisted: proven.
- anti-memory persisted: proven.
- no automatic memory mutation in target repo dogfood evidence capture: proven.

Retrieval/search status:

- search docs persisted: proven.
- lexical search: proven.
- pgvector readiness represented: proven.
- retrieval candidates persisted: proven.
- activation decisions persisted: proven.

Activation status:

- noisy fixture: proven.
- ContextAssembly inclusions persisted: proven.
- ContextAssembly exclusions persisted: proven.
- `krn plan` uses activation: proven.
- target fixture gap/abstention behavior: proven.

Codex adapter / worker status:

- execution brief rendered: proven.
- read-only `krn codex brief --run-id`: proven.
- hook expectations projected: proven.
- worker jobs enqueued: proven.
- worker job transitions: proven.

Not proven by M27:

- Codex execution.
- MCP availability.
- dashboard/API readiness.
- runtime markdown memory.
- separate vector/graph/search/queue stores.
- source crawler/research layer.
- production worker throughput.
- actual maintenance job execution.
- real external repo mutation.
- full observational memory/reflection layer.
