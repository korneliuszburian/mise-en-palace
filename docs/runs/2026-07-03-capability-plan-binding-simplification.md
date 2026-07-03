# Capability Plan Binding Simplification

Date: 2026-07-03

## Verdict

CapabilityPlan no longer emits decorative binding-kind vocabulary such as
`policy_gate` or `tool_boundary`. Requirements now carry only the fields used by
the compiler and Codex adapter: kind, priority, reason, and required evidence.

## Behavior Change

- `CapabilityRequirement.bindingKinds` was removed.
- Weak-context routing now uses `context_abstention` instead of `policy_gate`.
- Codex skill routing remains unchanged in effect: context-abstention work still
  routes to `activation-engine`.

## Proof

- `pnpm --filter @krn/harness test -- compiler`
- `pnpm --filter @krn/codex-adapter test -- renderExecutionBrief codexBriefGoldenBehavior`
- `pnpm -w typecheck`

## Non-Proof

This does not prove capability-planning quality, Codex adherence, or product
readiness. It only removes an unused binding layer that made the brief look like
an enforced policy/tool-boundary subsystem existed.
