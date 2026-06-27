# V37 Target Patch Lifecycle Rule Condensation

Status: complete.

Date: 2026-06-27.

Mode: workflow-rule condensation.

## Executive Verdict

V37 condensed the V32-V36 target patch ownership finding into the reusable
target-repo workflow surface.

KRN now has a durable rule for target patches left dirty after headless repair:

```txt
If lifecycle is handed_off_unresolved, do not start another repair in that same
target repo.
```

This is intentionally not a new subsystem. It is a small workflow rule in the
existing target-repo skill/runbook.

## Inputs Inspected

```txt
.agents/skills/target-repo-testing/SKILL.md
docs/runbooks/target-repo-testing.md
docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v36-target-patch-handoff-regate/REPORT.md
```

## Changes

Updated:

```txt
.agents/skills/target-repo-testing/SKILL.md
docs/runbooks/target-repo-testing.md
```

The skill now requires target patch lifecycle classification:

```txt
none
accepted_by_target_owner
rejected_by_target_owner
stronger_verification_requested
handed_off_unresolved
```

The runbook now records:

```txt
target_patch_lifecycle
handoff_artifact
target_owner_decision
same_target_repair_allowed
```

## Rule

If a previous headless repair left a KRN-made target patch dirty and that patch
has only been handed off, classify it as:

```txt
target_patch_lifecycle: handed_off_unresolved
```

Allowed next actions:

- wait for target owner/operator decision;
- run observation-only verification requested for that patch;
- choose a different clean/safe target;
- record a blocked handoff if no useful progress is possible.

Forbidden next action:

- another repair in that same target repo.

## What This Proves

V37 proves:

- the target patch lifecycle lesson is no longer only in reports/chat;
- future target workflows have a durable stop condition for unresolved
  handed-off patches;
- the rule is in the existing target-repo workflow surface, not a new product
  layer.

V37 does not prove:

- target owner accepted the FAQ patch;
- target runtime/browser/accessibility behavior;
- V02-01 second-operator usability;
- product readiness;
- that another target repo is ready for repair.

## Product Readiness Decision

Readiness remains:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
```

## Condensation Decision

Promote:

```txt
V38 — Clean Target Selection Gate
```

Goal:

Find whether there is a clean/safe next target proof path that does not touch
the unresolved `krn-elektroinstal-ogar` patch.

Decision options:

- select another clean/safe target for observation-only or bounded repair;
- run observation-only stronger verification only if useful and non-destructive;
- wait for target owner/operator decision if no clean target exists;
- resume V02-01 only if real second-operator inputs exist.

Non-goals:

- no target writes during selection;
- no same-target repair while FAQ patch is `handed_off_unresolved`;
- no fake V02-01;
- no product-ready overclaim.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk sed -n '1,260p' .agents/skills/target-repo-testing/SKILL.md` | passed | current skill surface inspected | target owner decision |
| `rtk proxy sed -n '1,320p' docs/runbooks/target-repo-testing.md` | passed | current runbook inspected | runtime target behavior |

## Final Decision

V37 is complete as workflow-rule condensation.

Next active stream:

```txt
V38 — Clean Target Selection Gate
```

