# ADR-0005: Read / Propose / Write Boundary

Status: accepted.

## Context

Tools, MCP, hooks, and subagents increase agency and risk.

## Decision

KRN separates read, propose, write, and destructive actions. Research and review
agents default to read-only/proposal-only. Write authority requires explicit
task scope. Destructive actions require explicit approval and audit.

## Consequences

- Initial `ts-type-critic` is read-only/proposal-only.
- Later policy gates must surface action class and rollback path.
- Hidden write paths are rejected.

