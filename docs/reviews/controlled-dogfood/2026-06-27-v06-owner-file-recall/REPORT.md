# V06 Owner-File Recall Read-Model Report

Status: source repair and controlled scenario report.

Date: 2026-06-27

## Executive Verdict

V06-00 improved target owner-file recall visibility without rewriting activation
scoring. KRN already surfaced exact owner-file candidates when the target read
model provided `ownerFiles`; the repeated gap was the opposite case: target
plans with only root-level `sourceSeeds` exposed owner-file absence as prose, not
typed replayable evidence. This slice adds a deterministic owner-file recall
assessment so planning now reports either `owner_files_available` or
`missing_owner_file_read_model` with reason, explanation, source seed paths,
owner file paths, and proof boundary.

This is improved evidence/read-model utility, not product readiness.

## Scope

Changed source:

- `packages/harness/src/activation/ownerFileRecall.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/cli/src/runPlanCommand.ts`

Changed tests:

- `packages/harness/src/activation/ownerFileRecall.test.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/cli/src/runCli.test.ts`

Non-goals:

- no activation scoring rewrite;
- no owner-file crawler;
- no DB schema change;
- no Memory Core mutation;
- no target repo writes;
- no dashboard, MCP, worker runtime, or broad eval platform.

## Finding

Before this slice, target planning could output:

```txt
Target owner files: unavailable; using root-level source seeds only
```

That was useful to a human, but weak as replayable brain evidence. It did not
carry typed status, reason, source seed paths, owner file paths, or
does-not-prove boundary in retrieval/execution metadata.

After this slice, target planning output includes:

```txt
Target owner-file recall: missing_owner_file_read_model
Target owner-file reason: target_read_model_has_no_owner_files
Target owner-file explanation: Target read model has source seeds but no exact owner-file entries, so KRN can only surface root-level target context.
Target owner-file does not prove: Missing owner-file entries do not prove owner files do not exist; it proves only that the current read model cannot name them.
```

When owner files are available, the typed status becomes:

```txt
owner_files_available
```

with exact owner file paths preserved.

## Controlled Scenario

Scenario A: project-scoped target plan without owner files.

- Input read model has `sourceSeeds` and trust exclusions.
- Input read model has no `ownerFiles`.
- Expected behavior: planning exposes `missing_owner_file_read_model` instead of
  silently pretending root seeds are exact files.

Scenario B: project-scoped target plan with owner files.

- Input read model has `sourceSeeds`.
- Input read model has exact `ownerFiles` below roots.
- Expected behavior: planning exposes `owner_files_available` and activation
  can include exact `targetReadModelKind=owner_file` candidates.

## What Improved

- Owner-file recall now has a typed assessment:
  `owner_files_available | missing_owner_file_read_model`.
- CLI plan output exposes the assessment and proof boundary.
- Execution run metadata preserves the assessment under `targetReadModel`.
- Retrieval run metadata preserves the assessment under `targetReadModel`.
- Tests cover both missing and available owner-file states.

## What This Proves

- KRN can distinguish exact owner-file availability from missing owner-file
  read-model data.
- Target planning can expose a typed abstain-like reason when exact owner files
  are unavailable.
- Existing exact owner-file candidate behavior remains intact when `ownerFiles`
  are present.

## What This Does Not Prove

- It does not prove activation scoring quality.
- It does not prove the target read model can discover owner files by itself.
- It does not prove owner-file paths are complete or correct.
- It does not prove product readiness or V02-01 second-operator usability.
- It does not prove a source crawler is needed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/harness test -- ownerFileRecall compileHarnessPlan` | passed | Owner-file assessment and compiler metadata behavior work in focused harness tests. | Does not prove full repo behavior or DB runtime truth. |
| `pnpm --filter @krn/cli test -- runCli` | passed | CLI plan output and execution-run metadata include typed owner-file recall status. | Does not prove live target repo correctness. |

## Brain Usefulness

Verdict: positive.

KRN's prior evidence narrowed the problem correctly: activation already had
guardrail and root-level target recall, but exact owner-file availability was
not explicit enough. The repair followed that evidence and avoided a scoring
rewrite.

Selected context usefulness:

| Item | Helped? | Notes |
|---|---|---|
| V05 re-gate / V06 plan | helped | Identified owner-file recall below target roots as the active bottleneck. |
| `activation-engine` skill | helped | Constrained the repair to typed inclusions/exclusions/abstention rather than padding context. |
| Existing owner-file recall tests | helped | Showed exact owner-file candidates already worked when read-model data existed. |

Missing context:

- A live DB-backed project run was not required for this minimal repair. The
  behavior is covered through CLI/harness tests, but a later run should confirm
  the metadata appears in live persisted readback.

## Candidate Outputs

MemoryCandidate:

- Summary: Target planning should expose typed owner-file recall assessment so
  missing owner-file read-model data is not confused with weak activation
  scoring.
- Evidence refs: this report; `packages/harness/src/activation/ownerFileRecall.ts`;
  `packages/cli/src/runPlanCommand.ts`.
- Does not prove: owner-file discovery is complete.
- Reviewability: ready.

EvalCandidate:

- Summary: A target plan with source seeds but no owner files should render and
  persist `missing_owner_file_read_model`.
- Evidence refs: `packages/cli/src/runCli.test.ts`;
  `packages/harness/src/compiler/index.test.ts`.
- Does not prove: live DB readback.
- Reviewability: ready.

## Next Recommended Action

Move to V07 memory/source usefulness loop. V06 closed the immediate owner-file
visibility gap. The next higher-ROI product question is whether memory/source
signals created by these runs are later selected, used, and marked helped/stale
with deterministic evidence.
