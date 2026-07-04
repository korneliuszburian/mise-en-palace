# Memory Eval Source Decisions

Bead: `mise-en-palace-m24d`

## Change

Reviewed the existing memory-eval source map and added only the missing bounded
decisions:

- A-MEM: lab-test relation-linked memory/source usefulness before any graph
  memory or autonomous evolution work.
- Letta memory blocks: use functional context blocks as a pressure test for
  typed, size-visible context packets; reject tool-editable always-on memory as
  KRN Memory Core.

Existing MemoryAgentBench, MemoryArena, Mem0, LoCoMo, memory taxonomy, and
autonomous-memory source decisions were already present in `docs/KRN_SOURCES.md`
and `docs/architecture/memory-eval-design.md`, so this slice did not duplicate
them.

## Follow-Up

Opened `mise-en-palace-pz6l`: relation-linked memory/source usefulness eval.

Read-only retained pattern check:

```txt
query: source-to-decision memory
selected: pattern:consensus-relation-heartbeat-review-boundary
use: pz6l should treat relation review/readback as a local consumer and falsifier, not only as an A-MEM paper hypothesis
```

## Non-Proof

This does not prove A-MEM or Letta architecture should be copied, does not prove
graph memory improves KRN, and does not justify autonomous Memory Core mutation,
dashboard/API/MCP, crawler work, or a broad benchmark platform.
