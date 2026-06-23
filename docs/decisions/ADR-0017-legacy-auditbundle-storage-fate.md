# ADR-0017: Legacy AuditBundle Storage Fate

Status: accepted.

Date: 2026-06-24

Decision status: active demotion accepted; C6-02 later dropped empty legacy
tables through ADR-0018 and migration `0012_condemned_wolf_cub.sql`.

## Context

`krn audit` was removed as a product, guardrail, scanner, and internal quality
subsystem. The repo still had legacy `AuditBundle` domain types, Zod input
schemas, a Drizzle write repository, and `audit_bundles` / `audit_findings`
table definitions.

Current KRN evidence and review truth is carried by:

- `EvidenceBundle`;
- `ReviewAssessment`;
- `FeedbackDelta`;
- observations and reflection records;
- reviewed memory/source/anti-memory candidate paths.

Keeping an active `AuditBundle` write contract next to those paths creates a
second review-evidence surface with weaker command provenance and old
audit-authority naming.

## Source Decisions

source_id: `docs/KRN_KERNEL.md`
trust_tier: high
mechanism: the canonical spine already has
`ExecutionRun -> EvidenceBundle -> ReviewAssessment -> FeedbackDelta`.
krn_implication: review evidence belongs in that lineage, not a parallel audit
bundle contract.
decision: adopt.
does_not_prove: historical audit tables contain no rows or can be dropped
without data-retention review.
consumer: this ADR, C6-01, package exports, DB repository surface.
falsifier: a future run needs legacy `AuditBundle` writes and cannot express
the same evidence through EvidenceBundle/ReviewAssessment/FeedbackDelta.

source_id: root `PLAN.md` C6 active scope
trust_tier: high
mechanism: C6-01 exists to decide whether legacy AuditBundle storage/contracts
are deleted, renamed, or migrated into EvidenceBundle/ReviewAssessment lineage.
krn_implication: the decision must remove active audit authority, not wrap it in
more guardrails.
decision: adopt.
does_not_prove: the physical DB tables should be dropped in this same slice.
consumer: active queue snapshot and C6-01 implementation.
falsifier: `AuditBundle` remains a public core/schema/repository contract after
C6-01.

source_id: live package inventory
trust_tier: high
mechanism: `AuditBundle` code was reachable only through its own tests and
package barrels; no CLI, harness, memory, source, evidence, observation, or
reflection runtime consumed it.
krn_implication: removing the active domain/schema/repository contract does not
break current Memory Brain behavior.
decision: adopt.
does_not_prove: migration-retained tables are safe to drop from existing
databases.
consumer: package cleanup and verification.
falsifier: typecheck or tests reveal a real runtime consumer of `AuditBundle`.

## Decision

Remove active `AuditBundle` as a KRN contract.

Accepted changes:

- delete core `AuditBundle` domain types and verdict helpers;
- delete schema package `parseAuditBundleInput`;
- delete `DrizzleAuditBundleRepository`;
- remove public package exports for those contracts;
- keep table definitions only as explicitly named legacy migration-retention
  schema so existing migrations and databases are not destructively changed in
  this slice.

The temporary DB symbols were legacy table definitions, not a review authority,
not a write repository, and not product UX. C6-02 later found the target tables
empty and removed them with an explicit drop migration.

## Future Drop Preconditions

Dropping `audit_bundles`, `audit_findings`, and related enum types requires a
separate destructive migration slice with:

- row-count and sample provenance check in the target DB;
- confirmation that no required evidence exists only in those tables;
- rollback path or export/archive plan;
- generated migration review;
- DB readiness/check proof against the target environment.

## Rejections

- Keep `AuditBundle` as evidence container: rejected because KRN already has
  EvidenceBundle/ReviewAssessment/FeedbackDelta lineage.
- Add guardrails around `AuditBundle`: rejected because the audit surface itself
  is the wrong abstraction.
- Drop DB tables immediately: rejected because C6-01 did not inspect target DB
  row contents and the long-running objective preserves completed evidence.
- Migrate old rows automatically now: rejected because no live consumer needs
  the rows and no row-shape audit has been performed.

## Verification

This ADR is upheld when:

- `AuditBundle` is not exported by `@krn/core` or `@krn/schema`;
- `DrizzleAuditBundleRepository` is absent from `@krn/db` adapters;
- no CLI/help/runtime path exposes audit bundle writes;
- DB schema names remaining audit tables as legacy retention only;
- future table drops cite the preconditions above.

This ADR is violated when:

- new code writes legacy audit bundles;
- docs claim audit bundles are active evidence proof;
- `krn audit` returns as scanner, guardrail, or quality subsystem;
- destructive table drops happen without row/provenance review.
