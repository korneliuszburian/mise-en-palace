# MM-38 Source-To-Decision Dogfood

Date: 2026-06-23

## Objective

Dogfood the source-to-decision path on a KRN memory/source implementation
decision without adding new runtime behavior.

Decision under review:

```text
MM-37 source graph health audit should inspect semantic source snapshots for
decorative support, stale accepted claims, unlinked accepted claims, and
rejected-claim decision support.
```

## Non-Goals

- No DB migration.
- No source crawler.
- No new CLI surface.
- No activation v2 integration.
- No reflection candidate persistence.
- No Memory Core mutation.
- No dashboard/API/MCP/server/plugin.

## Commands

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn plan \
  --task "MM-38 dogfood source-to-decision on memory source graph health audit" \
  --persist
```

Persisted execution run:

```text
bba64c9a-eb96-47b7-819a-93937e6d8c5d
```

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn source claim add \
  --run-id bba64c9a-eb96-47b7-819a-93937e6d8c5d \
  --title "MM-38 source graph health audit dogfood" \
  --claim "Source graph health audit should inspect semantic source snapshots for decorative support, stale accepted claims, unlinked accepted claims, and rejected-claim decision support." \
  --mechanism "Audit snapshots already carry source claims and source decisions, so health checks can turn source-to-decision doctrine into blocking or warning review findings without adding a crawler or new runtime surface." \
  --does-not-prove "This does not prove ActivationEngine v2 trust filters or source graph query quality." \
  --falsifier "A seeded decorative, stale, unlinked, or rejected-supported source graph snapshot produces no source_grounding audit finding." \
  --support-type implementation-boundary \
  --trust-tier project-decision \
  --consumer "MM-38 source-to-decision dogfood" \
  --persist
```

Persisted SourceClaim:

```text
d5ea7024-7d7a-4291-a050-4de1fbebf605
```

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn source decision link \
  --source-claim-id d5ea7024-7d7a-4291-a050-4de1fbebf605 \
  --target-type harness_run \
  --target-id bba64c9a-eb96-47b7-819a-93937e6d8c5d \
  --support-type implementation-boundary \
  --confidence high \
  --notes "MM-38 dogfood: the MM-37 source graph health audit decision is linked to a decision-grade SourceClaim with doesNotProve and falsifier." \
  --persist
```

Persisted SourceDecisionEdge:

```text
a343ebef-2951-4ba6-b0d7-8eb3af586509
```

## DB Proof

The persisted SourceClaim contains:

- `does_not_prove`: `This does not prove ActivationEngine v2 trust filters or source graph query quality.`
- `falsifier`: `A seeded decorative, stale, unlinked, or rejected-supported source graph snapshot produces no source_grounding audit finding.`
- `support_type`: `implementation-boundary`
- `trust_tier`: `project-decision`
- `consumer`: `MM-38 source-to-decision dogfood`
- `execution_run_id`: `bba64c9a-eb96-47b7-819a-93937e6d8c5d`

The persisted SourceDecisionEdge contains:

- `source_decision_edge_id`: `a343ebef-2951-4ba6-b0d7-8eb3af586509`
- `source_claim_id`: `d5ea7024-7d7a-4291-a050-4de1fbebf605`
- `target_type`: `harness_run`
- `target_id`: `bba64c9a-eb96-47b7-819a-93937e6d8c5d`
- `edge_support_type`: `implementation-boundary`
- `confidence`: `high`

Run counts:

```text
run_source_claims: 1
run_source_decision_edges: 1
```

## What This Proves

- A KRN implementation decision can be represented as a decision-grade
  SourceClaim.
- The claim carries mechanism, KRN implication via CLI default, doesNotProve,
  falsifier, support type, trust tier, consumer, and run linkage.
- The claim can be linked to a harness run through SourceDecisionEdge.

## What This Does Not Prove

- ActivationEngine v2 trust filters.
- Source graph query quality.
- Source graph health audit against production-scale data.
- Memory Core mutation.
