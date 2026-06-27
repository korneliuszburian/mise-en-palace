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
active stream: V70 Post Security Trust Boundary Re-Gate
current task: V70-00 Post Security Trust Boundary Re-Gate
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
V50 CI action modernization re-gate: complete
V51 second continuous pattern gate selection: complete
V52 brain-battle smoke CI gate: complete
V53 brain-battle CI gate re-gate: complete
V54 post-CI pattern gate re-gate: complete
V55 product readiness re-gate after CI/eval gates: complete
V56 operator/owner launch packet refresh: complete
V57 post-packet internal work re-gate: complete
V58 pattern intake runbook: complete
V59 first pattern intake runbook application: complete
V60 TypeScript lifecycle union drift spot-check: complete
V61 post-pattern intake re-gate: complete
V62 pattern intake skill linkage: complete
V63 post-pattern-intake linkage re-gate: complete
V64-00 pattern gate re-entry: complete
V64-01 pattern surface consumer matrix: complete
V64-02 first surface-matrix pattern application: complete
V64-03 post surface-matrix application re-gate: complete
V65-00 TypeScript source packet application: complete
V65-01 post TypeScript pattern application re-gate: complete
V66-00 TypeScript boundary falsifier spot-check: complete
V67-00 harness activation pattern application: complete
V68-00 post harness activation pattern re-gate: complete
V69-00 untrusted context warning pattern application: complete
V70 post security trust boundary re-gate: active
```

## Active Stream

### V70 Post Security Trust Boundary Re-Gate

Goal:

Decide the next bounded task after adding deterministic untrusted-context
warnings to Codex briefs.

Current finding:

```txt
V69 implemented SEC-01: `ExecutionBrief` now carries deterministic
untrusted-context warnings and rendered briefs show an explicit warning section.
```

Current action:

```txt
Execute V70-00: decide whether the next task is another bounded security proof,
another pattern surface, or an honest blocker.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate selects generic security work instead of a named consumer/falsifier.
```

### External Input Blocker

Status: deferred boundary, not the current internal stream.

V02-01 still requires real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

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
