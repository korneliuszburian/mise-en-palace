# Target-Aware Evidence Guard And Replay Scenario

Status: complete guard/replay report.

Date: 2026-06-27.

Task: V05-03.

## Executive Verdict

Target-aware evidence capture is now protected by the existing golden behavior
fixture lane. The guard executes real CLI evidence capture and fails if target
repo mode, dirty state, ownership, target changed files, target command proof,
or target `doesNotProve` boundaries disappear from output.

This closes the immediate regression gap after V05-02. It does not prove
product readiness, V02-01 second-operator usability, target repo correctness,
or live DB persisted replay.

## Guard Added

Extended:

- `tests/fixtures/golden-tasks/evidence-capture-behavior.json`
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`
- `packages/schema/src/goldenTask.test.ts`

New golden case:

```txt
golden-case-evidence-target-001-c
```

Protected failure mode:

```txt
target dirty state disappears from evidence capture output
```

The guard runs `krn evidence capture` through `runCli` with:

```txt
--target-repo ../wilq-seo
--target-mode observation-only
--target-dirty-before dirty
--target-dirty-after dirty
--target-owned-changes external
--target-changed-file "M apps/dashboard/src/App.tsx"
--target-command "wilq-seo scripts/test.sh"
--verification "wilq-seo scripts/test.sh=failed"
```

Expected output includes:

- clean KRN changed files;
- operator-reported target command proof;
- target evidence section;
- target repo;
- target mode;
- dirty before/after;
- ownership;
- target changed file;
- target does-not-prove boundaries.

## Why This Is Not Fixture Theater

The fixture maps directly to the repeated V04 target evidence gap:

- WILQ SEO headless target trial found that KRN evidence capture persisted
  command evidence but did not see target changed files because it ran in the
  KRN repo.
- WILQ SEO observation-only scenario repeated that target dirty state remained
  report prose unless recorded manually.
- V05-02 implemented target evidence as explicit operator-supplied capture
  metadata.

The guard now protects that exact behavior through real CLI execution.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk proxy pnpm --filter @krn/cli test -- evidenceCaptureGoldenBehavior` | passed | Golden behavior guard executes three evidence capture cases, including target evidence. | Does not prove live DB persistence. |
| `rtk proxy pnpm eval:brain-battle:smoke` | passed | Existing deterministic brain-battle smoke remains green after target evidence guard. | Does not prove product readiness. |
| `rtk proxy pnpm typecheck` | passed | Workspace TypeScript compiles. | Does not prove target correctness. |
| `rtk proxy pnpm test` | passed | Full workspace tests pass after fixture expectation update. | Does not prove V02-01 usability. |
| `rtk proxy git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic completeness beyond the checked behavior. |

## What This Proves

- Target evidence capture behavior is guarded by deterministic CLI execution.
- The golden fixture schema accepts the new target evidence case.
- Existing evidence dirty-context golden cases still pass.
- Existing brain-battle smoke still passes.

## What This Does Not Prove

- Live DB persisted replay of target evidence.
- Real second-operator usability.
- Target repo safety or correctness.
- Product readiness.
- Automatic target git execution.

## Condensation Decision

```txt
finding:
  Target evidence representation now has deterministic CLI guard coverage.

frequency:
  high-risk gap from V04, now guarded after V05-02.

candidate_surface:
  V05 re-gate.

decision:
  accept V05-04.

rationale:
  V05 has report, source repair, tests, preview proof, golden guard, and CI-ready
  verification. It needs a stream-level decision before opening the next product
  stream.

evidence:
  V05-01 report, V05-02 source repair report, V05-03 golden guard, verification
  commands.

does_not_prove:
  DB-backed replay, product readiness, V02-01, target correctness.

falsifier:
  CI fails this guard or V05-04 finds target evidence still cannot support a
  controlled target trial.

next_task_id:
  V05-04.
```
