# V247 Skill Owner-File Seed Repair

Status: complete.

Date: 2026-06-28

## Executive Verdict

V247 repaired the skill-directed owner-file recall gap found by V246.
Repo-local skills are now part of the target read model, and skill-directed
planning can surface the concrete skill document and skill invariant test
without activation scoring changes.

This is the same class of repair as V245: improve read-model input quality
before touching ranking/scoring.

## Source-To-Decision

```yaml
source_id: v246-skill-owner-file-recall-gap
title: Skill-directed task missed skill owner files
trust_tier: high
source_class: repo-local evidence
mechanism: activation can surface exact files when the target read model names them; V246 needed a skill document and skill invariant owner, but those paths were absent from source seeds.
krn_implication: repo-local skills should be seeded as execution workflow organs in the target read model.
decision_kind: adopt
decision: add skill root, evidence-review-loop skill doc, and skill invariant test source seeds.
consumer: runInitCommand source seed detection, ownerFileRecall target candidates, DB-backed plan readback.
falsifier: a skill-directed task still cannot surface .agents/skills/evidence-review-loop/SKILL.md and packages/harness/src/skillInvariants.test.ts from the read model.
does_not_prove: activation scoring is solved or all skills should always fit context.
```

## Changed

```txt
packages/cli/src/runInitCommand.ts
packages/cli/src/runInitCommand.test.ts
packages/harness/src/activation/ownerFileRecall.test.ts
```

Added source seed kinds/candidates:

```txt
.agents/skills | skill_root
.agents/skills/evidence-review-loop/SKILL.md | skill_doc
packages/harness/src/skillInvariants.test.ts | skill_invariant_test
```

No activation scoring, ranking, broad retrieval rewrite, skill content rewrite,
DB schema change, crawler, or broad eval platform was added.

## DB-Backed Proof

Root project refresh after repair:

```txt
command: krn init --connect --repo /home/krn/coding/krn/active/mise-en-palace --persist
Project ID: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b (reused)
ProjectKernel ID: f7001365-cb86-4450-ba6e-02a443fbad42
sourceSeeds: 14
```

Persisted V247 proof plan:

```txt
executionRun: 225f5add-6636-4caf-af61-424ad1c3829d
taskContract: 8ac6e0f2-6f67-456b-a897-a656dbdc60e6
contextAssembly: e249fb73-c9c2-4ed0-9209-f602e4260a44
ProjectKernel: f7001365-cb86-4450-ba6e-02a443fbad42
sourceSeeds: 14
```

Relevant selected context after repair:

```txt
Target source seed: .agents/skills/evidence-review-loop/SKILL.md
Target source seed: packages/harness/src/skillInvariants.test.ts
Target source seed: .agents/skills
```

This proves the skill-directed read model can surface the exact owner files for
the V246 class of work. It does not prove every skill should always be selected.

Persisted V247 evidence loop:

```txt
evidenceBundle: f2ca542a-7406-461a-93e2-f473243758c9
reviewAssessment: 46d9d92a-a228-4e04-8bed-9be6cd208c8a
feedbackDelta: 40531532-f526-4ff7-ba4c-717392e25661
observationGroup: 04df6f28-e133-4f68-b560-a82a21da0cd0
observationItems: 5
reflectionRecord: 0d72acc3-644d-41dc-ad7e-5695fa40acc2
reflection observations selected: 5
MemoryRecord created: no
```

Observe completed before reflect, so the reflection output is not
sequencing-weak.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runInitCommand runCli` | passed | CLI seed detection includes repo-local skill seeds without breaking existing CLI tests. | Does not prove every target repo has skills. |
| `pnpm --filter @krn/harness test -- ownerFileRecall` | passed | Owner-file recall can surface skill docs and skill invariant tests as target source seeds. | Does not prove ranking quality globally. |
| `pnpm run typecheck` | passed | New seed kinds preserve TypeScript boundaries. | Does not prove runtime DB readback. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove remote CI until push. |
| `pnpm db:ready` | passed | Local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote DB state. |
| `krn init --connect --repo <absolute-root> --persist` | passed | Root project read model can be refreshed with skill owner-file seeds. | Does not prove every operator will pass the root path correctly. |
| `krn plan --persist` | passed | Refreshed read model surfaces skill owner-file seeds in context. | Does not prove all activation gaps are solved. |
| `krn evidence capture --persist` | passed | V247 evidence metadata, intended files, and command provenance were persisted. | Does not prove memory quality or product readiness. |
| `krn observe --persist` | passed | Five observations were persisted before reflection. | Does not prove observations are useful. |
| `krn reflect --persist` after observe | passed | Reflection selected five observations after observe completed. | Does not prove reflection extraction quality. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## What This Proves

- Repo-local skills are now represented in the KRN target read model.
- Skill-directed tasks can surface the relevant skill doc and skill invariant
  owner file.
- The repair did not require activation scoring changes.

## What This Does Not Prove

- Product readiness.
- General activation quality.
- That all skills should always be loaded.
- That broad source crawling is useful.

## Condensation Decision

```txt
finding: skill-directed work needed exact skill owner files.
frequency: observed in V246.
candidate_surface: bounded read-model repair.
decision: accept.
rationale: skill docs are durable execution organs and should be explicit read-model candidates.
evidence: runInitCommand test, ownerFileRecall test, DB-backed plan proof after project refresh.
does_not_prove: activation scoring is solved.
falsifier: future skill-directed plan cannot surface skill doc/invariant seeds from the read model.
next_task_id: V248-00.
```

## Next Recommended Action

```txt
V248-00 Activation Surface Re-Gate After Seed Repairs
```

Reason: V245 and V247 repaired two repeated read-model seed gaps. The next step
should re-gate activation evidence before adding more seeds or changing scoring.
