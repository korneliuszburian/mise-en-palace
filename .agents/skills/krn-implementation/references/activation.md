# Activation

Use this reference when implementation changes KRN context selection, retrieval
candidate ranking, memory/source activation, owner-file/read-model recall,
context exclusions, trust filters, temporal filters, abstention, or context ROI.

## Procedure

1. Start from the task contract and context budget.
2. Build query terms from task objective, constraints, non-goals, and
   acceptance evidence.
3. Rank candidates with lexical, vector, graph, temporal, trust, and context
   ROI signals when available.
4. Exclude invalidated, stale, unsafe, unsupported, or low-ROI candidates with a
   concrete reason.
5. Abstain when context is weak instead of padding the packet.
6. Emit inclusions and exclusions with expected use and evidence requirement.

## Owner-File Recall Gate

Use this gate when a task targets a repo, package, source root, CLI command,
test, or behavior with likely owner files.

1. Check whether the task contract, target init/connect data, run readback, or
   source seeds provide exact owner-file signals.
2. Prefer explicit owner-file/read-model evidence over broad lexical proximity.
3. If exact owner-file data is missing, emit a missing-read-model or abstention
   reason instead of inventing files.
4. Use manual source inspection only as execution evidence, not as proof that
   activation selected the owner file.
5. Turn repeated owner-file misses into a bounded read-model/eval/skill repair,
   not a broad activation scoring rewrite.

Does not prove:

- activation scoring is wrong;
- filesystem crawling is needed;
- broad target repo inference is safe.

## Verification

Tests should prove high-signal inclusion, invalid/stale exclusion,
source-safety exclusion, budget behavior, and abstention for weak context.
