# V343 Consensus Dissent Coverage Artifact

marker: krn-v343-consensus-dissent-coverage

query terms:
consensus candidate dissent decision options

claim:
V339 proved a consensus/eval preview can preserve support, dissent, risks, and
decision options without creating autonomous truth.

mechanism:
Consensus should produce reviewable candidate/eval output with preserved
dissent and explicit decision options; it must not decide truth by itself.

KRN implication:
Product-facing knowledge search should retrieve consensus/dissent coverage when
operators ask about consensus candidate decision options.

doesNotProve:
This artifact does not prove multi-agent consensus quality, truth quality,
product readiness, or autonomous promotion safety.

consumer:
V343 Product-Facing Knowledge Search Coverage Seed.

falsifier:
`krn source search --query "consensus candidate dissent decision options"`
cannot retrieve this artifact or its governed SourceClaim after persistence.
