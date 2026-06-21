# Harness Persistence Inventory

Scope: M21 Slice 01.

Repo-local skills used:

- `brain-store-schema`
- `source-to-decision`
- `evidence-review-loop`

Inspected:

- `packages/db/src/schema/harness.ts`
- `packages/db/src/schema/events.ts`
- `packages/db/src/migrations/0000_optimal_wrecker.sql`
- `packages/harness/src/repositories/harnessRunRepository.ts`
- `packages/harness/src/repositories/eventLedgerRepository.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/db/src/repositories/DrizzleEventLedgerRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runPlanCommand.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/databaseRuntime.ts`

## Existing Tables

| M21 entity | Existing table | Status | Notes |
| --- | --- | --- | --- |
| operator intent | `operator_intents` | exists | Has workspace/project/source/raw/normalized/status/metadata. |
| task contract | `task_contracts` | exists | Has objective, constraints, non-goals, acceptance, status. |
| harness plan | `harness_plans` | exists | Has task contract, version, status, summary, next action, metadata. |
| context assembly | `context_assemblies` | exists | Has selected/excluded context JSONB plus counts and status. |
| execution/harness run | `execution_runs` | exists | Has harness plan, adapter, status, started/completed timestamps. |
| evidence bundle | `evidence_bundles` | exists | Has execution run, changed files, commands, diff risk, rollback path. |
| review assessment | `review_assessments` | exists | Has evidence bundle, reviewer, summary, findings. |
| feedback delta | `feedback_deltas` | exists | Has review assessment, memory/source/eval candidates as JSONB. |
| run events | `run_events` | exists | Has execution run, sequence, type, severity, message, payload. |
| outbox events | `outbox_events` | exists | Used by feedback delta creation and worker handoff. |
| evidence contract | none | missing first-class surface | Compiler returns it, but no table/column stores it directly yet. |

## Existing Repository Surface

`HarnessRunRepository` already exposes:

- `createOperatorIntent`
- `createTaskContract`
- `createHarnessPlan`
- `createContextAssembly`
- `createExecutionRun`
- `updateExecutionRunStatus`
- `createEvidenceBundle`
- `createReviewAssessment`
- `createFeedbackDelta`

`EventLedgerRepository` already exposes:

- `appendRunEvent`
- `listRunEvents`

Drizzle adapters exist for both repository ports and use transactions when a
state change must be paired with a run event or outbox event.

Missing repository surface for M21:

- read harness run by ID;
- read a run aggregate that links operator intent, task contract, harness plan,
  context assembly, execution run, evidence bundle, review assessment, feedback
  delta, and run events;
- list evidence/review/feedback by execution run;
- read back feedback delta candidates without losing `memoryCandidates` or
  `sourceDecisions`.

Mapper risk:

- `mapFeedbackDelta` currently returns empty `memoryCandidates` and
  `sourceDecisions` from persisted rows. Fresh `createFeedbackDelta` returns
  the input values, but a readback path would lose those two arrays unless the
  mapper is fixed.

## CLI Runtime Surface

Current `krn plan --task "..."` behavior:

- without `KRN_DATABASE_URL`, it uses no-store preview dependencies;
- with `KRN_DATABASE_URL`, it uses DB-backed compiler dependencies
  automatically;
- it persists operator intent, task contract, harness plan, context assembly,
  retrieval run/candidates/decisions/context selection, but not an execution
  run;
- it does not accept `--persist`;
- it does not print persisted IDs as a structured M21 identity block.

Current `krn evidence capture` behavior:

- it accepts no `--run-id`;
- it accepts no `--persist`;
- it reads git status and prints evidence only;
- it does not call `createEvidenceBundle`, `createReviewAssessment`, or
  `createFeedbackDelta`;
- it reports an execution-run configured state only as a pending adapter label.

## Migration Need

No new table is required for the primary M21 spine entities because they already
exist in `0000_optimal_wrecker.sql`.

One persistence gap remains for the evidence contract. The smallest
M21-compatible path is to persist the evidence contract as a typed
`harness_plans.metadata.evidenceContract` field when `krn plan --persist` is
implemented. This avoids a migration and matches the current schema, but the
adapter must narrow the JSON before returning domain/read models.

Add a dedicated `evidence_contracts` table only if implementation proves that
evidence contracts need independent lifecycle, query indexes, or status.

## Reuse And Minimal Extension

Reuse:

- existing `operator_intents`;
- existing `task_contracts`;
- existing `harness_plans`;
- existing `context_assemblies`;
- existing `execution_runs`;
- existing `evidence_bundles`;
- existing `review_assessments`;
- existing `feedback_deltas`;
- existing `run_events`;
- existing `outbox_events`;
- existing Drizzle repository adapter pattern.

Minimally extend:

- CLI parser/runtime for explicit `--persist`;
- CLI parser/runtime for `evidence capture --run-id <id> --persist`;
- repository port/adapters for readback by run ID;
- feedback delta mapper for persisted memory/source candidate arrays;
- plan output with a persisted identity block.

Intentionally not implemented in M21:

- full MemoryStore;
- full SourceStore;
- eval store;
- worker execution;
- dashboard;
- API;
- MCP server;
- automatic memory mutation.

## Source To Decision

```yaml
source_id: local-db-harness-schema
title: Existing Drizzle harness schema and migrations
trust_tier: high
mechanism: Existing tables already encode operator intents, task contracts, harness plans, context assemblies, execution runs, evidence bundles, review assessments, feedback deltas, run events, and outbox events.
krn_implication: M21 should reuse the current Postgres/Drizzle spine instead of adding duplicate tables.
decision: adopt
does_not_prove: The CLI already exposes explicit persisted plan and evidence workflows.
consumer: M21 Slice 02 schema decision and Slice 03 repository/readback work.
falsifier: A persisted plan/evidence implementation cannot store or read back the required evidence contract and linked run identity without a migration.
```

```yaml
source_id: local-cli-plan-evidence-runtime
title: Current CLI plan and evidence capture runtime
trust_tier: high
mechanism: Plan auto-writes when KRN_DATABASE_URL is set; evidence capture only prints and has no run-id or persist flags.
krn_implication: M21 must make write intent explicit with --persist and add a persisted evidence path.
decision: adopt
does_not_prove: The database schema is insufficient.
consumer: M21 Slice 04 and Slice 06 CLI behavior.
falsifier: Tests prove existing CLI already supports explicit --persist and persisted evidence capture.
```
