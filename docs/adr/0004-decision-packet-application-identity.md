# DecisionPacket identity makes application idempotent

## Decision

One memory application is identified by the memory record, execution run, and
typed DecisionPacket checksum. The database owns that uniqueness boundary;
only the transaction that wins the unique insert may update usefulness
counters, feedback deltas, maintenance candidates, or outbox effects.

## Rejected alternative

A lookup followed by insert is not an idempotency boundary: independent
connections can both observe absence and double-count one retry.

## Consumer

The memory application transaction and all downstream usefulness effects.

## Falsifier

Two independent database connections applying the same packet create more than
one application row or more than one downstream counter/event effect.

## Contraction / rollback

Preserve the unique database key and contract downstream effects to the winning
insert if a new packet field is introduced; never restore lookup-before-insert
as authority.

The cc8f race and application persistence tests are the executable source of
truth; this ADR does not prove performance or distributed transaction safety.
