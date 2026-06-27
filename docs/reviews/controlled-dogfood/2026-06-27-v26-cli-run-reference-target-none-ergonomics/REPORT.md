# V26 CLI Run Reference And Empty Target Changed Files Ergonomics

Status: completed bounded CLI repair.

Date: 2026-06-27
Evaluator: Codex
KRN repo: `/home/krn/coding/krn/active/mise-en-palace`
Mode: KRN CLI source repair
DB available: yes

## Executive Verdict

V26 repaired the small CLI friction found during V24/V25 dogfood without
changing evidence semantics, target policy, DB schema, or activation behavior.

Changes:

- `krn evidence capture` now accepts `--run <id>` as an alias for `--run-id <id>`;
- `krn observe` now accepts `--run-id <id>` as an alias for `--run <id>`;
- `krn evidence capture --target-changed-file none` explicitly records that
  the operator intended an empty target changed-file list while preserving the
  existing target evidence representation: no `changedFiles` array is emitted.

This reduces operator burden in repeated dogfood loops. It is not a product
readiness proof, target policy change, or DB migration.

## Source Inspection

Owning files:

- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/parseObserveArgs.ts`
- `packages/cli/src/parseArgs.ts`
- related parser / CLI help tests

Finding:

```txt
run show already accepts --run-id and --run.
evidence capture accepted only --run-id.
observe accepted only --run.
target evidence readback renders changedFiles none, but parser rejected
--target-changed-file none.
```

Decision:

```txt
Add only aliases observed in dogfood and one explicit empty target changed-file spelling.
```

Rejected:

- no broad CLI alias policy;
- no evidence shape change;
- no DB schema migration;
- no target policy change.

## Implementation

Changed:

- `packages/cli/src/parseEvidenceArgs.ts`
- `packages/cli/src/parseObserveArgs.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/parseEvidenceArgs.test.ts`
- `packages/cli/src/parseObserveArgs.test.ts`
- `packages/cli/src/runCli.test.ts`

Behavior:

```txt
krn evidence capture --run <id>
  accepted as runId alias.

krn observe --run-id <id>
  accepted as runId alias.

krn evidence capture --target-repo <repo> --target-changed-file none
  accepted and leaves targetEvidence.changedFiles absent.

krn evidence capture --target-changed-file none
  still requires --target-repo because it is target evidence.
```

## KRN Plan Evidence

Execution run:

```txt
c7dc3ae8-d0be-4d04-909e-4db88e1b0886
```

KRN selected one useful context item:

```txt
Owner-file recall: packages/cli/src/runEvidenceCaptureCommand.ts
```

Activation verdict: partially useful.

It selected the evidence capture owner surface, but source inspection still had
to find the observe parser and help tests.

Persisted evidence:

```txt
evidenceBundle: 37693b7f-253f-4d44-82a2-e1a7a5a3ef72
reviewAssessment: e49e85cb-6ab0-47d3-8079-32d35eed15ba
feedbackDelta: 72a0583c-cf38-42dc-80c5-4f57a1d3f089
changed files: all intended, no unrelated, no unknown
command provenance: 4 operator_reported / passed
```

Observe/reflect:

```txt
observationGroup: 0505836e-13c8-463f-b85a-59aa35fdd02b
observationItems: 5
reflectionRecord: b7ea3a70-0295-436d-813c-4946340225a0
observations selected: 5
candidate rows written: no
memory mutation: none
```

Dogfood note:

```txt
evidence capture used the new --run alias.
observe used the new --run-id alias.
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- parseEvidenceArgs parseObserveArgs runCli` | passed | Parser/help behavior covers the new aliases and target `none` spelling. | Does not prove every CLI command has consistent aliases. |
| `pnpm typecheck` | passed | TypeScript strict compile succeeds across packages. | Does not prove runtime target correctness. |
| `pnpm test` | passed | Full package test suite passes locally. | Does not prove product readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior completeness. |

## What This Proves

- V24/V25 operator friction has a focused CLI repair.
- The repair is covered by parser and CLI help tests.
- Evidence semantics for empty target changed files remain unchanged.

## What This Does Not Prove

- V02-01 second-operator usability.
- Product readiness.
- Widened internal alpha.
- That all CLI commands have ideal naming.
- That target evidence semantics should change.

## Next Recommended Action

Promote one re-gate:

```txt
V27 — Controlled Internal Alpha Re-Gate After Target Loop Repairs
```

Why:

V20 through V26 completed a real target loop, evidence/readback repairs,
DB/operator-friction repairs, owner-file priority repair, and CLI ergonomics.
The next step should be a compact re-gate deciding whether to:

- return to V02-01 real operator intake;
- run another target trial;
- repair another bounded source gap;
- pause implementation and gather external operator inputs.
