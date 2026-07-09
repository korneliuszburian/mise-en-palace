---
name: codebase-design
description: Use when changing KRN architecture, package seams, public interfaces, adapters, runtime/store boundaries, naming, or refactors where the risk is shallow modules, pass-through layers, duplicate read models, speculative seams, or unclear test surfaces.
---

# Codebase Design

Use this skill before architecture or naming edits that change a public seam.

## Trigger

Use before architecture, naming, or seam edits that change what callers,
operators, tests, or persistence paths must understand.

## Purpose

Make KRN smaller and deeper: more behavior behind fewer clearer interfaces, with
a runtime consumer, falsifier, and owner.

## Vocabulary

- Module: a function, file, package, or runtime slice with one interface and
  implementation.
- Interface: everything callers must know: types, invariants, ordering, error
  modes, config, and proof/non-proof boundaries.
- Seam: where callers or tests cross a module interface.
- Adapter: a concrete implementation at a seam.
- Depth: behavior gained per unit of interface learned.
- Leverage: capability callers get from the interface.
- Locality: change concentrated in one module instead of scattered callers.

## Checks

1. Map current caller -> interface -> implementation -> persistence/runtime path.
2. Run the deletion test: if deleting the module removes complexity, it is
   likely middle-man; if complexity reappears across callers, it earns depth.
3. Classify dependencies before adding a seam:
   - in-process: deepen directly and test through the interface;
   - local-substitutable: use the real local substitute, not a mock layer;
   - remote-owned: define a port only when production and test adapters both
     earn the seam;
   - true external: inject the dependency and mock only that boundary.
4. Count adapters: one adapter is usually a hypothetical seam; two real adapters
   can justify a seam.
5. Prefer one direct domain model over adapter chains, duplicate read models, or
   compatibility aliases.
6. Test at the highest public seam that proves behavior; replace shallow tests
   with seam tests instead of layering both.
7. Reject tests that freeze file topology, prose, command lists, or ceremony.
8. Reject new abstractions without a runtime consumer, falsifier, and owner.
9. State the smallest design decision before editing.

## Output

- Current path:
- Decision:
- Consumer:
- Falsifier:
- Non-proof:
- Verification:

## Stop Condition

Stop when the current path, smallest design decision, owner, consumer,
falsifier, non-proof boundary, and verification command are all named.
