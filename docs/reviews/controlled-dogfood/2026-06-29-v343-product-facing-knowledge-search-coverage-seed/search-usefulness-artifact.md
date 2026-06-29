# V343 Search Usefulness Coverage Artifact

marker: krn-v343-search-usefulness-coverage

query terms:
product-facing knowledge search usefulness coverage seed

claim:
V342 showed that `krn source search` reduces rereads when persisted coverage
exists, but heartbeat, consensus, and pattern queries need bounded corpus
coverage before product UI, API, MCP, crawler, ranking, or graph-runtime work.

mechanism:
Search usefulness depends on both readback behavior and persisted corpus
coverage; weak results can be coverage failures rather than ranking failures.

KRN implication:
KRN should seed a tiny bounded set of recent knowledge artifacts through
existing ingest paths before changing ranking or building new product surfaces.

doesNotProve:
This artifact does not prove product search quality, broad corpus coverage,
ranking quality, embeddings, graph retrieval, crawler readiness, or product
readiness.

consumer:
V343 Product-Facing Knowledge Search Coverage Seed.

falsifier:
After bounded coverage seeding, weak V342 queries still miss heartbeat,
consensus, pattern, and search-usefulness knowledge or return mostly generic
guardrails.
