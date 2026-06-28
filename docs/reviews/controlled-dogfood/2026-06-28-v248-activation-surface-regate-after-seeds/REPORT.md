# V248 Activation Surface Re-Gate After Seed Repairs

Status: complete.

Date: 2026-06-28

## Executive Verdict

V248 stops the reactive seed-repair loop for now.

V245 and V247 proved that missing owner files for source-decision and
skill-directed tasks were read-model input gaps, not activation scoring bugs.
Both gaps now have focused source seeds, tests, DB-backed plan proof, evidence,
observe, reflect, pushed commits, and green CI.

The next activation surface is not "add another seed class" and not "rewrite
scoring." The highest-value bounded next task is a budget/priority guard:
task-specific source seeds should not be crowded out by generic default owner
files when they match the task more directly.

## Evidence Compared

| Slice | Before | Repair | After | Residual signal |
|---|---|---|---|---|
| V245 source-decision seeds | Source-to-decision work missed `docs/KRN_SOURCES.md`, pattern-intake, standards, and invariant owner files. | Added source-map/runbook/standard/invariant source seeds. | DB-backed plan selected `docs/runbooks/pattern-intake.md`, `packages/harness/src/sourceMapInvariants.test.ts`, and `docs/KRN_SOURCES.md`. | `docs/standards/typescript-excellence.md` was present but budget-excluded. |
| V246 observe/reflect sequencing | First reflect could run before observe and select zero observations. | Added evidence-review-loop sequencing rule and invariant. | DB-backed evidence loop selected 5 observations after observe. | V246 plan missed real skill owner files. |
| V247 skill seeds | Skill-directed work missed `.agents/skills/evidence-review-loop/SKILL.md` and `skillInvariants`. | Added skill root, skill doc, and skill invariant seeds. | DB-backed plan selected `.agents/skills/evidence-review-loop/SKILL.md`, `packages/harness/src/skillInvariants.test.ts`, and `.agents/skills`. | Generic default owner files still consumed context slots. |

## Activation Surface Decision

```yaml
source_id: v248-post-seed-activation-regate
title: Activation re-gate after source-decision and skill seed repairs
trust_tier: high
source_class: repo-local evidence
mechanism: missing read-model inputs caused recent owner-file misses; after adding exact seeds, plans can surface the intended owner files, but generic default owner files still consume budget and can push task-specific seeds out.
krn_implication: stop adding seed classes until another concrete miss appears; next repair should guard budget priority between generic owner files and task-specific source seeds.
decision_kind: adopt
decision: open V249 as a bounded activation budget-priority guard, not a scoring rewrite.
consumer: activation owner-file recall tests, context assembly behavior, PLAN/PLANS next-task selection.
falsifier: a post-seed task-specific source seed is still excluded over budget while generic default owner files are included without stronger task relevance.
does_not_prove: activation scoring is globally wrong, broad retrieval rewrite is needed, or no future seed class will ever be needed.
```

## Why Not More Seeds Now

No current evidence names a third missing seed class. Adding another static seed
set now would preserve a different end state: source list growth for its own
sake.

Allowed future seed repair:

```txt
Only after a DB-backed task misses a concrete owner file class that should have
been present in the read model.
```

## Why Not Activation Scoring Rewrite Now

Recent evidence shows the main failures were missing inputs:

- V245: source-decision owner files were not seeded;
- V247: skill owner files were not seeded.

After each repair, DB-backed planning surfaced the expected owner files. That
does not support a broad scoring rewrite.

## Remaining Activation Risk

Generic default owner files are still strong candidates:

```txt
packages/cli/src/runPlanCommand.ts
packages/cli/src/runRunShowCommand.ts
packages/harness/src/activation/activationEngine.ts
```

They are useful for activation/readback work, but they should not always crowd
out task-specific source seeds. V245 already showed a relevant standard seed
present but excluded by budget. V247 selected the skill seeds, but still spent
half the context budget on generic owner files.

This is a budget-priority problem, not enough evidence for ranking rewrite.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git status --short --branch` | clean before V248 | V248 started from a clean local worktree matching `origin/main`. | Does not prove remote CI for future commits. |
| `git log --oneline -n 8` | passed | Recent commits include V245, V246, and V247 pushed history. | Does not prove product readiness. |
| V245 report readback | inspected | Source-decision seed repair worked and identified budget exclusion for TS standard. | Does not prove all source-decision contexts are perfect. |
| V246 report readback | inspected | Observe/reflect sequencing is now durable and the skill-owner miss was real. | Does not prove reflection quality. |
| V247 report readback | inspected | Skill owner-file seed repair worked and selected skill owner files. | Does not prove generic owner-file budget priority is optimal. |

## What This Proves

- V245 and V247 were the right class of repair: read-model input quality.
- There is no current evidence for another seed class.
- There is enough evidence for a bounded budget-priority guard around generic
  owner files vs task-specific source seeds.

## What This Does Not Prove

- Product readiness.
- General activation ranking quality.
- That generic owner files are bad.
- That no future seed class will be needed.
- That a scoring rewrite is justified.

## Next Recommended Action

```txt
V249-00 Activation Budget Priority Guard
```

Goal:

```txt
Add a focused behavior guard proving that task-specific target source seeds are
not crowded out by generic default owner files when the source seed has stronger
task relevance.
```

Non-goals:

```txt
no activation scoring rewrite
no broad retrieval rewrite
no new seed class
no source crawler
no dashboard/API/MCP/worker daemon
```

Expected first implementation surface:

```txt
packages/harness/src/activation/ownerFileRecall.test.ts
maybe packages/harness/src/activation/ownerFileRecall.ts
```

The implementation should be minimal and falsifiable. If source inspection shows
the current behavior already protects this, V249 should record that and stop.
