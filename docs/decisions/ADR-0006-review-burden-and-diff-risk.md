# ADR-0006: Review Burden And Diff Risk Are Product Metrics

Status: accepted.

## Context

Agent speed without review trust creates downstream cost.

## Decision

KRN treats review burden, diff risk, rollback path, test evidence, and reviewer
feedback as first-class product signals.

## Consequences

- Later `krn review capture` must emit typed evidence.
- Evals should arise from real traces and failures.
- Dashboard is later only if it drives action over typed objects.

