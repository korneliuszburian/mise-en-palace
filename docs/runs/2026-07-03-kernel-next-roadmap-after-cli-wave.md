# Kernel Next Roadmap After CLI Wave

Date: 2026-07-03.

Beads: `mise-en-palace-9uyc`.

## Context

Commits `c8030a3` and `8382220` closed the heartbeat preview boundary split and
shared exact command runtime contracts. Local gates passed, both commits were
pushed, and CI for `8382220` passed.

The follow-up `second-opinion-claude` review did not reject the code. It
rejected the roadmap evidence: the next-task selection did not explicitly rule
the six candidate areas in or out.

## Six-Area Ruling

1. Remaining oversized CLI command/domain logic: active next work.
   `wc -c` shows `runSourceSearchCommand.ts` at 48.5 KB,
   `runRunShowCommand.ts` at 37.7 KB,
   `sourceArtifactPreviewView.ts` at 37.8 KB,
   `runSourceArtifactPreviewCommand.ts` at 35.6 KB, and
   `runBrainSearchCommand.ts` at 29.5 KB. These are still real command/kernel
   boundary surfaces, not stale audit claims.
2. Active product loop usefulness: continue bounded verticals, no product-ready
   claim. `PLAN.md` records source-search, brain-search, source artifact
   preview, heartbeat preview, source graph ranking, and retained-pattern reuse
   as useful controlled-alpha loops. It also keeps product-ready and widened
   internal alpha at `no`.
3. Stale audit claims: do not reopen solved items. Current code already removed
   `@krn/schema`, fixed vector model boundaries, reduced codex adapter smoke,
   widened strict CLI test typecheck, and scoped eval naming. Follow-up tasks
   must cite current files, not old audit text.
4. DB/retrieval readback quality: no immediate model-id task. Current
   `DrizzleRetrievalRepository` requires `embeddingModelId` for
   `searchVector`/`searchHybrid`, validates vector shape and finite numbers, and
   CI now runs `db:smoke:brain-loop` plus `db:smoke:source-graph`.
5. Eval behavior signal: improved but still worth one product-behavior
   increment. `eval:behavior:smoke` now runs real golden, source-map,
   TypeScript-boundary, CLI readback, and codex brief behavior checks, while
   `docs:lint` holds prose/doc invariants. The next eval task should add a real
   behavior case, not another doc sentinel.
6. Retained skill operational value: keep, do not delete. Repo-local skills are
   operational guidance with `skillInvariants`; `second-opinion-claude` has live
   validated JSON review output and is now part of the larger-slice governance
   loop. No current evidence supports deleting skills wholesale.

Deferred worker branch: `mise-en-palace-plnv` is still deferred. The branch
choice between worker downscope and executor build remains a human/product
decision. No autonomous slice should implement it.

## New Queue

- `mise-en-palace-75za`: split source-search command readback boundaries.
- `mise-en-palace-wgei`: split source artifact preview persistence and view
  boundaries.
- `mise-en-palace-y6ib`: split brain-search selected-knowledge readback
  boundaries.
- `mise-en-palace-h1b4`: split run-show projection and JSON readback parsing.
- `mise-en-palace-ww5l`: add one kernel behavior eval for source artifact
  preview reuse.

Recommended next slice: `mise-en-palace-75za`. It is the largest current CLI
command file and it touches the most authority-looking operator readback
surface, so it has the best immediate ROI.

## Proof Boundary

Proves: next work is selected from current repo evidence, not stale audit
momentum; `plnv` is explicitly still blocked; solved audit findings are not
reopened.

Does not prove: any new product behavior, runtime worker enforcement, source
truth, ranking quality, or product readiness.
