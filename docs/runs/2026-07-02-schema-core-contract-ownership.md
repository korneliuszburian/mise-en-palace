# Schema/Core Contract Ownership Audit

Date: 2026-07-02

Beads issue: `mise-en-palace-a44d`

## Summary

This slice audited the audit claim that `@krn/schema` and `@krn/core` duplicate
domain contracts.

Verdict: the broad merge recommendation is rejected. The duplicated names are
mostly intentional projections:

```txt
@krn/schema -> unknown-first input / fixture DTOs
@krn/core   -> runtime records, branded IDs, behavior validators
```

Blindly merging them would weaken the product boundary by making external input
look like trusted runtime state, or by pulling Zod/input parsing into core.

Two real drifts were fixed:

```txt
1. EvidenceCaptureInput.executionRunId no longer requires UUID-only IDs.
2. core GoldenTask metadata validation now rejects reasoningTrace keys like schema.
```

## Ownership Table

| Concept | Core Owner | Schema Owner | Decision |
|---|---|---|---|
| `TaskContract` | Runtime record with `id`, `operatorIntentId`, `projectId`, `status`, timestamps. | `TaskContractInputSchema` for external draft fields: title, objective, constraints, non-goals, acceptance, metadata. | Intentional projection. Do not merge. |
| `OperatorIntent` | Runtime record with IDs, normalized intent, source, metadata, createdAt. | `OperatorIntentInputSchema` for raw intent, source, slugs, metadata. | Intentional projection. Do not merge. |
| `GoldenTask` | Runtime behavior contract plus `validateGoldenTaskContract`. | Fixture parser/schema for unknown JSON input. | Intentional projection. Keep schema as fixture boundary. |
| IDs | Branded domain ID aliases and type-level separation. | Text validators for unknown input fields. | Core owns identity; schema owns parsing. Do not create a parallel schema ID type graph. |

## Real Drift Fixed

### Evidence Capture ID Shape

`EvidenceCaptureInputSchema.executionRunId` used `z.string().uuid().optional()`
while core runtime IDs are branded strings and existing repo fixtures use IDs
such as `execution-run-1`.

Decision:

```txt
Use OptionalTextSchema for schema input, matching the rest of the schema package
where KRN-owned IDs are text-shaped runtime identifiers rather than UUID-only
external IDs.
```

Changed:

```txt
packages/schema/src/evidenceCapture.ts
packages/schema/src/__tests__/index.test.ts
```

### GoldenTask Private Metadata Policy

Schema rejects private reasoning metadata keys through
`privateReasoningMetadataKeys`, including `reasoningTrace` and
`reasoning_trace`. Core `validateGoldenTaskContract` only rejected some of that
vocabulary.

Decision:

```txt
Core GoldenTask runtime validation must be at least as strict as schema fixture
input validation for private reasoning metadata.
```

Changed:

```txt
packages/core/src/goldenTask.ts
packages/core/src/__tests__/goldenTask.test.ts
```

## Explicit Deferrals

No broad unification in this slice:

```txt
TaskContractInput -> TaskContract
OperatorIntentInput -> OperatorIntent
GoldenTaskSchema -> GoldenTask
schema ID validators -> core branded IDs
```

Deferred follow-ups, only if they become blocking:

```txt
1. Export shared readonly value tuples for OperatorIntent source values.
2. Export shared readonly value tuples for GoldenTask status/domain/outcome/severity.
3. Add clearer schema aliases such as GoldenTaskFixtureSchema while preserving old exports.
4. Audit schema ID validators one field family at a time.
```

## Source To Decision

```yaml
source_id: schema-core-ownership-audit
source: repo-local audits, core/schema source files, subagent read-only import graph
mechanism: >
  The same domain words appear in schema and core, but the field sets and
  consumers show separate lifecycle phases: untrusted external input in schema,
  trusted runtime records and validators in core.
krn_implication: >
  Merging schema and core contracts would erase an important trust boundary.
  The right repair is not a large type migration; it is fixing specific drift
  where input validators and runtime validators disagree.
decision: >
  Keep schema/core ownership split. Fix the two live drift points found by the
  audit: evidence capture ID shape and GoldenTask private metadata vocabulary.
consumer: >
  CLI plan/evidence parsing, harness compiler/runtime contracts, GoldenTask
  behavior gates, and future audit-hardening tasks.
falsifier: >
  A future external input path can set runtime-only fields directly, core accepts
  metadata that schema rejects, or schema rejects a KRN runtime ID shape used by
  core/harness/DB records.
```

## Proof

Verification passed:

```txt
rtk pnpm --filter @krn/schema test -- src/__tests__/index.test.ts
rtk pnpm --filter @krn/core test -- src/__tests__/goldenTask.test.ts
rtk pnpm -C packages/schema typecheck
rtk pnpm -C packages/core typecheck
rtk pnpm -C packages/harness typecheck
rtk pnpm -C packages/cli typecheck
rtk pnpm --filter @krn/schema test -- src/__tests__/index.test.ts src/__tests__/goldenTask.test.ts
rtk pnpm --filter @krn/core test -- src/__tests__/goldenTask.test.ts
rtk pnpm --filter @krn/harness test -- src/compiler/index.test.ts src/goldenRunner.test.ts
rtk pnpm --filter @krn/cli test -- src/parsePlanArgs.test.ts src/runCli.test.ts -t "plan"
rtk pnpm quality:fallow:ci
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm eval:brain-battle:smoke
rtk git diff --check
```

Note: `rtk pnpm typecheck` returned a false non-zero wrapper result while
printing `TypeScript: No errors found`; `rtk proxy pnpm typecheck` was used for
the root typecheck proof.

## Does Not Prove

This does not prove schema/core ownership is perfect everywhere, that all ID
validators are correctly shaped, that every public export is ideally named, or
that future value-vocabulary drift cannot happen. It proves only that the broad
duplicate-contract audit claim was too coarse and that two live drift points
were repaired.

## Handoff

Current state after this slice:

```txt
schema/core contract split: preserved
TaskContract / OperatorIntent broad merge: rejected
GoldenTask broad merge: rejected
EvidenceCapture executionRunId UUID-only validation: fixed
GoldenTask reasoningTrace metadata drift: fixed
remaining risk: duplicated literal vocabularies can still drift
next likely task: continue bounded audit-hardening, likely CLI command registry pilot or another Beads-ready item
```

## Second Opinion Prompt

```txt
You are reviewing the current `mise-en-palace` schema/core contract ownership
audit and diff.

Be ruthless. Verify current repo state, not old audit claims.

Questions:

1. Did this slice correctly reject broad schema/core unification for
   TaskContract, OperatorIntent, GoldenTask, and IDs?
2. Are `@krn/schema` input/fixture DTOs and `@krn/core` runtime records still
   cleanly separated after the patch?
3. Was changing EvidenceCaptureInput.executionRunId from UUID-only to optional
   text correct for current KRN runtime ID semantics?
4. Did core GoldenTask metadata validation become aligned with schema private
   reasoning metadata rejection, or are there more forbidden keys missing?
5. Are there other schema/core drift points that are higher risk than the two
   fixed here?
6. Should the next bounded slice address shared value tuples, schema aliases,
   CLI command registry, or another audit finding?

Return findings first with exact file/line refs. Then give delete/rename/leave
decisions, proof/non-proof, and one next bounded slice with acceptance criteria
and verification commands. Do not propose broad package unification unless you
can show a concrete consumer and a safer migration order.
```
