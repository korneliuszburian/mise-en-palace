# Evidence Dirty Context Golden Behavior Dogfood Report

Status: KRN-on-KRN regression hardening slice.

Date: 2026-06-25

Evaluator: Codex using KRN plan/reporting discipline

DB available in current shell: not used. This slice did not require DB persistence.

## Executive Verdict

This slice locked the previous evidence dirty-context source repair behind a bounded GoldenTask behavior proof. KRN plan output again abstained from selecting context, so activation usefulness remains weak. The governed workflow was useful: it kept the work to one fixture, one schema fixture parser assertion, and one CLI behavior proof that executes real `runCli` before passing cases through the existing harness `runGoldenTaskFixtures`.

Brain usefulness verdict: positive for workflow/regression discipline, weak for activation.

## Scope

Objective: add one bounded regression/golden behavior proof for `krn evidence capture` dirty-context reporting.

Changed files:
- `tests/fixtures/golden-tasks/evidence-capture-behavior.json`
- `packages/schema/src/goldenTask.test.ts`
- `packages/cli/src/evidenceCaptureGoldenBehavior.test.ts`

Non-goals preserved:
- no activation scoring change;
- no memory scoring change;
- no reflection extraction change;
- no dashboard, worker runtime, `krn audit`, DB schema/migration, or broad eval platform.

## KRN Plan Output Summary

Command:

```sh
pnpm --filter @krn/cli krn plan --task "Add golden behavior coverage for evidence dirty-context capture without changing activation, memory, reflection, DB schema, or eval platform surfaces"
```

Result:
- persistence: disabled, no-store preview;
- selected context: none;
- selected memory: none;
- selected source claims: none;
- context status: abstained;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Usefulness: neutral for context, useful as a narrow execution contract.

## Repair Diff Summary

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| Golden fixture | Added `evidence-capture-behavior.json` with two protected cases. | Reuses existing GoldenTask fixture format. | No new eval platform. |
| Schema proof | Added deterministic fixture parse assertion. | Keeps JSON fixture typed/validated at schema boundary. | No new schema domain enum. |
| CLI proof | Added real `runCli` execution before `runGoldenTaskFixtures`. | Prevents fixture-only theater; proof comes from behavior. | No harness-to-CLI dependency cycle. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/schema test -- goldenTask` | passed | GoldenTask fixture parses deterministically through schema. | Does not prove CLI behavior. |
| `pnpm --filter @krn/cli test -- evidenceCaptureGoldenBehavior runCli parseEvidenceArgs` | passed | CLI golden behavior proof and related CLI tests pass. | Does not prove DB persistence. |
| `pnpm typecheck` | passed | Workspace TypeScript compile succeeds. | Does not prove product readiness. |
| `pnpm test` | passed | Full workspace test suite passes. | Does not prove activation or reflection quality. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove runtime behavior. |
| `krn evidence capture ... --intended-file ...` | passed | Current worktree slice was classified as intended-only with operator-reported command proof. | Does not persist DB evidence. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- The brain workflow helped by converting a report candidate into a bounded regression slice. Activation did not help because it selected no context.

What this run proves:
- Dirty-context evidence capture now has GoldenTask fixture coverage.
- The proof executes real CLI behavior before generating GoldenTask pass results.
- Default weak command rows and operator-reported proof remain distinguished.

What this run does not prove:
- It does not prove product readiness.
- It does not prove activation scoring quality.
- It does not prove DB replay.
- It does not prove broad eval platform readiness.

DB used in current shell:
- no

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KRN plan output | other | Required planning step. | yes | neutral | none | Plan output abstained. | keep |
| Previous dirty-context report | source | Directly recommended this slice. | yes | helped | none | `docs/reviews/controlled-dogfood/2026-06-25-evidence-dirty-context/REPORT.md` | keep |
| Existing GoldenTask fixtures/tests | raw recall | Needed to reuse existing behavior proof shape. | yes | helped | none | `tests/fixtures/golden-tasks/*`, schema/CLI tests | keep |
| Activation-selected memory/source | memory/source | KRN plan selected none. | no | unknown | missing | Plan output context included 0. | gather more runs before scoring repair |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| GoldenTask fixture strategy | SourceClaim or memory | It determined where the proof belonged. | Found by repo search, not activation. | source quality |
| Prior dirty-context candidate | MemoryCandidate | It directly named this slice. | Previous report candidate. | memory guidance |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Previous EvalCandidate: dirty-context golden fixture | no | yes | helped | prior report ledger | ready | keep as completed |
| New candidate: use CLI-owned golden tests for CLI behavior | no | yes | helped | this report + test diff | needs more evidence | defer |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Previous dirty-context report | yes | yes | no | no | Candidate table recommended this exact slice. | keep |
| Existing GoldenTask schema/runner files | yes | yes | no | no | Reused instead of creating a new eval platform. | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Schema fixture test | strong | Fixture shape remains valid. | Does not prove behavior alone. | reduced |
| CLI golden behavior test | strong | Real CLI behavior satisfies protected cases. | Does not prove DB persistence. | reduced |
| Full test suite | strong | Existing workspace tests pass with the new fixture/proof. | Does not prove product readiness. | reduced |
| Evidence capture preview | strong | Current slice is intended-only with command provenance. | Does not persist DB evidence. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation | not run | correctly empty | No persisted DB run needed for this regression slice. | no action |
| Reflection | not run | correctly empty | No candidate promotion or Memory Core mutation. | no action |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Add CLI-owned golden proof for CLI behavior when harness cannot depend on CLI. | MemoryCandidate | This report and `evidenceCaptureGoldenBehavior.test.ts`. | needs more evidence | defer | Revisit after one more CLI behavior golden slice. |
| Add DB replay proof for evidence capture metadata when DB is available. | EvalCandidate | Previous report DB caveat remains. | needs more evidence | defer | Requires live DB. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Slice touched only fixture/schema test/CLI golden test. |
| Review burden | lower | Behavior is now protected by one focused golden proof. |
| Resume quality | better | This report records proof and non-proofs. |
| Decision grounding | better | Reused existing GoldenTask runner instead of creating a new eval surface. |
| Memory usefulness | unknown | No memory was selected. |
| Operator friction | same | No operator-facing behavior changed. |

Brain ROI verdict:
- positive

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| `git fetch --prune` | passed | strong | Remote refs refreshed. | Does not prove CI. |
| `git status --short --branch` | clean before edits | strong | Started from clean worktree. | Does not prove final push. |
| `git log --oneline --decorate --left-right origin/main...main` | no entries | strong | Local and remote were aligned before edits. | Does not prove future state. |
| `pnpm --filter @krn/schema test -- goldenTask` | passed | strong | Fixture parses through schema. | Does not prove CLI output. |
| `pnpm --filter @krn/cli test -- evidenceCaptureGoldenBehavior runCli parseEvidenceArgs` | passed | strong | CLI behavior proof passed. | Does not prove DB. |
| `pnpm typecheck` | passed | strong | TS compile passes. | Does not prove runtime DB. |
| `pnpm test` | passed | strong | Full suite passes. | Does not prove product value. |
| `git diff --check` | passed | strong | Diff whitespace clean. | Does not prove logic. |
| `krn evidence capture ... --intended-file ...` | passed | strong | Slice evidence captured in printed preview. | Does not persist evidence. |

### Next Slice Candidates

| Candidate slice | Why | Evidence | Non-goals | Verification |
| --- | --- | --- | --- | --- |
| Candidate reviewability output | Brain usefulness reports keep pointing at candidate reviewability as next product bottleneck. | Two dogfood reports. | No memory promotion automation. | CLI/harness tests, typecheck, full test. |
| DB replay proof for evidence capture metadata | DB caveat remains from dirty-context repair. | DB unavailable in prior run. | No schema migration unless proof fails. | `pnpm db:ready`, persisted evidence capture smoke. |
