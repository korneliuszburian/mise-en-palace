# ADR-0025: Dashboard Readiness Gate

Status: accepted

Date: 2026-06-25

## Context

F-02 asked whether KRN should build a dashboard after read models and readback
proof.

KRN currently has:

- D-03 read-model definitions for review burden, context ROI, and memory
  usefulness;
- F-00 typed `krn.run.readback.v1` JSON run readback;
- DB-backed evidence and dogfood reports;
- no dashboard package, no API package, and no UI runtime.

The risk is vanity UI: rendering state before KRN proves which operator action
the UI improves.

## Decision

Do not build a dashboard in F-02.

Accept dashboard work only after a future task proves at least one view has:

- owner;
- data source;
- action threshold;
- operator action;
- stale/unknown state behavior;
- proof that the view reduces review burden or decision latency;
- read-only boundary over typed read models;
- no Memory Core or source-decision mutation path.

## Current View Assessment

| Candidate view | Status | Reason |
| --- | --- | --- |
| Review burden view | promising, not UI-ready | D-03 defines fields and actions, but no implemented aggregate helper or repeated operator-use proof exists. |
| Context ROI view | not UI-ready | Classification still depends on dogfood report evidence and remains unknown for many runs. |
| Memory usefulness view | not UI-ready | Selected memory without application feedback must remain usefulness unknown. |

## Accepted Next Work

Before dashboard UI, the next valid implementation should be one of:

1. pure read-model helpers over existing aggregates;
2. CLI/readback output for one action-oriented read model;
3. a dogfood report proving an operator action was faster or less risky because
   of that read model.

## Rejected Alternatives

- Add dashboard package now.
- Add API solely to serve a dashboard.
- Render aggregate metrics without action thresholds.
- Treat dashboard as product proof.
- Add write actions from dashboard to Memory Core or source decisions.

## Falsifier

If operators repeatedly spend material time reconstructing review burden,
context ROI, or memory usefulness from DB/readback output, and a single
read-only view with a named action can reduce that burden, reopen dashboard work
with a first-view implementation slice.

