---
name: krn-implementation
description: Use for KRN maker work that needs a tight proof path: activation, store schema, Codex adapter rendering, TDD, TypeScript boundaries, tests, or migrations.
---

# KRN Implementation

Use this skill for maker work inside the KRN kernel. It routes one concrete
runtime slice to the right reference and proof path.

## Trigger

- Changing activation, retrieval, memory/source selection, context budget, or
  owner-file recall.
- Changing Drizzle/Postgres schema, migrations, repository adapters, outbox, or
  worker persistence.
- Rendering `DecisionPacket`, harness output, or task contracts into Codex
  briefs.
- Touching TypeScript boundaries, validators, public types, casts, generics,
  CLI/env/file/JSON/MCP inputs, or tsconfig.
- Adding or changing tests for runtime behavior, parser boundaries,
  migrations, source/memory authority, feedback, or bug fixes.

## Steps

1. Read the active Beads issue, `KRN_ROADMAP.md`, and only the files needed for
   the current runtime boundary.
2. Name the runtime consumer, owner, falsifier, proof command, and non-proof
   boundary before editing.
3. Load exactly the relevant reference, or more only when the slice truly
   crosses boundaries:
   - `references/activation.md` for context selection and owner-file recall;
   - `references/store-schema.md` for DB schema, migrations, and adapters;
   - `references/codex-adapter.md` for Codex execution brief rendering;
   - `references/tdd.md` for red-green runtime behavior work;
   - `references/type-safety.md` for TypeScript boundary discipline.
4. Implement the smallest change that makes the roadmap or Beads acceptance
   criteria more true.
5. Remove compatibility aliases, duplicate read models, and old public paths in
   the same slice when a staged migration is not required.
6. Run the smallest focused behavior check first, then typecheck for
   TypeScript changes, and Fallow when the change touches package surfaces,
   architecture, or cleanup.

## Branch Dispatch

| Change shape | Required reference | First proof |
|---|---|---|
| selection, ranking, owner-file recall, exclusions | `activation.md` | focused activation or owner-file test |
| schema, migration, repository adapter | `store-schema.md` | migration/adapter test or DB check |
| Codex brief or DecisionPacket rendering | `codex-adapter.md` | brief golden or renderer test |
| behavior with known desired outcome | `tdd.md` | red command before implementation |
| TS boundary, parser, env/file/JSON/MCP input | `type-safety.md` | focused test plus typecheck |

If the symptom is unknown, use `diagnosing-bugs` before this skill.

## Output

- Runtime boundary:
- Consumer:
- Owner:
- Falsifier:
- Reference loaded:
- Changed files:
- Proof:
- Non-proof:
- Follow-up Beads:
- Reference rejected:

## Stop Condition

Stop when the runtime consumer, owner, falsifier, changed boundary, proof
command, and remaining non-proof are explicit, focused checks pass or are
reported honestly, and durable follow-up work is represented in Beads.

## Verification

Use the selected reference verification plus `rtk proxy pnpm typecheck` for
TypeScript changes. For broad JS/TS package-surface or cleanup work, run
`rtk proxy pnpm quality:fallow` or record why it is not applicable.

## Forbidden

- Do not implement from a vague concept before naming the consumer and
  falsifier.
- Do not load every reference as ritual.
- Do not add compatibility shims unless a test or staged rollout requires them.
- Do not hide runtime memory in markdown.
- Do not weaken TypeScript or testing boundaries to make a slice green.
- Do not turn package/file topology changes into proof of product behavior.
