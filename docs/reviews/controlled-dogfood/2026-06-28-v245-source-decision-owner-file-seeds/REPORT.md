# V245 Source-Decision Owner-File Seed Repair

Status: complete.

Date: 2026-06-28

## Executive Verdict

V245 repaired the read-model input gap selected by V244. Source-to-decision and
pattern-intake work can now surface concrete owner seeds for the source map,
pattern-intake runbook, TypeScript standard, and source-map invariant tests
without changing activation scoring.

This is a read-model/source-seed repair, not a retrieval rewrite.

## Source-To-Decision

```yaml
source_id: v244-repeated-source-owner-recall-gap
title: Repeated Source-To-Decision Owner-File Recall Gap
trust_tier: high
source_class: repo-local evidence
mechanism: activation can surface exact files when the target read model names them; repeated V241/V243/V244 source-to-decision work missed concrete source-map, runbook, standard, and invariant owner files because the read model only exposed broad roots.
krn_implication: improve source seed detection and target read-model candidates before changing scoring.
decision_kind: adopt
decision: add exact source-decision seed candidates and tests.
consumer: runInitCommand source seed detection, ownerFileRecall target candidates, DB-backed plan readback.
falsifier: a source-to-decision task still cannot surface docs/KRN_SOURCES.md, docs/runbooks/pattern-intake.md, relevant standards, or source-map invariant owner files from the read model.
does_not_prove: activation scoring is solved, broad search is needed, or every docs file deserves priority.
```

## Change Summary

Changed:

```txt
packages/cli/src/runInitCommand.ts
packages/cli/src/runInitCommand.test.ts
packages/harness/src/activation/ownerFileRecall.test.ts
```

Added exact source seed kinds and candidates:

```txt
docs/KRN_SOURCES.md | source_map
docs/runbooks/pattern-intake.md | runbook
docs/standards/typescript-excellence.md | standard_doc
packages/harness/src/sourceMapInvariants.test.ts | invariant_test
```

No activation scoring, ranking, DB schema, crawler, or broad TypeScript cleanup
was added.

## DB-Backed Proof

Initial V245 plan before repair:

```txt
executionRun: 8b1b4f8b-b480-4760-906a-235bbc8c6d1b
ProjectKernel: 05cfb8c8-8f25-4561-a0dd-182ca7435bb3 was not yet created.
Context included broad docs seed, but not exact source-decision owner files.
```

Root project was refreshed after the source seed detection repair:

```txt
command: krn init --connect --repo /home/krn/coding/krn/active/mise-en-palace --persist
Project ID: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b (reused)
ProjectKernel ID: 05cfb8c8-8f25-4561-a0dd-182ca7435bb3 (created)
sourceSeeds: 11
```

The proof plan after refresh:

```txt
executionRun: 05c08590-f424-4d06-b9d1-6d7e6567f12a
taskContract: e6e4290e-2588-44c4-8d79-a93bb4504757
ProjectKernel: 05cfb8c8-8f25-4561-a0dd-182ca7435bb3
sourceSeeds: 11
ownerFiles: 3
```

Relevant selected context after repair:

```txt
Target source seed: docs/runbooks/pattern-intake.md
Target source seed: packages/harness/src/sourceMapInvariants.test.ts
Target source seed: docs/KRN_SOURCES.md
```

`docs/standards/typescript-excellence.md` was present in the refreshed source
seeds and excluded only by context budget in the proof run. That proves it is in
the read model, not that it will always fit in context.

Evidence, observation, and reflection were then persisted for the proof run:

```txt
evidenceBundle: e1ffb3ab-315e-4d27-b93d-3d8234cd6d9d
reviewAssessment: 307c03f6-cdc8-47db-b9ba-205d66607b8a
feedbackDelta: ddf88865-f53b-4989-8bba-7d2459b13281
observationGroup: db93a7a1-15c6-436c-8eeb-f25ccf17c384
observationItems: 5
reflectionRecord: 4301fc95-e56e-43fd-963c-584c11c88f08
reflection observations selected: 5
MemoryRecord created: no
```

V245 intentionally ran `observe` before `reflect`. This avoided the repeated
V243/V244 sequencing issue where an earlier parallel reflect selected zero
observations before observe completed.

Runtime caveat:

```txt
An accidental `krn init --connect --repo . --persist` through pnpm filter
connected packages/cli as a separate local project before the absolute root path
run. This was a DB-only side effect and did not change files or Memory Core.
Future operator docs should prefer absolute target paths for root repo refresh
when command cwd may be package-scoped.
```

## Type Safety Boundary

Boundary classification:

```txt
boundary: CLI target repo detection / target activation read model
validation/narrowing: existing filesystem existence checks and literal seed kinds
public type changes: local SourceSeedProposal kind union extended
type-safety exceptions: none
```

No `any`, double assertions, unchecked parsing, or type weakening were added.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runInitCommand runCli` | passed | CLI source seed detection and related CLI behavior tests pass. | Does not prove every target repo should use these exact KRN seeds. |
| `pnpm --filter @krn/harness test -- ownerFileRecall` | passed | Owner-file recall can surface exact source-decision source seeds as target candidates. | Does not prove scoring quality globally. |
| `pnpm run typecheck` | passed | New seed kinds preserve strict TypeScript boundaries. | Does not prove product readiness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass locally. | Does not prove remote CI until push. |
| `pnpm db:ready` | passed | Local DB is reachable with 14/14 migrations and pgvector. | Does not prove remote DB state. |
| `krn init --connect --repo <absolute-root> --persist` | passed | Root project read model can be refreshed with exact source-decision seeds. | Does not prove every operator will use absolute paths correctly. |
| `krn plan --persist` | passed | Refreshed read model surfaces exact source-decision source seeds in context. | Does not prove all owner-file recall gaps are solved. |
| `krn evidence capture --persist` | passed | V245 evidence metadata, intended files, and command provenance were persisted. | Does not prove memory quality or product readiness. |
| `krn observe --persist` | passed | Five observations were persisted for the V245 run. | Does not prove reflection findings are useful. |
| `krn reflect --persist` after observe | passed | Reflection selected five observations after observe completed. | Does not prove reflection extraction quality at scale. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## What This Proves

- The KRN repo read model can now retain exact source-decision seeds.
- Source-to-decision tasks can surface source map, pattern-intake, and source
  invariant owner files from DB-backed planning.
- The repair did not require activation scoring changes.

## What This Does Not Prove

- Product readiness.
- General activation quality.
- Every standards doc will always fit context.
- Broad source crawling is useful.

## Condensation Decision

```txt
finding: source-to-decision work needed exact source/read-model seeds.
frequency: repeated across V241, V243, and V244.
candidate_surface: bounded repair.
decision: accept.
rationale: exact read-model inputs are lower-risk than scoring rewrite and directly address the observed missing owner files.
evidence: runInitCommand test, ownerFileRecall test, DB-backed plan proof after root project refresh.
does_not_prove: all activation misses are fixed.
falsifier: future source-to-decision plan cannot surface source map/runbook/standard/invariant owner seeds from the read model.
next_task_id: V246-00.
```

## Next Recommended Action

Open a small sequencing guard task for evidence workflow:

```txt
V246-00 Observe-Reflect Sequencing Guard
```

Reason: V243 and V244 both had a first reflect run in parallel with observe that
selected zero observations. This is a repeated workflow issue and should be
condensed into the evidence/review loop guidance before it becomes normal
operator behavior.
