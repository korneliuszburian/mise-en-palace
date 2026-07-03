# Post-Refactor Kernel Priority Review

Date: 2026-07-03.

## Context

The latest CLI/runtime cleanup wave is closed and pushed. Current `PLAN.md`
states that the post-CLI-wave queue is drained and that next selection uses
Beads ready work (`PLAN.md:140-152`). CI run `28683276963` is green, including
typecheck, tests, Fallow, KRN smoke, DB smoke, DB brain-loop smoke, DB run-show
smoke, DB worker-jobs smoke, and DB source-graph smoke.

Recent shipped slices:

- `3358470d` split `krn run show` readback from the command runner.
- `9faa0833` added DB-backed run-show readback smoke.
- `6911bc42` fixed smoke cleanup on failure after Claude review.
- `2b2d4277` gates DB-backed run-show smoke in CI.
- `021be190` made second-opinion context packs work for committed ranges.

## Current Evidence

- Active goal: `GOAL.md:72-84` directs product-facing vertical slices and says a
  task must improve usefulness, a bounded product surface, or unblock the next
  vertical slice.
- Active goal: `GOAL.md:100-107` requires verify, commit, push, CI, and
  second-opinion-claude after larger slices without operator routing.
- Active non-goals: `GOAL.md:134-139` rejects dashboard, API, MCP, worker
  daemon, broad eval platform, and speculative runtime memory unless a bounded
  root plan authorizes them.
- Active plan: `PLAN.md:166-172` lists remaining product gaps as
  pattern/research brain continuously applied to code quality, source/graph
  relation ranking quality beyond one focused proof, and product UI/API/MCP only
  after usefulness/security gates.
- Kernel contract: `docs/KRN_KERNEL.md:19-22` says not to build more context,
  but the machinery that selects, applies, verifies, and forgets context.
- Kernel boundary: `docs/KRN_KERNEL.md:31-39` keeps active execution truth
  compact and retains patterns through source-to-decision and pattern-intake
  gates.
- Beads state: `bd ready` reported no open issues after the DB run-show smoke
  CI gate.
- Vector retrieval follow-up is already satisfied in current code:
  `packages/db/src/repositories/DrizzleRetrievalRepository.ts:113-123` rejects a
  missing `embeddingModelId`; `packages/db/src/repositories/DrizzleRetrievalRepository.ts:416-432`
  filters vector search by that model id; `packages/db/src/repositories/DrizzleRetrievalRepository.ts:444-460`
  passes the same scope through hybrid search; tests cover missing model id at
  `packages/db/src/repositories/DrizzleRetrievalRepository.test.ts:39-59`.
- CapabilityPlan binding orphan cleanup is already satisfied in active code:
  `rg -n "PolicyGateBinding|CapabilityBinding|SkillBinding|RulePackBinding|bindingKinds" packages/core/src packages/harness/src packages/cli/src packages/codex-adapter/src`
  returns only `CodexSkillBinding*` adapter-output names plus live
  `CapabilityRequirement` usage, not the removed binding candidate types.
- Worker write-authority model remains a parked product branch decision:
  `packages/workers/src/jobTypes.ts:175` still has
  `allowedWritesByMemoryCoreGate`, and `packages/workers/src/jobTypes.ts:194`
  still has `requiredWritesByMemoryCoreGate`.
- Brain knowledge feasibility for Candidate A was checked after Claude review:
  `krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "unknown-first" --json`
  returned 3 cards, including
  `pattern:ts-boundary-brain-knowledge-parser-exemplar`,
  `pattern:source-to-decision-retention-gate`, and
  `pattern:ts-boundary-unknown-first-result-state`. The proof boundary says this
  proves deterministic local readback/filtering only, not DB-backed state,
  ranking quality, or product readiness.

## Candidate Next Slices

### A. Pattern/Research Brain Applied To Code Quality

Decision: choose as likely P1 unless second opinion falsifies it.

Mechanism: use retained pattern/read-model evidence to select a concrete
code-quality pattern for a real code change, then prove plan/run/readback shows
the pattern influenced implementation or rejection.

KRN implication: this moves the brain from storing patterns to applying patterns
in engineering work, matching the Shared Brain Vertical Loop.

Consumer: Codex implementation loop and `krn run show`/brief readback.

Falsifier: if no persisted plan/run/brief/evidence readback can show the pattern
was selected and used, the slice is only documentation.

### B. Source/Graph Relation Ranking Beyond One Focused Proof

Decision: P1/P2.

Mechanism: add a second graph-ranking proof with a different relation shape than
the already proven invalidates/expires/supersedes path.

KRN implication: improves source grounding and graph-brain quality without
building a dashboard or broad benchmark lane.

Consumer: `krn source search`, `krn brain search`, activation/context assembly.

Falsifier: if the change only tweaks tests around the existing one-case proof, it
does not extend graph relation quality.

### C. Active-Code Placeholder Naming Cleanup

Decision: P2, not first unless it blocks the P1 implementation.

Mechanism: audit active source only for misleading names such as `final`,
`normalized`, `new`, `temp`, `data`, `result`, and patch only high-confidence
local names that harm reviewability.

KRN implication: reduces code-review friction and AI-slop vocabulary without a
broad rename treadmill.

Consumer: future kernel contributors and code-review surfaces.

Falsifier: if it touches historical docs/materials or renames semantically valid
terms, it becomes churn.

### D. Worker Package Branch Decision

Decision: keep parked unless a human/product decision explicitly chooses
downscope or executor work.

Mechanism: current worker package has typed write-authority declarations and
preview/readback builders but no runtime executor.

KRN implication: important architecture question, but starting a daemon now
violates current hard non-goals.

Consumer: future heartbeat/dreaming runtime.

Falsifier: any implementation that adds daemon/scheduler/leases without a
specific product slice is speculative expansion.

## Recommended Next Move

Second-opinion-claude returned `approve_with_fixes` / MEDIUM. Both findings were
accepted:

- F1: code-state claims needed file/line or command evidence. Fixed above.
- F2: Candidate A needed current retained-pattern readback proof. Fixed above
  with `krn brain knowledge` readback.

Seed Beads from this review and start Candidate A first:

```txt
Apply retained pattern brain to one real code-quality slice
```

Acceptance sketch:

- choose one retained pattern through current KRN plan/brain readback;
- apply it to a bounded real code change;
- persist evidence/review showing whether it helped;
- expose plan/run/brief or brain-search readback that proves the pattern was
  used or explicitly rejected;
- do not create dashboard/API/MCP/worker daemon or broad eval platform.

## Proof Boundary

This report proves only that the next queue was selected from current root
state, recent CI, active code evidence, and a governed second-opinion review. It
does not prove pattern selection quality, DB-backed brain recall, automatic
memory recall, implementation correctness of the next slice, or product
readiness.
