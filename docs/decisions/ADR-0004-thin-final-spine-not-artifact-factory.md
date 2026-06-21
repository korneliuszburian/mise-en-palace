# ADR-0004: Thin Final Spine, Not Artifact Factory

Status: accepted.

## Context

The previous direction produced artifacts faster than it proved a daily
workflow.

## Decision

KRN builds a thin final spine first: kernel contract, pattern selection, skills,
typed primitives, dry-run init, context packet, review capture, dogfood.

## Consequences

- No dashboard before typed objects.
- No broad benchmark lane before dogfood traces.
- No application code before kernel boundaries.
- Every new artifact must reduce ambiguity, review burden, or repeated failure.

