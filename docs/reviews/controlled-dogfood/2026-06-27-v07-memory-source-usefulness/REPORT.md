# V07 Memory / Source Usefulness Loop Report

Status: controlled DB-backed usefulness re-gate.

Date: 2026-06-27

## Executive Verdict

V07-00 proves the current memory usefulness loop still works after V05 target
evidence repair and V06 owner-file recall assessment. In the current shell,
`pnpm db:smoke:target-repo-harness` created a target-like project, seeded a
MemoryRecord with SourceClaim lineage, planned a target-like run, included the
memory, recorded `MemoryApplication outcome=helped`, read back the positive
feedback count, preserved weak command proof boundaries, and cleaned up marker
rows.

Memory usefulness: proven in controlled fixture.

Source usefulness: partially proven as lineage/claim support, but not yet as a
first-class source application feedback loop. The exact missing path is a
source-usefulness readback surface equivalent to memory application feedback.

## Current-Shell Evidence

Command:

```sh
pnpm db:smoke:target-repo-harness
```

Result: passed.

Important output:

```txt
Memory included: yes
Memory usefulness outcome: helped
Memory usefulness readback: matched
Memory positive feedback count: 1
Automatic MemoryRecord mutation: none
Evidence readback: matched
Feedback delta readback: matched
Cleanup remaining marker count: 0
Target repo harness smoke: passed
```

IDs from this run:

```txt
Project: 268fcb20-bac5-45d9-8d6d-abf633a983af
Execution run: 89b01ef2-b450-4cd8-81a9-c4e724295ffc
Evidence bundle: 05555188-14fc-4540-85d9-67935368feb6
Review assessment: 472a75ab-0e9a-4315-8bb2-45563353dfaa
Feedback delta: 6dab8c9c-af95-4420-90ee-15b4f8b976c7
Memory seed record: 7f413dce-05a7-460e-abbe-a902d7d55022
Memory application: 47248a61-a54d-4485-8c09-776a1202119a
```

The smoke cleaned up marker rows, so these IDs are evidence from command output,
not durable rows expected to remain queryable.

## What This Proves

- A target-like DB-backed run can include a seeded MemoryRecord.
- KRN can record `MemoryApplication outcome=helped`.
- Positive feedback readback increments and is visible.
- Memory usefulness can be measured without automatic Memory Core mutation.
- Evidence/review/feedback readback remains intact in the same smoke.
- The smoke keeps target source seeds, owner files, and trust exclusions bounded.

## What This Does Not Prove

- Product-wide memory usefulness.
- Usefulness on arbitrary external target repos.
- Real second-operator usability.
- Automatic memory promotion should exist.
- Source usefulness has a first-class application feedback loop.
- Candidate promotion quality.

## Source Usefulness Gap

The smoke creates a SourceClaim as lineage for the seeded MemoryRecord. That is
valuable source grounding, but it is not equivalent to:

```txt
SourceClaim selected
  -> source expected use recorded
  -> source application outcome helped / neutral / hurt / stale
  -> source usefulness readback
  -> source feedback candidate if stale/hurt
```

Current state:

```txt
source usefulness as lineage: yes
source usefulness as first-class feedback/readback: not yet
```

Exact missing path:

- a typed source application or source usefulness readback equivalent;
- CLI/readback output that distinguishes selected source from helped source;
- a controlled guard proving source usefulness feedback does not mutate source
  truth automatically.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:smoke:target-repo-harness` | passed | Current-shell DB-backed target-like memory usefulness loop works and cleanup completed. | Does not prove arbitrary target repo usefulness or source application feedback. |
| `pnpm db:ready` | passed during V06 | Local Postgres was reachable with 14/14 migrations and pgvector before V07 smoke. | Does not prove another operator's DB state. |
| CI run `28283849675` | passed before V07 report | V06 code, tests, promptfoo smoke, DB readiness, and DB smoke passed remotely. | Does not include this docs-only V07 report until committed. |

## Brain Usefulness Verdict

Verdict: positive with a source-usefulness gap.

KRN's current memory path is useful enough for controlled internal-alpha
technical operators: a reviewed/seeded memory can be activated, applied, marked
helped, and read back. The source layer is still stronger as decision lineage
than as usefulness feedback.

## Candidate Outputs

MemoryCandidate:

- Summary: Target-like memory usefulness is measurable only when activation,
  application outcome, feedback count readback, and no automatic Memory Core
  mutation are recorded together.
- Evidence refs: this report; `packages/cli/src/targetRepoHarnessSmoke.ts`;
  `docs/reviews/controlled-dogfood/2026-06-26-target-memory-usefulness-loop/REPORT.md`.
- Does not prove: product-wide memory quality.
- Reviewability: ready.

RepairCandidate:

- Summary: Add a bounded source usefulness application/readback path.
- Evidence refs: this report; SourceClaim currently acts as lineage, not as a
  selected/used/helped feedback surface.
- Does not prove: source usefulness requires a new DB table; source inspection
  may find an existing metadata path.
- Reviewability: ready.

## Next Recommended Action

Promote a bounded follow-up:

```txt
V07-01 — Source Usefulness Application / Readback Path
```

The task should inspect existing source decision/readback models first. It
should not add a new source subsystem if existing SourceDecisionEdge or feedback
metadata can represent selected/used/helped source usefulness safely.
