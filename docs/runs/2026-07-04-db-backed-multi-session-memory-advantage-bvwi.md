# DB-Backed Multi-Session Memory Advantage

Status: implementation report for `mise-en-palace-bvwi`.

## Change

`pnpm db:smoke:brain-search` now proves a two-session DB-backed memory path:

1. baseline `brain search --store-only` runs before Session A evidence exists
   and selects no smoke MemoryRecord or SourceClaim;
2. Session A persists a real harness spine through live repositories:
   TaskContract, HarnessPlan, ExecutionRun, EvidenceBundle, ReviewAssessment,
   and FeedbackDelta;
3. the smoke creates accepted source support, SearchDocument support, a
   MemoryCandidate linked to Session A `executionRunId` and `feedbackDeltaId`,
   and promotes it into a MemoryRecord;
4. Session B runs DB-backed `brain search --store-only` and selects both the
   Session A MemoryRecord and accepted SourceClaim support;
5. cleanup removes marker rows, including Session A run events and retrieval
   rows.

## Evidence

Verified command:

```sh
pnpm db:smoke:brain-search
```

Observed readback summary:

```txt
Session A task contract: present
Session A harness plan: present
Session A execution run: present
Session A evidence bundle: present
Session A review assessment: present
Session A feedback delta: present
Baseline smoke SourceClaim selected: no
Baseline smoke MemoryRecord selected: no
Grounded smoke SourceClaim selected: yes
Grounded smoke MemoryRecord selected: yes
Grounded selectedKnowledge packets: memory_store:<MemoryRecord>, source_search:<SourceClaim>
Grounded linked search documents: 1
Grounded source decision support: 1
Cleanup remaining marker count: 0
Brain search smoke: passed
```

## Proof Boundary

Proves:

- reviewed Session A evidence can persist through live DB repositories;
- a Session A feedback-linked MemoryCandidate can be promoted to MemoryRecord;
- later DB-backed brain search can select that MemoryRecord plus accepted source
  support;
- the smoke baseline misses before Session A memory/source evidence exists.

Does not prove:

- arbitrary Codex output quality;
- broad memory retrieval or ranking quality;
- source truth;
- autonomous memory writing;
- worker runtime usefulness;
- product readiness.

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` / `MEDIUM`.

Accepted fixes:

- removed duplicate cleanup deletes by consolidating marker-metadata cleanup;
- made harness-spine cleanup explicit for feedback, review, evidence,
  execution, harness plan, task contract, and operator intent rows;
- added count coverage for the new harness-spine marker rows;
- preserved Session A execution and feedback IDs in promoted MemoryRecord
  metadata and asserted they survive promotion;
- labeled the report readback block as a summary, not literal stdout.

Remaining boundary after triage:

- the smoke proves one controlled DB-backed multi-session path;
- it does not prove broad ranking quality, arbitrary Codex superiority, or
  autonomous memory writing.
