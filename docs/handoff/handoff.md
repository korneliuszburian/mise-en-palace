# Handoff

Objective:
The memory ideal-state execution track is implemented through MM-32B. KRN has
observation staging, manual observe dogfood, reflection contracts, reflection
persistence/CLI, reflection no-Memory-Core mutation proof, memory repository
invariants, and a MemoryReviewGate that permits public `krn memory candidate
promote --persist` only with `--evidence-reviewed-ref`. Memory invalidation now
marks records invalidated and excludes them from active memory while preserving
their MemoryRecordVersion audit trail. Memory application feedback now affects
activation ranking through feedback scores/penalties, and repeated negative
feedback surfaces a blocking memory health finding. Anti-memory now blocks
explicit memory-record activation candidates, linked search-document
candidates, and observation prefix items by explicit IDs/keys. Context assembly
now records explicit abstention metadata when available context is absent,
weak, unsafe, stale, over budget, or fully excluded. Memory health audit now
flags stale high-confidence records, active records without lineage/source
support, no application feedback, missing guidance, temporal records without
invalidation strategy, and high negative feedback. Audit CLI now consumes
explicit slice intended files/verification commands, AuditBundle evidence, and
DB-backed semantic snapshots for memory/source/eval/observation/activation
state; repo-local `docs/handoff/*` files are converted into handoff snapshots;
`--fail-on warning` is available for CI-style slice gates.

Last verified state:
MM-32B verification passed with focused audit CLI tests for AuditBundle/semantic
DB snapshot ingestion and `--fail-on warning`, focused package typechecks, full
`pnpm typecheck`, full `pnpm test`, DB-aware `pnpm db:ready`, `git diff
--check`, and forbidden surface scan. Full tests pass across 45 files and 230
tests. Live DB readiness proves 11/11 migrations and pgvector.

Current dirty context:
The research inputs `docs/materials/2026-06-22-big-brain.md` and
`docs/materials/2026-06-22-big-brain-part-2.md` remain untracked user-owned
materials. They are intentionally not part of memory implementation commits.

Milestone status:
- M22 source graph: complete and proven.
- M23 memory governance: complete and proven.
- M24 retrieval/search substrate: complete and proven.
- M25 activation engine: complete and proven.
- M26 Codex adapter + hook expectations + worker skeleton: complete and
  proven.
- M27 target repo init/connect dogfood: complete and proven through anti-rot.
- MM-00 through MM-32B memory ideal-state slices: complete through governed
  MemoryReviewGate promotion, memory invalidation, feedback-aware memory
  ranking, negative-feedback health findings, and explicit memory anti-memory
  blocking across source claims, memory records, linked search documents,
  observation prefix items, explicit activation abstention metadata, and
  broader memory health audit findings, and AuditBundle/semantic DB snapshot
  ingestion in the audit CLI.

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
- migrations: proven, 11/11 applied.
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
- public `krn memory candidate promote --persist`: requires
  `--evidence-reviewed-ref` and passes through MemoryReviewGate before low-level
  repository promotion.
- memory invalidation: proven by `db:smoke:memory-governance`; invalidated
  memory is excluded from active memory and the version row remains present.
- feedback ranking: negative memory application feedback penalizes activation
  candidates and is exposed in candidate metadata.
- memory health audit: active memory with repeated negative feedback is a
  blocking finding requiring review action.
- anti-memory: explicit source-claim, memory-record, linked search-document,
  and observation-prefix candidates/items are blocked by subject id, memory
  key, anti-memory key, `appliesTo`, or explicit source/memory metadata links.
- activation abstention: context assembly records `activationAbstention`
  metadata with reason, explanation, candidate count, exclusion count, and
  exclusion reasons.
- memory health audit: supplied memory snapshots flag stale high-confidence
  memory, no lineage/source-claim support, no application feedback, missing
  guidance, missing temporal invalidation strategy, and high negative feedback.
- audit slice gate: `krn audit slice` can merge explicit and AuditBundle
  intended files/verification evidence, read DB-backed semantic snapshots, emit
  semantic snapshot counts in JSON/text output, read repo handoff docs as
  handoff evidence, and fail on warnings when invoked with `--fail-on warning`.

Key proof IDs:
- Direct fixture Project: `9da67341-0124-407e-b3fa-197f7f850a57`.
- Direct fixture RepoInstallation: `e40219ed-a6b1-4842-9ef4-9bf851cdb65e`.
- Direct fixture ProjectKernel: `db32f8c2-dc8d-4e26-b4b5-89ca84f721f6`.
- Direct fixture ExecutionRun: `eb16411b-d304-420e-adc7-1fdb86857c1d`.
- Direct fixture EvidenceBundle: `6c85abdd-7b6d-468a-833e-0e12a445b6a6`.
- Latest anti-rot target harness ExecutionRun:
  `ece37032-cb48-477d-bc41-07eb2e742a99`.

Residual blockers:
No MM-32B blocker remains.

Rollback path:
After commit, revert the MM-32B commit with `git revert <commit>` if the audit
semantic snapshot ingestion or handoff snapshot builder causes regressions.
Before commit, discard only the MM-32B touched files listed in the slice
Progress entry.

Not built:
dashboard, API, MCP server, plugin package, broad workers runtime, research
layer, source crawler, runtime markdown memory, `.krn` runtime truth, separate
vector/graph/search DB, Redis/Kafka, broad eval suite, real external repo
mutation, actual Codex execution, automatic memory promotion, fuzzy
anti-memory matching, golden proof, and production worker throughput.

Next safest action:
Run MM-33 and dogfood promotion of one reviewed KRN lesson through
MemoryReviewGate, with lineage/guidance/confidence/invalidation proof.

Do not reread:
Broad historical docs or old repo topology unless a future task explicitly
asks for raw source/audit material.
