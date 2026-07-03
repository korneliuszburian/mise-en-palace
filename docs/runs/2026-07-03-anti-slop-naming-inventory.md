# Anti-Slop Naming Inventory

## Scope

Inventory for `mise-en-palace-66jn`: find low-signal names such as
`normalized`, `final`, `new`, and `default`; rename only where the name hides
domain meaning and the blast radius is bounded.

## Renamed

| Old name | New name | Reason | Blast radius |
|---|---|---|---|
| `final_truth_target` | `non_candidate_target` | Reflection does not detect "final truth"; it blocks outputs targeting non-candidate authority objects such as `memory_record`. | Core reflection contract and focused harness/core tests. |
| `final_truth_metadata` | `forbidden_authority_metadata` | The violation is forbidden authority-writing metadata, not a final truth concept. | Core reflection contract and focused harness/core tests. |
| "final MemoryRecord target" wording | "direct MemoryRecord target/authority" wording | Keeps proof text aligned with the real mechanism. | Golden behavior/readback tests only. |

## Kept

| Name | Decision | Reason |
|---|---|---|
| `normalizedIntent` | keep | Persistent domain field and DB column. Rename would be schema/API churn. |
| `normalizedReviewOutcome` / `normalizedReviewRisk` | keep | Domain vocabulary for canonicalized review labels. |
| `default_template` | keep | Intentional weak evidence provenance with review-gate semantics. |
| `defaultBranch` | keep | Standard repository concept and DB field. |
| `defaultWorkspaceSlug` / `defaultProjectSlug` | keep for now | Repeated CLI fallback constants; naming is clear enough. Duplication may be addressed by a future CLI runtime helper, not a naming-only sweep. |
| `source-claim-new` test IDs | keep | Fixture IDs, not operator-facing semantics. |

## Follow-Up Candidates

- Revisit repeated CLI fallback constants only if a shared runtime helper slice is already touching those commands.
- Do not rename persisted DB columns or public domain fields without a migration/API decision.

## Proof Boundary

Proves: active reflection violation names no longer use the misleading
`final_truth_*` vocabulary.

Does not prove: all names in the repo are ideal, or that broad rename sweeps are
safe or valuable.
