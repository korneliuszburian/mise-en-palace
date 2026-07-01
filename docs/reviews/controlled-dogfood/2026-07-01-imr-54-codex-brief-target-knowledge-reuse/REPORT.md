# IMR-54 Codex Brief Target-Knowledge Reuse

Status: complete.

Beads issue: `mise-en-palace-41r`.

## Objective

Prove that target-specific EKOLOGUS brain knowledge reaches a Codex-facing
brief/context path, not only `krn brain search`.

## Boundary

```txt
mode: observation-only
target_repo: /home/krn/coding/krn/active/krn-ekologus
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes: KRN Postgres plan/readback rows, KRN report/plan/beads state
forbidden_writes: target repo files, target commits, target pushes, target reset/clean
```

Target status:

```txt
## v1.3d28-polish-marketing-language-pack...origin/v1.3d28-polish-marketing-language-pack
?? GOAL.md
```

The target dirty file was external operator context. This slice did not write
to the target repo.

## Method

Use the existing DB-backed product path:

1. `krn plan --task "...EKOLOGUS Brain quality gate..." --persist`
2. `krn codex brief --run-id 07192df3-4656-48f4-b557-89f62c3e3d3d`
3. `krn run show --run-id 07192df3-4656-48f4-b557-89f62c3e3d3d`

No source repair was needed.

## Persisted IDs

```txt
operatorIntent: 5a6168ff-496d-4b51-a014-30e2b8b93835
taskContract: bf702051-314f-4d1f-9cce-1c43054398bb
harnessPlan: 1bc632c4-e74c-4533-b874-8060017b2bb2
contextAssembly: 19db8551-c808-4ccd-85df-552532a9af2b
executionRun: 07192df3-4656-48f4-b557-89f62c3e3d3d
```

## Results

| Check | Result | Interpretation |
|---|---|---|
| persisted plan | context assembled with 6 inclusions and 20 exclusions | Existing activation/context path selected bounded context. |
| first context inclusion | `source_claim:bc4731b9-8add-40f8-9df9-fb4bb9342b75` | EKOLOGUS target-specific packet is first in the Codex-facing context. |
| Codex brief readback | includes the same SourceClaim as first inclusion | Persisted `krn codex brief` path reuses the selected context. |
| Codex invocation | none | Brief rendering remains adapter/readback only. |
| Memory mutation | none | No Memory Core mutation occurred. |
| untrusted warning | one paper warning | Non-source-code context is still labeled as untrusted. |

First Codex brief inclusion:

```txt
source_claim:bc4731b9-8add-40f8-9df9-fb4bb9342b75
reason: EKOLOGUS Brain is a brand knowledge operating system, not a marketing chatbot, and its README defines the quality-gate command plus src/ekologus_brain, data, master_strategy, and docs as the main project surfaces.
expected_use: For EKOLOGUS Brain quality gate work, KRN should select this target-specific SourceClaim and README SearchDocument evidence before treating generic selectedKnowledge as sufficient.
trust: source-code
```

## Source To Decision

Source: IMR-52/IMR-53 EKOLOGUS SourceClaim reuse evidence and current persisted
plan/brief/run-show readbacks.

Mechanism: the same target-specific SourceClaim selected by brain search is
also selected by the persisted plan/context path and rendered by `krn codex
brief` as the first Codex-facing context inclusion.

KRN implication: the shared brain is now useful beyond search readback; it can
feed an execution brief without building a new adapter, ranking repair, crawler,
schema, worker, API/MCP, or target write path.

Decision: accept Codex brief reuse behavior. No source repair is needed in this
slice. Next close source-usefulness feedback for the selected SourceClaim through
the existing evidence/review path.

Consumer: Codex brief/context reuse and evidence source-usefulness feedback.

Falsifier: a future EKOLOGUS quality-gate plan/brief omits the target-specific
SourceClaim, or renders generic guardrails before the target-specific packet.

Does not prove: Codex executed work, target repo correctness, ranking quality at
scale, source truth beyond the README snapshot, product readiness, source truth
promotion, eval promotion, or Memory Core mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current-shell DB, migrations, and pgvector are ready. | Does not prove brain correctness. |
| `rtk git -C /home/krn/coding/krn/active/krn-ekologus status --short --branch` | passed | Target dirty state was captured. | Does not prove target quality. |
| `krn plan --task "...EKOLOGUS..." --persist` | passed | Plan/context path selects the EKOLOGUS SourceClaim first and persists run IDs. | Does not prove Codex execution or source truth. |
| `krn codex brief --run-id 07192df3-4656-48f4-b557-89f62c3e3d3d` | passed | Persisted Codex brief renders the target-specific SourceClaim first. | Does not prove the brief was used by Codex. |
| `krn run show --run-id 07192df3-4656-48f4-b557-89f62c3e3d3d` | passed | Persisted run readback preserves context details and activation trace. | Does not prove product readiness. |

## Decision

IMR-54 is accepted.

Next task:

```txt
mise-en-palace-x6u: Capture source-usefulness feedback for Codex brief reuse.
```
