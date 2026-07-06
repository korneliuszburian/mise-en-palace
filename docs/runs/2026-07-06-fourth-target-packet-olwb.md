# Fourth Target Packet Eval Olwb

Date: 2026-07-06

Bead: `mise-en-palace-olwb`

## Change

Added a fourth target-repo decision-packet corpus:

- `async-job-boundary-typescript`;
- failure mode: async job boundary, idempotency, retry budget, lease timeout,
  clock injection, and no-daemon scope;
- fixture evidence under `tests/fixtures/target-repos/async-job-boundary-typescript`;
- eval corpus under `tests/fixtures/second-repo/async-job-decision-packet-vs-notes.json`.

The active `eval:second-repo-decision-packet` script now runs three target
corpora instead of two.

## Verification

```sh
pnpm --filter @krn/cli test -- secondRepoDecisionPacketEval
pnpm eval:second-repo-decision-packet
pnpm eval:determinism
```

Result: passed.

Current readback:

- target repos: 3;
- cases: 45;
- target-repo-backed current decisions: 28;
- reusable TypeScript pattern decisions: 9;
- rejected paths: 11;
- stale decisions: 9;
- self-repo contamination refs: 0;
- notes KRN win rate: 1.0 for each repo;
- decision-packet useful rate: 1.0 for each repo.

## Proves

- The target-repo packet eval now covers a different stack shape than weak JSON
  parsing and env config.
- The async job target carries target-specific decisions, reusable TypeScript
  patterns, stale paths, rejected paths, and zero scanned self-repo evidence
  contamination.
- Deterministic eval includes the new target corpus.

## Does Not Prove

- Live Codex execution or obedience.
- Arbitrary repository portability.
- Source truth.
- Production async worker correctness.
- That KRN should build a worker daemon now.

## Second Opinion

`second-opinion-claude` reviewed the uncommitted diff with
`SECOND_OPINION_BASE=HEAD` and returned `approve` / `LOW`.

Non-blocking notes:

- existing negative tests were not expanded with a fourth-repo-specific
  mutation, but the positive aggregate now requires the fourth repo metrics;
- reusable pattern decisions keep the same `docs/standards/*` convention as
  prior target corpora;
- the target source is intentionally a minimal evidence anchor for packet eval,
  not a production async queue implementation.
