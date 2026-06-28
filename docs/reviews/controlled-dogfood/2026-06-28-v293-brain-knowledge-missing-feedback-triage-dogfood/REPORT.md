# V293 Brain Knowledge Missing Feedback Triage Dogfood

Status: complete.

## Executive Verdict

The missing-feedback filter is useful for triage. It reduces the no-feedback
candidate set from the full catalog to 8 retained pattern cards and makes the
next highest-ROI usefulness target clear:

```txt
pattern:codex-skill-progressive-disclosure-routing
```

This is the best next target because current product pressure is not "add more
patterns"; it is "make Codex actually use the right brain/skill surface while
building KRN." V292 already used `typescript-type-safety` as a progressive
disclosure skill during a real TypeScript boundary repair, but the
skill-routing pattern still has no explicit usefulness feedback.

## Scope

Question:

```txt
Among retained patterns without usefulness feedback, which one should be
exercised next?
```

Inputs:

- `docs/brain-knowledge/catalog.json`;
- `--usefulness-outcome none` readback from V292;
- V292 TypeScript skill usage and report;
- current user pressure around skills connecting the brain to Codex.

No source files were modified for this triage.

## No-Feedback Cards

| Card | Triage | Why |
|---|---|---|
| `pattern:active-context-compact-current-truth` | defer | Already heavily guarded by context-hygiene tests; useful, but less urgent than skill routing. |
| `pattern:brain-knowledge-read-only-ui-boundary` | defer | Important before web/API/MCP, but not the immediate bottleneck. |
| `pattern:codex-skill-progressive-disclosure-routing` | select | Directly answers current product pressure: how brain knowledge becomes Codex behavior through skills. |
| `pattern:evidence-proof-non-proof-boundary` | keep in queue | Core pattern, but already indirectly exercised often. Needs explicit feedback later. |
| `pattern:source-to-decision-retention-gate` | keep in queue | Critical for research/paper/course condensation; next after skill proof if research intake resumes. |
| `pattern:target-repo-write-authority-boundary` | defer | Relevant for external/target repo work, not current brain-knowledge loop. |
| `pattern:untrusted-context-warning-boundary` | defer | Security-critical, but not today's bottleneck. |
| `pattern:ts-boundary-unknown-first-result-state` | keep in queue | Used in V292, but skill-routing is the broader routing mechanism that made the skill application explicit. |

## Selected Next Pattern

```txt
pattern:codex-skill-progressive-disclosure-routing
```

Expected usefulness proof:

```txt
helped:
  A future slice uses a relevant repo-local skill, keeps root prompts compact,
  queries/uses retained brain knowledge where relevant, and avoids loading broad
  unrelated docs.

neutral:
  The skill is loaded but does not materially change file selection, boundary
  discipline, implementation, or evidence.

noise:
  The skill adds ceremony or irrelevant instructions and increases review burden.

stale:
  The skill points to old patterns or conflicts with current root PLAN/PLANS.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git status --short --branch && git log --oneline -n 5` | passed | Worktree was clean after V292 and latest pushed commit was `fc2db1c`. | Does not prove product readiness. |
| `pnpm --silent --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome none --json \| jq '.cards[] \| {id, title, consumers, evidenceRefs, falsifier}'` | passed | Missing-feedback readback exposes the 8 no-feedback retained patterns with triage-relevant fields. | Does not prove semantic ranking or that the selected pattern will help. |

## What This Proves

- `--usefulness-outcome none` is useful enough to drive the next product slice.
- The next highest-ROI no-feedback pattern is skill routing, not another source
  intake or UI/API/MCP surface.
- The pattern brain is moving from retained cards toward usefulness coverage.

## What This Does Not Prove

- That skill routing already works for every Codex task.
- That Codex will always choose the right skill automatically.
- That all no-feedback cards are lower value.
- That UI/API/MCP/dashboard work should start now.
- Product readiness.

## Source-To-Decision

- Source: V292 no-feedback readback and current operator pressure around skills.
- Mechanism: missing-feedback readback should drive the next usefulness proof,
  not sit as another report-only artifact.
- KRN implication: the next pattern-brain improvement should prove that a
  repo-local skill can route Codex behavior without expanding root prompts.
- Decision: open V294 Brain Knowledge Skill Routing Usefulness Feedback.
- Does not prove: automatic skill selection or full Codex/brain integration.
- Consumer: V294 usefulness feedback for
  `pattern:codex-skill-progressive-disclosure-routing`.
- Falsifier: the selected skill-routing pattern cannot be tied to a concrete
  recent or next slice where loading a skill improved boundary discipline,
  reduced rereads, or prevented broad context load.

## Next Recommended Action

Open V294: Brain Knowledge Skill Routing Usefulness Feedback.

Use the V292 TypeScript boundary repair as evidence where appropriate, and add
explicit usefulness feedback for `pattern:codex-skill-progressive-disclosure-routing`
only if the report can show that the skill materially helped. If it did not,
record neutral/noise instead.
