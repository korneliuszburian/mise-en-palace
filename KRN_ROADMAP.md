# KRN Roadmap

KRN is a Codex operating layer: Codex edits code; KRN decides which context is
allowed, why it is trusted, what it does not prove, and how the result feeds the
next run.

## Product Thesis

The target is a governed decision-packet brain for engineering work:

```txt
operator intent
  -> task contract
  -> memory/source activation
  -> bounded Codex brief
  -> implementation
  -> evidence capture
  -> review and feedback
  -> memory/source/eval candidates
  -> governed promotion or rejection
  -> next run reuses or rejects the knowledge
```

The product should beat plain Codex plus notes plus grep on governance, stale
knowledge handling, rejected-path recall, source grounding, and proof/non-proof
readback. It does not need to win raw recall against a comprehensive notes dump.

## Kernel Law

Do not build more context. Build the machinery that selects, applies, verifies,
and forgets context.

Markdown is not runtime memory. Markdown may exist only as a compact operator
surface, source artifact, fixture, or handoff. Durable work state belongs in
Beads; durable product memory belongs in the store/corpus/eval path.

## Current Boundary

Current label: controlled internal alpha for technical operators.

Not product-ready:

- no dashboard/API/MCP product surface;
- no worker daemon/scheduler runtime;
- no external operator proof;
- no broad benchmark lane;
- no markdown-backed runtime memory.

Built enough to keep:

- strict TypeScript package spine;
- source and memory activation;
- DB-backed source/memory/evidence/review paths;
- Codex brief rendering;
- deterministic behavior gates and DB smokes;
- governed second-opinion review through `.agents/skills/second-opinion-claude`.

## Authority Surfaces

Active authority should be small:

- `AGENTS.md` for agent operating rules;
- this file for product direction;
- `GOAL.md`, `PLAN.md`, and `PLANS.md` for active execution state while they are
  still needed;
- Beads for durable task graph and follow-up state;
- repo-local skills for repeated workflows;
- DB/corpus/eval read models for brain memory.

Docs folders are not the brain. Any remaining docs dependency must be either a
real fixture/source artifact or a temporary migration target.

## Decision Rule

Every retained source, pattern, or architectural rule must map through:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If that chain is missing, do not promote the knowledge. Either reject it, keep it
as a bounded source artifact, or file a Beads task to prove it.

## Near-Term Roadmap

1. Collapse markdown authority: remove tests and scripts that treat docs prose as
   product contracts.
2. Keep only compact operator surfaces and real fixtures; delete historical
   report forests instead of archiving them.
3. Move brain knowledge out of markdown catalogs and into DB/corpus/eval paths.
4. Prove usefulness with a notes-baseline decision-packet eval.
5. Run the loop across multiple real repos and record whether KRN changes Codex
   behavior in ways plain notes do not.
