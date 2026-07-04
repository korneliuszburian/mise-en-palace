# Plan/Brief Memory Advantage

Status: implementation report for `mise-en-palace-m448`.

## Change

`pnpm db:smoke:target-repo-harness` now proves a DB-backed plan/brief memory
advantage path:

1. baseline compile/render runs after target repo/project setup but before the
   smoke MemoryRecord exists;
2. baseline Codex brief renders, but does not include or render the target
   MemoryRecord;
3. the smoke creates accepted source support through a SourceDecision;
4. grounded compile/render includes the MemoryRecord in ContextAssembly;
5. grounded Codex brief renders the MemoryRecord as used context;
6. memory application records `helped`, no automatic MemoryRecord mutation is
   introduced, and cleanup removes marker rows.

## Evidence

Verified command:

```sh
pnpm db:smoke:target-repo-harness
```

Observed readback summary:

```txt
Baseline Codex brief rendered: yes
Baseline memory included: no
Baseline context bytes: 5126
Baseline approximate tokens: 1282
Codex brief rendered: yes
Codex brief memory rendered: yes
Grounded context bytes: 5503
Grounded approximate tokens: 1376
Memory included: yes
Memory usefulness outcome: helped
Memory record drift: none
Automatic MemoryRecord mutation: none
Cleanup remaining marker count: 0
Target repo harness smoke: passed
```

## Proof Boundary

Proves:

- one live DB-backed target-repo harness path can miss a MemoryRecord before it
  exists and include it after governed source-backed seeding;
- the included MemoryRecord reaches the Codex-facing brief, not only
  brain-search selectedKnowledge;
- memory usefulness can be recorded as helped without automatic Memory Core
  mutation of MemoryRecord content/status/metadata.

Does not prove:

- arbitrary Codex output quality;
- broad memory ranking quality;
- source truth;
- autonomous memory writing;
- worker runtime usefulness;
- product readiness.

## Second Opinion

`second-opinion-claude` returned `approve_with_fixes` / `LOW`.

Accepted fixes:

- updated `PLAN.md` so the slice no longer read as merely in progress after
  verification;
- documented strict baseline-miss vs grounded-hit brief matching in code;
- added MemoryRecord content/status/metadata drift readback and report output;
- checked outbox behavior: SourceDecision and SourceDecisionEdge events carry
  `sourceClaimId`, and cleanup removes them before the claim row is deleted.

Rejected with evidence:

- exporting internal readback helpers only for unit tests. The proof path is a
  live DB smoke through repository aggregate readback and Codex rendering; adding
  exports would widen the CLI module surface just to test internals.

No second review loop was required.
