# TypeScript Boundary Patterns

Status: active pattern catalog.

This file keeps retained TypeScript patterns small, decision-oriented, and
falsifiable. It is not a course transcript or broad research archive.

Structured retained-pattern sources live under `corpus/brain-knowledge/patterns/`
and are the producer input for `BrainKnowledgeReadModel` cards. Do not parse
this markdown as the runtime/card source.

## Pattern: Unknown-First External Boundary With Explicit Result State

```yaml
pattern_id: ts-boundary-unknown-first-result-state
name: Unknown-first external boundary with explicit result state
source_mechanisms:
  - source_id: typescript-narrowing-and-exhaustiveness
    ref: docs/KRN_SOURCES.md#typescript-narrowing-and-exhaustiveness
    trust_tier: high
    source_class: official docs
    mechanism: TypeScript narrowing makes finite union states explicit at behavior-changing branches.
  - source_id: total-typescript-designing-your-types
    ref: docs/KRN_SOURCES.md#designing-your-types
    trust_tier: medium
    source_class: high-quality public course page
    mechanism: Type design communicates domain logic and authority.
  - source_id: ts-reset
    ref: docs/KRN_SOURCES.md#ts-reset
    trust_tier: medium
    source_class: practitioner writing
    mechanism: unsafe platform defaults such as JSON.parse returning any should be narrowed at app boundaries, not trusted by domain logic.
  - source_id: v253-normalized-target-repair
    ref: docs/reviews/controlled-dogfood/2026-06-28-v253-normalized-target-repair-trial/REPORT.md
    trust_tier: high
    source_class: repo-local evidence
    mechanism: unknown-first parsing and discriminated result states repaired the normalized target boundary and added invalid-input tests.
  - source_id: v256-replayable-target-repair
    ref: docs/reviews/controlled-dogfood/2026-06-28-v256-replayable-target-repair-trial/REPORT.md
    trust_tier: high
    source_class: target-repo evidence
    mechanism: the same repair was replayed from a weak baseline in an isolated target.
solves_paradox: A target can pass happy-path tests while still letting untrusted JSON and nullable failure states leak into domain logic.
adoption_status: adopt_now
krn_primitive: pattern decision + future eval/golden candidate
implementation_boundary: external JSON/env/file/CLI/MCP/input parsing and result models whose failure states affect behavior
decision: External input boundaries should parse to unknown, narrow locally, and return explicit finite result states when callers need to distinguish success from invalid input.
consumer: V258 Pattern Enforcement Gate and future TypeScript target repair trials
falsifier: A replayable target repair can trust JSON.parse/fetch/env/CLI/file/MCP input directly or represent invalid input as null/boolean while still passing the pattern gate.
does_not_prove: Every function needs a discriminated union, broad rewrites are useful, ts-reset should be global, or product readiness is achieved.
candidate_output:
  type: EvalCandidate
  reviewability: ready
  content: "A target repair should fail the pattern gate if JSON.parse output reaches domain code without unknown narrowing, or if invalid external input is represented as null/boolean when callers need failure reasons."
source_usefulness_feedback:
  status: measured_with_evidence_capture
  outcome: helped
  reason: V253 and V256 used the pattern to repair the normalized weak TypeScript boundary.
  evidence_refs:
    - docs/reviews/controlled-dogfood/2026-06-28-v253-normalized-target-repair-trial/REPORT.md
    - docs/reviews/controlled-dogfood/2026-06-28-v256-replayable-target-repair-trial/REPORT.md
  does_not_prove: The pattern has transferred to unrelated real target repositories.
next_action: V258 should add the smallest falsifiable enforcement gate over the normalized target scenario.
```

## Application Checklist

Use this checklist only when the task touches an external input boundary.

- Does external data enter as `unknown` before domain use?
- Is narrowing near the IO boundary or at a named parser/type guard?
- Are valid finite states represented as literal or discriminated unions?
- If callers need failure reasons, is the result explicit instead of `null`,
  `false`, or broad thrown behavior?
- Do tests cover malformed input, missing required fields, and invalid finite
  states?
- Does evidence state what typecheck/tests prove and do not prove?

## Rejection Rules

Reject applying this pattern when:

- the value is already internal and typed by construction;
- a broad rewrite would touch unrelated APIs;
- failure states do not affect caller behavior;
- a smaller parser/test repair would prove the boundary more clearly.
