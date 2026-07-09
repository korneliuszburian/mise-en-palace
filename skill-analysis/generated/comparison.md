# Skill Inventory

This is an inventory, not a verdict. It intentionally avoids text-similarity
scores because the useful question is whether a skill has a clear role in the
engineering loop.

## KRN Skills

| Skill | Role | strip_decision | Owner | References | Templates | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|---|---|---|---|
| beads | router | active | beads | 1 | 4 | model | yes | yes | yes | 142 |
| code-review | checker | active | code-review | 1 | 1 | model | yes | yes | yes | 86 |
| diagnosing-bugs | maker | new | diagnosing-bugs | 0 | 0 | model | yes | yes | yes | 82 |
| domain-modeling | decision | active | domain-modeling | 3 | 0 | model | yes | yes | yes | 132 |
| krn-implementation | maker | new | krn-implementation | 5 | 0 | model | yes | yes | yes | 91 |
| source-to-decision | decision | active | source-to-decision | 2 | 0 | model | yes | yes | yes | 134 |
| target-repo-testing | checker | active | target-repo-testing | 1 | 0 | model | yes | yes | yes | 189 |

## KRN Strip Decisions

| Skill/procedure | strip_decision | Owner skill | Target | Reason |
|---|---|---|---|---|
| activation-engine | merged | krn-implementation | `references/activation.md` | Activation is implementation procedure, not an independent top-level workflow. |
| beads | active | beads | `SKILL.md` | Durable task graph, planning modes, blocker edges, frontier, and handoff state need one tracker substrate. |
| brain-store-schema | merged | krn-implementation | `references/store-schema.md` | Store schema work is implementation procedure with DB-specific verification. |
| code-review | active | code-review | `SKILL.md` | Checker behavior and evidence review belong behind one review entrypoint. |
| codebase-design | merged | domain-modeling | `references/codebase-design.md` | Architecture seams and names are part of domain concept ownership. |
| codex-adapter-plan | merged | krn-implementation | `references/codex-adapter.md` | Codex adapter rendering is a specialized implementation boundary. |
| diagnosing-bugs | new | diagnosing-bugs | `SKILL.md` | Diagnosis needs an explicit red-capable repro gate that TDD did not cover. |
| domain-modeling | active | domain-modeling | `SKILL.md` | Vocabulary, context, ADR, and codebase-design decisions share the same concept ownership lane. |
| evidence-review-loop | merged | code-review | `references/evidence-review.md` | Evidence capture is checker procedure under code review. |
| handoff-compact | merged | beads | `templates/handoff.md` | Handoff is Beads state transfer, not a separate public skill. |
| krn-implementation | new | krn-implementation | `SKILL.md` | Unifies maker procedures that were too narrow to remain top-level invocation skills. |
| source-to-decision | active | source-to-decision | `SKILL.md` | Source evidence still needs a distinct mechanism-to-decision gate. |
| target-repo-testing | active | target-repo-testing | `SKILL.md` | Target-repo dirty-state and write-authority checks remain a distinct proof boundary. |
| tdd | merged | krn-implementation | `references/tdd.md` | TDD is a maker reference used inside implementation, not a standalone KRN workflow. |
| typescript-type-safety | merged | krn-implementation | `references/type-safety.md` | Type safety is a reusable implementation boundary reference. |

## Matt Skills

| Skill | Role | strip_decision | Owner | References | Templates | Invocation | Stop | Output | Verification | Lines |
|---|---|---|---|---|---|---|---|---|---|---|
| ask-matt | router | n/a | ask-matt | 0 | 0 | user | no | no | yes | 77 |
| code-review | checker | n/a | code-review | 0 | 0 | model | no | no | yes | 90 |
| codebase-design | decision | n/a | codebase-design | 0 | 0 | model | no | no | yes | 115 |
| diagnosing-bugs | maker | n/a | diagnosing-bugs | 0 | 0 | model | yes | no | yes | 135 |
| domain-modeling | decision | n/a | domain-modeling | 0 | 0 | model | no | no | yes | 75 |
| grill-with-docs | decision | n/a | grill-with-docs | 0 | 0 | user | no | no | no | 8 |
| implement | maker | n/a | implement | 0 | 0 | user | no | no | yes | 16 |
| improve-codebase-architecture | decision | n/a | improve-codebase-architecture | 0 | 0 | user | no | no | yes | 67 |
| prototype | maker | n/a | prototype | 0 | 0 | model | no | no | yes | 31 |
| research | decision | n/a | research | 0 | 0 | model | no | no | yes | 13 |
| resolving-merge-conflicts | maker | n/a | resolving-merge-conflicts | 0 | 0 | model | no | no | yes | 15 |
| setup-matt-pocock-skills | router | n/a | setup-matt-pocock-skills | 0 | 0 | user | no | no | yes | 128 |
| tdd | maker | n/a | tdd | 0 | 0 | model | no | no | yes | 37 |
| to-spec | decision | n/a | to-spec | 0 | 0 | user | no | no | yes | 76 |
| to-tickets | router | n/a | to-tickets | 0 | 0 | user | no | no | yes | 115 |
| triage | router | n/a | triage | 0 | 0 | user | no | no | yes | 113 |
| wayfinder | router | n/a | wayfinder | 0 | 0 | user | no | no | yes | 128 |
