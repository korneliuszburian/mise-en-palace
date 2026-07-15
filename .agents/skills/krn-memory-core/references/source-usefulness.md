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
  --source-usefulness "claim:<selected-claim-id>=helped|<reason>|packet:<current-packet-checksum>,<evidence-ref>|<does-not-prove>" \
  --persist
```

The claim must be selected by that packet, and its evidence refs must include
the packet's own `packet:<checksum>` ref. SourceDecision usefulness is not a
supported return channel because the packet does not expose canonical selected
SourceDecision ids; record claim-scoped usefulness instead.

If usefulness is not measured, record one bounded reason: no current bound
packet or persisted run, source rejected, background context only, no
implementation/review decision used it, or a legal/content boundary.

Stop when shaped source material has persisted usefulness feedback for the
named run, or one bounded reason explains why measurement is not available.
Preview output, an unbound command, or a command from an older packet is
non-proof. This feedback does not prove the source true or justify automatic
promotion.
