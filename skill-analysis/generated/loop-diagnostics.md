# Loop Diagnostics

This file measures whether KRN has the mechanisms needed for Matt Pocock's
v1.1 lifecycle and loop-engineering work, not whether our markdown looks tidy.

## Summary

- Covered: 9
- Partial: 1
- Missing: 0
- Optional missing: 1
- Readiness score: 19/22

## Lifecycle Coverage

| Stage | Status | Artifact | Agent-sized | Blocker graph | Maker/checker | Stop gate | KRN Finding | Next Move |
|---|---|---|---|---|---|---|---|---|
| Router | partial | Always-on routing text | n/a | n/a | n/a | partial | KRN has always-on orientation and Beads, but no user-invoked router that says which KRN skill to use when the operator is unsure. | Create a router only if confusion repeats; otherwise keep routing in onboarding and Beads. |
| Grill | covered | Resolved question/vocabulary | yes | no | partial | yes | KRN keeps grill behavior inside domain-modeling: ask one narrow operator question when term, owner, or decision is ambiguous; never self-grill. | Keep grill as domain-modeling behavior, not a top-level skill. |
| Spec | covered | Spec | yes | n/a | partial | yes | KRN keeps to-spec inside Beads and uses a spec template when a settled artifact is needed before slicing. | Keep specs as Beads artifacts unless repeated independent invocation pressure appears. |
| Tickets | covered | Beads issues | yes | yes | partial | yes | KRN keeps to-tickets inside Beads with agent-sized acceptance criteria, proof boundaries, and native dependency edges. | Use bd ready as the frontier proof instead of adding a separate to-tickets skill. |
| Wayfinder | covered | Map issue | yes | yes | yes | yes | KRN has explicit wayfinding mode, a map template, one-ticket-per-session discipline, native blockers, and bd ready frontier. | Keep wayfinding as a Beads mode until independent invocation pressure is proven. |
| Research | covered | Source decision | yes | n/a | partial | yes | KRN intentionally routes research through source-to-decision so sources become mechanisms, decisions, consumers, and falsifiers instead of archives. | Reject decorative research artifacts; create Beads follow-up only when a source has a consumer. |
| Prototype | optional | Prototype link | yes | n/a | partial | missing | KRN currently has no explicit prototype loop. That may be fine for backend/control-plane work, but it is a real gap for UX/state-model exploration. | Defer unless a KRN feature needs visual/state-model exploration. |
| Implement | covered | Patch + evidence | yes | partial | partial | yes | KRN now has one implementation entrypoint with activation, store, adapter, TDD, and TypeScript references. | Use specialized references through krn-implementation instead of top-level maker skill sprawl. |
| Code Review | covered | Review findings | yes | n/a | yes | yes | KRN code-review already includes Fowler-style smells, standards/spec separation, verification gaps, and checker behavior. | Keep as-is; pair it explicitly after implementation. |
| Diagnosis | covered | Red-capable repro | yes | n/a | partial | yes | KRN now has a diagnosis entrypoint that forbids hypotheses or fixes before a red-capable repro command exists and has been run. | Use diagnosis for unknown symptoms and krn-implementation/tdd for known behavior changes. |
| Context / ADR | covered | Context/ADR candidate | n/a | n/a | partial | yes | KRN owns vocabulary in CONTEXT.md, artifact rules in CONVENTIONS.md, and rare hard-to-reverse decisions in docs/adr/ through domain-modeling. | Update the smallest stable owner when a vocabulary or operating decision is resolved. |

## Highest-Value Gaps

1. Validate the new `diagnosing-bugs` skill on real failures.
2. Keep the context/ADR lane small so vocabulary and surprising decisions survive
   fresh-agent loops.
3. Validate Beads `to-spec`, `to-tickets`, and `wayfinding` modes through
   real issue creation.
4. Watch whether `krn-implementation` stays a useful entrypoint or becomes too broad.
