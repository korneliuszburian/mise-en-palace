---
name: domain-modeling
description: Use when changing or judging KRN terminology, public names, concept ownership, domain vocabulary, CLI/API wording, roadmap wording, or when the user flags logical divergence in names such as brain, memory, knowledge, source, activation, DecisionPacket, retained knowledge, pattern, card, normalized, final, or new.
---

# Domain Modeling

Keep KRN's language coherent across roadmap, Beads, code, CLI/API surfaces, and
store-backed knowledge. Resolve domain terms by changing the owning boundary,
not by creating another glossary file.

## Workflow

1. Pin the term or concept under dispute.
2. Map the current path:
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
   - `KRN_ROADMAP.md` only for compact architecture truth;
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

## Rejection Rules

- Do not create `CONTEXT.md`, ADRs, glossary docs, or markdown runbooks as a new
  authority surface.
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
