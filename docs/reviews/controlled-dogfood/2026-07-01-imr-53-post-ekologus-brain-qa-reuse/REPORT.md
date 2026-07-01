# IMR-53 Post-EKOLOGUS Brain-QA Reuse Check

Status: complete.

Beads issue: `mise-en-palace-aqo`.

## Objective

Verify that the IMR-52 EKOLOGUS target-specific SourceClaim is reused by the
next brain-search readback, and that it does not add EKOLOGUS context waste to a
separate KRN pattern query.

## Boundary

```txt
mode: observation-only
target_repo: /home/krn/coding/krn/active/krn-ekologus
target_dirty_before: yes
target_status_freshness: fresh_current_task
target_patch_lifecycle: none
allowed_writes: KRN report/plan/beads state only
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

Run a compact DB-backed readback batch:

1. `krn source search --query "EKOLOGUS Brain quality gate"`.
2. `krn brain search --query "EKOLOGUS Brain quality gate"`.
3. `krn heartbeat preview --candidate-kind knowledge_acquisition` over the
   EKOLOGUS brain-search JSON.
4. `krn brain search --query "source artifact preview ingest loop"` as a KRN
   control query.

## Results

| Check | Result | Interpretation |
|---|---|---|
| EKOLOGUS source search | useful answer package, 4 supporting SourceClaims, 1 supporting SearchDocument | Existing source path still finds governed target evidence. |
| EKOLOGUS brain search | `target_specific_selected_knowledge` | IMR-52 SourceClaim is reused as selected brain knowledge. |
| EKOLOGUS selectedKnowledge | 1 target-specific, 3 generic guardrails | The target-specific packet is first; generic guardrails remain visible but no longer dominate. |
| EKOLOGUS heartbeat acquisition | 0 candidates | The resolved target-fit gap no longer emits acquisition work. |
| KRN ingest brain query | 4 target-specific selectedKnowledge packets | KRN pattern query still selects KRN ingest/source-artifact knowledge. |
| KRN ingest EKOLOGUS leakage | 0 selectedKnowledge mentions | EKOLOGUS target-specific packet did not leak into the KRN control query. |

First EKOLOGUS selectedKnowledge packet:

```txt
id: bc4731b9-8add-40f8-9df9-fb4bb9342b75
targetFit: target_specific
reviewability: ready
summary: For EKOLOGUS Brain quality gate work, KRN should select this target-specific SourceClaim and README SearchDocument evidence before treating generic selectedKnowledge as sufficient.
```

Control KRN query selectedKnowledge target-fit counts:

```txt
target_specific: 4
EKOLOGUS mentions: 0
```

## Source To Decision

Source: IMR-52 EKOLOGUS SourceClaim and current DB-backed readbacks.

Mechanism: source/brain search can now select the target-specific EKOLOGUS
SourceClaim before generic guardrails, while an unrelated KRN ingest query
selects only KRN-specific packets.

KRN implication: the target-fit acquisition path improved next-run reuse without
introducing observed cross-repo context leakage in this compact batch.

Decision: accept the IMR-52 reuse behavior. Do not open ranking/scoring repair.
Next prove the same target-specific selectedKnowledge can reach a Codex-facing
brief/context path.

Consumer: multi-repo brain search, Codex brief/context reuse work.

Falsifier: later EKOLOGUS queries lose the target-specific packet, or unrelated
KRN pattern queries begin selecting EKOLOGUS packets as relevant knowledge.

Does not prove: ranking quality at scale, product readiness, target repo
correctness, source truth beyond the README snapshot, autonomous heartbeat
runtime, source promotion, eval promotion, or Memory Core mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current-shell DB, migrations, and pgvector are ready. | Does not prove brain correctness or product readiness. |
| `rtk git -C /home/krn/coding/krn/active/krn-ekologus status --short --branch` | passed | Target dirty state was captured. | Does not prove target quality. |
| `krn source search --query "EKOLOGUS Brain quality gate" --json` | passed | Source search still finds target evidence. | Does not prove source truth. |
| `krn brain search --query "EKOLOGUS Brain quality gate" --json` | passed | Brain search reuses the EKOLOGUS target-specific packet. | Does not prove broad ranking quality. |
| `krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-imr53/ekologus-brain.json --json` | passed | Resolved EKOLOGUS readback emits no new acquisition candidate. | Does not prove autonomous heartbeat execution. |
| `krn brain search --query "source artifact preview ingest loop" --json` | passed | Control KRN query selects KRN-specific ingest/source-artifact packets. | Does not prove all KRN queries avoid target leakage. |

## Decision

IMR-52 reuse is accepted.

Next task:

```txt
mise-en-palace-41r: Prove target-specific brain knowledge in Codex brief reuse.
```
