# IMR-17 Linked Document Acquisition Wording Repair

Status: complete.

Issue: `mise-en-palace-dad`.

## Executive Verdict

Knowledge-acquisition candidates now tell the operator to review linked document
evidence before opening new acquisition. This closes the IMR-16 burden: linked
SearchDocuments are no longer presented only as a count appended to a generic
missing-evidence request.

The repair is intentionally small. It changes readback wording and tests only.
It does not change retrieval, ranking, schema, crawler behavior, worker runtime,
API/MCP, source truth, or Memory Core.

## Scope

Changed:

- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts`
- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`
- this report;
- compact root plan/ledger state;
- Beads task graph.

## Source-To-Decision

- Source: IMR-16 candidate review and retained Autonomous Memory Agents source
  decision.
- Mechanism: acquisition candidates should escalate from existing/cheap evidence
  before opening new acquisition work.
- KRN implication: when linked document evidence exists, KRN should direct the
  operator to review it first.
- Decision: change acquisition evidence request wording to say
  `Review linked document evidence before opening new acquisition`.
- Rejection: no SearchDocument inclusion repair, ranking rewrite, schema,
  crawler, worker, API/MCP, source truth mutation, or Memory Core mutation.
- Consumer: heartbeat acquisition candidate readback and operator review.
- Falsifier: a candidate with linked document evidence still reads like generic
  acquisition work with no review-linked-evidence priority.

TypeScript boundary:

- Boundary: internal domain/readback string construction and CLI text output.
- `ts-boundary-unknown-first-result-state`: not directly applied; no new
  external input or JSON parse boundary was introduced.
- Public types: unchanged.
- Type-safety exceptions: none.

## Behavior

Before:

```txt
Linked document evidence: 5 source-claim document link(s), 5 linked SearchDocument(s).
```

After:

```txt
Review linked document evidence before opening new acquisition: 5 source-claim document link(s), 5 linked SearchDocument(s).
```

Live readback confirmed the full request now says:

```txt
Find or reject evidence for: included SearchDocument evidence for this combined
query; artifact-linked SearchDocuments are visible but were not included by
lexical retrieval. Recommended follow-up: Use the store-backed source/search
evidence cautiously; run catalog-backed brain search only when file-retained
pattern context is explicitly needed. Review linked document evidence before
opening new acquisition: 5 source-claim document link(s), 5 linked
SearchDocument(s). Preserve source, mechanism, KRN implication, consumer,
falsifier, and doesNotProve before promotion.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-dad --claim` | passed | Durable task was claimed before source edits. | Does not prove implementation quality. |
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview brainHeartbeatPreview` | passed | Worker candidate output covers the new linked-document wording. | Does not prove CLI rendering or product readiness. |
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI readback includes the new wording. | Does not prove source truth. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-7zt-brain-search.json --max-candidates 1 --json` | passed | Live operator-facing output uses the new wording. | Does not prove ranking quality or candidate promotion correctness. |
| `rtk pnpm run typecheck` | passed | Strict TypeScript compilation passes. | Does not prove semantic usefulness. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full local workspace tests pass. | Does not prove CI state. |
| `rtk pnpm quality:fallow:ci` | passed | Changed TS files are clean under Fallow. | Does not prove all possible cleanup is complete. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Next Bounded Action

Created:

```txt
mise-en-palace-fg9: Add cost-aware acquisition escalation preview.
```

Why: this is the next small product step from the retained Autonomous Memory
Agents mechanism. KRN should expose candidate-only escalation order from cheap
evidence review toward more expensive acquisition without autonomous execution
or truth mutation.

## Proof Boundary

Proves:

- linked-document candidate guidance is clearer;
- focused worker/CLI tests cover the readback;
- the live candidate output uses the new wording;
- no broad retrieval/source/memory mutation was added.

Does not prove:

- source truth;
- ranking quality;
- cost-aware acquisition implementation;
- autonomous worker safety;
- Memory Core usefulness;
- product readiness.
