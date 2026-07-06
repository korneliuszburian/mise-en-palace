# Third-Repo Portability Falsifier

Bead: `mise-en-palace-79cm`.

## Outcome

`eval:second-repo-decision-packet` now runs the notes-baseline and
decision-packet gates across two target corpora:

- `weak-json-boundary-typescript`;
- `env-config-contract-typescript`.

The second corpus is the new third-repo portability falsifier. It uses a
different failure mode from weak JSON boundaries: environment/config parsing,
mode narrowing, precedence, secret redaction, invalid port handling, and
process-env test isolation.

## Current Result

```txt
status: pass
repoCount: 2
caseCount: 30
repoSpecificDecisionCount: 20
reusablePatternDecisionCount: 6
rejectedPathCount: 8
staleDecisionCount: 7
selfRepoContaminationCount: 0
```

Per repo:

```txt
weak-json-boundary-typescript:
  caseCount: 15
  repoSpecificDecisionCount: 12
  reusablePatternDecisionCount: 3
  rejectedPathCount: 5
  staleDecisionCount: 5
  notesKrnWinRate: 1
  decisionPacketUsefulRate: 1

env-config-contract-typescript:
  caseCount: 15
  repoSpecificDecisionCount: 8
  reusablePatternDecisionCount: 3
  rejectedPathCount: 3
  staleDecisionCount: 2
  notesKrnWinRate: 1
  decisionPacketUsefulRate: 1
```

## Target Mode

```txt
mode: observation-only fixture target
target_dirty_before: not applicable; static fixture under tests/fixtures
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
handoff_artifact: this report
allowed_writes: KRN fixture/eval files only
forbidden_writes: live external target edits, commits, resets, cleans
```

## Proof Boundary

Proves:

- the deterministic packet/notes comparison runs on two non-KRN target corpora;
- the new env-config corpus has target-specific governing decisions, reusable
  KRN TypeScript patterns, stale boundaries, rejected paths, and zero scanned
  self-repo evidence references;
- the runner reports per-repo metrics and aggregate metrics.

Does not prove:

- live Codex execution or obedience;
- arbitrary repository portability;
- source truth;
- commercial usefulness;
- second-operator readiness;
- that every reusable pattern transfers cleanly.

## Verification

```sh
pnpm --filter @krn/cli test -- secondRepoDecisionPacketEval
pnpm --filter @krn/cli test -- secondRepoDecisionPacketEval deterministicEval
pnpm --filter @krn/cli typecheck:tests:clean
pnpm eval:second-repo-decision-packet
pnpm eval:determinism
pnpm eval:behavior:smoke
pnpm docs:lint
pnpm quality:fallow:ci
pnpm -r --workspace-concurrency=1 --if-present typecheck
git diff --check
```

Second-opinion findings accepted:

- added a negative test that mutates the env-config corpus and proves the
  per-repo target-specific decision gate fails for repo 2;
- extended `eval:determinism` so the target-repo decision-packet check compares
  the two-repo aggregate output, not only the original weak-json fixture.

Focused re-review after those fixes returned `approve` / `LOW` with no findings
or evidence gaps.
