# IMR-32 AMA Activation Utility Experiment

Status: complete bounded harness lab proof.

Issue: `mise-en-palace-ff5`.

## Executive Verdict

The AMA activation utility hypothesis is locally testable without changing
production ranking. A focused harness helper now compares two deterministic
signals:

```txt
selectedKnowledge utility
source/link/graph evidence utility
```

The current AMA-shaped readback reproduces the useful gap from IMR-31:
`selectedKnowledge` is empty, while source/link/graph evidence remains useful.
The result is classified as a `linked_evidence_exploration_candidate`, not as a
ranking mandate.

Next action: expose this readback in `krn brain search` output through
`mise-en-palace-4hu`.

## Source To Decision

```yaml
source_id: arxiv:2602.22406
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: U-Mem proposes semantic-aware Thompson sampling to balance memory
  exploration and exploitation.
krn_implication: KRN should distinguish missing selected brain knowledge from
  useful linked source/graph evidence before considering activation utility
  changes.
decision_kind: bounded_lab_helper
decision: add a deterministic harness helper and tests for the local utility
  proxy; do not change production ranking.
consumer: future `krn brain search` activation utility readback and evaluation
  candidates.
falsifier: the helper cannot classify a selectedKnowledge miss with useful
  linked evidence as distinct from insufficient evidence, or future brain-search
  readback cannot reproduce the same signal.
does_not_prove: paper correctness, benchmark transfer to KRN, source truth,
  ranking quality, semantic-aware Thompson sampling, product readiness, or
  Memory Core mutation safety.
```

## Scope

Changed:

- `packages/harness/src/activation/activationUtilityLab.ts`
- `packages/harness/src/activation/index.ts`
- `packages/harness/src/activation/index.test.ts`
- compact root plan/ledger state
- Beads task graph

Not changed:

- production activation ranking
- semantic model
- crawler or worker daemon
- API/MCP
- DB schema
- source truth
- Memory Core state

## Lab Input

The current DB-backed summary used by the test fixture:

```json
{
  "selectedKnowledge": 0,
  "answerUsefulness": "partly_useful_missing_document",
  "supportingClaims": 8,
  "supportingDocuments": 0,
  "sourceClaimDocumentLinks": 8,
  "linkedSearchDocuments": 8,
  "relationSupport": 6,
  "mutation": "none",
  "access": "read_only"
}
```

The helper computes `source/link/graph evidence count = 30` for this case and
returns:

```txt
verdict: linked_evidence_exploration_candidate
recommendedNextAction: Run a bounded activation utility experiment before changing production ranking.
```

Control cases also prove:

- selected brain knowledge remains the primary signal when present;
- absent selected knowledge plus absent linked evidence stays
  `insufficient_evidence`.

## Decision

Accept the bounded lab helper.

This is enough to prove the local activation utility question is concrete and
falsifiable. It is not enough to change production ranking. The next product
step is a small operator-facing readback in `krn brain search`, not a scoring
rewrite.

## Next Issue

```txt
mise-en-palace-4hu: Expose activation utility readback in brain search output.
```

Acceptance target:

```txt
brain-search output exposes selectedKnowledge/source-link-graph strengths,
verdict, recommended next action, and doesNotProve for the AMA-shaped
selectedKnowledge miss; focused tests cover the readback; no production ranking
rewrite or new subsystem.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current shell can reach Postgres, migrations are applied, and pgvector is available. | Does not prove remote DB or product readiness. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn brain search --query "Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling" --limit 12 --max-inclusions 8 --json` | passed | Current brain-search readback has `selectedKnowledge: 0` while source/link/graph evidence is useful. | Does not prove source truth or ranking quality. |
| `rtk pnpm --filter @krn/harness test -- activation` | passed | Focused activation tests cover the new helper and existing activation behavior. | Does not prove CLI surfacing or production ranking quality. |

## Proof Boundary

Proves:

- the AMA-shaped selectedKnowledge miss has useful linked evidence in current
  readback;
- a deterministic harness helper can classify that as an exploration candidate;
- the helper preserves insufficient-evidence and selected-knowledge-sufficient
  controls;
- no production ranking rewrite is required for this slice.

Does not prove:

- AMA paper correctness;
- benchmark transfer;
- source truth;
- semantic-aware Thompson sampling implementation;
- production activation scoring quality;
- graph retrieval quality;
- product readiness;
- Memory Core mutation safety.
