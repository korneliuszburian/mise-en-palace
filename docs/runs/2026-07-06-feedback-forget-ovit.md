# Feedback/Forget Product Path

Bead: `mise-en-palace-ovit`

## Outcome

`krn memory candidate add --persist` seeded one obsolete larger-slice closure
memory, `krn memory candidate promote --persist` promoted it through
MemoryReviewGate, and three `krn memory record apply --outcome stale --persist`
calls recorded negative feedback.

The next `krn plan --persist` excluded that MemoryRecord before context
inclusion:

```txt
memory_record:bd52c719-f96a-4e71-a57d-5d47f387cc6d
reason=unsafe
explanation=Memory review signal unresolved_negative_feedback
```

## Evidence

Marker: `ovit-1783323833`

Artifacts:

```txt
.local-lab/ovit/candidate-add.txt
.local-lab/ovit/candidate-promote.txt
.local-lab/ovit/apply-1.txt
.local-lab/ovit/apply-2.txt
.local-lab/ovit/apply-3.txt
.local-lab/ovit/plan-after-feedback.txt
```

Artifact hashes:

```txt
bec02535f5e11cfbc504670b94fd2dc6f3941439f0f29b167e8d389501570a96  apply-3.txt
9caad75041baf3b8d6ba6544441680b15479065fd52e05ebcdcba1d329e86f47  plan-after-feedback.txt
```

Last stale feedback excerpt:

```txt
memoryApplication: c4778bda-e6b6-44b8-b864-fe34e6327e78
memoryRecord: bd52c719-f96a-4e71-a57d-5d47f387cc6d
runId: 8f086705-91ab-4c3a-a43d-a6130cd98e1b
outcome: stale
Memory Core mutation: none
memoryFeedbackEvent: 266f9266-c2af-4623-b5f8-a68dba8cf4a7
antiMemoryCandidate: d72182fc-2127-4755-994e-d27b014f5ebb
Candidate reviewability: review
```

Next activation excerpt:

```txt
Context exclusions:
- memory_record:bd52c719-f96a-4e71-a57d-5d47f387cc6d | reason=unsafe | explanation=Memory review signal unresolved_negative_feedback: Repeated hurt/stale feedback must produce a governed demotion or invalidation review. | trust=high

Memory Records Used:
- none
```

DB readback:

```txt
memoryRecord: bd52c719-f96a-4e71-a57d-5d47f387cc6d
summary: Obsolete larger KRN migrations may close from local tests only without governed second-opinion review.
positiveFeedbackCount: 0
negativeFeedbackCount: 3
```

Readback command:

```sh
psql postgres://krn:krn@localhost:54329/krn \
  -c "select id, key, status, summary, positive_feedback_count, negative_feedback_count, metadata->>'ovitMarker' as marker from memory_records where id='bd52c719-f96a-4e71-a57d-5d47f387cc6d';"
```

## Proof Boundary

Proves:

- product CLI can record stale feedback for a reviewed MemoryRecord;
- repeated stale feedback increments Memory Core negative feedback;
- next activation excludes the stale MemoryRecord with readable
  `unresolved_negative_feedback` explanation;
- excluded memory is not rendered as a used memory in the Codex brief.

Does not prove:

- autonomous memory evolution;
- automatic pruning or deletion;
- ranking quality across arbitrary memories;
- that every stale decision has already been reviewed.

Rollback risk: low. The seeded memory is intentionally obsolete and now blocked
by negative feedback; removing it would require DB cleanup, not code rollback.

## Verification

```txt
pnpm docs:lint: passed
pnpm --filter @krn/harness test -- activation: passed
pnpm eval:memory-advantage: passed
pnpm eval:determinism: passed
pnpm db:smoke:brain-loop: passed
pnpm -r --workspace-concurrency=1 --if-present typecheck: passed
pnpm test: passed
pnpm quality:fallow:ci: passed
git diff --check: passed
```
