# IMR-35 Activation Utility Heartbeat Routing

Status: complete bounded source repair.

Issue: `mise-en-palace-6mn`.

## Executive Verdict

`krn heartbeat preview` now preserves `activationUtility` exploration evidence
from `krn brain search --json` readbacks in candidate-only knowledge acquisition
output. This closes the IMR-34 follow-up without ranking changes, schema
changes, worker automation, crawler work, API/MCP work, or Memory Core mutation.

## Source To Decision

```yaml
source_id: arxiv:2602.22406
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: U-Mem proposes a cost-aware acquisition cascade and semantic-aware
  Thompson sampling to preserve exploration when current memory is missing but
  linked evidence is useful.
krn_implication: KRN should not treat missing selected brain knowledge as low
  utility when source/link/graph evidence is useful; it should route the gap to
  candidate-only acquisition work.
decision_kind: adopt_candidate_only_followup
decision: preserve `activationUtilityEvidence` in heartbeat knowledge
  acquisition candidates for `linked_evidence_exploration_candidate` readbacks.
consumer: `krn heartbeat preview` and future bounded eval/golden candidates.
falsifier: heartbeat preview drops activationUtility evidence, mutates final
  truth, changes ranking, or treats the paper as product proof.
does_not_prove: source truth, ranking quality, semantic-aware Thompson sampling,
  autonomous learning, product readiness, worker runtime readiness, crawler
  readiness, or Memory Core mutation safety.
```

## Changed

- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts`
  - added `activationUtilityEvidence` to knowledge-acquisition requests and
    candidates;
  - included activation utility guidance in the candidate evidence request.
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
  - parses `activationUtility` from brain-search JSON only when verdict is
    `linked_evidence_exploration_candidate`;
  - renders activation utility evidence in text output.
- Focused tests cover:
  - candidate-only preservation;
  - text output visibility;
  - non-exploration verdict ignored;
  - mutation remains `none`.

## Live Readback

Readback files:

```txt
/tmp/krn-imr-35-activation-utility-heartbeat/brain-ama.json
/tmp/krn-imr-35-activation-utility-heartbeat/heartbeat-preview.json
/tmp/krn-imr-35-activation-utility-heartbeat/heartbeat-preview.txt
```

Observed:

```txt
activationUtility.verdict: linked_evidence_exploration_candidate
selectedKnowledge: missing
sourceLinkGraph: useful
knowledgeAcquisition candidates: 1
mutation: none
```

The emitted candidate includes:

```txt
activationUtilityEvidence.verdict: linked_evidence_exploration_candidate
activationUtilityEvidence.selectedKnowledge.strength: missing
activationUtilityEvidence.sourceLinkGraph.strength: useful
forbiddenWrites: memory_records, anti_memory_records, source_claims,
  source_decisions, source_claim_edges, eval_candidates, worker_jobs
```

## Proof Boundary

Proves:

- heartbeat preview can preserve activation utility exploration evidence from a
  current brain-search readback;
- the route stays candidate-only and mutation-free;
- non-exploration verdicts are not treated as exploration evidence;
- current tests/typecheck/full suite/Fallow pass locally.

Does not prove:

- source truth;
- answer correctness;
- activation ranking quality;
- semantic-aware Thompson sampling;
- autonomous acquisition;
- worker daemon readiness;
- product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview brainHeartbeatPreview` | passed | Worker candidate behavior preserves activation utility evidence and mutation boundary. | Does not prove CLI parsing or live DB state. |
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI readback parsing/rendering covers exploration and non-exploration verdicts. | Does not prove source truth or ranking quality. |
| `rtk pnpm run typecheck` | passed | TypeScript public boundaries compile under strict settings. | Does not prove runtime usefulness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full local test suite passes. | Does not prove CI or product readiness. |
| `rtk pnpm quality:fallow:ci` | passed | Fallow found no issues in changed JS/TS files. | Does not prove semantic correctness. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |
| `rtk pnpm db:ready` | passed | Current shell Postgres is reachable with migrations and pgvector. | Does not prove remote/CI DB state. |
| live `krn brain search --json` + `krn heartbeat preview --json/text` | passed | Current DB-backed readback routes activationUtility exploration evidence into heartbeat preview. | Does not prove autonomous memory learning or ranking quality. |

## Brain Usefulness

Verdict: positive.

KRN helped because IMR-34 selected the right next slice: route exploration
evidence into heartbeat preview instead of rewriting activation ranking. The
source-to-decision gate kept the AMA paper as a local hypothesis with a
falsifier, not a product claim.

Activation is still not proven as SOTA retrieval. This slice only improves the
candidate-only route for useful exploration evidence.

## Next

Do not open another guard-only task from this slice.

Recommended next bounded direction:

```txt
turn one heartbeat-routed activation utility candidate into a bounded eval/golden
candidate, or continue the vertical brain loop toward reviewed promotion/rejection
without changing ranking first.
```
