# V253 Normalized Target Repair Trial

Status: target repair complete, product-ready not claimed.

Date: 2026-06-28
Evaluator: Codex
Target: `tests/fixtures/target-repos/normalized-weak-typescript`
Mode: `headless-repair` inside KRN-owned fixture only

## Executive Verdict

V253 repaired the normalized target fixture's weak TypeScript external input
boundary. The repair replaced `any` and nullable failure with an
unknown-first parser boundary and discriminated result state, then added runtime
invalid-input tests.

This is the first controlled proof that KRN can move from best-pattern doctrine
to a target source repair inside a normalized substrate. It does not prove real
target transfer or product readiness.

The repair also exposed the next substrate gap: once the committed fixture is
repaired, the weak baseline is no longer replayable without git history. V254
should add a reset/generator or baseline/expected variant.

## Boundary Classification

```txt
boundary: target fixture external JSON/env input
validation location: src/config.ts and src/userService.ts
public type changes: CreateUserResult, UserRole
type-safety exceptions: none
```

## Changes

| File | Change | Why |
|---|---|---|
| `src/config.ts` | `parseJsonConfig` now returns `unknown`; added `UserRole` and role parser. | External JSON/env values are untrusted until narrowed. |
| `src/userService.ts` | Added `CreateUserResult` union and local input guard. | Callers can distinguish success, invalid JSON, and invalid shape. |
| `src/index.ts` | Exports new result/role types and parser. | Public fixture API matches repaired boundary. |
| `tests/userService.test.ts` | Adds runtime invalid JSON, missing email, and invalid role checks. | Tests prove more than compile-only behavior. |
| `package.json` / `.gitignore` | Test script compiles to temp output and executes runtime test. | `tsc --noEmit` alone did not execute invalid-input behavior. |
| fixture docs | Mark V252 baseline vs V253 repaired state. | Avoid stale claims that current code still contains the weak boundary. |

## Best-Pattern Pressure Used

| Pattern | Applied? | Evidence |
|---|---|---|
| unknown-first external input | yes | `parseJsonConfig(raw): unknown`, `parseCreateUserInput(value: unknown)`. |
| no `any` at boundary | yes | `rg` over target `src`/`tests` found no `any`. |
| finite-state result | yes | `CreateUserResult` discriminates `created` vs `invalid_input`. |
| invalid-input tests | yes | Runtime test covers malformed JSON, missing email, invalid role. |
| proof/non-proof | yes | Evidence capture records command limits and product-readiness non-proof. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --dir tests/fixtures/target-repos/normalized-weak-typescript test` | passed | Target fixture compiles and executes runtime user service tests. | Real target transfer or product readiness. |
| `rg "\bany\b|as unknown as|@ts-ignore|@ts-expect-error|CreatedUser \| null" .../src .../tests` | no matches | The repaired target source/tests do not retain those type-safety smells. | Every possible type weakness is absent. |
| `krn evidence capture ... --intended-file ...` | passed | Intended/unknown/unrelated classification was clean; target command proof was recorded as operator-reported. | DB persistence, memory usefulness, or product readiness. |
| `krn init --dry-run --repo ...` | passed | KRN can still detect source seeds and owner-file proposals for the repaired fixture. | That persisted activation will select perfectly. |

## What This Proves

- KRN-owned target fixture repair can be bounded to target files.
- The weak JSON/`any`/nullable result boundary was repaired.
- Runtime invalid-input tests now exist.
- Evidence capture can describe the target repair without living target writes.

## What This Does Not Prove

- Product readiness.
- Second-operator usability.
- Real target repo transfer.
- Reflection/candidate quality at scale.
- That the normalized substrate remains replayable from a weak baseline.

## Candidate Outputs

```yaml
candidate_output:
  type: EvalCandidate
  reviewability: ready
  decision: review
  content: "Normalized target repair should fail if JSON.parse output reaches domain code without unknown narrowing or if create-user failure is represented as null."
  evidence_refs:
    - tests/fixtures/target-repos/normalized-weak-typescript/src/config.ts
    - tests/fixtures/target-repos/normalized-weak-typescript/src/userService.ts
    - tests/fixtures/target-repos/normalized-weak-typescript/tests/userService.test.ts
  does_not_prove: "This candidate does not prove real target repo transfer."
```

```yaml
candidate_output:
  type: MemoryCandidate
  reviewability: needs_more_evidence
  decision: defer
  content: "Target repair trials should preserve a replayable weak baseline before committing repaired fixture state."
  evidence_refs:
    - docs/reviews/controlled-dogfood/2026-06-28-v253-normalized-target-repair-trial/REPORT.md
  does_not_prove: "One substrate repair does not prove the best reset strategy."
```

## Next Recommended Action

Open V254:

```txt
Make normalized target substrate replayable.
```

The fixture should not rely on git history to recreate weak baseline state. Add
the smallest reset/generator or baseline/expected variant that preserves:

- weak initial state;
- expected repaired state;
- owner-file contract;
- command evidence;
- proof/non-proof boundaries.
