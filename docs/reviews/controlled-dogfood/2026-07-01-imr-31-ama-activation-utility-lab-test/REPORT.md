# IMR-31 AMA Activation Utility Lab-Test

Status: complete bounded decision check, DB-backed readback.

## Executive Verdict

The AMA activation-utility hypothesis is ready for one bounded experiment, not
a ranking rewrite. Current KRN readbacks show the exact tension worth testing:
AMA-shaped natural queries can return `selectedKnowledge: 0` while the
source/brain readback still reports useful SourceClaim, linked SearchDocument,
and graph evidence. That maps to the paper's exploration/exploitation mechanism
as a local utility question: should activation utility consider useful linked
source evidence even when retained pattern cards are absent?

Next action: open bounded activation experiment `mise-en-palace-ff5`.

## Source To Decision

```yaml
source_id: arxiv:2602.22406
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: U-Mem proposes semantic-aware Thompson sampling to balance memory
  exploration and exploitation, alongside cost-aware acquisition.
krn_implication: KRN should lab-test whether activation utility needs to
  distinguish "no selected brain knowledge" from "useful linked source/graph
  evidence exists".
decision_kind: lab_test
decision: open one bounded activation utility experiment; do not change
  production ranking, add a semantic model, or claim AMA benchmark transfer.
consumer: future activation utility lab and source/brain readback evaluation.
falsifier: the experiment cannot produce a concrete case where selectedKnowledge
  misses but source/link/graph evidence is useful, or it cannot define a
  falsifiable utility signal without rewriting ranking.
does_not_prove: paper correctness, benchmark transfer to KRN, source truth,
  ranking quality, product readiness, or Memory Core mutation safety.
```

## Inputs

Retained local evidence:

- `docs/KRN_SOURCES.md#towards-autonomous-memory-agents`
- `docs/reviews/controlled-dogfood/2026-07-01-imr-29-ama-external-source-decision/REPORT.md`
- `docs/reviews/controlled-dogfood/2026-07-01-imr-30-ama-source-evidence-reuse/REPORT.md`

Tracked persisted AMA IDs from IMR-29/IMR-30:

```txt
SearchDocument: 9853097e-f496-4d5f-ba62-29ea8bca8288
SourceClaim: ea770eea-47c1-47c5-90ab-7bcd1a4bff3f
```

## Readback Results

| Query | Surface | Result | Interpretation |
|---|---|---:|---|
| `cost-aware acquisition` | `krn brain knowledge` catalog | 1 retained pattern | Cost-aware acquisition is retained and usable. |
| `activation utility` | `krn brain knowledge` catalog | 0 retained patterns | Activation utility is not yet retained as a pattern. |
| `exploration exploitation` | `krn brain knowledge` catalog | 0 retained patterns | AMA exploration/exploitation is not yet retained as brain knowledge. |
| `semantic-aware Thompson sampling exploration exploitation activation utility memory relevance` | source search | useful; 7 claims, 1 document, 7 links | Broad utility query finds useful KRN activation/source evidence, not direct AMA proof. |
| `Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling` | source search | partly useful; 8 claims, 0 docs, 8 links | Natural AMA query preserves linked evidence but misses included document evidence. |
| same natural AMA query | brain search | partly useful; 8 claims, 0 docs, 8 linked docs, `selectedKnowledge: 0` | Brain search preserves source evidence but selects no brain knowledge packet. |
| marker query with `krn-source-artifact-preview 328e164c8002a596` | source search | useful; 7 claims, 1 doc, 7 links | Persisted AMA document is retrievable when the artifact marker is present. |

## Decision

Open a bounded activation utility experiment.

The experiment should compare at least two candidate utility views:

```txt
selectedKnowledge-only utility:
  selectedKnowledge > 0 is treated as useful activation evidence.

source/link/graph evidence utility:
  useful answerUsefulness, linked SearchDocuments, SourceClaimDocumentLinks,
  and relationSupport may keep the candidate useful even when selectedKnowledge
  is 0.
```

The goal is not to implement semantic-aware Thompson sampling. The goal is to
create a small falsifiable local proxy for the same exploration/exploitation
question: when should KRN explore linked evidence instead of treating missing
selected knowledge as low-value activation?

## Rejected Paths

- No production ranking rewrite: the evidence is one bounded AMA-shaped case.
- No semantic model: current proof is lexical/readback evidence only.
- No crawler, worker daemon, API/MCP, DB schema, or Memory Core mutation.
- No broad benchmark: one focused experiment is enough for the next slice.
- No standalone eval candidate yet: the utility signal itself needs a small lab
  before it is worth turning into a durable eval.

## Next Issue

```txt
mise-en-palace-ff5: Run bounded AMA activation utility experiment.
```

Acceptance target:

```txt
show the AMA-shaped case where selectedKnowledge is zero but source/link/graph
evidence is useful; define utility signals and falsifier; decide whether linked
evidence should influence future activation utility candidates.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | Current shell can reach Postgres, 14/14 migrations, pgvector available. | Does not prove ranking quality or product readiness. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "cost-aware acquisition"` | passed; 1 result | Retained acquisition pattern is queryable from file catalog. | Does not prove activation utility pattern exists. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "activation utility"` | passed; 0 results | Activation utility is not currently retained under that text. | Does not prove no related pattern exists under other wording. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn source search --query "Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling" --json` | passed; partly useful, 8 claims, 0 docs, 8 links | Natural AMA query has linked evidence but missing included document evidence. | Does not prove source truth or ranking quality. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn brain search --query "Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling" --json` | passed; partly useful, 8 claims, 0 docs, 8 linked docs, `selectedKnowledge: 0` | Brain search can preserve useful linked source evidence even with no selected knowledge packet. | Does not prove how utility should be scored. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn source search --query "krn-source-artifact-preview 328e164c8002a596 semantic-aware Thompson sampling" --json` | passed; useful, 7 claims, 1 doc, 7 links | Persisted AMA document is retrievable with marker context. | Does not prove natural query inclusion is sufficient. |

## Proof Boundary

This slice proves that a bounded activation utility experiment is justified by
current KRN evidence. It does not prove the experiment outcome, source truth,
AMA benchmark transfer, production activation scoring quality, or product
readiness.
