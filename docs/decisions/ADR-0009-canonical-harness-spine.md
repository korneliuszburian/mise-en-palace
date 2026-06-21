# ADR-0009: Canonical Harness Spine And Adapter Boundary

Status: accepted.

## Context

The second-opinion architecture verdict corrects the next typed-model run. It
is authoritative before executing any later `PLAN.md`-style implementation.

## Decision

The canonical KRN spine is:

```text
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> ExecutionContract
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> MemoryCandidate / SourceDecision / EvalCandidate
```

`ContextPacket` may exist only as a materialized artifact rendered from
`ContextAssembly`. It is not the central domain model.

`requiredSkills` is not a field on `TaskContract`, `ContextAssembly`, or
`ContextPacket`. Core represents skill needs as `CapabilityRequirement`. The
Codex adapter layer maps those requirements to `CodexSkillBinding`.

Core owns the harness model, pure use cases, and ports. CLI commands are
adapters only. Memory Core and source graph contracts/ports exist in the first
typed model, but store implementations are out of scope.

## Consequences

- `packages/core` owns the harness model, `renderContextPacket`, Memory Core
  port, and source graph port.
- `packages/codex-adapter` owns `CodexAdapterPlan`,
  `CodexSkillBinding`, and the capability-to-skill binding mapper.
- Golden fixture coverage starts with the full spine from operator intent to
  feedback delta.
- Researcher layer, dashboard, MCP server, plugin package, broad eval suite,
  and runtime markdown memory remain out of scope.

