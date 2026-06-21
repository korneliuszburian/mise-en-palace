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

## Output

- Query terms and filters.
- Ranked candidates.
- Context inclusions.
- Context exclusions.
- Abstention reason if applicable.
- Test or proof command.

## Forbidden

- Do not activate raw materials by default.
- Do not include context because it is nearby, recent, or long.
- Do not hide selection policy inside CLI, DB, or Codex adapter code.
- Do not omit exclusion records for rejected high-scoring candidates.

## Verification

Tests should prove high-signal inclusion, invalid/stale exclusion, source-safety
exclusion, budget behavior, and abstention for weak context.
