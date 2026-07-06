# Live Codex Decision-Packet Obedience Pilot

Bead: `mise-en-palace-9u9w`

## Command

```sh
codex exec \
  --sandbox read-only \
  -c approval_policy='never' \
  --cd /home/krn/coding/krn/active/mise-en-palace \
  --ephemeral \
  --output-schema .local-lab/codex-live-obedience/9u9w/output.schema.json \
  --output-last-message .local-lab/codex-live-obedience/9u9w/output.json \
  - < .local-lab/codex-live-obedience/9u9w/prompt.md
```

Environment readback from the command:

```txt
model: gpt-5.5
approval: never
sandbox: read-only
tokens used: 16,062
```

The first attempted command used `--ask-for-approval never`; this Codex CLI
version rejected that flag for `codex exec`, so the successful runs used
`-c approval_policy='never'`. The first schema-valid live output preserved the
governing, stale, and rejected signals but failed the checker because it omitted
the exact packet non-proof phrases. The second live output preserved the full
packet non-proof set and is the committed fixture.

The fixture `changedFiles` field names the committed capture path. It is not a
claim that Codex edited product code during the read-only pilot.

## Result

The live output was captured as
`tests/fixtures/codex-decision-packet-obedience/live-pilot-2026-07-06.json` and
checked by the existing decision-packet obedience evaluator.

It preserved:

- governing decision: `store-backed-memory-no-markdown`;
- stale boundary: `markdown-runtime-memory`;
- rejected path: `create-markdown-memory-files`;
- decision-packet brief receipt;
- evidence refs, verification refs, changed files, and explicit non-proof.

## Proof

Proves:

- one live `codex exec` output can follow a compact KRN decision-packet brief;
- the existing obedience checker can validate live-output artifacts, not only
  hand-written recorded fixtures;
- the run can be bounded by read-only sandbox, approval disabled, and a JSON
  output schema.

Does not prove:

- broad live Codex obedience;
- LLM output quality;
- arbitrary repository portability;
- source truth;
- product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- codexDecisionPacketObedienceEval
pnpm eval:codex-decision-packet-obedience
pnpm eval:codex-decision-packet-obedience:live-pilot
```
