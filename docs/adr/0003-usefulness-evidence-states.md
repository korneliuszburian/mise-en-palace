# Usefulness evidence separates selected, used, and helped

## Decision

`selected` means an item entered the current DecisionPacket. `used` requires
current packet-bound application evidence. `helped` additionally requires a
fresh successful verification that followed that application. Adapter fields
use these meanings rather than preserving aliases that imply stronger proof.

## Rejected alternative

Packet membership or an unchanged target check cannot prove that Codex applied
the item or that the item improved the result.

## Consumer

Evidence capture, memory application idempotency, feedback deltas, and
maintenance candidate generation.

## Falsifier

An unchanged target is marked helped, or feedback can mark an item used/helped
without packet-bound application and subsequent verification evidence.

## Contraction / rollback

Downscope the state to selected or used when the required evidence is absent;
never promote a weaker observation by renaming it.

The anat, cc8f, and evidence contract tests remain the executable source of
truth; this ADR does not establish usefulness in a live Codex run.
