# V46 Target Owner Coordination Packet

Status: ready for operator/owner use.

Date: 2026-06-27.

Purpose: state the exact inputs that unblock the next target proof without
creating another local substitute.

## Current Decision

```txt
Do not run another headless target repair right now.
Do not call any self/headless run V02-01.
Do not edit living target repos without explicit current write scope.
```

KRN may continue internal hardening while waiting for target owner/stability
inputs.

## Current Target States

### wilq-seo

Current V45 classification:

```txt
mode: observation_only
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
owned_by_current_krn_run: no
target_owner_decision: no target owner repair permission; observation-only only
same_target_repair_allowed: no
```

Fresh dirty files observed in V45:

```txt
M packages/shared-schemas/src/index.ts
M wilq/briefing/ads_diagnostics.py
M wilq/schemas.py
```

What unlocks WILQ repair:

```txt
target_repo: /home/krn/coding/krn/active/wilq-seo
target_repo_mode: writable
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes:
  - exact file paths or package surface
forbidden_writes:
  - unrelated dirty files
  - target commits unless explicitly requested
  - resets/cleans
bounded_target_task:
  - one narrow repair objective
verification:
  - exact target commands allowed to run
rollback:
  - how to discard KRN-made target changes only
owner_decision:
  - dirty state may be edited / dirty state must stay untouched
```

Minimal owner reply:

```txt
WILQ write scope:
  allowed files:
  forbidden files:
  bounded task:
  commands allowed:
  commit target changes: yes/no
  existing dirty files are mine / can be edited / must not be touched:
```

### krn-elektroinstal-ogar

Current V45 classification:

```txt
mode: observation_only
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: handed_off_unresolved
handoff_artifact: docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md
owned_by_current_krn_run: yes
target_owner_decision: no visible target owner decision after handoff
same_target_repair_allowed: no
```

Fresh dirty files observed in V45:

```txt
M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

What unlocks elektroinstal work:

```txt
one of:
  accepted_by_target_owner:
    owner accepts/keeps/commits the V35 FAQ patch

  rejected_by_target_owner:
    owner rejects/reverts the V35 FAQ patch

  stronger_verification_requested:
    owner asks KRN for observation-only verification of the handed-off patch

  explicit same-target repair permission:
    owner allows further work despite handed_off_unresolved state
```

Minimal owner reply:

```txt
Elektroinstal V35 FAQ patch decision:
  accepted_by_target_owner / rejected_by_target_owner / stronger_verification_requested
  if stronger verification requested, commands allowed:
  if further repair allowed, exact file scope:
  commit target changes: yes/no
```

## V02-01 Real Second-Operator Inputs

V02-01 remains blocked/deferred until these inputs exist:

```txt
operator:
operator_machine_os:
operator_timezone:
support_channel:
trial_date:

KRN source:
target_repo:
target_repo_mode: read-only / writable
DB mode:
support boundary:
bounded target task:
operator transcript:
```

Rules:

```txt
self/headless run:
  allowed as engineering proof
  not allowed as V02-01

real second-operator run:
  only mode that can satisfy V02-01
```

## While Waiting

Allowed KRN work:

```txt
internal source hardening
docs/runbook condensation
golden behavior coverage
Promptfoo smoke/golden adapter checks
evidence/readback ergonomics
research-to-decision trials
TypeScript boundary hardening
```

Forbidden KRN work:

```txt
target repo edits
target commits
target resets/cleans
same-target elektroinstal repair while handed_off_unresolved
fake V02-01
product-ready claim
another local substitute for missing owner/operator inputs
```

## Next Decision Matrix

| Input Received | Next Task |
|---|---|
| WILQ exact writable scope | Run bounded WILQ repair trial |
| WILQ read-only verification request | Run observation-only WILQ verification |
| Elektro patch accepted | Re-gate elektro as no pending KRN patch |
| Elektro patch rejected | Record rejection and choose next target |
| Elektro stronger verification requested | Run observation-only verification of V35 patch |
| Real second operator inputs | Resume V02-01 |
| No owner/operator input | Continue internal KRN hardening |

## Evidence Pointers

- V35 handoff: `docs/reviews/controlled-dogfood/2026-06-27-v35-target-patch-handoff/REPORT.md`
- V45 availability gate: `docs/reviews/controlled-dogfood/2026-06-27-v45-target-availability-regate-typed-evidence/REPORT.md`
- Target workflow skill: `.agents/skills/target-repo-testing/SKILL.md`
- Target runbook: `docs/runbooks/target-repo-testing.md`
