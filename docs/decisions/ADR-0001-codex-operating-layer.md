# ADR-0001: KRN Is A Codex Operating Layer

Status: accepted.

## Context

KRN must not become a replacement executor, dashboard app, benchmark lab, or
generic agent framework.

## Decision

KRN is a Codex Operating Layer / AI Engineering Control Plane. Codex executes.
KRN supplies bounded context, store-backed memory, source grounding, policy,
skills, eval expectations, traces, review gates, and feedback.

## Consequences

- Prefer Codex-native surfaces before inventing new mechanisms.
- Product proof comes from dogfood workflow, not from UI or reports.
- Architecture decisions must map source -> mechanism -> KRN implication.

