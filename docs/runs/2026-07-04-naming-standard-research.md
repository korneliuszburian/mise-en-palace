# Naming Standard Research

## Slice

Bead: `mise-en-palace-td3u`

Objective: turn the operator's naming concern into an enforceable KRN standard,
not a broad rename sweep.

## Sources

- Matt Pocock `skills`: shared language helps agents navigate a codebase and
  keeps variables, functions, and files consistent.
- Google TypeScript style guide: names should be descriptive and clear to a new
  reader.
- TypeScript contributor guidelines: coding/naming guidelines belong near the
  review workflow.
- Angular style guide: meaningful method/file names should reveal behavior and
  feature boundaries instead of hiding code under generic containers.
- Repo-local retained pattern `krn-brain-layer-model-boundary`: KRN is governed
  RAG/memory/source/review around Codex; no vanity rename or helper extraction
  sweep.

Mapped source decisions were added to `docs/KRN_SOURCES.md`.

## Current-State Audit

Commands:

```txt
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "naming standard no vanity rename helper extraction rule"
rg "\b(normalized|normalize|normalizes|normalizing|final|new|legacy|compatibility)\b" packages -g'*.ts'
rg "\b(helper|helpers|utils|common|manager|processor|handler|service)\b" packages -g'*.ts'
rg --files packages | rg "(helper|helpers|utils|common|manager|processor|handler|service|normalized|final|new|legacy|compatibility)"
rg "bindingKinds|PolicyGateBinding|CapabilityBinding|SkillBinding|RulePackBinding" packages/core/src/capabilityPlan.ts packages -g'*.ts'
```

Findings:

- The retained brain pattern is selected for the naming/helper query and already
  carries the no-vanity/no-fake-helper rule.
- The independent-review residual about orphaned CapabilityPlan binding types
  is stale: those types are no longer present in `packages/core/src/capabilityPlan.ts`.
- The independent-review residual about `searchVector` lacking
  `embeddingModelId` is already fixed: `DrizzleRetrievalRepository` requires an
  `embeddingModelId` for `searchVector` and `searchHybrid`.
- Most `normalized`/`legacy` hits are valid domain or compatibility language:
  review outcome canonicalization, legacy command row parsing, legacy CLI alias
  tests, and DB-only lifecycle status tests.
- `final` appears mostly in proof/report wording and tests. No production rename
  is justified by current evidence.
- `common.ts` under DB repositories is the strongest low-risk future rename
  candidate because it contains repository row guards, timestamp conversion, and
  unknown metadata readers. The name is understandable by local convention, but
  it hides the persistence-boundary responsibility.

## Decision

Adopt an anti-vanity naming gate in `docs/standards/code-vocabulary.md`.

The gate says a rename must pay rent by reducing review cost, removing duplicated
domain language, revealing authority boundaries, or making bugs easier to catch.
It explicitly rejects aesthetic-only renames, historical-doc cleanup, persisted
field churn, and broad grep-cleaning.

## Follow-Up Slices

Create bounded Beads instead of renaming in this slice:

1. Rename `packages/db/src/repositories/common.ts` only if accepted as a DB
   repository-boundary rename. Suggested replacement:
   `repositoryValueReaders.ts` or `repositoryRowGuards.ts`; choose after reading
   imports and deciding whether timestamp/metadata readers stay together.
2. Add a small invariant only if future naming drift repeats: Beads that include
   a naming change must name `evidence_ref`, `old name`, `new name`,
   `mechanism`, and `why not churn`.

## Proof

This slice proves:

- external naming/style sources were mapped through source-to-decision;
- the active code vocabulary standard now has a concrete anti-vanity gate;
- current-state scans were run before proposing renames;
- two stale residual audit claims were rejected with current code evidence.

## Non-Proof

This does not prove every KRN name is ideal, that broad naming sweeps are safe,
or that the future DB repository common-file rename is worth doing before
higher-product ROI work.
