# ADR-0013: Observation Is Staging, Not Memory Core

Status: Accepted

Date: 2026-06-23

## Context

ADR-0011 accepted observational memory as a staging layer. The repo reset keeps
that direction, but removes any reading that observation, reflection, workers,
or audit surfaces are an autonomous brain or a direct Memory Core writer.

KRN's kernel spine remains:

```txt
raw evidence -> observation -> reflection -> candidates -> reviewed promotion
```

Observation is useful only when it makes run evidence easier to select and
review. It is not durable guidance for future work until it passes explicit
reflection and review gates.

## Source Decision

source: `docs/decisions/ADR-0011-observational-memory-as-staging-layer.md`
mechanism: defines observation as source-ranged temporal staging and rejects
reflection auto-promotion.
KRN implication: keep observation/reflection, but do not let them become Memory
Core or an autonomous consolidation runtime.
decision: adopt and narrow as the reset doctrine.
rejection: do not copy any "living brain", dreaming, self-healing, or
auto-promotion framing.
falsifier: an observe or reflect path writes `MemoryRecord`, `AntiMemoryRecord`,
`SourceDecision`, policy, or eval truth without a review gate.

source: `docs/reviews/repo-reset-audit/FULL_REPO_AUDIT.md`
mechanism: verifies current observe/reflect paths are deterministic,
source-ranged, and non-mutating, but warns that naming can overclaim authority.
KRN implication: preserve the mechanism and remove inflated authority.
decision: adopt.
rejection: do not delete observation/reflection as if they were QG-06 style
audit machinery.
falsifier: docs or CLI help describe observation/reflection as autonomous
memory consolidation.

## Decision

Observation is event-derived staging.

Truth-bearing observations require source ranges. Raw evidence remains
canonical for exact claims. An observation may summarize, index, group, or
prioritize evidence, but it must keep a recall path to the raw run event,
source chunk, diff, tool trace, review assessment, or feedback delta.

Observation cannot mutate Memory Core. It cannot create, promote, invalidate,
or rewrite `MemoryRecord` or `AntiMemoryRecord`. It cannot approve source
decisions, policy, or eval truth.

Reflection is candidate/reporting work. It may create or propose reviewable
candidates only when the relevant writer exists and the review gate remains
explicit. Reflection cannot bypass MemoryReviewGate or source-decision review.

Observation prefix is a bounded activation artifact. It is selected under a
budget, excludes unsourced truth-bearing items, carries warnings/exclusions,
and must not grow into an unbounded context dump.

Metadata is not authority. Observation prefix, prefix gate, and activation
abstention are typed context fields. Persisted metadata may carry debug
snapshots, but runtime selection and review decisions must not depend on
generic metadata keys.

## Consequences

- P3-01 must prove factual observations without source ranges are rejected.
- P3-01 must prove observe/reflect paths do not create Memory Core records.
- P3-01 must prove unsourced observation prefix items are rejected.
- P3-02 may add candidate creation from reflection only as reviewed candidate
  staging, not automatic promotion.
- Worker/runtime slices must not claim background consolidation before explicit
  job contracts define allowed and forbidden writes.

## Rejections

- observation as Memory Core;
- reflection as direct promotion;
- autonomous consolidation loops;
- hidden observer/reflector workers;
- markdown or `.krn/**` runtime memory;
- unbounded observation prefix;
- unsourced factual observations;
- treating debug metadata snapshots as runtime authority.

## Verification

This ADR is upheld when:

- truth-bearing observation writers require source ranges;
- observe CLI output keeps `Memory mutation: none`;
- reflect CLI output keeps `MemoryRecord created: no`;
- reflection outputs remain records, reports, or reviewable candidates;
- activation rejects unsourced observation prefix items;
- exact claims can recall raw evidence.

This ADR is violated when:

- observation/reflection creates Memory Core truth directly;
- observation prefix bypasses source ranges or budget;
- metadata keys become the decision source for observation prefix, prefix gate,
  activation abstention, or candidate identity;
- docs describe observation/reflection as autonomous memory, dreaming, or
  self-healing behavior.
