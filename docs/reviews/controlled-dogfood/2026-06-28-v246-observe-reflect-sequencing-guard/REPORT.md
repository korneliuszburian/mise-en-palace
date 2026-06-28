# V246 Observe-Reflect Sequencing Guard

Status: complete.

Date: 2026-06-28

## Executive Verdict

V246 condensed the repeated observe/reflect ordering caveat into the existing
`evidence-review-loop` skill and a harness skill invariant.

The repair is intentionally small: future persisted same-run evidence loops must
complete `krn observe --persist` before `krn reflect --persist`, and a
zero-observation reflection result is sequencing-weak until observe completion
is verified.

This is workflow guidance plus a durable invariant, not a reflection extraction
rewrite and not an activation scoring change.

## Source-To-Decision

```yaml
source_id: v243-v244-observe-reflect-ordering-caveat
title: Repeated observe/reflect sequencing caveat
trust_tier: high
source_class: repo-local evidence
mechanism: run-scoped reflection selects persisted observations; when reflect starts before observe completes, it can select zero observations and create false reflection-quality noise.
krn_implication: same-run persisted evidence loops need an explicit observe-before-reflect sequencing guard in the evidence/review workflow.
decision_kind: adopt
decision: update evidence-review-loop skill and guard it with skillInvariants.
consumer: .agents/skills/evidence-review-loop/SKILL.md; packages/harness/src/skillInvariants.test.ts
falsifier: future dogfood reports keep treating first zero-observation reflect runs as reflection-quality evidence after observe was started in parallel.
does_not_prove: reflection extraction quality, candidate quality, or product readiness.
```

## Changed

```txt
.agents/skills/evidence-review-loop/SKILL.md
packages/harness/src/skillInvariants.test.ts
```

The skill now requires:

```txt
same-run persisted loops:
  evidence capture
  -> krn observe --persist completes
  -> krn reflect --persist
```

If reflect selects zero observations while observe completion is unverified, the
result must be marked as sequencing-weak and must not be used as reflection
quality evidence.

## DB-Backed Plan

Persisted V246 plan:

```txt
executionRun: b0d81391-94bd-4596-9769-59b085a8077f
taskContract: 6d867db7-a5eb-4696-b395-d8b183202f41
contextAssembly: e3a97694-27d4-4e8a-b4cc-6eb1a7ac52ec
```

Persisted V246 evidence loop:

```txt
evidenceBundle: 12a34561-59b0-4334-a5a6-f30ff8050d09
reviewAssessment: 0da0272e-832e-49f2-a847-489678e499b9
feedbackDelta: d435562b-7480-44d1-bad1-107e5719f1f2
observationGroup: e6b5003b-6f38-4abc-a645-3b9f959d9d1f
observationItems: 5
reflectionRecord: 16df5c27-2e96-4858-ae92-1504945a9125
reflection observations selected: 5
MemoryRecord created: no
```

Observe and reflect were run sequentially for this proof. The reflect result is
not sequencing-weak.

Activation usefulness:

```txt
mixed / weak for owner-file recall
```

The plan selected broad activation/readback owner files and
`packages/harness/src/sourceMapInvariants.test.ts`, but did not select the real
owner files for this task:

```txt
.agents/skills/evidence-review-loop/SKILL.md
packages/harness/src/skillInvariants.test.ts
```

This does not justify scoring changes yet. It does justify the next bounded
read-model repair for skill owner-file seeds.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- skillInvariants` | passed | The evidence-review-loop skill invariant protects command provenance, proof boundaries, and observe-before-reflect sequencing text. | Does not prove all operators will follow the skill. |
| `pnpm run typecheck` | passed | Workspace TypeScript still compiles. | Does not prove runtime behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove remote CI until pushed. |
| `pnpm db:ready` | passed | Local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote DB state. |
| `krn plan --persist` | passed | V246 has a DB-backed run and activation readback. | Does not prove selected context was sufficient. |
| `krn evidence capture --persist` | passed | V246 evidence metadata, intended files, and command provenance were persisted. | Does not prove memory quality or product readiness. |
| `krn observe --persist` | passed | Five observations were persisted before reflection. | Does not prove observations are useful. |
| `krn reflect --persist` after observe | passed | Reflection selected five observations after observe completed. | Does not prove reflection extraction quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## What This Proves

- The repeated V243/V244 observe/reflect ordering caveat is now a durable
  workflow rule, not just a report footnote.
- The rule is guarded by a harness invariant.
- V246 did not change reflection extraction, candidate generation, memory
  mutation, activation scoring, or DB schema.

## What This Does Not Prove

- Reflection quality.
- Candidate quality.
- Product readiness.
- That every future operator will follow the skill without a CLI guard.
- That activation can find skill owner files.

## Condensation Decision

```txt
finding: repeated zero-observation reflect came from observe/reflect sequencing, not reflection quality.
frequency: repeated in V243 and V244.
candidate_surface: skill + invariant.
decision: accept.
rationale: existing evidence-review-loop is the workflow consumer and already compact.
evidence: V243/V244 reports, V246 skill invariant, DB-backed V246 plan.
does_not_prove: a CLI guard is unnecessary forever.
falsifier: future reports repeat the same sequencing miss after V246.
next_task_id: V247-00.
```

## Next Recommended Action

```txt
V247-00 Skill Owner-File Seed Repair
```

Reason: the V246 DB-backed plan missed the exact skill owner files and they were
found through skill routing plus manual inspection. Repair the read model before
changing activation scoring.
