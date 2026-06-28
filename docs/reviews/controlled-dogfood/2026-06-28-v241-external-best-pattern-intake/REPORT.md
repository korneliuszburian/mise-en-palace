# V241 External Best-Pattern Intake Trial

Status: complete.

Date: 2026-06-28

## Executive Verdict

V241 completed one bounded external best-pattern intake without creating a
research archive. The retained source is the official TypeScript Handbook
narrowing page. The consumer is the KRN TypeScript Excellence Standard.

The adopted mechanism is narrow and falsifiable: finite unions that govern
behavior, persistence mapping, review meaning, or operator readback should be
narrowed explicitly and should make unhandled states visible to TypeScript.

## Scope

```txt
mode: DB-backed default-path KRN dogfood
default_plan_path: yes, no explicit --project
allowed_sources: public official docs only
legal_boundary: no paid/proprietary course material copied
consumer: docs/standards/typescript-excellence.md
```

## Source Intake

```yaml
source_id: typescript-narrowing-and-exhaustiveness
title: TypeScript Handbook - Narrowing
url_or_ref: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
trust_tier: high
source_class: official docs
mechanism: TypeScript control-flow narrowing and never exhaustiveness make finite union states explicit at behavior-changing branches.
krn_implication: KRN status, provenance, lifecycle, and readback metadata unions should be narrowed at IO/render boundaries, and behavior-changing branches should fail typecheck when a union member is added but not handled.
decision_kind: adopt
decision: Add durable TypeScript standard guidance for finite-state narrowing and exhaustiveness at public, CLI, persistence, and readback boundaries.
consumer: docs/standards/typescript-excellence.md
falsifier: A future KRN union adds a behavior-relevant member while rendering, persistence mapping, or review logic keeps compiling without handling the new state.
does_not_prove: This does not prove every union needs a switch, broad type rewrites are useful, or official handbook examples alone prove product value.
candidate_output:
  type: none
  reviewability: ready
source_usefulness_feedback:
  status: measured_with_evidence_capture
  outcome: helped
  reason: The source directly shaped the finite-state exhaustiveness standard update.
  evidence_refs:
    - docs/KRN_SOURCES.md#typescript-narrowing-and-exhaustiveness
    - docs/standards/typescript-excellence.md#finite-state-exhaustiveness
  does_not_prove: Helpfulness for this standards update does not prove future code already satisfies the rule.
```

## Consumer Update

Updated:

```txt
docs/KRN_SOURCES.md
docs/standards/typescript-excellence.md
```

`docs/KRN_SOURCES.md` now retains the official TypeScript source with:

```txt
source -> mechanism -> KRN implication -> decision -> consumer -> falsifier -> does_not_prove
```

`docs/standards/typescript-excellence.md` now includes a finite-state
exhaustiveness section focused on KRN behavior-governing fields:

```txt
status
lifecycle
provenance
authority
candidate/reviewability labels
project/source/memory/evidence/activation readback kinds
metadata promoted into public/operator-facing resources
```

## Default-Path KRN Proof

V241 used default `krn plan --persist`, no explicit `--project`.

```txt
executionRun: 24a73c6b-6d3f-4a5e-9b6f-12f52e61bc6a
projectResolution: connected_repo_path
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
context: assembled
inputStatus: candidates_available
ownerFileCount: 5
evidenceBundle: 92450796-5e2a-4ae0-8b01-30e01c33c694
reviewAssessment: 95faf049-ef34-496d-aa37-5a5f9ed18979
feedbackDelta: 327ca559-57e1-4ac5-843b-13b0a8140228
observationGroup: 47896743-b02e-4624-bba3-d92f5d34eb33
reflectionRecord: 72c57a4b-2bd4-424d-ab5b-c543aeb97bc9
MemoryRecord created: no
```

Selected context helped partially:

| Item | Used? | Helped? | Notes |
|---|---:|---:|---|
| `tsconfig.base.json` source seed | yes | yes | Confirmed strict TypeScript baseline is relevant to this source decision. |
| `packages/cli/src/runPlanCommand.ts` | no | neutral | Selected from current owner-file read model but not needed for doc consumer. |
| `packages/cli/src/runRunShowCommand.ts` | no | neutral | Related to V240, not needed for this intake. |
| `packages/harness/src/activation/activationEngine.ts` | no | neutral | Not needed for this intake. |

Missing context:

```txt
docs/KRN_SOURCES.md and docs/standards/typescript-excellence.md were not owner-file selected and were found by source inspection. This suggests future best-pattern intake may need owner-file seeds for durable source/standard docs.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git diff --check` | passed | Docs diff has no whitespace errors. | Does not prove the standard is useful in future code. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm --filter @krn/harness test -- activePlanInvariants patternChainInvariants` | passed | Active plan and pattern-chain invariants still hold after V241/V242 plan updates. | Does not prove product readiness. |
| `krn evidence capture --run-id 24a73c6b-6d3f-4a5e-9b6f-12f52e61bc6a --source-usefulness ... --persist` | passed | Evidence, review assessment, feedback delta, and source usefulness outcome were persisted. | Does not prove future code satisfies the new standard. |
| `krn observe --run-id 24a73c6b-6d3f-4a5e-9b6f-12f52e61bc6a --persist` | passed | Observation group and five items were persisted. | Does not prove observations are complete. |
| `krn reflect --scope run:24a73c6b-6d3f-4a5e-9b6f-12f52e61bc6a --persist` | passed | Reflection selected five observations and wrote one record without Memory Core mutation. | Does not prove reflection extraction quality. |

Source usefulness closure:

```txt
outcome: helped
sourceClaim: typescript-narrowing-and-exhaustiveness
reason: Official TypeScript narrowing and exhaustiveness mechanism shaped the finite-state exhaustiveness standard update.
doesNotProve: This does not prove current code already satisfies the rule or that broad type rewrites are useful.
```

## What This Proves

- KRN can ingest one official/public best-practice source through the
  source-to-decision lane without source hoarding.
- The source has a concrete consumer and falsifier.
- The retained note is small and does not copy proprietary course material.

## What This Does Not Prove

- Broad research ingestion is needed.
- A source crawler should exist.
- Current code already satisfies the new finite-state exhaustiveness standard.
- Product readiness.

## Next Recommended Action

Run a bounded code application of this standard only if source inspection finds
a finite union where a behavior-changing new member would not force a local
handling decision.

Do not start broad TypeScript cleanup.
