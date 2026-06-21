# ADR-0007: Raw Material Quarantine

Status: accepted.

## Context

Raw onboarding material is valuable but too large to be default context.

## Decision

Preserve raw materials under `docs/materials/` as source/audit quarantine. Do
not link them from `AGENTS.md` as required reading. Derived thin docs are active
working context.

## Consequences

- Source recovery remains possible.
- Daily work avoids broad rereads.
- Context selection remains a product behavior, not a giant file read.

