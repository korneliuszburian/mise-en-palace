# V34 Target Repair Re-Gate After Owner-File Refresh

Status: complete.

Date: 2026-06-27.

Mode: observation-only re-gate.

## Executive Verdict

V32 and V33 together move KRN target-repair readiness forward, but they do not
justify widened alpha, product-ready status, or V02-01.

Current verdict:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
```

V32 proved KRN can govern one bounded headless target repair with allowed files,
forbidden files, rollback, target commands, DB-backed evidence, observe,
reflect, and readback.

V33 repaired the owner-file refresh issue found by V32. Reused target reconnect
now creates a fresh ProjectKernel snapshot when owner/source metadata changes,
and planning treats latest ProjectKernel owner files as the active snapshot.

The remaining immediate blocker is not another KRN feature. It is target patch
ownership: the living target repo still has the V32 patch dirty and uncommitted.
KRN must not silently commit, revert, normalize, or forget that state.

Next task:

```txt
V35 — Target Patch Handoff Packet
```

## Inputs Inspected

Reports:

```txt
docs/reviews/controlled-dogfood/2026-06-27-v32-controlled-target-repair/REPORT.md
docs/reviews/controlled-dogfood/2026-06-27-v33-reused-project-owner-file-refresh/REPORT.md
```

Current KRN state:

```txt
branch: main...origin/main
worktree: clean
latest commit: e9d3af1 fix(init): refresh reused project owner files
latest CI: 28289476246 passed
```

Current target state:

```txt
target_repo: /home/krn/coding/krn/active/krn-elektroinstal-ogar
branch: master...origin/master
dirty files:
  M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
  M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

Target diff summary:

```txt
2 files changed, 5 insertions(+), 3 deletions(-)
```

No target command in this V34 re-gate modified target files.

## What Improved

### Target Repair Governance

V32 showed that KRN can run a headless repair safely when the target write
scope is explicit before editing.

Evidence:

```txt
allowed target files:
  bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
  bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js

forbidden:
  target commit
  target reset/clean
  target files outside allowed scope
```

### Owner-File Refresh

V33 fixed the stale owner-file read-model issue:

```txt
Target read model: sourceSeeds=3, ownerFiles=2, trustExclusions=7
Context included:
  faq-accordion.js
  faq-help.php
  target trust exclusions
```

This means another target repair can use fresher direct owner-file context after
explicit reconnect.

### Evidence Strength

The latest KRN CI passed:

```txt
DB readiness and smoke: passed
Typecheck, tests, and eval smoke: passed
Promptfoo smoke: passed
```

## What Did Not Improve

V34 does not improve or prove:

- real second-operator usability;
- product readiness;
- widened internal alpha;
- full target browser/runtime/accessibility verification;
- target patch acceptance by the target repo owner;
- that KRN should commit target code;
- that future target patches are always safe.

## Target Patch Boundary

Current target patch remains intentionally dirty:

```txt
M bedrock/web/app/themes/elektroinstal/src/css/blocks/faq-accordion.js
M bedrock/web/app/themes/elektroinstal/template-parts/flex/faq-help.php
```

V34 decision:

```txt
Do not start another target repair while this patch is only implicit dirty state.
Do not commit the target patch from KRN.
Do not revert the target patch from KRN.
Create a KRN-side handoff packet with exact patch, verification, proof
boundaries, and operator choices.
```

This keeps the target repo from becoming hidden state in KRN’s product proof.

## Readiness Decision

```txt
controlled-internal-alpha for technical operators:
  yes / stronger

widened internal alpha:
  no

product-ready:
  no

V02-01:
  blocked/deferred until real second-operator inputs exist
```

Reason:

KRN can now govern and repair a bounded target slice, then repair its own
owner-file read-model issue from that evidence. That is meaningful internal
alpha evidence for technical operators. It is still not independent operator
proof, not product UX proof, and not target patch ownership proof.

## Next Recommended Task

Promote V35:

```txt
V35 — Target Patch Handoff Packet
```

Goal:

Create a KRN-side packet for the V32 target patch containing:

- exact target diff;
- target files changed;
- commands already run;
- what the patch proves and does not prove;
- apply/keep/revert options for the operator;
- explicit statement that KRN did not commit target code.

Non-goals:

- no target edits;
- no target commit;
- no target reset/clean;
- no product-ready/V02-01 claim;
- no new KRN source feature.

After V35, the next gate can decide whether another controlled target repair is
safe, or whether target owner/operator action is the honest blocker.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git status --short --branch` in KRN | clean | KRN repo had no uncommitted work before V34 docs | future commits/CI |
| `rtk gh run list --branch main --limit 3` | latest CI ok | latest pushed KRN commit passed CI | product readiness |
| `rtk git status --short --branch` in target | dirty with 2 files | target patch still exists and is bounded to V32 files | target owner acceptance |
| `rtk git diff --stat` in target | 2 files, 5 insertions, 3 deletions | target patch size/scope | runtime correctness |

## Final Decision

V34 is a decision gate, not a feature slice.

The next highest-ROI move is not another implementation. It is making the
existing target patch explicit and handoff-safe before KRN touches another
target repair.
