# V343 Heartbeat Memory Staleness Coverage Artifact

marker: krn-v343-heartbeat-memory-staleness-coverage

query terms:
memory staleness heartbeat candidate MemoryRecord

claim:
V338 proved a memory-staleness heartbeat preview can propose reviewable
MemoryRecord maintenance candidates without Memory Core mutation.

mechanism:
Heartbeat previews should produce candidate rows or reviewable candidate output
only; they must not mutate final Memory Core truth.

KRN implication:
Product-facing knowledge search should retrieve heartbeat/staleness coverage
when operators ask about memory staleness heartbeat candidates.

doesNotProve:
This artifact does not prove heartbeat quality, stale-memory detection quality,
autonomous dreaming, worker runtime readiness, or Memory Core mutation safety at
scale.

consumer:
V343 Product-Facing Knowledge Search Coverage Seed.

falsifier:
`krn source search --query "memory staleness heartbeat candidate MemoryRecord"`
cannot retrieve this artifact or its governed SourceClaim after persistence.
