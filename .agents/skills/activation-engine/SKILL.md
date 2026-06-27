---
name: activation-engine
description: Use when implementing or changing KRN context selection, retrieval candidate ranking, memory/source activation, context exclusions, trust filters, temporal filters, or context ROI behavior.
---

# Activation Engine

Use this skill to keep active context small, justified, and reviewable.

## Trigger

- A task needs memory/source retrieval, ranking, inclusion, exclusion, or
  abstention behavior.
- A change affects trust, time, lexical/vector/graph scores, or context budget.

## Workflow

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

Before changing scoring or widening recall:

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

## Output

- Query terms and filters.
- Ranked candidates.
- Context inclusions.
- Context exclusions.
- Abstention reason if applicable.
- Owner-file/read-model source or missing-read-model reason when relevant.
- Test or proof command.

## Forbidden

- Do not activate raw materials by default.
- Do not include context because it is nearby, recent, or long.
- Do not hide selection policy inside CLI, DB, or Codex adapter code.
- Do not omit exclusion records for rejected high-scoring candidates.

## Verification

Tests should prove high-signal inclusion, invalid/stale exclusion, source-safety
exclusion, budget behavior, and abstention for weak context.
