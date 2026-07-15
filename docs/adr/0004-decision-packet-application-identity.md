# DecisionPacket subject identity makes application idempotent

## Decision

One current application is identified by the execution run, typed
DecisionPacket checksum, subject kind, and subject id. The database owns that
uniqueness boundary in the canonical `usefulness_applications` ledger. A retry
with another application id or immutable payload conflicts rather than
returning a different application as equivalent.

The former `memory_applications` ownership statement is superseded by
[ADR 0003](./0003-usefulness-evidence-states.md). That table remains historical;
it does not own current application identity or downstream effects. A later
admitted FeedbackDelta owns its own exact-once outcome/effect transaction and
must reference the canonical application identity.

## Rejected alternative

A lookup followed by insert is not an idempotency boundary: independent
connections can both observe absence and double-count one retry.

## Consumer

Canonical application admission, FeedbackDelta outcome admission, counter
projection, maintenance, and outbox effects.

## Falsifier

Two independent database connections applying the same packet subject create
more than one canonical application row, or replaying one admitted FeedbackDelta
creates more than one downstream counter/event effect.

## Contraction / rollback

Preserve the canonical application and feedback uniqueness keys if a new packet
field is introduced; never restore lookup-before-insert as authority. Historical
`memory_applications` rows remain readable but cannot satisfy either current
uniqueness boundary.

The canonical application and feedback race tests are the executable source of
truth; this ADR does not prove performance or distributed transaction safety.
