---
name: domain-modeling
description: Use when changing or judging KRN terminology, public names, concept ownership, domain vocabulary, CLI/API wording, roadmap wording, or when the user flags logical divergence in names such as brain, memory, knowledge, source, activation, DecisionPacket, retained knowledge, pattern, card, normalized, final, or new.
---

# Domain Modeling

Keep KRN's language coherent across `CONTEXT.md`, `CONVENTIONS.md`, roadmap,
Beads, code, CLI/API surfaces, and store-backed knowledge. Resolve domain terms
by updating the smallest durable owner.

## Trigger

Use when a term, public name, concept boundary, roadmap phrase, CLI/API wording,
or retained-knowledge vocabulary changes or looks logically inconsistent.

## Steps

1. Pin the term or concept under dispute.
2. Map the current path:
   - `CONTEXT.md` for shared operating vocabulary;
   - `CONVENTIONS.md` for skill/artifact rules;
   - `KRN_ROADMAP.md` for product architecture language;
   - the active Beads issue for current work scope;
   - exported types, CLI commands, readbacks, schemas, and tests that expose the term;
   - `AGENTS.md` only when the term affects agent behavior.
3. Classify the term:
   - product language: what operators see;
   - domain model: durable code concept;
   - storage detail: table/column/repository mechanics;
   - technical generic: regex pattern, path pattern, parser normalization, etc.;
   - stale vocabulary: old scaffold, migration residue, or temporary name.
4. Choose one canonical term at the highest honest boundary.
5. Update the owner:
   - code export when the term is a runtime/domain concept;
   - `CONTEXT.md` when the term is shared operating vocabulary;
   - `CONVENTIONS.md` when the term defines a skill/artifact rule;
   - `KRN_ROADMAP.md` only for compact product or architecture direction;
   - Beads for follow-up work or dependency edges;
   - store-backed memory/source/eval candidates when the term must be learned at runtime.
6. Remove stale public terms in the same slice when safe. Do not hide them behind
   local aliases or migration fallbacks unless a staged rollout is required.
7. Verify by grepping the rejected term and running the smallest behavior/type
   checks that touch the changed boundary.

## KRN Naming Rules

- Product/UI/readback language may say `brain` when it helps operators understand
  the system.
- Durable retained knowledge in code is `knowledge`, not `pattern card`.
- Use `memory` for temporal store/lifecycle behavior: promotion, demotion,
  staleness, feedback, forgetting, and activation.
- Use `source` for provenance, authority, claims, support, decisions, and
  rejected paths.
- Use `DecisionPacket` only for the bounded task-facing packet emitted to Codex.
- Keep technical uses of `pattern` when they are literal regex/path/search
  patterns, not retained brain knowledge.

## Context And ADR

- For context format, read `references/context-format.md`.
- For ADR format, read `references/adr-format.md`.
- Update `CONTEXT.md` immediately when a shared operating term is resolved.
- Update `CONVENTIONS.md` when the decision changes skill shape, artifact
  ownership, planning modes, review rules, or debugging rules.
- Offer an ADR only when the decision is hard to reverse, surprising without
  context, and the result of a real trade-off.
- Keep ADRs compact and link the consumer, falsifier, and verification path when
  those are not obvious from the decision text.

## Forbidden

- Do not use `CONTEXT.md`, `CONVENTIONS.md`, ADRs, or markdown runbooks as task
  ledgers, runtime memory, or substitutes for implemented behavior.
- Do not preserve bad exported names with local aliases.
- Do not rename storage details into product terms when only repository plumbing
  is involved.
- Do not turn a terminology concern into a broad refactor unless the public
  boundary actually leaks the wrong concept.
- Do not write tests that only freeze vocabulary. Prefer existing behavior tests,
  typecheck, Fallow, and targeted `rg` proof for rejected terms.

## Source-To-Decision

When external writing, papers, or reference implementations influence a term,
record the decision in this shape:

```yaml
source:
mechanism:
krn_implication:
decision:
rejection:
consumer:
falsifier:
does_not_prove:
```

## Output

- Term:
- Current path:
- Canonical language:
- Decision:
- Owner:
- Consumer:
- Falsifier:
- Verification:

## Stop Condition

Stop when the canonical term is owned at the highest honest boundary, stale
public terms are removed or explicitly deferred, and `rg` plus the smallest
type/behavior check prove the rejected vocabulary is not still active.

## Verification

Verify by grepping rejected terms and running the smallest type/behavior checks
that touch the renamed or re-owned boundary.
