# Codex Adapter

Load this branch when a bounded KRN task contract or `DecisionPacket` becomes a
Codex execution brief.

## Invariants

1. Consume only the task contract, selected knowledge, source support,
   stale/rejected paths, capability needs, and evidence expectations owned by
   the input contract.
2. Render the minimum instructions needed for the next slice.
3. Preserve inclusions, exclusions, rejected paths, and non-proof boundaries.
4. Keep output plain, inspectable, deterministic for the same input, and
   non-mutating.
5. Reject reserved sections without a current consumer.
6. Keep imports one-way: adapter packages may consume core/harness contracts;
   core must not import the Codex adapter.

## Proof

Verify the changed brief at its public renderer seam and confirm core does not
acquire Codex-specific runtime behavior or adapter imports.

The adapter does not invoke Codex, write files, mutate memory, run commands, or
turn skills, hooks, MCP metadata, Goal state, or planning artifacts into the
product brain.
