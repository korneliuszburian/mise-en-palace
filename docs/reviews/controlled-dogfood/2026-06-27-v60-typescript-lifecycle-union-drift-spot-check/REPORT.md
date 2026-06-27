# V60 TypeScript Lifecycle Union Drift Spot-Check

Status: complete.

Date: 2026-06-27.

## Executive Verdict

The V59 eval/golden candidate should not become an implemented guard yet.

The bounded source sample shows KRN already uses narrow unions, Zod enums, and
some discriminated unions for the highest-risk lifecycle/state surfaces. The
main caution is `EvidenceCommand`: the legacy/base interface still has optional
`provenance` and `doesNotProve`, but the same file already provides
`NormalizedEvidenceCommand` as a discriminated union for behavior-governing
command proof.

Decision:

```txt
keep as standard/eval candidate
do not implement guard now
do not rewrite package source
```

## Source Pattern

Source:

```txt
docs/KRN_SOURCES.md#unions-literals-and-narrowing
```

Mechanism:

```txt
Literal unions and narrowing constrain finite states and make invalid
transitions visible.
```

KRN implication:

```txt
KRN lifecycle, provenance, reviewability, candidate, target-state, and worker
authority models should use narrow unions or discriminated unions when valid
fields differ by state.
```

## Inspected Sample

| File | Surface | Finding | Decision |
|---|---|---|---|
| `packages/core/src/evidenceBundle.ts` | evidence command proof, target evidence state | Behavior-governing `NormalizedEvidenceCommand` is a discriminated union. Legacy/base `EvidenceCommand` remains optional for compatibility and persistence paths. | No rewrite now; watch base interface if it starts governing behavior directly. |
| `packages/core/src/candidateReviewability.ts` | candidate reviewability | Uses literal union and deterministic classifier with reasons. | Good. |
| `packages/core/src/source.ts` | source claim/decision lifecycle and review signals | Uses narrow unions for statuses, decisions, support types, target types, and review signal kinds. | Good. |
| `packages/harness/src/repositories/types.ts` | retrieval/activation statuses | Uses narrow unions for run, candidate, validity, embedding, and activation decision statuses. | Good. |
| `packages/harness/src/activation/types.ts` | activation candidates and exclusions | Uses narrow unions for focus, need, risk, exclusion reason; some candidate fields are optional because multiple subject kinds share one candidate shape. | Acceptable for now; no local evidence that this creates invalid states. |
| `packages/workers/src/jobTypes.ts` | worker job authority | Uses discriminated `MaintenanceJob<TType>` over job type and payload. Authority tables are literal-checked with `satisfies`. | Good. |
| `packages/workers/src/enqueueMaintenanceJob.ts` | worker job record lifecycle | Uses narrow `WorkerJobStatus` and generic `WorkerJobRecord<TType>` keyed by job type. | Good. |
| `packages/schema/src/reflection.ts` | reflection status and candidate outputs | Uses Zod enums for statuses, findings, severity, and candidate output targets. Candidate output arrays remain metadata because proposal payloads vary. | Accept for now; future guard only if metadata starts hiding behavior-governing fields. |
| `packages/schema/src/memoryCandidate.ts` | memory candidate lifecycle | Uses Zod enums and refinements for candidate status, promotion decision, application outcome, feedback direction, and anti-memory evidence requirements. | Good. |
| `packages/core/src/memory.ts` | memory lifecycle | Uses narrow unions for record status, candidate lifecycle, application outcome, feedback direction, and event type. | Good. |
| `packages/core/src/contextAssembly.ts` | context assembly and observation prefix gate | Uses current/historical status unions and a small rejected gate shape. | Good. |

## Decision

Do not implement a deterministic guard now.

Rationale:

- The sampled high-risk domain surfaces already follow the source-backed
  pattern.
- The only caution is already isolated by a normalized discriminated union.
- A new guard today would likely become a broad scanner or snapshot theater.

Keep the V59 candidate in the eval matrix as:

```txt
standard/eval candidate, deferred after spot-check
```

Falsifier for reopening:

```txt
Future source work finds repeated lifecycle optional-object drift where valid
fields differ by state and no parser/discriminated union exists.
```

## Rejected Actions

| Action | Decision | Reason |
|---|---|---|
| Implement CI guard now | reject | No repeated drift found in bounded sample. |
| Rewrite `EvidenceCommand` base interface | reject for now | Normalized discriminated union already governs command proof behavior. |
| Broad TypeScript audit/scanner | reject | Violates current anti-slop direction and no local evidence justifies it. |
| Add more course sources | reject for now | V60 tests local evidence for one source-backed candidate. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| focused `sed` reads of inspected files | completed | The report inspected the named TypeScript source samples. | Exhaustive TypeScript safety. |
| `git diff --check` | passed | Checks whitespace for docs-only changes. | TypeScript behavior or product readiness. |
| `git status --short --branch` | expected docs/plan changes only | Shows local worktree state before commit. | CI success. |

## Next Recommended Task

Promote:

```txt
V61 — Post-Pattern Intake Re-Gate
```

Goal:

Decide whether to continue internal pattern-intake hardening, return to
external operator/owner blockers, or select one bounded source-backed repair
from current evidence.

## What This Proves

- The pattern intake loop can reject implementation when local source evidence
  does not justify it.
- The Total TypeScript source influenced KRN through a falsifiable local check,
  not through broad doctrine.
- The current sampled TypeScript lifecycle surfaces are mostly aligned with the
  repo standard.

## What This Does Not Prove

- Exhaustive TypeScript quality.
- Product readiness.
- V02-01.
- That no future lifecycle drift exists.
- That the eval/golden candidate should never be implemented.
