# Index is subordinate to canonical authority

## Decision

`SearchDocument` is an index projection only. Activation may use its ranking
and provenance hints only after the linked canonical `SourceClaim`,
`MemoryRecord`, or `AntiMemoryRecord` is present, project-matched, and in an
eligible authority state.

## Rejected alternative

Treating an active index row as a parallel authority would make stale,
rejected, missing, or cross-project canonical state invisible to consumers.

## Consumer

Retrieval, activation, and DecisionPacket assembly.

## Falsifier

An index-only row, a mismatched project link, or an ineligible canonical row
can produce governing context or a clean authority statement.

## Contraction / rollback

Keep the index for search diagnostics and rank hints, but fail closed when its
canonical owner cannot be resolved or authorized.

The xvxw activation and persistence contract tests are the executable source
of truth; this ADR does not prove database behavior by itself.
