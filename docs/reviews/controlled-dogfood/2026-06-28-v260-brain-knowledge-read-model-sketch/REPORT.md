# V260 Brain Knowledge Read Model Sketch

Status: complete.

Date: 2026-06-28.

## Executive Verdict

V260 added the minimum read-only knowledge card contract needed before future
web UI/search over KRN brain knowledge.

The new `BrainKnowledgeReadModel` in
`docs/architecture/observability-read-models.md` defines how sources,
decisions, patterns, memories, candidates, ADRs, standards, skills, and run
evidence can be surfaced without becoming a write path.

This is not UI work. It is the contract that prevents UI/search from becoming a
decorative dashboard or a mutation surface.

## Changed

- `docs/architecture/observability-read-models.md`
- `docs/reviews/controlled-dogfood/2026-06-28-v260-brain-knowledge-read-model-sketch/REPORT.md`
- compact active pointers in `PLAN.md`, `GOAL.md`, and `PLANS.md`

## Read Model Added

`BrainKnowledgeReadModel` includes:

- kind;
- status;
- title;
- summary;
- confidence;
- reviewability;
- source refs;
- evidence refs;
- consumers;
- falsifier;
- does-not-prove;
- temporal state;
- dissent/conflict state;
- next action.

## Source-To-Decision

- Source: user requirement for future UI/search, V257 retained pattern object,
  V258 enforcement gate, V259 skill routing, and ADR-0025 dashboard readiness
  gate.
- Mechanism: UI/search over brain knowledge needs read-only cards with evidence,
  source refs, reviewability, falsifier, and does-not-prove boundaries before
  any dashboard/API/MCP surface exists.
- KRN implication: the brain can become searchable only through typed read
  models, not raw reports or mutable memory shortcuts.
- Decision: add `BrainKnowledgeReadModel` as a docs/contract-only read model.
- Does not prove: UI exists, search works, API/MCP is ready, or product
  readiness.
- Consumer: V261 read-model contract guard and future UI/search implementation.
- Falsifier: future UI/search can display knowledge without source refs,
  evidence refs, consumer, falsifier, reviewability, or does-not-prove boundary.

## What This Proves

- KRN now has a minimal contract for future searchable brain knowledge cards.
- The contract is read-only and does not authorize dashboard/API/MCP work.
- UI/search readiness has a concrete gate instead of a vibe.

## What This Does Not Prove

- UI/search implementation;
- product readiness;
- real target transfer;
- broad knowledge ingestion;
- automatic ranking quality.

## Next Active Task

V261-00 Brain Knowledge Read Model Contract Guard.

Goal:

```txt
Add the smallest guard that fails if the BrainKnowledgeReadModel loses required
source/evidence/reviewability/falsifier/does-not-prove fields or if UI/search
work is authorized before the read-only contract is protected.
```
