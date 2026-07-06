# Codex Decision-Packet Obedience Eval

Bead: `mise-en-palace-we82`

## Outcome

Added `eval:codex-decision-packet-obedience`, a deterministic recorded-output
gate that checks whether a replayed Codex-style output preserves the selected
decision-packet boundaries.

The gate starts from the existing notes-baseline decision-packet fixture, builds
a compact decision-packet brief, and validates recorded output against:

- claimed-output evidence shape;
- explicit decision-packet brief receipt in verification evidence;
- governing decision evidence;
- stale-boundary evidence;
- rejected-path evidence;
- explicit packet-derived non-proof.

## Result

```txt
status: pass
caseCount: 2
validEvidenceShapeCount: 2
governedDecisionObedienceCount: 2
staleBoundaryObedienceCount: 2
rejectedPathObedienceCount: 2
nonProofObedienceCount: 2
```

## Proof

Proves:

- recorded Codex-output evidence can be checked against decision-packet brief
  fields;
- the checker rejects KRN-context-use claims that fail the shared output
  evidence-shape validator;
- governing/stale/rejected ids must appear in `evidenceRefs` or
  `verification`, not incidental prose or changed-file paths;
- governing decision, stale-boundary, rejected-path, and non-proof signals must
  survive into the recorded output.

Does not prove:

- live Codex execution;
- broad model obedience;
- LLM output quality;
- source truth;
- arbitrary repository portability;
- product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- codexDecisionPacketObedienceEval deterministicEval
pnpm --filter @krn/cli typecheck:tests:clean
pnpm eval:codex-decision-packet-obedience
pnpm eval:determinism
pnpm docs:lint
pnpm eval:behavior:smoke
pnpm -r --workspace-concurrency=1 --if-present typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```

## Second Opinion

`second-opinion-claude` first returned `approve_with_fixes` / `MEDIUM`:

- brief receipt was too tautological;
- non-proof preservation checked a hardcoded fixture phrase instead of packet
  `nonProofs`;
- only stale-boundary failure had a negative test;
- id matching was too loose across all output fields.

Accepted fixes:

- require `recorded-obedience:decision-packet-brief-read` in verification;
- require governing/stale/rejected ids in `evidenceRefs` or `verification`;
- derive non-proof preservation from `sourceCase.packet.nonProofs`;
- add negative tests for governing decision, stale boundary, rejected path,
  non-proof, brief receipt, and invalid evidence shape.

Focused re-review returned `approve` / `LOW`.
