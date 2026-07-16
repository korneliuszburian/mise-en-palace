# Source Usefulness

Load this branch after execution when retained source material materially
shaped an implementation or review decision.

Use the source-usefulness return channel rendered by the current
`DecisionPacket`. Do not reconstruct it from an older packet or omit its
binding fields. In this repository the wrapped command has this shape:

```text
rtk proxy pnpm krn evidence capture --run-id <execution-run-id> \
  --decision-packet-checksum <current-packet-checksum> \
  --decision-packet-generated-at <current-packet-generated-at> \
  --source-usefulness "decision:<selected-source-decision-id>=selected|<reason>|packet:<current-packet-checksum>,<evidence-ref>|<does-not-prove>" \
  --persist
```

Use only an exact canonical ID from the current packet's
`sourceDecisionIds`. A `targetId` from `sourceDecisionTargets` is the supported
architecture or product target, not a SourceDecision alias. IDs listed only in
`staleDecisionIds`, absent from the packet selection, or copied from an older
packet are unauthorized. The evidence refs must include the packet's own
`packet:<checksum>` ref. Use the separately rendered `claim:<id>` form when the
measured subject is a packet-selected SourceClaim instead.

If usefulness is not measured, record one bounded reason: no current bound
packet or persisted run, source rejected, background context only, no
implementation/review decision used it, or a legal/content boundary.

Stop when shaped source material has persisted usefulness feedback for the
named run, or one bounded reason explains why measurement is not available.
Preview output, an unbound command, or a command from an older packet is
non-proof. SourceDecision feedback is non-authoritative: it does not mutate the
decision's reviewed truth, prove its target correct, or justify automatic
promotion.
