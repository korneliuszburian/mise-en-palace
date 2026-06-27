# V30 Codex Surface Context-Budget Application Gate

Status: complete.

Date: 2026-06-27.

Mode: Codex surface / context-budget application.

## Executive Verdict

V30 found one real Codex surface drift: root `PLAN.md` claimed to be a compact
product SSOT but still carried historical completed-stream details and an old
`Active Stream: V28` section. That created unnecessary context load and a
possible stale-current-truth conflict.

The repair was to condense root `PLAN.md` back to its intended role:

```txt
compact current product state
active stream/task
V02-01 boundary
hard non-goals
verification policy
```

Detailed execution history remains in `PLANS.md`, which is explicitly the
continuous ExecPlan. No new skill, hook, MCP server, subagent framework, or
`AGENTS.md` expansion was justified.

## Scope

Inspected surfaces:

| Surface | Size / count | Classification | Decision |
|---|---:|---|---|
| `AGENTS.md` | 1,164 bytes | compact durable repo guidance | keep |
| `GOAL.md` | 5,251 bytes | acceptable continuous objective contract | keep |
| `PLAN.md` before repair | 19,877 bytes | drifted beyond compact SSOT | refine |
| `PLAN.md` after repair and V31 promotion | 4,121 bytes | compact product SSOT | keep |
| `PLANS.md` | 192,209 bytes | intentionally detailed continuous ExecPlan | keep as detailed surface |
| repo-local skills | 9 skills / 18,692 bytes total | bounded, focused workflows | keep |

Repo-local skills inspected:

| Skill | Size | Trigger quality | Decision |
|---|---:|---|---|
| `activation-engine` | 1,616 bytes | focused on activation/context selection | keep |
| `brain-store-schema` | 1,688 bytes | focused on DB/schema/repository work | keep |
| `codex-adapter-plan` | 1,555 bytes | focused on Codex-facing rendering | keep |
| `evidence-review-loop` | 1,454 bytes | focused on evidence/review/feedback | keep |
| `handoff-compact` | 1,832 bytes | focused on compact/resume/handoff | keep |
| `source-to-decision` | 3,014 bytes | focused on source mapping and falsifiers | keep |
| `target-infra-adr` | 1,615 bytes | focused on architecture/ADR choices | keep |
| `target-repo-testing` | 3,984 bytes | longer but justified by target safety workflow | keep |
| `typescript-type-safety` | 1,934 bytes | focused on TS boundary discipline | keep |

Non-goals:

- no new skill;
- no hook implementation;
- no MCP server;
- no subagent framework;
- no dashboard/API/worker runtime;
- no `AGENTS.md` bloat;
- no parallel roadmap;
- no product-ready claim.

## Findings

### Finding 1: Root `PLAN.md` Was Not Compact Enough

Evidence:

- `rtk wc -c AGENTS.md GOAL.md PLAN.md PLANS.md` reported
  `PLAN.md` at 19,877 bytes before repair and 4,121 bytes after repair plus
  V31 promotion.
- `rtk rg -n "^## |^### " PLAN.md` showed completed stream sections from V05
  through V28.
- `PLAN.md` still had a lower `## Active Stream: V28` section while the top
  current state pointed to V30.

Decision:

Repair root `PLAN.md` by removing historical completed-stream details and
keeping only current product state, active V30 task, V02-01 boundary, hard
non-goals, and verification policy.

Does not prove:

- that `PLANS.md` should be shortened;
- that historical reports should be deleted;
- that future active root `PLAN.md` will stay compact automatically.

Falsifier:

- future continuation cannot recover active task state from compact `PLAN.md`
  plus detailed `PLANS.md`.

### Finding 2: `AGENTS.md` Is Correctly Small

Evidence:

- `AGENTS.md` is 1,164 bytes.
- It points to `docs/KRN_KERNEL.md`, forbids broad rereads and wrong surfaces,
  and keeps TypeScript/git rules durable.

Decision:

Keep. Do not expand `AGENTS.md`.

Does not prove:

- that no future global repo rule belongs there.

Falsifier:

- repeated global violation persists despite skills, tests, plans, and reports.

### Finding 3: Repo-Local Skills Are Bounded

Evidence:

- 9 repo-local skills.
- Total skill body size is 18,692 bytes.
- Each skill frontmatter has a focused trigger description.
- No duplicate skill surface was found for V30.

Decision:

Keep. Do not create a new skill.

Does not prove:

- every skill will trigger perfectly;
- future repeated workflows will not need a new or refined skill.

Falsifier:

- repeated workflow misses occur because no existing skill trigger covers the
  work, or a skill is too broad to select reliably.

## Repair Diff Summary

| File | Change | Why |
|---|---|---|
| `PLAN.md` | condensed from historical stream ledger to compact active SSOT | aligns with V28 Codex surface decision and reduces context waste |

No package source, skills, hooks, MCP, subagents, or `AGENTS.md` were changed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk git fetch --prune` | passed | Remote refs refreshed before V30. | Does not prove future CI. |
| `rtk git status --short --branch` | passed, clean, `main...origin/main` | V30 started from clean synced state. | Does not prove surface quality. |
| `rtk git log --oneline -n 8` | passed | Latest local history started at `862887d`. | Does not prove V30 repair. |
| `rtk gh run list --branch main --limit 3` | passed | Previous CI for `862887d` was green. | Does not prove new commit CI. |
| `rtk wc -c AGENTS.md GOAL.md PLAN.md PLANS.md` | passed | Measured root instruction/plan surface sizes. | Does not prove semantic quality by itself. |
| `rtk find .agents/skills -name SKILL.md -maxdepth 3` | passed with warning from `rtk find` flag handling | Identified 9 repo-local skills. | Does not prove skill trigger quality by itself. |
| `rtk wc -c .agents/skills/*/SKILL.md` | passed | Measured skill body sizes. | Does not prove runtime skill selection. |
| `rtk rg -n "Active Stream: V28\|active stream: V28\|V28-00.*active\|current task: V28" PLAN.md GOAL.md PLANS.md` | no matches after repair | Stale active V28 pointers were removed from active surfaces. | Does not prove future plan hygiene. |

## Product Readiness Impact

```txt
controlled-internal-alpha for technical operators: unchanged / stronger context hygiene
widened internal alpha: no
product-ready: no
V02-01: still blocked/deferred
```

## Next Recommended Task

Promote:

```txt
V31 — Product Readiness Re-Gate After Research And Surface Hygiene
```

Why:

V28 through V30 completed the research-to-brain, TypeScript boundary, and Codex
surface hygiene loop. The next useful move is not another meta-surface pass; it
is a compact re-gate that decides whether to return to target trials, real
operator intake, activation/read-model repair, or pause for V02-01 inputs.

V31 should inspect V27 through V30 evidence and make one next-task decision.

## Final Decision

Root `PLAN.md` was repaired. No new Codex surface was added.
