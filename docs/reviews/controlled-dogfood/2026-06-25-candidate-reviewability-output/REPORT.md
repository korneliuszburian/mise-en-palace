# Candidate Reviewability Output Dogfood Report

Status: KRN-on-KRN source repair trial.

Date: 2026-06-25

Evaluator: Codex using KRN plan/reporting discipline

DB available in current shell: not used. This slice did not touch DB persistence shape or require DB runtime truth.

## Executive Verdict

This slice improved the smallest current candidate/proposal output surface: `krn evidence capture` feedback candidates. Candidate proposals now render deterministic `reviewability` and `reviewability reasons`, and persisted feedback metadata preserves that classification for the evidence-capture proposal paths. No candidate promotion, review-gate behavior, activation scoring, memory scoring, or reflection extraction changed.

Brain usefulness verdict: positive for workflow discipline and review-burden reduction; weak for activation because KRN plan again abstained.

## Scope

Objective: make candidate/proposal output easier to review by distinguishing `ready`, `needs_more_evidence`, `too_vague`, `duplicate`, `not_useful`, and `unknown`.

Changed files:
- `packages/cli/src/candidateReviewability.ts`
- `packages/cli/src/candidateReviewability.test.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.test.ts`

Non-goals preserved:
- no MemoryReviewGate or AntiMemoryReviewGate behavior changes;
- no candidate promotion;
- no activation, memory, or reflection scoring changes;
- no dashboard, worker runtime, API/MCP server, broad eval platform, `krn audit`, or anti-slop scanner;
- no DB schema or migration.

## KRN Plan Output Summary

Command:

```sh
pnpm --filter @krn/cli krn plan \
  --task "Improve candidate reviewability output so future dogfood runs can distinguish ready, needs-more-evidence, too-vague, duplicate, not-useful, and unknown candidates without changing promotion behavior"
```

Result:
- persistence: disabled, no-store preview;
- selected context: none;
- selected memory: none;
- selected source claims: none;
- exclusions: none;
- raw recall triggers: none reported;
- context status: abstained;
- expected evidence: `pnpm typecheck`, `pnpm test`, `git diff --check`.

Usefulness: weak for activation, useful as a narrow execution contract. Activation did not identify the candidate reviewability reports or candidate-rendering source files.

## Repair Diff Summary

| Area | Change | Why final-pattern | What was not changed |
| --- | --- | --- | --- |
| Reviewability helper | Added deterministic CLI helper for `ready`, `needs_more_evidence`, `too_vague`, `duplicate`, `not_useful`, and `unknown`. | Keeps classification pure and testable without LLM/model calls. | No persistent candidate lifecycle changes. |
| Evidence candidate output | Added `reviewability` and `reviewability reasons` to memory/source proposal renderers. | Operators can see why a proposal is not review-ready. | No candidate auto-promotion. |
| Feedback metadata | Added reviewability metadata for evidence-capture proposal paths. | Persisted feedback deltas keep reviewability context when DB is used. | No DB schema migration. |
| Tests | Added helper tests for ready/needs_more_evidence/too_vague and CLI tests for proposal-only output. | Covers behavior without relying only on docs. | No broad eval platform. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- candidateReviewability runCli` | passed | Reviewability helper and evidence-capture output tests pass. | Does not prove product readiness. |
| `pnpm typecheck` | passed | Workspace TypeScript compile succeeds with strict optional property boundaries. | Does not prove runtime DB. |
| `pnpm test` | passed | Full workspace test suite passes. | Does not prove activation or reflection quality. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove behavior correctness. |
| `krn evidence capture ... --intended-file ...` | passed | Current slice classified intended-only and rendered candidate reviewability in evidence output. | Does not persist DB evidence. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- The workflow converted repeated dogfood findings into a small source repair. Activation did not help, but reporting and evidence discipline kept the slice narrow and reviewable.

What this run proves:
- Candidate/proposal output can render deterministic reviewability labels and reasons.
- Evidence-capture proposal-only candidates remain proposal-only and do not create MemoryRecord rows.
- `ready`, `needs_more_evidence`, and `too_vague` are covered by tests.

What this run does not prove:
- It does not prove candidate quality at scale.
- It does not prove reflection candidate usefulness.
- It does not prove activation scoring quality.
- It does not prove DB replay in this shell.

DB used in current shell:
- no

### Activated Context Usefulness

| Item | Type | Why selected | Used? | Helped? | Missing/Stale/Noise? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- | --- |
| KRN plan output | other | Required planning step. | yes | neutral | none | Plan output abstained. | keep |
| Brain usefulness reports | source | Named candidate reviewability as a bottleneck. | yes | helped | none | Manual read of reports. | keep |
| Candidate rendering source files | raw recall | Needed to find smallest owner. | yes | helped | none | `rg` and source inspection. | keep |
| Activation-selected memory/source | memory/source | KRN plan selected none. | no | unknown | missing | Plan output selected 0 context. | gather more evidence before scoring repair |

### Missing Context

| Missing item | Expected source | Why it mattered | Evidence | Repair implication |
| --- | --- | --- | --- | --- |
| Candidate reviewability bottleneck | MemoryRecord or SourceClaim | It directly motivated this slice but was not selected. | Brain usefulness and dogfood reports. | memory guidance / source quality |
| Evidence candidate renderer owner | SourceClaim or raw recall | It determined the minimal implementation surface. | Manual source search. | raw recall |

### Memory Usefulness

| Memory/Candidate | Selected? | Used? | Outcome | Evidence provenance | Reviewability | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Prior candidate: candidate reviewability output | no | yes | helped | dogfood report ledger | ready | completed |
| New MemoryCandidate: candidate outputs should classify reviewability before human review | no | yes | helped | this report + source diff + tests | ready | review |

### Source Grounding Usefulness

| Source/Claim | Supported decision? | Prevented overclaim? | Decorative/noise? | Missing conflict? | Evidence | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Brain usefulness report | yes | yes | no | no | Candidate quality was mixed and mostly ledger in some lanes. | keep |
| Dirty-context dogfood reports | yes | yes | no | no | Both reports pointed to candidate reviewability as next bottleneck. | keep |
| Existing evidence-capture renderer | yes | yes | no | no | Provided the smallest output surface. | keep |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | What it does not prove | Review burden impact |
| --- | --- | --- | --- | --- |
| Helper tests | strong | Reviewability classification labels are deterministic. | Does not prove every candidate type. | reduced |
| CLI output tests | strong | Evidence capture prints reviewability and reasons while staying proposal-only. | Does not prove reflection candidate output. | reduced |
| Full test suite | strong | Existing workspace behavior still passes. | Does not prove product value. | reduced |
| Evidence capture preview | strong | Current slice output includes reviewability on a real dirty worktree. | Does not persist DB evidence. | reduced |

### Observation And Reflection Usefulness

| Observation/Reflection | Output | Useful? | Evidence refs | Follow-up |
| --- | --- | --- | --- | --- |
| Observation | not run | correctly empty | No DB run needed. | no action |
| Reflection | not run | correctly empty | This slice did not touch reflection extraction. | candidate reviewability may later be reused there |

### Candidate Quality

| Candidate | Type | Evidence refs | Reviewability | Decision | Follow-up |
| --- | --- | --- | --- | --- | --- |
| Candidate outputs should classify reviewability before human review. | MemoryCandidate | Source diff, helper tests, CLI tests, evidence capture output. | ready | review | Consider promoting after one more non-evidence-capture candidate surface uses it. |
| Do not treat proposal-only or missing-evidence candidates as ready for review. | AntiMemoryCandidate | Evidence output shows proposal remains no-row/no-record. | ready | review | Keep if future runs show overclaim risk. |
| Candidate reviewability output should regress ready vs needs_more_evidence vs too_vague. | EvalCandidate | `candidateReviewability.test.ts`. | ready | review | Could become GoldenTask case if reused outside evidence capture. |

### Brain ROI

| Dimension | Verdict | Evidence |
| --- | --- | --- |
| Context waste | lower | Source changes stayed in one CLI helper and one renderer. |
| Review burden | lower | Candidate output now includes label and reasons. |
| Resume quality | better | This report records proof/non-proof and next candidates. |
| Decision grounding | better | Work followed repeated dogfood findings rather than a new subsystem. |
| Memory usefulness | unknown | No memory was selected. |
| Operator friction | lower | Operators can scan proposal reviewability faster. |

Brain ROI verdict:
- positive

### Command Evidence

| Command | Result | Proof strength | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| `git fetch --prune` | passed | strong | Remote refs refreshed. | Does not prove CI. |
| `git status --short --branch` | clean before edits | strong | Started from clean worktree. | Does not prove final push. |
| `git log --oneline --decorate --left-right origin/main...main` | no entries | strong | Local and remote were aligned before edits. | Does not prove future state. |
| `pnpm --filter @krn/cli test -- candidateReviewability runCli` | passed | strong | Helper and CLI output tests pass. | Does not prove all candidate surfaces. |
| `pnpm typecheck` | passed | strong | TS compile passes. | Does not prove runtime DB. |
| `pnpm test` | passed | strong | Full suite passes. | Does not prove product value. |
| `git diff --check` | passed | strong | Diff whitespace clean. | Does not prove logic. |
| `krn evidence capture ... --intended-file ...` | passed | strong | Slice evidence captured in printed preview. | Does not persist evidence. |

### Next Slice Candidates

| Candidate slice | Why | Evidence | Non-goals | Verification |
| --- | --- | --- | --- | --- |
| Apply reviewability helper to reflection candidate output if source inspection shows the same proposal-only ambiguity. | Reflection remains mostly ledger and candidate reviewability is now reusable. | Brain usefulness report + this helper. | No reflection extraction rewrite. | Harness/CLI reflection tests, typecheck, full test. |
| DB replay proof for evidence capture metadata. | DB caveat remains from prior evidence slices. | Prior DB timeout caveat. | No schema migration unless proof fails. | `pnpm db:ready`, persisted evidence capture smoke. |
