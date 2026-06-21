# ADR-0008: Codex-Native Surfaces First

Status: accepted.

## Context

KRN must not invent new ritual surfaces when Codex already provides native
ones.

## Decision

Use Codex-native surfaces first:

- `AGENTS.md` for thin repo guidance;
- `.agents/skills/` for repo-local reusable workflows;
- `.codex/agents/` for bounded custom subagents;
- hooks later for deterministic lifecycle gates;
- MCP later for typed tools/resources;
- rules later for experimental command policy;
- plugins later for distribution.

## Consequences

- Custom prompts are rejected.
- Plugins are not created in Commit 0/1.
- Permissions must choose one active model and avoid mixing incompatible config
  styles.

