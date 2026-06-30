# V371 bounded ingest readback artifact

Marker: krn-v371-ingest-loop-readback-20260630.

KRN should make persisted local ingest reviewable as one loop: source artifact
to chunks, SearchDocument, governed SourceClaim, optional SourceClaimEdge, and
the source/brain search readback commands that prove whether the artifact can
be found by later activation-style search.

This artifact does not prove source truth, ranking quality, embeddings, crawler
readiness, UI/API/MCP readiness, worker runtime readiness, Memory Core mutation,
or product readiness.
