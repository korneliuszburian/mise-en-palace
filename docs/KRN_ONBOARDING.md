# KRN Onboarding

## First Read

1. `AGENTS.md`.
2. `docs/KRN_KERNEL.md`.
3. The specific doc or skill needed for the current task.

Do not start from `docs/materials/` unless the task is source audit,
reconciliation, or doctrine recovery.

## Bootstrap State

This repo currently contains only Commit 0/1 surfaces:

- kernel contract;
- raw source quarantine;
- source map;
- pattern selection;
- ADRs;
- repo-local skills;
- one TypeScript critic subagent.

## How To Work Here

- Keep context selected and small.
- Map sources to mechanisms and decisions.
- Keep memory runtime store-backed.
- Treat files as exports, docs, seeds, or audit trails.
- Prefer Codex-native surfaces before inventing new ones.
- Use skills for reusable workflows.
- Use subagents only for explicit, bounded work.
- Keep review burden and diff risk visible.

## First Dogfood Path

The later dogfood path is:

```text
krn context build --task "add doctor command"
Codex implements a small doctor command
typecheck/test
krn review capture
memory/source/eval candidates
handoff-compact
```

Do not start this path until the TypeScript spine and typed primitives exist.

