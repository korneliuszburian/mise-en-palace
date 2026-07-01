# IMR-18 Cost-Aware Acquisition Escalation Preview

Status: complete.

Issue: `mise-en-palace-fg9`.

## Executive Verdict

Knowledge-acquisition candidates now expose a deterministic candidate-only
cost-aware escalation preview. The output orders acquisition work from cheap
evidence review to more expensive review paths without executing tools,
starting workers, changing ranking, changing schema, mutating source truth, or
mutating Memory Core.

For linked-document candidates, the live preview starts with
`linked_document_review`, then falls back to `source_search_review`,
`bounded_external_research`, and `human_review`. For missing-evidence-only
candidates, focused tests prove the preview starts at `source_search_review`.

## Scope

Changed:

- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts`
- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`
- this report;
- compact root plan/ledger state;
- Beads task graph.

No autonomous execution, crawler, worker daemon, API/MCP, ranking rewrite, DB
schema, source truth mutation, or Memory Core mutation was added.

## Source-To-Decision

- Source: `Towards Autonomous Memory Agents`, IMR-17 linked-document wording
  repair, and live heartbeat preview evidence.
- Mechanism: useful memory acquisition should escalate from cheaper available
  evidence toward more expensive sources only when the cheaper path is
  insufficient.
- KRN implication: KRN acquisition candidates need a candidate-only escalation
  order that is visible to operators before any acquisition work begins.
- Decision: add typed `acquisitionEscalationPreview` steps to knowledge
  acquisition candidates and render them in CLI output.
- Rejection: no autonomous acquisition execution, crawler, worker daemon,
  ranking rewrite, DB schema, API/MCP, source truth mutation, or Memory Core
  mutation.
- Consumer: heartbeat acquisition candidate readback and operator review.
- Falsifier: candidates with missing or weak evidence do not show a reviewable
  low-cost-to-high-cost escalation order.

TypeScript boundary:

- Boundary: internal domain/readback type and CLI text rendering.
- Public type surface: `@krn/workers` exports explicit escalation step types via
  the existing package barrel.
- External input parsing: unchanged.
- Type-safety exceptions: none.

## Behavior

New candidate field:

```txt
acquisitionEscalationPreview:
  - linked_document_review | cost: low
  - source_search_review | cost: low
  - bounded_external_research | cost: medium
  - human_review | cost: high
```

If no linked document evidence exists, the first step is
`source_search_review`.

Live linked-document readback:

```txt
candidate: knowledge-acquisition-heartbeat:readback-brain-search-local-artifact-preview-can-carry-governed-source-claims:missing_evidence
step 1: linked_document_review | low
step 2: source_search_review | low
step 3: bounded_external_research | medium
step 4: human_review | high
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-fg9 --claim` | passed | Durable task was claimed before source edits. | Does not prove implementation quality. |
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview brainHeartbeatPreview` | passed | Worker candidate output covers linked-document-first and missing-evidence-only escalation previews. | Does not prove CLI rendering or source truth. |
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI text output renders escalation preview. | Does not prove operator usefulness. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable with migrations and pgvector. | Does not prove remote DB state. |
| `rtk pnpm --filter @krn/cli krn brain search ... --json` | passed | Live DB-backed readback produced the candidate input. | Does not prove ranking quality. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview ... --json` | passed | Live candidate output includes escalation preview with `mutation: none`. | Does not prove candidate promotion correctness. |
| `rtk pnpm run typecheck` | passed | Strict TypeScript compilation passes. | Does not prove product value. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full local workspace tests pass. | Does not prove CI state. |
| `rtk pnpm quality:fallow:ci` | passed | Changed TS files are clean under Fallow. | Does not prove no future cleanup remains. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Next Bounded Action

Created:

```txt
mise-en-palace-ghj: Review cost-aware acquisition escalation outcome.
```

Reason: the next useful loop is not another feature. Review one live
cost-aware candidate, decide if the escalation order reduces review burden, and
choose no-op or one bounded repair from evidence.

## Proof Boundary

Proves:

- acquisition candidates expose candidate-only low-to-high cost escalation;
- linked-document-first and missing-evidence-only cases are tested;
- live output carries the escalation preview with no mutation;
- the retained AMA mechanism changed a bounded KRN readback surface.

Does not prove:

- source truth;
- retrieval ranking quality;
- autonomous worker safety;
- actual acquisition success;
- Memory Core usefulness;
- product readiness;
- benchmark transfer from the AMA paper.
