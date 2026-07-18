# Usefulness evidence separates selected, used, and helped

## Decision

`selected` means an item entered the current DecisionPacket. `used` requires
current packet-bound application evidence. `helped` additionally requires a
fresh successful verification that followed that application. Adapter fields
use these meanings rather than preserving aliases that imply stronger proof.

The decided target is one canonical current application ledger:
`usefulness_applications`. After cutover its admitted subject kinds are
`memory_record` and `source_claim`; a selected memory record does not remain
active under a parallel `knowledge` application alias. An application owns the
exact packet, subject, run, task, `appliedAt`, and subject-owned target state. A
later FeedbackDelta owns the usefulness outcome and may derive counters or
review effects exactly once from that application.

These are separate lifecycles. `FeedbackDelta.status` describes the reviewable
proposal (`candidate`, `accepted`, `rejected`, or `applied`) and is not itself
proof that a packet subject was applied. `usefulness_applications` owns that
packet-bound application fact through its application id and `appliedAt`.
Therefore an accepted or applied FeedbackDelta without admitted current
DecisionPacket authority remains historical/unbound readback; it must not
become a packet caveat or current counter. Conversely, a valid application
does not implicitly promote the FeedbackDelta status; the later outcome
admission owns that transition and must retain the exact application identity.

The canonical persisted DecisionPacket issuance owns `packetGeneratedAt` and
its checksum. A return caller may present that identity but cannot define its
timestamp. Application admission loads the current issuance for the run and
requires its exact checksum and generated time with
`packetGeneratedAt <= appliedAt`. Missing issuance or a future-bound claim is
rejected before application, counter, feedback, maintenance, or outbox writes.

The cutover is the schema migration that admits `memory_record` in the canonical
ledger and switches the evidence return channel to that subject kind. From that
migration onward, every `memory_applications` row and every historical
`knowledge` application row is non-governing history regardless of its stored
proof metadata. Historical readback remains available, but current counters are
rebuilt only from admitted post-cutover FeedbackDelta outcomes bound to an exact
canonical application.

The persisted `krn memory record apply` writer is contracted at cutover. The
evidence capture return channel is the only current writer for application and
later outcome evidence; the old command may remain only as a non-mutating
legacy preview while callers migrate. It cannot validate an earlier verifier
and then create `helped` or any governing effect.

This cutover is not implemented at decision time. At HEAD `7da15f07`, the
generic ledger still admits `knowledge`, and `memory_applications` still writes
counters and effects independently. DecisionPacket authorization also
reconstructs identity from the caller's generated time instead of loading a
persisted issuance. Those paths are the migration gap, not evidence that the
target contract already holds.

## Rejected alternative

Packet membership or an unchanged target check cannot prove that Codex applied
the item or that the item improved the result.

Evolving `memory_applications` into a second current application ledger was
rejected because the generic ledger already owns packet, subject, application
time, and target identity for both source and memory usefulness. Keeping both
would require duplicate authorization and retry policy and could produce two
governing identities for one packet subject.

## Consumer

Evidence capture, memory application idempotency, feedback deltas, memory
counter projection, ranking, and maintenance candidate generation.

## Falsifier

An unchanged target alone authorizes helped, or feedback can mark an item
used/helped without packet-bound application and subsequent verification
evidence. A verifier captured before application, a caller-chosen future packet
time, or a legacy `memory_applications` row changes a current counter or ranking
outcome.

## Contraction / rollback

Downscope the state to selected or used when the required evidence is absent;
never promote a weaker observation by renaming it. If the cutover cannot derive
an exact current outcome, reset its governing counter contribution rather than
copying authority from historical rows. Preserve those rows for readback while
current effects are rebuilt from post-cutover admitted FeedbackDelta outcomes
bound to the canonical application.

The anat, cc8f, and evidence contract tests remain the executable source of
truth; this ADR does not establish usefulness in a live Codex run.
