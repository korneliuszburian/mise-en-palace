# V11 Product Readiness Re-Gate

Status: readiness gate.

Date: 2026-06-27.

## Executive Verdict

V05-V10 make KRN stronger as a controlled-internal-alpha tool for technical
operators, but they do not justify widened internal alpha or product-ready
claims.

Current verdict:

```txt
controlled-internal-alpha for technical operators: yes / stronger
widened internal alpha: no
product-ready: no
V02-01 real second-operator proof: blocked/deferred
next stream: V12 Widened Alpha Trial Launch Packet
```

The strongest current product value is not a new surface. It is a governed
workflow that can preserve target evidence, owner-file recall state,
memory/source usefulness, skill-based continuation state, and source-backed
surface decisions without adding dashboard/API/MCP/subagent/hook sprawl.

The strongest remaining product gap is not another local feature. It is a real
operator or widened-alpha trial transcript with explicit operator inputs,
support boundary, target repo mode, DB mode, task, evidence, and failure
surface.

## Scope

This gate reviewed:

- V05 target-aware evidence capture and replay;
- V06 owner-file recall read-model utility;
- V07 memory/source usefulness loop;
- V08 skill-first workflow expansion gate;
- V09 deterministic hooks candidate decision;
- V10 MCP / subagent candidate gate;
- current `GOAL.md`, `PLAN.md`, `PLANS.md`;
- latest remote CI status on `main`.

Non-goals:

- no product feature work;
- no dashboard/API/MCP/subagent/hook implementation;
- no fake V02-01 proof;
- no product-ready claim;
- no target repo writes.

## Evidence Table

| Stream | Product Evidence | Readiness Impact | What It Does Not Prove |
|---|---|---|---|
| V05 | Target evidence capture/readback now represents target repo mode, dirty state, ownership, target files, target commands, write boundaries, and target proof/non-proof boundaries. | Strengthens controlled target trials. | Does not prove live external target correctness, target write safety, product readiness, or V02-01. |
| V06 | Owner-file recall now reports typed `owner_files_available` / `missing_owner_file_read_model` state with reason and proof boundary. | Reduces false blame on activation scoring and improves context ROI visibility. | Does not prove owner-file discovery is complete or activation scoring is good. |
| V07 | Controlled target-like memory usefulness loop proved helped feedback/readback; source decision candidates became visible in feedback summary and run readback. | Strengthens memory/source feedback usefulness for controlled runs. | Does not prove arbitrary external repo usefulness or automatic promotion. |
| V08 | Existing `handoff-compact` skill was refined for active stream/task and verified commit/push/CI state. | Reduces context loss and continuation waste without AGENTS.md bloat. | Does not prove future sessions always trigger the skill or second-operator usability. |
| V09 | Runtime hooks were rejected/deferred with candidate decisions and falsifiers; projection-first hook boundary remains. | Prevents hidden guardrail sprawl and keeps hooks evidence-gated. | Does not prove hooks will never be useful or that projections enforce behavior. |
| V10 | KRN MCP server and new subagent framework rejected/deferred; existing read-only `ts-type-critic` remains the only accepted custom agent-style surface. | Prevents premature surface expansion and preserves CLI/files/DB/readback as current boundary. | Does not prove MCP/subagents will never be useful or that KRN is product-ready. |
| CI | Latest `main` runs listed by GitHub CLI are green through `28284615177`. | Confirms pushed V08-V10 plan/report changes passed current remote CI. | Does not prove product readiness or live operator usability. |

## Readiness Decision

### Controlled-Internal-Alpha For Technical Operators

Verdict: yes / stronger.

Why:

- KRN can run controlled dogfood streams with explicit evidence boundaries.
- Target-aware evidence is represented and replayed.
- Owner-file recall absence is typed instead of hidden in prose.
- Memory/source usefulness has controlled readback evidence.
- Skills are now used as the first durable condensation surface for repeated
  workflow behavior.
- Hooks, MCP, and subagents have current source-backed decisions and falsifiers
  rather than vague backlog pressure.

Boundary:

This is still for technical operators who can read command evidence, understand
proof/non-proof boundaries, and work with `GOAL.md` / `PLAN.md` / `PLANS.md`.

### Widened Internal Alpha

Verdict: no / not yet.

Why:

- The evidence remains mostly self/headless controlled KRN-on-KRN work.
- V02-01 real second-operator transcript is still missing.
- No fresh widened-alpha run proves a non-author operator can follow the launch
  packet, recover from DB/setup friction, capture evidence, and finish a target
  task with bounded support.

Required next evidence:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
bounded target task:
operator transcript:
commands:
support used:
verdict:
```

### Product-Ready

Verdict: no.

Why:

- Product readiness requires stronger evidence than local controlled dogfood and
  green CI.
- Activation, target repo onboarding, operator ergonomics, second-operator
  usability, live support boundaries, and external target outcomes remain
  under-proven.
- V09/V10 explicitly rejected/deferred additional product surfaces rather than
  validating an end-user product loop.

## Remaining Blockers

| Blocker | Status | Evidence | Next Proof Needed |
|---|---|---|---|
| V02-01 real second-operator proof | blocked/deferred | `GOAL.md`, `PLAN.md`, `PLANS.md` all require real operator inputs and forbid self/headless substitution. | Real operator transcript with target repo, support boundary, DB mode, bounded task, commands, and verdict. |
| Widened internal alpha | not ready | V05-V10 are controlled/self/headless engineering evidence. | Launch packet plus one real or formally bounded widened-alpha trial. |
| Product readiness | not ready | V05-V10 improve internals and reject surfaces; they do not prove end-user value. | Repeated non-author operator success and clear support/playbook boundaries. |
| Activation quality | partial | V06 improves owner-file recall state; it does not prove ranking/discovery quality. | More target runs showing selected/used/helped/missing context under real tasks. |
| Surface expansion | deferred | V09/V10 reject hooks/MCP/subagents now. | Repeated falsifier-triggering evidence that skills/CLI/files/DB/readback are insufficient. |

## What Not To Build Next

Do not build next:

- dashboard;
- API server;
- KRN MCP server;
- worker daemon;
- new subagent framework;
- hook runtime;
- source crawler;
- broad eval platform;
- `krn audit`;
- anti-slop scanner;
- another local substitute for V02-01.

These surfaces remain candidates only when a future report records repeated
evidence and a falsifier that the current CLI/files/DB/readback/skill path
cannot satisfy.

## Next Recommended Stream

Move to:

```txt
V12 — Widened Alpha Trial Launch Packet
```

First task:

```txt
V12-00 — Real Operator / Widened Alpha Trial Launch Packet
```

Objective:

Prepare the smallest operator-ready packet that can run V02-01 or a widened
internal-alpha trial without relying on the author explaining context in chat.

Rules:

- Do not fake second-operator proof.
- Do not run another local substitute and call it widened alpha.
- If operator inputs are missing, record the missing fields and stop that trial
  path cleanly.
- The packet should capture setup, DB mode, target repo mode, support boundary,
  transcript schema, evidence checklist, failure taxonomy, and final verdict
  labels.

Why this is next:

V11 found no current feature/surface that should outrank the missing operator
proof. The highest-ROI move is to make the next real operator or widened-alpha
trial executable with minimal author context and clear stop conditions.

## Command Evidence

| Command | Result | What It Proves | What It Does Not Prove |
|---|---|---|---|
| `rtk git fetch --prune && rtk git status --short --branch && rtk git log --oneline -n 8` | passed | Local `main` was clean and aligned with `origin/main`; recent commits include V05-V10. | Does not prove readiness. |
| `rtk gh run list --branch main --limit 8` | passed | Latest listed `main` CI runs were green, including V10. | Does not prove product behavior or operator usability. |
| `rtk sed ... V05-V10 reports` | passed | Readiness gate inspected the completed stream reports. | Does not prove those streams cover product-ready requirements. |

## Condensation Decision

```txt
finding:
  V05-V10 strengthen controlled-internal-alpha but do not unlock widened alpha
  or product-ready claims.

frequency:
  repeated across every stream gate after V04.

candidate_surface:
  real operator / widened alpha launch packet.

decision:
  accept V12-00.

rationale:
  The next blocker is not a missing architecture surface; it is missing
  operator-trial evidence with explicit inputs, support boundary, transcript,
  and verdict.

evidence:
  V05-V10 reports, current PLAN/GOAL/PLANS state, latest green CI.

does_not_prove:
  second-operator usability, external repo success, product readiness.

falsifier:
  V12 shows an existing packet already covers real operator setup, DB mode,
  support boundary, target mode, transcript, evidence checklist, and verdicts
  well enough to launch without changes.

next_task_id:
  V12-00.
```
