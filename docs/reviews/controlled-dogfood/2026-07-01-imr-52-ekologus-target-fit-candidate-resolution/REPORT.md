# IMR-52 EKOLOGUS Target-Fit Candidate Resolution

Status: complete.

Beads issue: `mise-en-palace-83t`.

## Objective

Resolve the IMR-51 heartbeat acquisition candidate for the
`EKOLOGUS Brain quality gate` query.

The candidate asked for target-specific SourceClaim evidence because brain
search had useful source evidence but only generic selected knowledge.

## Target Boundary

```txt
mode: observation-only
target_repo: /home/krn/coding/krn/active/krn-ekologus
target_file: README.md
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes: KRN Postgres brain store, KRN report/plan/beads state
forbidden_writes: target repo files, target commits, target pushes, target reset/clean
handoff_artifact: this report
```

Target status before and after:

```txt
## v1.3d28-polish-marketing-language-pack...origin/v1.3d28-polish-marketing-language-pack
?? GOAL.md
```

The target dirty file was external operator context. This slice did not create,
modify, stage, commit, push, reset, or clean target files.

## Source To Decision

Source: `/home/krn/coding/krn/active/krn-ekologus/README.md`.

Mechanism: the target README states project identity, quality-gate command, and
the main owner surfaces (`src/ekologus_brain`, `data`, `master_strategy`,
`docs`). Persisting this as a SourceClaim gives brain search target-specific
selected knowledge before generic KRN guardrails.

KRN implication: for `EKOLOGUS Brain quality gate` work, KRN should select the
target-specific EKOLOGUS SourceClaim and README SearchDocument evidence before
treating generic selected knowledge as sufficient.

Decision: accept the acquisition candidate by creating proposed target-specific
SourceClaim evidence through the existing source artifact preview path. Do not
change activation scoring, ranking, crawler, schema, API/MCP, worker runtime,
target repo files, eval promotion, source truth status, or Memory Core.

Consumer: multi-repo brain search and future EKOLOGUS target-fit readbacks.

Falsifier: future EKOLOGUS README no longer states this identity/topology/
quality-gate boundary, or `krn brain search --query "EKOLOGUS Brain quality
gate"` cannot retrieve this SourceClaim as target-specific selected knowledge.

Does not prove: EKOLOGUS implementation correctness, target test health,
marketing quality, source truth beyond the README snapshot, ranking quality,
product readiness, or Memory Core mutation.

## Persisted Evidence

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --silent --filter @krn/cli krn source artifact preview --file /home/krn/coding/krn/active/krn-ekologus/README.md --chunk-lines 20 --limit-chunks 2 --claim "<EKOLOGUS README claim>" --mechanism "<mechanism>" --krn-implication "<implication>" --does-not-prove "<boundary>" --support-type implementation-boundary --trust-tier source-code --consumer "EKOLOGUS target-fit brain search" --falsifier "<falsifier>" --persist --json
```

Result:

```txt
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
sourceArtifact: 8d6560bc-e415-41f2-8bb6-2067ae5d5afc
sourceChunks:
  - 481227d0-94a3-4e90-8ffb-a348330e7cba
  - ff664856-428a-4782-83eb-d3de96a6a789
searchDocument: e9bc9b90-7c8b-4f15-8533-0e1bef560e4b
sourceClaim: bc4731b9-8add-40f8-9df9-fb4bb9342b75
sourceClaimReadback: hit
mutation: KRN source artifact/chunk/SearchDocument/proposed SourceClaim rows only
```

## Before / After

| Readback | Before | After |
|---|---|---|
| source search top claim | generic KRN graph/source claims | `bc4731b9-8add-40f8-9df9-fb4bb9342b75` EKOLOGUS README SourceClaim |
| brain targetFit verdict | `generic_only_selected_knowledge` | `target_specific_selected_knowledge` |
| targetSpecific count | `0` | `1` |
| genericGuardrail count | `4` | `3` |
| heartbeat acquisition candidates | `1` from IMR-51 q2 readback | `0` after target-specific selected knowledge exists |

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk git -C /home/krn/coding/krn/active/krn-ekologus status --short --branch` | passed | Target dirty state was captured and unchanged. | Does not prove target correctness. |
| `rtk pnpm db:ready` | passed | Current-shell KRN DB is reachable with migrations and pgvector. | Does not prove source truth. |
| baseline source/brain search JSON | passed | The pre-existing gap was real: useful source evidence with generic-only selected knowledge. | Does not prove ranking bug. |
| `krn source artifact preview --persist --claim ... --json` | passed | Existing path persisted target README artifact, chunks, SearchDocument, and proposed SourceClaim. | Does not prove source truth, crawler readiness, or Memory Core mutation. |
| after source search JSON | passed | Source search selects the EKOLOGUS SourceClaim as supporting evidence. | Does not prove broad multi-repo recall. |
| after brain search JSON | passed | Brain search targetFit changed to `target_specific_selected_knowledge`. | Does not prove ranking quality or product readiness. |
| after heartbeat preview JSON | passed | The same readback no longer emits a knowledge acquisition gap. | Does not prove autonomous heartbeat execution. |

## Pattern Feedback

- `source-to-decision-retention-gate`: helped. The target evidence was retained
  only with mechanism, KRN implication, consumer, falsifier, and does-not-prove.
- `target-repo-testing`: helped. The target repo stayed observation-only and
  dirty state was preserved.
- `cost-aware-acquisition-escalation-boundary`: helped indirectly. The cheapest
  route was existing source artifact/readback, not external research, ranking,
  crawler, or schema work.

## Decision

The IMR-51 candidate is accepted and resolved.

Next action: run a compact post-resolution multi-repo Brain-QA check to ensure
the new target-specific packet improves EKOLOGUS recall without increasing KRN
generic context waste.
