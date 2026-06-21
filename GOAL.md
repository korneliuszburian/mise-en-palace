# Goal: Bootstrap Clean KRN Kernel To First Dogfood Loop

## Role

This file is the canonical execution contract for this bootstrap only.

It is not the product brain, not the source map, not the memory layer, and not
the full architecture. Keep it compact, phase-oriented, and evidence-based.

## Objective

Create the clean KRN kernel workspace that prevents the old failure modes before
application code exists.

KRN is a Codex Operating Layer / AI Engineering Control Plane. Codex executes.
KRN supplies bounded context, service/store-backed memory, source grounding,
policy, skills, eval expectations, traces, review gates, and feedback.

## Current Scope

Commit 0/1 is complete. The active implementation phase is Commit 2:

- root `package.json`;
- `pnpm-workspace.yaml`;
- `tsconfig.base.json`;
- `packages/core`;
- `packages/cli`;
- minimal package manifests;
- minimal source entrypoints;
- strict `typecheck`.

## Hard Non-Goals

- Do not implement CLI runtime behavior yet.
- Do not create dashboard.
- Do not create benchmark lane.
- Do not create runtime memory in markdown.
- Do not create `.krn/**` as product truth.
- Do not import old repo topology.
- Do not create a broad subagent system.
- Do not package plugins yet.
- Do not create custom prompts.

## Phase Contract

### Commit 0: Kernel Language And Hard Boundaries

Status: complete.

Outcome:

- repo root initialized;
- `README.md`;
- thin `AGENTS.md`;
- raw source quarantine under `docs/materials/`;
- `docs/KRN_KERNEL.md`;
- `docs/STATE_OF_THE_ART.md`;
- `docs/KRN_ONBOARDING.md`;
- `docs/KRN_FAILURE_REPORT.md`;
- `docs/KRN_SOURCES.md`;
- `docs/glossary.md`;
- pattern selection doc;
- TypeScript boundary standard;
- ADRs for irreversible boundaries.

Evidence:

- created file tree;
- explicit not-built list;
- raw material not linked from `AGENTS.md` as required reading.

Stop condition:

- Codex has a small active kernel context and a quarantined raw source archive.

### Commit 1: Codex-Native Surfaces

Status: complete.

Outcome:

- repo-local skills under `.agents/skills/`;
- exactly one custom subagent at `.codex/agents/ts-type-critic.toml`;
- skills follow `$skill-creator` discipline;
- no plugin package yet.

Evidence:

- skill frontmatter contains only `name` and `description`;
- skill descriptions carry trigger boundaries;
- no extra README/install/changelog files inside skills;
- `ts-type-critic` is read-only/proposal-only.

Stop condition:

- Codex has the initial engineering disciplines without an agent zoo.

### Commit 2: Strict TypeScript Spine

Status: active.

Outcome:

- root pnpm workspace;
- strict shared TypeScript base config;
- `packages/core` as library-safe package shell;
- `packages/cli` as CLI package shell;
- source entrypoints with no runtime behavior;
- `typecheck` script.

Evidence:

- created file tree;
- `pnpm typecheck` passes;
- no `ts-reset`;
- no dashboard/apps/benchmark/.krn/MCP/plugin surface;
- `packages/core` has no global typing dependency.

Stop condition:

- repo can typecheck a strict two-package workspace without implementing KRN
  runtime behavior.

## Later Phases

These are planned but not part of this implementation run:

1. Commit 3: typed KRN primitives.
2. Commit 4: proposal-only `krn init --dry-run`.
3. Commit 5: `krn context build`.
4. Commit 6: `krn review capture`.
5. Dogfood: use KRN to add or improve `krn doctor`.

## Bootstrap Rules

- `docs/materials/` is source/audit quarantine, not default context.
- Derived docs are the active working context.
- Files can be export, audit, seed, or backup; files are not Memory Core.
- Runtime memory must be service/store-backed.
- Use `$skill-creator` for creating or updating skills.
- Use `$skill-installer` only to install curated or GitHub-hosted skills into
  `$CODEX_HOME/skills`.
- Use `quick_validate.py` only if it exists in active skill tooling. If absent,
  document a tiny local validator contract before adding one.
- Do not mix Codex permission profiles with legacy `sandbox_mode` settings in
  the same active config path.
- Treat Codex Rules as experimental command-policy controls only.

## Acceptance

Commit 2 is accepted when:

- `find . -maxdepth 4 -type f | sort` shows only docs, skills, subagent, and
  TypeScript workspace spine surfaces expected for the bootstrap;
- `AGENTS.md` is short;
- `GOAL.md` is compact and phase-oriented;
- no dashboard, benchmark lane, plugin, runtime markdown memory, MCP server, or
  CLI runtime implementation exists;
- `pnpm typecheck` passes;
- `packages/core` does not depend on global `ts-reset`;
- skill folders contain only essential `SKILL.md` files unless a future task
  explicitly adds resources.
