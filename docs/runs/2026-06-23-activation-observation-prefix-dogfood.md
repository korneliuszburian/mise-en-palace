# 2026-06-23 Activation Observation Prefix Dogfood — MM-45

Scope: compare one KRN memory task before and after observation prefix
activation, using existing activation APIs and proving no Memory Core mutation.

Non-goals: no DB migration, no new CLI, no prefix fetcher, no reflection, no
memory promotion, no dashboard/API/MCP/server/plugin, no source crawler.

## Task

```text
MM-45 activation dogfood for memory slice closure
```

Objective:

```text
Close a KRN memory implementation slice with activation dogfood, observation
prefix evidence, audit slice verification, and no Memory Core mutation.
```

## Counts Before

Command:

```bash
psql postgres://krn:krn@localhost:54329/krn -Atc \
  "select 'memory_records=' || count(*) from memory_records
   union all select 'memory_candidates=' || count(*) from memory_candidates
   union all select 'observation_groups=' || count(*) from observation_groups
   union all select 'observation_items=' || count(*) from observation_items
   union all select 'context_assemblies=' || count(*) from context_assemblies;"
```

Output:

```text
memory_records=4
memory_candidates=2
observation_groups=1
observation_items=5
context_assemblies=18
```

## Dogfood Command

Command shape:

```bash
pnpm --filter @krn/cli exec tsx <<'TS'
# one-off script using @krn/harness assembleContext + selectObservationPrefix
TS
```

The script constructed the same `TaskContract` twice:

- before: no activation candidates and no observation prefix;
- after: same empty activation candidates plus one selected source-ranged
  observation prefix item.

The selected observation had:

```text
observationId: observation-mm45-selected
sourceRangeCount: 1
sourceType: run_event
locator: docs/plans/memory-ideal-state/PLAN.md#MM-45
```

## Before

```json
{
  "status": "abstained",
  "inclusionCount": 0,
  "hasObservationPrefix": false,
  "abstentionReason": "no_candidates"
}
```

Interpretation: without memory/source/search candidates and without an
observation prefix, activation correctly abstains instead of padding context.

## After

```json
{
  "status": "assembled",
  "inclusionCount": 0,
  "hasObservationPrefix": true,
  "observationPrefixItemCount": 1,
  "observationPrefixItems": [
    {
      "observationId": "observation-mm45-selected",
      "kind": "fact",
      "confidence": "high",
      "priority": "high",
      "summary": "Activation dogfood should attach one source-ranged observation prefix item.",
      "sourceRangeCount": 1,
      "reason": "matched task terms: activation, and, audit, core, dogfood, evidence, for, item, memory, mutation, observation, one, prefix, ranged, slice, source, verification",
      "score": 55
    }
  ]
}
```

Verdict:

```text
prefix_improves_context_precision_without_candidates
```

Interpretation: the observation prefix adds one small source-ranged activation
artifact for the task without creating a MemoryRecord, without adding a new
context subject type, and without broad context dumping.

## Counts After

Command:

```bash
psql postgres://krn:krn@localhost:54329/krn -Atc \
  "select 'memory_records=' || count(*) from memory_records
   union all select 'memory_candidates=' || count(*) from memory_candidates
   union all select 'observation_groups=' || count(*) from observation_groups
   union all select 'observation_items=' || count(*) from observation_items
   union all select 'context_assemblies=' || count(*) from context_assemblies;"
```

Output:

```text
memory_records=4
memory_candidates=2
observation_groups=1
observation_items=5
context_assemblies=18
```

## Proof

- `memory_records` stayed `4`.
- `memory_candidates` stayed `2`.
- `observation_groups` stayed `1`.
- `observation_items` stayed `5`.
- `context_assemblies` stayed `18`.
- The dogfood run used existing activation APIs only and did not persist new
  product state.
- The result improved context precision from `abstained/no_candidates` to one
  source-ranged observation prefix item.

## Residual Scope

- MM-45 does not load observations automatically from DB into `krn plan`.
- MM-45 does not fetch raw evidence from activation trigger metadata.
- MM-45 does not create reflection candidates, MemoryCandidates, or
  MemoryRecords.
- Activation dogfood is sufficient to continue into Gate 6 capability compiler
  work, but later E2E slices still need runtime observation fetching and golden
  behavior proof.
