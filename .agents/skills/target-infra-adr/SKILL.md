---
name: target-infra-adr
description: Use when KRN architecture chooses storage, queues, retrieval, runtime boundaries, external services, migrations, or package topology that must become an ADR with explicit adoption, rejection, and falsifier.
---

# Target Infra ADR

Use this skill before encoding architecture that could create a new runtime
surface.

## Trigger

- A KRN decision changes storage, retrieval, queues, workers, memory, source
  graph, package boundaries, or runtime authority.
- A proposed implementation would add Redis, Kafka, dashboard, MCP, subagents,
  benchmark lane, hooks, or another durable surface.

## Workflow

1. State the architecture choice in one sentence.
2. Map evidence as source -> mechanism -> KRN implication.
3. Choose `adopt_now`, `defer`, `lab`, or `reject`.
4. List rejected alternatives and why they fail the current kernel boundary.
5. Name package/runtime boundaries and migration impact.
6. Define verification, rollback, and falsifier.

## Output

```yaml
decision:
status: adopt_now | defer | lab | reject
source_mechanisms:
krn_implication:
accepted_boundary:
rejected_alternatives:
verification:
rollback:
falsifier:
```

## Forbidden

- Do not copy old repo topology.
- Do not add dashboard, benchmark, MCP, plugin, or subagent surfaces before the
  typed harness primitive exists.
- Do not keep decorative sources without a decision or rejection.
- Do not split Postgres into extra stores for the first spine without an ADR.

## Verification

The ADR should reduce future diff risk by making the accepted boundary,
rejected options, and falsifier auditable.
