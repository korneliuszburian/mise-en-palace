# Post-Refactor Next Queue Synthesis

Date: 2026-07-03.

Beads: `mise-en-palace-b8zd`.

## Context

After the source-graph duplicate ranking proof and placeholder-vocabulary audit,
the ready Beads queue was empty while `PLAN.md` still named two active product
gaps:

- pattern/research brain continuously applied to code quality;
- source/graph relation ranking quality beyond one focused proof.

Latest CI for `a72217a` passed both jobs:

- Typecheck, tests, Fallow, and KRN behavior/docs smoke;
- DB readiness/smoke, brain-loop, run-show, worker-jobs, and source-graph smoke.

## Claude Review

Ran governed `second-opinion-claude` with a compact context pack:

- prompt: `.local-lab/second-opinion/post-refactor-next-queue/prompt.md`
- verdict: `.local-lab/second-opinion/post-refactor-next-queue/claude.json`
- result: `block`, risk `HIGH`

Accepted findings:

- F1/F2: no concrete bounded ready queue existed after the completed slices.
  Fix: created bounded follow-up Beads issues.
- F3: the context pack did not expose Beads issue details because they were
  generated after the review prompt. Fix: this report records the issue IDs and
  the Beads export diff is committed with the queue synthesis.

## Created Queue

- `mise-en-palace-xh86`: extract source-search graph scoring policy.
- `mise-en-palace-5qmm`: prove positive SourceClaimEdge ranking readback.
- `mise-en-palace-fusx`: capture retained-pattern usefulness for post-refactor
  slices.

`mise-en-palace-plnv` remains a deferred human decision because it chooses
between worker downscope and a real executor.

## Proof Boundary

Proves the ready-queue gap was triaged into concrete Beads work and that latest
CI for the prior code slice is green.

Does not prove the new issues are implemented, source/graph ranking is broadly
correct, retained-pattern feedback is complete, or KRN is product-ready.
