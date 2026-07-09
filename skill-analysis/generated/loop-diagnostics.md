# Loop Diagnostics

This file measures whether KRN has the mechanisms needed for Matt Pocock's
v1.1 lifecycle and loop-engineering work, not whether our markdown looks tidy.

## Summary

- Covered: 1
- Partial: 7
- Missing: 2
- Optional missing: 1
- Readiness score: 9/22

## Lifecycle Coverage

| Stage | Status | Artifact | Agent-sized | Blocker graph | Maker/checker | Stop gate | KRN Finding | Next Move |
|---|---|---|---|---|---|---|---|---|
| Router | partial | Always-on routing text | n/a | n/a | n/a | partial | KRN has always-on orientation and Beads, but no user-invoked router that says which KRN skill to use when the operator is unsure. | Create a router only if confusion repeats; otherwise keep routing in onboarding and Beads. |
| Grill | partial | Resolved question/vocabulary | yes | no | partial | partial | KRN can challenge vocabulary and source claims, but lacks a named human-question gate that prevents self-grilling or jumping straight to code. | Add the grill behavior to domain-modeling or a user-invoked router before adding a separate skill. |
| Spec | missing | Spec | partial | no | partial | missing | KRN has task issues and source decisions, but no first-class spec artifact that sits between conversation and ticket slicing. | Decide whether Beads issue bodies are enough, or add a to-spec style mode for large/fuzzy work. |
| Tickets | partial | Beads issues | partial | yes | partial | partial | Beads already supports dependencies and tracer-bullet wording, but there is no dedicated conversion workflow from spec/conversation into a frontier. | Strengthen Beads before adding a separate to-tickets skill. |
| Wayfinder | partial | Map issue | yes | partial | yes | partial | KRN has foggy-work guidance inside Beads, but lacks Matt's explicit map artifact: destination, decisions so far, not-yet-specified fog, out-of-scope, one ticket per session. | Add a Beads wayfinding mode before creating a separate wayfinder skill. |
| Research | partial | Source decision | partial | n/a | partial | partial | source-to-decision is strong for source -> mechanism -> implication -> decision, but may be too broad for pure research legwork. | Audit source-to-decision uses before splitting. |
| Prototype | optional | Prototype link | yes | n/a | partial | missing | KRN currently has no explicit prototype loop. That may be fine for backend/control-plane work, but it is a real gap for UX/state-model exploration. | Defer unless a KRN feature needs visual/state-model exploration. |
| Implement | partial | Patch + evidence | partial | partial | partial | partial | KRN has strong domain-specific maker skills, but no unified implement wrapper that always routes through TDD and review for each ticket. | Prefer improving Beads/README routing over a generic implement skill unless agents keep skipping review. |
| Code Review | covered | Review findings | yes | n/a | yes | yes | KRN code-review already includes Fowler-style smells, standards/spec separation, verification gaps, and checker behavior. | Keep as-is; pair it explicitly after implementation. |
| Diagnosis | missing | Red-capable repro | yes | n/a | partial | missing | KRN has TDD and review, but no diagnosis discipline that blocks theory-first debugging. | Add diagnosing-bugs as the first new KRN skill candidate. |
| Context / ADR | partial | Context/ADR candidate | n/a | n/a | partial | partial | KRN has source decisions and roadmap truth, but no small domain-context artifact analogous to Matt's glossary plus lazy ADR lane. | Run the context-artifact-lane decision candidate next. |

## Highest-Value Gaps

1. Add a KRN-specific `diagnosing-bugs` skill.
2. Decide the context/ADR lane so vocabulary and surprising decisions survive
   fresh-agent loops.
3. Strengthen Beads with `to-tickets` and `wayfinder` modes before adding
   separate skills.
4. Decide whether a `to-spec` artifact is needed for large or fuzzy work.
