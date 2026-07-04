# DB-Backed Memory Advantage

Bead: `mise-en-palace-yb62`

## Decision

`krn brain search --store-only` now reads active `MemoryRecord` rows from the
configured DB project when DB runtime is available. The readback converts those
records into `BrainKnowledgeReadModel` packets with explicit source lineage,
consumer, falsifier, and `doesNotProve` boundaries.

The DB brain-search smoke now proves a narrow memory/source path:

1. baseline store-only brain search runs before seeded rows and selects no
   knowledge;
2. the smoke creates accepted SourceClaim evidence with SearchDocument and
   SourceDecisionEdge support;
3. the smoke promotes a MemoryCandidate into a MemoryRecord linked to that
   source;
4. grounded store-only brain search selects both the MemoryRecord packet and
   source-search packet.

## Evidence

Local DB smoke:

```txt
pnpm db:smoke:brain-search
Baseline smoke SourceClaim selected: no
Baseline smoke MemoryRecord selected: no
Baseline selectedKnowledge: 0
Grounded smoke SourceClaim selected: yes
Grounded smoke MemoryRecord selected: yes
Grounded selectedKnowledge: 2
Grounded selectedKnowledge packets: memory_store:<memory-record-id>, source_search:<source-claim-id>
Grounded linked search documents: 1
Grounded source decision support: 1
Brain search smoke: passed
```

## Proof

Proves:

- one isolated Postgres-backed brain-search path can miss without seeded memory
  and source rows;
- the same path can select a promoted MemoryRecord plus accepted source evidence
  after seeding through live repositories;
- store-only brain search no longer means only source/search readback when DB
  memory is available.

Does not prove:

- broad memory ranking quality;
- source truth;
- Codex used the selected memory;
- product readiness;
- autonomous worker memory writes.

## Rollback Risk

Low to medium. Store-only brain search is stricter and more useful when DB
runtime is present, but tests that stub source-search without DB runtime keep the
old no-catalog skip behavior.
