# V236 Activation Abstention Re-Gate

Status: complete.

Date: 2026-06-28

## Executive Verdict

Recent DB-backed plan abstention is explained by empty activation inputs, not by proven bad ranking/scoring. V231..V235 all persisted `Context: abstained` with `0 inclusions` and `0 exclusions`; DB inspection shows their retrieval runs had `candidate_count=0`. The active project also has no active memory records, anti-memory records, project source claims, active search documents, project kernel metadata, or repo installation metadata.

The next repair should make empty-store and owner-file fallback diagnostics visible in plan/run readback before any activation scoring rewrite.

## Scope

| Run | Task | Context | Retrieval candidates |
| --- | --- | --- | --- |
| `0ece63ad-854d-4ff5-87bb-b474bc37eb2d` | V231 repo-root evidence path readback | abstained, `0/0` | `0` |
| `0bba403e-1b77-43bb-8957-0b640bc6981c` | V233 best-pattern source usefulness closure | abstained, `0/0` | `0` |
| `4b01b223-d6aa-4754-9784-6c28b41562e6` | V234 TypeScript best-pattern application | abstained, `0/0` | `0` |
| `bc0312c6-94e4-4214-88b6-c6b34caea2dc` | V235 sibling package path normalization | abstained, `0/0` | `0` |

V236 itself was planned with DB persistence and assembled one static owner-file recall candidate:

```txt
executionRun: 6ea3fded-3e8c-4c5e-a95a-36039d28c6b8
included: packages/harness/src/activation/activationEngine.ts
```

## Evidence

`krn run show` for V231..V235 proves persisted readback exposes the symptom:

```txt
Context:
- status: abstained
- inclusions: 0
- exclusions: 0
```

DB inspection proves the narrower cause:

```txt
task_contracts.project_id: ae9962f9-0b20-4a43-97fe-d715062c4478
retrieval_runs.status: abstained
retrieval_candidates: 0 for each inspected run
```

Project activation store counts:

```txt
memory_active: 0
anti_memory: 0
source_claims_via_artifact: 0
search_documents: 0
repo_installations: 0
project_kernels: 0
```

## Source-To-Decision

```yaml
source_id: v236-db-readback
title: V236 current-shell activation abstention DB inspection
trust_tier: high
source_class: repo-local evidence
mechanism: The compiler can only activate memory/source/search/owner-file candidates supplied by project stores or target read models; V231..V235 had zero persisted retrieval candidates and the active project has no stored activation inputs.
krn_implication: Treat repeated abstention as an activation-input/readback diagnostic gap, not as evidence for a scoring rewrite.
decision_kind: adopt
decision: Add a bounded follow-up to expose activation input diagnostics in plan/run readback before changing activation ranking.
does_not_prove: This does not prove activation scoring is correct, that future seeded stores will select good context, or that product readiness is achieved.
consumer: V237 activation abstention diagnostics repair
falsifier: A future DB-backed run with non-empty memory/source/search/owner-file candidates still abstains without readable exclusion/score diagnostics.
```

## Pattern Gate

This slice touches harness/activation and operator UX/readback. The applied pattern is evidence-first diagnosis: inspect input availability and retrieval traces before changing ranking behavior. This rejects a broad scoring rewrite because the current failure has zero candidates, not low-scoring candidates.

Best-pattern intake remains active for every non-trivial slice through `source-to-decision` and `docs/runbooks/pattern-intake.md`; no course/paper archive is needed here.

## Findings

### F1: The active project has no persisted activation material

The project has zero active memory, source claims via project artifacts, search documents, anti-memory, repo installations, and project kernels. In that state, normal memory/source/search activation cannot select anything.

Decision: do not change ranking/scoring from this evidence.

### F2: Static owner-file recall works only when task wording matches enough known catalog terms

V236 selected `packages/harness/src/activation/activationEngine.ts` because the task explicitly named activation/retrieval. V231..V235 had real owner files, but their task wording did not cross the current static catalog match threshold or lacked a project read model.

Decision: next repair should expose why owner-file fallback produced zero candidates, not silently summarize the outcome as generic abstention.

### F3: Current readback hides the actionable cause

`krn run show` says `Context: abstained`, but does not show candidate source counts, empty-store cause, target read-model availability, or owner-file fallback result.

Decision: V237 should improve activation abstention diagnostics in plan/run readback.

## What Not To Do Next

- Do not rewrite activation scoring.
- Do not build a source crawler.
- Do not create Research Foundry.
- Do not add broad memory/source seeding.
- Do not claim product readiness.
- Do not treat static owner-file catalog as a complete repo index.

## Next Task

Open V237:

```txt
V237 Activation Abstention Diagnostics And Empty-Store Readback
```

Goal: make `krn plan` and/or `krn run show` explain activation input counts and owner-file fallback availability when context abstains, so the next repair can distinguish empty store, missing target read model, low-score candidates, low-trust candidates, and budget exclusions.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git fetch --prune` | passed | Remote refs were refreshed. | Does not prove CI state. |
| `git status --short --branch` | passed, clean at preflight | Worktree was clean before edits. | Does not prove later edits are committed. |
| `pnpm db:ready` | passed | Local DB reachable, migrations applied, pgvector available. | Does not prove DB contents are useful. |
| `krn run show --run-id <V231..V235>` | passed | Persisted readback shows abstained context and evidence records. | Does not show retrieval candidate counts. |
| DB SQL against `task_contracts`, `retrieval_runs`, `retrieval_candidates` | passed | V231..V235 had project scope and zero retrieval candidates. | Does not prove why every possible future query would have zero candidates. |
| DB SQL against memory/source/search/project metadata tables | passed | Active project store has no activation material or target read model metadata. | Does not prove source/memory seeding strategy. |
| `krn plan --persist` for V236 | passed | Static owner-file recall can select activation owner file when task terms match. | Does not prove general owner-file recall quality. |
