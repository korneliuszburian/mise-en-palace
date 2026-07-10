# Active evidence is separate from historical evidence

## Decision

Current verification comes only from the active, task- and run-bound
`HarnessPlan`/`EvidenceContract`. Historical bundles remain read-only history
with their status, capture time, source run, provenance, and freshness intact;
they cannot silently become current commands or falsifiers.

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
