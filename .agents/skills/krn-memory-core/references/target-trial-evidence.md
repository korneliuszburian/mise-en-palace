# Target Trial Evidence

Load this branch when global `$target-repo-work` must become KRN evidence,
readback, or second-operator proof. The global skill owns target authority and
dirty-state procedure; this reference owns KRN field semantics.

## Mode Mapping

| Global semantic mode | KRN `targetMode` |
|---|---|
| `observation-only` | `observation-only` |
| `headless-repair` | `headless-repair` |
| `real-operator` | `real-second-operator` only with genuine second-operator input or transcript |
| unclassified | `unknown` |

A headless run cannot be relabeled as `real-second-operator` after the fact.

## Evidence Fields

Record fresh values for the current task:

```text
targetDirtyBefore: clean | dirty | unknown
targetDirtyAfter: clean | dirty | unknown
targetOwnedChanges: external | owned-by-current-krn-run | partial | unknown
targetStatusFreshness: fresh-current-task | stale-prior-selection | changed-since-selection | unknown
targetPatchLifecycle: none | accepted-by-target-owner | rejected-by-target-owner | stronger-verification-requested | handed-off-unresolved | unknown
targetHandoffArtifact:
targetOwnerDecision:
allowedWrites:
forbiddenWrites:
commands:
```

Revalidate target status for every task. If a previously clean target changed,
downgrade to observation-only until authority is renewed. A prior
`handed-off-unresolved` KRN patch blocks another same-target repair; allowed
next actions are observation, owner decision, a different target, or a blocked
handoff.

## Proof Boundary

Target commands prove only the named observation in the recorded target state.
They do not prove KRN source correctness, product readiness, arbitrary-repo
portability, or second-operator usability unless a genuine second operator
participated.
