# KRN Active Plan

Status: active compact root plan.

Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in:

```txt
PLANS.md
```

Do not create another parallel roadmap.

## Current Product State

Current readiness:

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V32 Controlled Target Repair Trial
current task: V32-00 Controlled Target Repair Trial
```

Completed stream summary:

```txt
V02-03..V02-08: complete
V03-00..V03-06: complete
V04-00..V04-07: complete
V05 target-aware evidence capture repair: complete
V06 activation / owner-file / context ROI utility: complete
V07 memory / anti-memory / source usefulness loop: complete
V08 skill-first workflow expansion: complete
V09 deterministic hooks candidate decision: complete
V10 MCP / subagent candidate gate: complete
V11 product readiness re-gate: complete
V12 widened alpha trial launch packet: complete
V13 research-to-brain decision lane gate: complete
V14 TypeScript boundary drift gate: complete
V15 Promptfoo / Golden Behavior Role Gate: complete
V16 Activation Relevance Evidence Gate: complete
V17 Target Owner-File Read-Model Contract Gate: complete
V18 Target Owner-File Contract Re-Gate / Trial Application: complete
V19 Product Readiness Re-Gate After Owner-File Contract: complete
V20 Real Target Observation-Only Owner-File Trial: complete
V21 Target Evidence Observation-Only Defaults And Readback Clarity: complete
V22 Persisted CLI DB URL Default Consistency: complete
V23 Real Target Observation Re-Run After Evidence/DB Ergonomics Repairs: complete
V24 Target Owner-File Recall Deduplication And Budget Priority: complete
V25 Real Target Observation Re-Run After Owner-File Priority Repair: complete
V26 CLI Run Reference And Empty Target Changed Files Ergonomics: complete
V27 Controlled Internal Alpha Re-Gate After Target Loop Repairs: complete
V28 Research-To-Brain TypeScript/Codex Decision Trial: complete
V29 TypeScript Boundary Research Application Gate: complete
V30 Codex Surface Context-Budget Application Gate: complete
V31 Product Readiness Re-Gate After Research And Surface Hygiene: complete
```

## Active Stream

### V32-00 — Controlled Target Repair Trial

Goal:

Run one bounded KRN-guided repair against a safe target checkout with explicit
allowed files, forbidden files, pre/post dirty state, rollback, target commands,
KRN plan/evidence/readback, and a report.

Current finding:

```txt
V27-V31 keep KRN controlled-internal-alpha for technical operators.
Product-ready, widened alpha, and V02-01 remain unproved.
The next product proof should move beyond observation-only target loops.
```

Current V32 action:

```txt
Select a safe target checkout and bounded target task.
Record allowed files, forbidden files, rollback, and pre/post status before any
target edit.
If no safe target exists, write a blocker report instead of substituting another
local/meta task.
```

## V02-01 Boundary

V02-01 can resume only with real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Hard Non-Goals

Do not build or claim:

- fake V02-01 proof;
- product-ready status;
- widened internal alpha;
- dashboard;
- API server;
- MCP server;
- worker daemon;
- source crawler;
- Research Foundry;
- broad eval platform;
- generic multi-agent system;
- runtime markdown memory;
- hidden semantic hooks;
- living target repo writes without explicit scope;
- large `AGENTS.md` expansion;
- parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

Docs/plan-only changes:

```sh
git diff --check
```

Source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB/eval-affecting changes:

```sh
pnpm db:ready
pnpm db:smoke
pnpm eval:promptfoo:smoke
```

After each bounded slice, commit, push, and confirm CI when appropriate.
