# Goal: MM-01 — Observational Memory domain contracts

Context:
MM-00 is complete.

Commit:
80f9ef9 docs(memory): add observational memory ideal-state ADR and ledger

MM-00 established:
- Observational Memory is not Memory Core.
- Observations are event-derived, source-ranged, temporal staging records.
- Reflections may later create candidates, but must not mutate Memory Core directly.
- Raw evidence remains canonical for exact claims.
- Anti-memory is first-class.
- No chain-of-thought storage.
- No markdown runtime memory.
- No source crawler / worker / DB schema / CLI runtime in MM-00.

Task:
Implement MM-01 as a pure domain-contract slice only.

Add observational memory domain contracts in packages/core.

Required domain concepts:
- ObservationScope
- ObservationGroup
- ObservationItem
- ObservationSourceRange
- ObservationTemporalScope
- ObservationKind
- ObservationPriority
- ObservationConfidence
- ObservationStatus
- ObservationProvenanceKind
- optional entity/claim link types if needed by the existing core style

Required pure helpers:
- requiresObservationSourceRange(kind, provenanceKind)
- validateObservationContract(observation)

Rules:
- Observation is not MemoryRecord.
- Observation is not SourceClaim.
- Observation is not final truth.
- Observation cannot auto-promote to Memory Core.
- Factual, decision, correction, risk, procedure, conflict, slang, and gap observations require source ranges unless the provenance is explicitly local operator note or user preference.
- User preference/local operator note may omit source ranges only when explicitly marked.
- Observations must include confidence, status, priority, kind, scope, and temporal anchors.
- No chain-of-thought storage.
- No DB imports in core.
- No Drizzle imports in core.
- No Zod imports in core if schema package owns IO validation.
- No fs/process/network imports in core.
- No CLI/runtime behavior.
- No migrations.
- No workers.
- No dashboard/API/MCP/server/plugin/source crawler.
- No runtime markdown memory.

Suggested files:
- packages/core/src/observations/ObservationScope.ts
- packages/core/src/observations/ObservationSourceRange.ts
- packages/core/src/observations/ObservationTemporalScope.ts
- packages/core/src/observations/ObservationItem.ts
- packages/core/src/observations/ObservationGroup.ts
- packages/core/src/observations/observationKinds.ts
- packages/core/src/observations/observationPolicy.ts
- packages/core/src/observations/observationValidation.ts
- packages/core/src/observations/index.ts

Tests:
Add focused tests for:
- factual observation without source range is invalid
- user preference may omit source range only with explicit provenance
- observation cannot contain promotion-to-memory semantics
- no chain-of-thought field is accepted by validation helper
- source-range requirement matrix works for each ObservationKind

Verification:
- pnpm typecheck
- pnpm test
- git diff --check
- forbidden runtime surface/dependency scans
- staged scope check proves this is core-domain only

Stop condition:
MM-01 is complete when pure observation contracts and tests exist,
all verification passes, and no runtime/DB/worker/CLI surface is added.

Commit:
feat(core): add observational memory domain contracts
