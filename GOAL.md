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

Execute only Commit 0/1 in the first implementation run:

- raw onboarding source quarantine;
- thin kernel docs;
- source map;
- pattern selection;
- TypeScript boundary standard;
- initial ADRs;
- repo-local skills;
- one read-only/proposal-only `ts-type-critic`.

## Hard Non-Goals

- Do not create TypeScript packages yet.
- Do not create CLI code yet.
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

## Later Phases

These are planned but not part of the first implementation run:

1. Commit 2: strict pnpm TypeScript spine.
2. Commit 3: typed KRN primitives.
3. Commit 4: proposal-only `krn init --dry-run`.
4. Commit 5: `krn context build`.
5. Commit 6: `krn review capture`.
6. Dogfood: use KRN to add or improve `krn doctor`.

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

Commit 0/1 is accepted when:

- `find . -maxdepth 4 -type f | sort` shows only docs, skills, and subagent
  surfaces expected for the bootstrap;
- `AGENTS.md` is short;
- `GOAL.md` is compact and phase-oriented;
- no `packages/`, dashboard, benchmark lane, plugin, runtime markdown memory,
  or CLI implementation exists;
- skill folders contain only essential `SKILL.md` files unless a future task
  explicitly adds resources.

