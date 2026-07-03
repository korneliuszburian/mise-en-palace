# Skill Surface Cull

## Decision

Keep repo-local skills only when they encode a concrete repeatable workflow that
Codex actually uses in this repository. Do not keep duplicate skills that only
make the architecture look larger.

## Inventory

Keep active:

- `beads`: durable task tracking and resume workflow.
- `brain-store-schema`: DB schema, migrations, repositories, and rollback risk.
- `typescript-type-safety`: strict TypeScript boundary work.
- `source-to-decision`: source mechanism, consumer, and falsifier gate.
- `activation-engine`: context selection, activation, exclusions, abstention.
- `evidence-review-loop`: command provenance and proof/non-proof capture.
- `target-repo-testing`: target checkout safety and write-authority boundary.
- `codex-adapter-plan`: bounded Codex brief rendering boundary.
- `handoff-compact`: compact continuation state after meaningful work.

Delete/demote:

- `target-infra-adr`: removed from the active skill surface. Its useful rule is
  already covered by `source-to-decision` plus ADR documents: source ->
  mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier.

## Proof

The active skill surface is smaller by one redundant skill. The active
invariants no longer require `target-infra-adr` as a skill, while ADR and
source-to-decision documents still carry the consumer-before-falsifier chain.

## Non-Proof

This does not prove every retained skill is permanent, runtime-load-bearing, or
product capability. It only removes the currently redundant ADR wrapper without
changing runtime behavior.
