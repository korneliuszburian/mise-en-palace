# SQLite dogfooding

KRN's default local store is the governed SQLite artifact at
`<project>/.krn/memory.db`.  This guide is for a technical operator proving
the bounded memory loop; it does not authorize automatic promotion.

## Setup

```sh
git clone <krn-repository-url> krn
cd krn && pnpm install
pnpm --filter @krn/cli krn init --connect --repo /path/to/project --persist --backend sqlite
```

The target project must be a real local repository. `init` creates the
connection and migrations; it does not import arbitrary files as memory.

## MCP configuration

Put the following in the target repository's `.claude/settings.json` (or add
the same `mcpServers.krn` object to the equivalent Codex MCP configuration).
Replace `/absolute/path/to/krn` and `/absolute/path/to/project`.

```json
{
  "mcpServers": {
    "krn": {
      "command": "pnpm",
      "args": ["--dir", "/absolute/path/to/krn", "--filter", "@krn/cli", "mcp:decision-packet"],
      "env": {
        "INIT_CWD": "/absolute/path/to/project",
        "KRN_DB_BACKEND": "sqlite"
      }
    }
  }
}
```

The server exposes `krn_decision_packet`, `remember`, `recall`, `brief`, and
`feedback`. `remember` creates a proposed candidate only; `recall` and
`brief` are read-only.

## Operator loop

1. Issue a real persisted run and packet:

   ```sh
   pnpm --filter @krn/cli krn plan --backend sqlite --persist \
     --repo /path/to/project --task "Describe the task" --json
   ```

   Keep `handoff.identity.executionRunId` and
   `handoff.packetIdentity.checksum`. They are the exact feedback binding.

2. In the MCP client, call `remember` with a concise candidate. If it might
   later be promoted, include accepted project `sourceClaimIds`; an
   ungrounded proposal correctly fails the review gate.

3. Review and promote only evidence-backed candidates. The CLI review action
   requires an explicit reviewer and `evidenceReviewedRef`; it creates the
   active `MemoryRecord` only after `MemoryReviewGate` passes. This is a human
   decision, not auto-promotion.

4. Call `feedback` with the promoted `memoryRecordId`, outcome (`helped`,
   `hurt`, or `stale`), the real run ID, and packet checksum. `hurt` and
   `stale` require a note. The binding is checked atomically and replays are
   idempotent.

5. Call `recall` and `brief` for the next task. Record whether the returned
   ordering and selected guidance changed; do not infer usefulness from a
   successful write alone.

Compare the packet issued before feedback with the subsequent packet:

```sh
pnpm --filter @krn/cli krn packet diff --before-run <run-id> --after-run <run-id> --json
```

The command is read-only. `selection_changed` means the selected memory IDs
changed; `ordering_changed` means the same IDs changed positions; and
`not_comparable` is fail-closed for a different project, missing, or malformed
packet readback.

## Record metrics

For each project, record the date range, candidate count, promoted count, and
feedback outcomes (`helped`, `hurt`, `stale`). For every feedback entry, retain
the run ID/checksum and compare the next packet/recall ordering with the prior
readback. Also record operator friction verbatim, for example: “feedback
requires too many fields.” These observations are evidence, not a claim of
ranking quality or broad KRN advantage.

Run this on two or three real projects for one to two weeks before making a
product claim. No such longitudinal evidence is manufactured by the synthetic
smoke below.

## Synthetic proof

The `dogfood` script creates a fresh project, migrates it, creates and
reviews/promotes a grounded candidate, issues a packet-bound feedback event,
and verifies the readback. It then prints the metrics the synthetic fixture
actually proves. Run it with:

```sh
pnpm --filter @krn/cli dogfood
```

It reports one candidate, one promoted record, the fixture's `helped`, `hurt`,
and `stale` packet-bound feedback events, one deterministic recall readback,
and the fixture's `selection_changed` packet diff. It does not prove that
feedback caused that change, so it is not a substitute for the real-project
metrics above.
