# Live Dogfood At Scale: Brain Informs The adopt --link Implementation

Status: operator-driven dogfood run. Date: 2026-07-05. Related Bead:
`mise-en-palace-p722`. Follows: `2026-07-05-live-dogfood-recall-teach-loop.md`.

This is a fuller live dogfood than slice 3: while implementing a real repo
feature (the `krn source decision adopt --link` convenience, `mise-en-palace-hkxb`),
the operator queried the brain (`krn source search`) before and during the work
and let the surfaced governing decisions shape the implementation.

## Queries And Surfaced Governing Decisions

`krn source search --query "..." --json` against the persistent real-claim
corpus (effective knowledge 17 claims-with-edge after slice 4):

| Task framing | Surfaced governing decision |
| --- | --- |
| "how should a KRN CLI command parse external arguments and JSON input" | TypeScript external JSON/env/file/CLI/MCP inputs should enter as unknown and narrow near the boundary. |
| "what evidence must a source decision adoption carry" | Retained KRN knowledge must preserve source, mechanism, KRN implication, decision or rejection, consumer, falsifier, does-not-prove boundary. |
| "how should source decision link edges be represented" | Temporal relations are edges between source claims; an edge never makes the newer claim globally true by itself. |

## How The Surfaced Decisions Shaped The Implementation

- **Unknown-first input boundary.** The `adopt --link` command takes external
  CLI args. Rather than casting raw args into an edge record, the implementation
  routes them through `parseSourceDecisionEdgeInput` (the core validator), which
  narrows `--link-target-type`/`--link-confidence` against typed enums and
  applies defaults. That is the surfaced unknown-first boundary honored in
  practice, not just documented.
- **Retained-knowledge evidence gate.** The surfaced gate lists the evidence a
  retained decision must carry. `adopt` already requires `--decision`
  `--rationale` `--falsifier` `--consumer`; the `--link` path inherits the same
  required-evidence contract, so a combined adopt+link cannot silently produce
  an under-evidenced decision.
- **Edge semantics.** The surfaced temporal-edge decision says an edge
  interprets rather than asserts global truth. The combined command emits a
  `SourceDecisionEdge` with explicit `targetType`/`confidence`/`notes` and a
  `doesNotProve` boundary, consistent with that semantics - it does not claim
  the linked target is true.

## Honest Note

This is single-operator dogfood on a curated corpus, not a blind test. The
surfaced decisions largely CONFIRMED boundaries the code already honored
(because the repo is self-consistent), rather than revealing a new constraint
that changed the design. The value demonstrated is that the brain's recall
surfaces the RIGHT governing decisions for a real framing on the first query,
so an operator implementing a sibling feature lands on the relevant standards
without rereading docs. It does not prove the brain would change a decision a
human would otherwise get wrong.

## Proof Boundary

Proves:

- the brain surfaces the relevant governing decisions (input boundary,
  evidence gate, edge semantics) for a real implementation task's framings,
  via the live DB and product CLI, and the operator could tie each surfaced
  decision to a concrete place in the new code.

Does not prove:

- live Codex adherence;
- that the brain changed a decision the operator would otherwise have gotten
  wrong (here it confirmed existing boundaries);
- broad advantage, recall completeness, or product readiness.
