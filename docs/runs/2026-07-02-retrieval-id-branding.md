# Retrieval ID Branding

Date: 2026-07-02

## Summary

Added bounded soft-branded IDs for retrieval-owned persisted records and used
them in harness repository contracts.

This follows ADR-0020's soft-brand policy: raw strings remain assignable at DB,
CLI, and fixture boundaries, but already-typed retrieval IDs are no longer
mutually assignable. The slice deliberately avoids a whole-repo ID branding
migration and does not claim runtime validation.

## Changed

- Added core ID aliases:
  - `SearchDocumentId`
  - `EmbeddingModelId`
  - `EmbeddingId`
  - `RetrievalRunId`
  - `RetrievalCandidateId`
  - `ActivationDecisionId`
- Updated `ids.typecheck.ts` compatibility/separation proofs for the new
  retrieval ID family.
- Updated runtime string tests to confirm the new IDs remain plain strings at
  runtime.
- Updated harness repository retrieval records and inputs to use the new typed
  IDs where the persisted relationship is concrete.

## Source To Decision

```yaml
source_id: adr-0020-branded-domain-ids-plus-t8bi-audit
source: docs/decisions/ADR-0020-branded-domain-ids.md plus Beads issue mise-en-palace-t8bi and read-only subagent inspection
mechanism: Soft brands keep raw string compatibility while preventing already-typed IDs from being mixed across selected entity families.
krn_implication: Retrieval run, candidate, search document, embedding, and activation decision IDs cross repository boundaries often enough to deserve typed separation before broader runtime ID parsing exists.
decision_kind: adopt
decision: brand retrieval-owned persisted IDs and apply them to harness repository contracts; do not brand every ID family in one slice.
consumer: core ID contracts, harness retrieval repository contracts, DB repository typecheck
falsifier: a typed RetrievalRunId can still be assigned to SearchDocumentId or RetrievalCandidateId under package typecheck.
does_not_prove: raw strings are valid IDs, DB rows reference the intended entity, retrieval subjectType/subjectId pairs are semantically valid, runtime validation exists, or every persisted ID family should be branded.
```

## Proof

- `rtk pnpm -r --workspace-concurrency=1 --if-present typecheck`
- `rtk pnpm test`
- `rtk pnpm quality:fallow:ci`
- `rtk pnpm eval:brain-battle:smoke`
- `rtk git diff --check`
- `rtk pnpm -C packages/core typecheck`
- `rtk pnpm -C packages/harness typecheck`
- `rtk pnpm -C packages/db typecheck`
- `rtk pnpm -C packages/core test -- ids`
- `rtk pnpm -C packages/harness test -- contextHygieneInvariants`

## Non-Proof

- This does not add runtime ID parsers or hard opaque constructors.
- This does not change DB schema or migrations.
- This does not validate CLI/file/env/JSON IDs.
- This does not solve polymorphic `subjectType` + `subjectId` or source decision
  `targetType` + `targetId` semantics.
- This does not brand every remaining plain ID alias in `@krn/core`.
- Fallow still reports inherited duplication between retrieval repository input
  and record contracts; this slice does not refactor that ownership boundary.

## Second-Opinion Prompt

Review the diff after `docs/runs/2026-07-02-retrieval-id-branding.md`.

Act as a ruthless senior TypeScript reviewer. Challenge whether the selected
retrieval-owned ID family is the right first bounded repair under ADR-0020, or
whether the slice is still too performative because raw strings remain
assignable. Inspect `@krn/core` ID aliases, `ids.typecheck.ts`, harness
repository retrieval contracts, and DB repository typecheck fallout. Look for
casts, overbranding, missing public contract updates, schema/core drift, and
misleading proof language. Decide whether the next slice should brand
SourceArtifact/SourceChunk IDs, Task/Harness/Context spine IDs, add schema
runtime UUID parsers, or stop ID work and return to execution-brief/root-doc
cleanup. Provide exact files, risks, verification commands, and non-goals.
