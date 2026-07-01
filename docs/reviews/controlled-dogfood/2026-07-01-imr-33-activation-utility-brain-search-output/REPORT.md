# IMR-33 Activation Utility Brain Search Output

Status: complete bounded product-surface repair.

Issue: `mise-en-palace-4hu`.

## Executive Verdict

`krn brain search` now exposes activation utility readback directly in JSON and
text output. Operators can see whether the active result is driven by selected
brain knowledge or by useful source/link/graph evidence.

The live AMA-shaped query now reports:

```txt
selectedKnowledge: missing
sourceLinkGraph: useful
verdict: linked_evidence_exploration_candidate
```

This is not a ranking rewrite. It is a read-only operator surface that prevents
KRN from treating missing selected brain knowledge as the same thing as missing
evidence.

Next action: `mise-en-palace-mo4` measures whether this readback helps across a
small current query batch.

## Source To Decision

```yaml
source_id: arxiv:2602.22406
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: U-Mem proposes semantic-aware Thompson sampling to balance memory
  exploration and exploitation.
krn_implication: KRN should expose the exploration/exploitation signal before
  changing activation utility or ranking.
decision_kind: adopt_bounded_readback
decision: expose the existing activation utility lab readback in `krn brain
  search` output using existing selectedKnowledge and sourceSearch summary
  fields.
consumer: `krn brain search` JSON/text output and the next usefulness check.
falsifier: an AMA-shaped brain-search readback lacks activationUtility output,
  hides selectedKnowledge/source-link-graph strengths, or changes ranking while
  claiming to be read-only.
does_not_prove: paper correctness, benchmark transfer to KRN, source truth,
  ranking quality, semantic-aware Thompson sampling, product readiness, or
  Memory Core mutation safety.
```

## Scope

Changed:

- `packages/cli/src/runBrainSearchCommand.ts`
- `packages/cli/src/runBrainSearchCommand.test.ts`
- `packages/harness/src/activation/activationUtilityLab.ts`
- `packages/harness/src/activation/index.test.ts`
- compact root plan/ledger state
- Beads task graph

Not changed:

- activation ranking
- source search ranking
- semantic model
- crawler or worker daemon
- API/MCP
- DB schema
- source truth
- Memory Core state

## Behavior

New `krn brain search` JSON field:

```txt
activationUtility:
  selectedKnowledge:
    signal
    strength
    reasons
  sourceLinkGraph:
    signal
    strength
    reasons
  verdict
  recommendedNextAction
  doesNotProve
```

Text output now includes an `Activation utility:` section with the same
operator-facing proof boundary.

The `linked_evidence_exploration_candidate` recommendation is:

```txt
Review linked source/graph evidence as exploration context before treating
missing selected knowledge as low utility; do not change production ranking
without a bounded eval.
```

## Live Readback

Command output was written under:

```txt
/tmp/krn-imr-33-activation-utility-brain-search/
```

Natural AMA query:

```txt
Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling
```

Summary:

```json
{
  "selectedKnowledge": 0,
  "answerUsefulness": "partly_useful_missing_document",
  "supportingClaims": 8,
  "supportingDocuments": 0,
  "sourceClaimDocumentLinks": 8,
  "linkedSearchDocuments": 8,
  "relationSupport": 6,
  "activationUtilityVerdict": "linked_evidence_exploration_candidate",
  "access": "read_only",
  "mutation": "none"
}
```

## Decision

Accept the readback surface.

This closes the immediate operator-facing gap from IMR-32. The next step is a
bounded usefulness check across a small query batch before considering any
eval/golden candidate or ranking work.

## Next Issue

```txt
mise-en-palace-mo4: Run activation utility readback usefulness check.
```

Acceptance target:

```txt
small brain-search batch records selectedKnowledge counts, source/link/graph
strengths, activationUtility verdicts, helped/neutral/noise/missing
classification, and one decision; no ranking rewrite or new subsystem.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` | passed | CLI output tests cover activationUtility JSON/text surfacing. | Does not prove live DB contents or ranking quality. |
| `rtk pnpm --filter @krn/harness test -- activation` | passed | Harness helper controls still pass after operator-facing wording update. | Does not prove CLI behavior by itself. |
| `rtk pnpm run typecheck` | passed | TypeScript project references compile with the new CLI/harness imports and exported types. | Does not prove runtime usefulness. |
| `rtk pnpm db:ready` | passed | Current shell can reach Postgres, migrations are applied, and pgvector is available. | Does not prove remote DB or product readiness. |
| live `krn brain search --json` AMA query | passed | Current brain-search output exposes activationUtility with the expected selectedKnowledge miss and useful source/link/graph signal. | Does not prove source truth, ranking quality, or semantic-aware Thompson sampling. |

## Proof Boundary

Proves:

- `krn brain search` exposes activationUtility in JSON output;
- text output includes an activation utility section;
- the live AMA-shaped query reports selectedKnowledge missing and
  source/link/graph useful;
- the slice remains read-only and does not mutate KRN state.

Does not prove:

- AMA paper correctness;
- benchmark transfer;
- source truth;
- activation ranking quality;
- semantic-aware Thompson sampling;
- product readiness;
- Memory Core mutation safety;
- usefulness across a query batch.
