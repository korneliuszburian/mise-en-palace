# MM-51 Capability Routing Dogfood

Date: 2026-06-23

## Objective

Dogfood CapabilityCompiler routing on a KRN memory implementation task and prove
that selected bindings are small, relevant, and auditable.

Task:

```text
MM-51 dogfood capability routing for a KRN memory implementation task: harden MemoryReviewGate evidence capture, TypeScript unknown-first boundaries, source-to-decision audit evidence, and review-risk diff summary without adding runtime memory or dashboard
```

## Non-Goals

- No DB migration.
- No new capability repository.
- No new CLI surface.
- No binding lifecycle promotion.
- No Codex invocation.
- No Memory Core mutation.
- No dashboard/API/MCP/server/plugin/source crawler.

## Commands

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "MM-51 dogfood capability routing for a KRN memory implementation task: harden MemoryReviewGate evidence capture, TypeScript unknown-first boundaries, source-to-decision audit evidence, and review-risk diff summary without adding runtime memory or dashboard" \
  --persist
```

Persisted IDs:

```text
operatorIntent: 9c27ee4e-efe0-448a-8f77-0387bdb6fa42
taskContract: d9a7ce6c-361d-426e-9ee8-f4909e936200
harnessPlan: ff740ef3-9147-4eaf-800f-3b102a9c3396
contextAssembly: cbde0ebc-da45-410a-b023-00cf11a92903
executionRun: 1c6dd716-3903-4d9f-b765-57c20019beff
```

Readback command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn codex brief \
  --run-id 1c6dd716-3903-4d9f-b765-57c20019beff
```

Readback status:

```text
Persistence: read-only (Postgres)
Codex invocation: none
Memory mutation: none
```

## Selected Binding Hints

The persisted readback brief selected these bounded hints:

```text
source-to-decision | capability=source_grounding | evidence=context inclusions, context exclusions
typescript-type-safety | capability=type_safety | evidence=pnpm typecheck, unknown-first boundary check, no type weakening
test-driven-development | capability=test_boundary | evidence=pnpm test
evidence-review-loop | capability=evidence_capture | evidence=git diff --check, changed files summary, diff risk summary
evidence-review-loop | capability=review_capture | evidence=review assessment, review-risk notes, diff risk summary
brain-store-schema | capability=schema_design | evidence=schema/domain tests, typecheck
brain-store-schema | capability=db_migration | evidence=pnpm db:ready, relevant DB smoke
```

## Context Selected

The run assembled six context inclusions:

```text
source_claim:d5ea7024-7d7a-4291-a050-4de1fbebf605
source_claim:f0b5c9ee-01aa-41df-9268-7df3f7437068
memory_record:41d1a2ef-3578-4e45-947f-42c6739796de
source_claim:212815bc-477c-4985-8992-31825f5c5897
source_claim:3b5540bc-2307-4578-9abb-5bee0805bbdd
memory_record:7dda35fd-b89d-4bd4-94bd-7937022d99e7
```

No context exclusions were emitted.

## Surprise

The first read-only `krn codex brief --run-id` readback reconstructed a generic
CapabilityPlan and lost the task-text routing from the persisted task contract.
MM-51 fixed that readback path by passing the persisted `TaskContract` into
`createCapabilityPlan`.

Focused regression:

```text
RED pnpm --filter @krn/cli test -- runCli.test.ts
failed because readback did not include unknown-first boundary check.

GREEN pnpm --filter @krn/cli test -- runCli.test.ts
passed with 6 files / 93 tests.
```

## What This Proves

- A KRN memory implementation task selects small, relevant capability hints.
- TypeScript boundary work routes to `typescript-type-safety` with
  unknown-first and no-type-weakening evidence.
- Review-risk work routes to `evidence-review-loop` with changed-file,
  diff-risk, and review-risk evidence.
- Memory/schema persistence language routes to `brain-store-schema`.
- Source grounding remains present through `source-to-decision`.
- The read-only Codex brief path preserves the same task-text capability
  routing as the original persisted plan.

## What This Does Not Prove

- Codex executed the work.
- A capability binding lifecycle repository exists.
- Capability bindings were promoted.
- Memory Core was mutated.
- Golden memory behavior is complete.
