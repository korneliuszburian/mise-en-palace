# ADR-0002: Memory Is Store-Backed, Files Are Export

Status: accepted.

## Context

The old direction treated markdown notes as memory. This created inspectable
files but not runtime memory.

## Decision

Runtime Memory Core must be service/store-backed. Files may be export, audit,
seed, source bank, or backup. Files are not runtime memory.

## Consequences

- Do not create `docs/memory/**` as runtime truth.
- Memory entries need lineage, confidence, TTL/validity, invalidation, owner,
  and application guidance.
- Retrieval must be able to abstain.

