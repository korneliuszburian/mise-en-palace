# V340 Local Ingest Artifact

Marker: krn-v340-ingest-loop-local-artifact-20260629

KRN should prove one bounded local ingest loop before building a crawler,
dashboard, API, MCP server, worker daemon, new schema, or broad eval platform.

Mechanism: a small local file can be persisted as a SourceArtifact,
SourceChunk, SearchDocument, and governed SourceClaim, then activated in a
later plan by a marker query.

KRN implication: product-facing knowledge search should grow from a proven
artifact-to-activated-knowledge path, not from a new product surface.

Does not prove: source truth, broad corpus ingest, embeddings, graph retrieval,
crawler readiness, product readiness, or Memory Core mutation.
