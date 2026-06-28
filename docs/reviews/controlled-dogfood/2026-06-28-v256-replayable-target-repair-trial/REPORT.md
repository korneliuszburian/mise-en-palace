# V256 Replayable Target Repair Trial

Status: complete.

Date: 2026-06-28.

## Executive Verdict

V256 proved that the normalized weak TypeScript target substrate can be
materialized from a weak baseline and repaired in an isolated `.local-lab`
target without touching KRN package source or a living external repo.

The run also exposed a useful brain gap: `krn init --dry-run` surfaced the
correct target owner files, but `krn plan` without connected target read-model
context selected an unrelated KRN owner file. This means the workflow can
enforce the repair through explicit target contracts today, while activation
still needs better target owner-file routing before it can be trusted as the
main context selector.

## Mode

```txt
mode: headless-repair
target: .local-lab/target-substrates/normalized-weak-typescript-v256
target_dirty_before: not a git repo
target_status_freshness: fresh_current_task
owned_by_current_krn_run: yes
target_patch_lifecycle: local_lab_discardable
allowed_writes: .local-lab/target-substrates/normalized-weak-typescript-v256/src/**, tests/**
forbidden_writes: living target repos, KRN package source, secrets, generated runtime caches outside .local-lab
handoff_artifact: this report
```

## Baseline Replay

Materializer:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs
```

Scenario:

```txt
tests/fixtures/target-repos/normalized-weak-typescript/scenarios/weak-json-boundary/
```

Materialized target:

```txt
.local-lab/target-substrates/normalized-weak-typescript-v256
```

Baseline weaknesses confirmed:

- `parseJsonConfig(raw: string): any`;
- raw `JSON.parse`;
- `CreatedUser | null`;
- only happy-path test coverage.

## KRN Plan Review

`krn init --dry-run` correctly surfaced the target owner files:

- `AGENTS.md`;
- `docs/repair-contract.md`;
- `src/config.ts`;
- `src/userService.ts`;
- `tests/userService.test.ts`.

`krn plan` then selected one unrelated KRN owner file:

```txt
packages/cli/src/runDbReadinessCommand.test.ts
```

Verdict:

```txt
activation usefulness: weak for this target trial
workflow usefulness: positive
```

This does not justify an activation scoring rewrite by itself. It does justify
V257/V258 pattern intake and enforcement trials that keep owner-file evidence
explicit.

## Repair Summary

The `.local-lab` target was repaired with the same best-pattern pressure as the
committed repaired fixture:

| Area | Weak baseline | Repaired state |
|---|---|---|
| JSON boundary | `JSON.parse` returned `any` | `parseJsonConfig` returns `unknown` |
| Role state | trusted string role | `UserRole = "admin" | "member"` |
| User creation result | `CreatedUser | null` | discriminated `CreateUserResult` |
| Invalid input | missing runtime coverage | invalid JSON, missing email, invalid role tests |

No KRN package source was modified.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `node tests/fixtures/target-repos/normalized-weak-typescript/scripts/materialize-scenario.mjs weak-json-boundary .local-lab/target-substrates/normalized-weak-typescript-v256` | passed | weak baseline can be replayed from committed scenario | product readiness |
| `pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-v256 test` before repair | passed | weak baseline compiles and happy-path tests pass | target quality |
| `rg "parseJsonConfig\\(raw: string\\): any|CreatedUser \\| null|JSON\\.parse" .local-lab/...` | found weak markers | replayed baseline contains intended weaknesses | every weakness is represented |
| `pnpm --dir .local-lab/target-substrates/normalized-weak-typescript-v256 test` after repair | passed | repaired target compiles and runtime tests pass | full product correctness |
| `rg "\\bany\\b|as unknown as|@ts-ignore|@ts-expect-error|CreatedUser \\| null|parseJsonConfig\\(raw: string\\): any" .local-lab/.../src .local-lab/.../tests` | no matches | targeted forbidden TypeScript smells are removed from repaired local target | all possible bad patterns are absent |
| `krn evidence capture ... --verification ...` | passed | root evidence capture can record operator-reported target commands | root EvidenceBundle saw target file diffs |

## Evidence Capture Boundary

`krn evidence capture` reported:

```txt
Changed files: none
Target evidence: none
Memory mutation: none
```

This is expected because `.local-lab` target changes are ignored and not root
repo diffs. The report therefore treats target repair evidence as operator
reported command evidence, not as root changed-file classification.

## Pattern Brain Finding

V256 is the first concrete bridge from "pattern gate exists" to "pattern can be
replayed against weak code":

```txt
weak baseline
  -> explicit best-pattern pressure
  -> target repair
  -> verification
  -> evidence boundary
```

The next missing part is to turn the pattern into a durable intake/enforcement
object rather than relying on a human to remember it.

## Source-To-Decision

- Source: V252 normalized substrate, V253 TypeScript repair, V254 replayable
  baseline, target-repo-testing skill, TypeScript type safety skill.
- Mechanism: replayable weak targets allow the same best-pattern pressure to be
  applied repeatedly and checked by command evidence.
- KRN implication: pattern brain work should use replayable target trials as
  falsifiers, not rely on prose standards alone.
- Decision: mark V256 complete and open V257 pattern intake for the
  unknown-first external boundary / discriminated result-state pattern.
- Does not prove: product readiness, second-operator usability, or automatic
  activation quality.
- Consumer: V257 pattern intake, V258 enforcement gate, future target repair
  trials.
- Falsifier: future replay trials cannot reproduce or verify the pattern without
  manual source archaeology.

## What This Proves

- The weak baseline is replayable.
- The weak baseline can be repaired in an isolated target.
- Unknown-first JSON boundary and discriminated result-state repair are
  repeatable on the normalized target.
- Root evidence capture can record target command evidence, but does not
  classify ignored `.local-lab` target diffs.

## What This Does Not Prove

- full pattern brain automation;
- activation owner-file quality;
- product readiness;
- real target transfer;
- second-operator usability;
- UI/search readiness.

## Next Active Task

V257-00 Pattern Intake Trial.

Goal:

```txt
Convert the unknown-first external boundary / discriminated result-state pattern
from V253/V256 into a source-to-decision object with consumer, falsifier, and an
enforcement/eval candidate.
```
