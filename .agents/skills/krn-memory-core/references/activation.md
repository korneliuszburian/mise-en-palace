# Activation

Load this branch when a slice changes KRN context selection, retrieval ranking,
memory or source activation, temporal/trust filters, exclusions, abstention, or
context ROI.

## Invariants

1. Start from the task contract, expected use, and context budget.
2. Build signals from objective, constraints, non-goals, and acceptance proof.
3. Combine only available lexical, vector, graph, temporal, trust, and ROI
   signals; absence of a signal is not negative evidence.
4. Exclude invalidated, stale, unsafe, unsupported, or low-ROI candidates with
   a concrete reason.
5. Abstain when support is weak instead of padding the packet.
6. Emit inclusions and exclusions with intended use and evidence requirement.

For exact target owner files, load
[owner-file-read-model.md](owner-file-read-model.md). Prefer explicit read-model
evidence over broad lexical proximity. Repeated misses justify a bounded
read-model or eval repair, not an automatic scoring rewrite.

## Proof

Prove high-signal inclusion, invalid/stale or unsafe exclusion, budget behavior,
and abstention for weak support. Manual source inspection proves execution
knowledge, not that activation selected the owner file.
