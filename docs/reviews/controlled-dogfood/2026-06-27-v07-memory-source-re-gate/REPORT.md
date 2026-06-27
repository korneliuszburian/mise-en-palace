# V07 Memory / Source Usefulness Re-Gate

Status: V07 completion gate.

Date: 2026-06-27

## Executive Verdict

V07 is sufficient to move to V08 skill-first workflow expansion.

V07-00 proved the controlled target-like memory usefulness loop in the current
shell: memory included, `MemoryApplication outcome=helped`, positive feedback
readback, no automatic MemoryRecord mutation, and cleanup count zero.

V07-01 repaired the source usefulness readback blind spot: source decision
candidates in `FeedbackDelta.sourceDecisions` now appear in feedback proposal
summary and run readback as `source_decision_candidate`, with source claim and
source decision counts separated.

This does not make KRN product-ready and does not complete V02-01. It only
means memory/source usefulness is no longer the next active blocker before
skill-first workflow expansion.

## Gate Inputs

| Input | Verdict | Evidence |
|---|---|---|
| Memory usefulness | pass with controlled-fixture boundary | `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-usefulness/REPORT.md` |
| Source decision readback | pass | `docs/reviews/controlled-dogfood/2026-06-27-v07-source-usefulness-readback/REPORT.md` |
| Full tests | pass | `pnpm test` |
| Type safety | pass | `pnpm typecheck` |
| Brain-battle smoke | pass | `pnpm eval:brain-battle:smoke` |
| Promptfoo smoke | pass | `pnpm eval:promptfoo:smoke` |
| DB target harness smoke | pass | `pnpm db:smoke:target-repo-harness` |

## What V07 Proves

- A controlled target-like run can measure memory usefulness through helped
  feedback and readback.
- Feedback proposal summary now exposes source decision candidates.
- Run readback distinguishes source claim and source decision candidate counts.
- The current path does not require a new source subsystem or DB migration.

## What V07 Does Not Prove

- Product readiness.
- V02-01 real second-operator usability.
- Memory/source usefulness on arbitrary external repos.
- Source helped/stale outcome feedback equivalent to memory applications.
- Automatic promotion should exist.

## Decision

Move to:

```txt
V08 — Skill-First Workflow Expansion
```

Reason:

```txt
Memory/source usefulness has enough controlled evidence to stop blocking the
next question: whether KRN can condense repeatable senior/operator workflows
into skills without bloating AGENTS.md, hooks, MCP, or subagents prematurely.
```

## Next Active Task

```txt
V08-00 — Skill-First Workflow Expansion Gate
```

The first V08 task should inspect existing project skills and recent repeated
workflow patterns, then decide whether to add or refine one skill. It must not
create a broad plugin, MCP server, hook framework, or subagent system.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/core test -- reviewFeedback` | passed | Source decision candidates are summarized in core feedback proposal summary. | Does not prove CLI readback. |
| `pnpm --filter @krn/cli test -- runRunShowCommand` | passed | Run readback exposes source decision candidate counts. | Does not prove live DB readback. |
| `pnpm typecheck` | passed | TypeScript public shapes compile. | Does not prove runtime usefulness. |
| `pnpm test` | passed | Workspace tests pass after V07-01. | Does not prove product readiness. |
| `pnpm eval:brain-battle:smoke` | passed | Existing deterministic brain behavior gates still pass. | Does not prove arbitrary repo behavior. |
| `pnpm eval:promptfoo:smoke` | passed | Promptfoo adapter smoke remains wired. | Does not execute full KRN behavior. |
| `pnpm db:smoke:target-repo-harness` | passed | Current-shell DB-backed target harness smoke still proves target memory usefulness and cleanup. | Does not prove external target repo usefulness. |

## Follow-Up Candidates

MemoryCandidate:

- Summary: Memory/source usefulness gates should move forward only after both
  memory helped feedback and source decision candidate readback are visible.
- Evidence refs: V07-00, V07-01, this report.
- Does not prove: product-wide usefulness.
- Reviewability: ready.

SkillCandidate:

- Summary: Codex/KRN repeated workflows should be condensed into skills only
  when the workflow is repeated and the skill keeps AGENTS.md compact.
- Evidence refs: current goal continuation rules, existing `.agents/skills`,
  repeated target/evidence/source workflows.
- Does not prove: hooks/MCP/subagents are needed.
- Reviewability: review in V08-00.
