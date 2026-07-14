# Active evidence is separate from historical evidence

## Decision

Current verification comes only from the active, task- and run-bound
`HarnessPlan`/`EvidenceContract`. Historical bundles remain read-only history
with their status, capture time, source run, provenance, and freshness intact;
they cannot silently become current commands or falsifiers.

The activation decision binds the parsed contract's top-level
`taskContractId` to the current task, then follows the persisted
`ExecutionRun.harnessPlanId -> HarnessPlan.id -> HarnessPlan.taskContractId`
relation. The decision carries the exact `executionRunId`; the plan-level
contract does not duplicate that database-owned identity in metadata.

## Lifecycle matrix

| TaskContract status | planned run | running run | succeeded / failed / blocked / cancelled run |
| --- | --- | --- | --- |
| active | active | active | inactive history |
| draft / superseded / closed | inactive | inactive | inactive history |

`HarnessPlan.status` is not a second lifecycle authority. The plan owns the
contract and binding relation, while the task and execution run decide whether
that contract is active. A missing, invalid, or mismatched binding fails closed
before lifecycle classification.

One plan may currently own more than one active execution run. The activation
decision is exact for the run being read, but this does not make the
plan-level contract a one-shot or run-specific command snapshot.

## Rejected alternative

Copying old commands into the current packet loses whether they were run,
whether they were bound to this task, and whether their result is still fresh.

## Consumer

DecisionPacket verification commands, evidence capture, readback, and eval
reports.

## Falsifier

A stale or unrelated historical command is emitted as a current verification
requirement without an active contract binding.

## Contraction / rollback

Retain historical evidence as explicitly labeled history; if no active
contract exists, emit an evidence gap rather than a current falsifier.

The zpwc contract/readback tests are the executable source of truth; this ADR
does not prove that a checker itself is correct.
