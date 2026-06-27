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
active stream: V50 CI Action Modernization Re-Gate
current task: V50-00 CI Action Modernization Re-Gate
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
V32 Controlled Target Repair Trial: complete
V33 Reused Project Owner-File Refresh Repair: complete
V34 Target Repair Re-Gate After Owner-File Refresh: complete
V35 Target Patch Handoff Packet: complete
V36 Target Patch Handoff Re-Gate: complete
V37 Target Patch Lifecycle Rule Condensation: complete
V38 Clean Target Selection Gate: complete
V39 WILQ Clean Target Observation-Only Baseline: complete
V40 Target Selection Freshness Rule Condensation: complete
V41 Target Trial Availability Re-Gate: complete
V42 WILQ Fresh Observation-Only Baseline Retry: complete
V43 Target Stability Window Gate: complete
V44 target evidence lifecycle/freshness fields: complete
V45 target availability re-gate with typed lifecycle evidence: complete
V46 target owner coordination packet: complete
V47 internal hardening re-gate after target coordination: complete
V48 continuous pattern source-to-decision gate: complete
V49 first continuous pattern gate application: complete
```

## Active Stream

### V50-00 — CI Action Modernization Re-Gate

Goal:

Inspect the post-push CI result for V49 and decide whether the action
modernization is accepted, needs repair/revert, or creates a next bounded task.

Current finding:

```txt
V49 applied the Continuous Pattern Gate to CI action runtime modernization.
The consumer is `.github/workflows/ci.yml`; the falsifier is the post-push KRN
CI run for the V49 commit.
```

Current V50 action:

```txt
Check the V49 CI run before unrelated work. If CI fails, repair or revert the
workflow action update first. If CI passes, record the gate application as
accepted and select the next bounded task.
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
