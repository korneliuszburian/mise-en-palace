# V58 Pattern Intake Runbook For Continuous Brain Growth

Status: complete.

Date: 2026-06-27.

## Executive Verdict

KRN now has an operator-facing pattern intake runbook:

```txt
docs/runbooks/pattern-intake.md
```

This does not build a research subsystem. It makes the existing Continuous
Pattern Gate executable for operators who want to feed KRN with strong courses,
papers, official docs, practitioner writing, local evidence, and target-run
evidence.

## What Changed

Added a compact runbook that defines:

- allowed source classes;
- legal/content boundaries;
- trust tiers;
- intake workflow;
- consumer routing;
- source-decision output template;
- rejection reasons;
- examples for official docs, TypeScript practitioner sources, and target
  evidence;
- verification criteria.

## Source-To-Decision Mapping

```yaml
source_id: v58-pattern-intake-runbook
title: Pattern Intake Runbook For Continuous Brain Growth
url_or_ref: docs/reviews/controlled-dogfood/2026-06-27-v57-post-packet-internal-work-regate/REPORT.md
trust_tier: high
source_class: repo-local evidence
mechanism: V48 created the Continuous Pattern Gate, but V57 found the operator-facing intake workflow was implicit.
krn_implication: Operators need a compact runbook so best-practice sources become decisions, consumers, and falsifiers instead of active-context sludge.
decision_kind: adopt
decision: Add docs/runbooks/pattern-intake.md.
consumer: docs/runbooks/pattern-intake.md
falsifier: The next pattern intake cannot produce one decision/rejection with a consumer and falsifier without creating a broad research archive.
does_not_prove: KRN has ingested all best sources, product readiness, or that future source intakes will be high quality.
candidate_output:
  type: SkillCandidate
  reviewability: ready
next_action: Run one bounded application of the runbook on an existing source decision.
```

## Rejected Alternatives

| Alternative | Decision | Reason |
|---|---|---|
| Source crawler | reject | No bounded consumer; high context and copyright risk. |
| Broad course index | reject | Paid/proprietary content must not be copied into KRN. |
| Research Foundry | reject | New subsystem not needed for current product state. |
| Add more raw sources first | reject | Existing sources are enough to create the runbook. |
| Put this in `AGENTS.md` | reject | Too detailed for durable top-level instructions. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git diff --check` | passed | Checks whitespace for the docs diff. | Product readiness or source intake quality. |
| `git status --short --branch` | expected docs/plan changes only | Shows local worktree state before commit. | CI success. |

## Next Recommended Task

Promote:

```txt
V59 — First Pattern Intake Runbook Application
```

Goal:

Use `docs/runbooks/pattern-intake.md` on one existing source decision from
`docs/KRN_SOURCES.md` and produce one concrete consumer update, rejection, or
eval/golden candidate. This proves the runbook can drive behavior and is not
just another document.

## What This Proves

- KRN has a compact operator path for continuous pattern intake.
- Pattern intake is constrained by consumer and falsifier.
- Course/paper/practitioner material is routed through legal and reviewable
  summaries, not copied into active context.

## What This Does Not Prove

- Product readiness.
- V02-01.
- That all best sources have been reviewed.
- That a future source intake will select the best possible pattern.
- That a runbook by itself improves code quality without application.
