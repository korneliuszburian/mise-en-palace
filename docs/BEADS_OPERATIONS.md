# Beads history operations

`.beads/issues.jsonl` and `.beads/interactions.jsonl` are internal operational
history. They are not runtime Memory Core data or a public user-memory store.
The durable public-to-repo fields are issue ID, title, status, priority, type,
labels, proof/non-proof notes, closure reason, and dependency edges. Interaction
records are audit detail and may contain operator prose.

The repository owner, `@korneliuszburian`, owns retention and redaction. Keep
current issue snapshots and active dependency edges indefinitely while the
repository is maintained. After an issue has been closed for 180 days, an owner
may manually archive old interaction detail in a reviewed commit; never delete
an active issue, immutable issue ID, or active dependency edge. Redact secrets
immediately through an owner-reviewed commit, preserving only the fact that a
redaction occurred. No automated destructive compaction is enabled.

Before and after any manual archive, run:

```sh
rtk node scripts/validate-beads-history.mjs validate --issues .beads/issues.jsonl --interactions .beads/interactions.jsonl
rtk node scripts/validate-beads-history.mjs roundtrip --issues .beads/issues.jsonl --interactions .beads/interactions.jsonl
```

The validator rejects malformed JSONL, duplicate IDs, invalid status/priority,
dangling or self-dependency edges, unknown interaction issue IDs, and supported
credential/private-key patterns. The round-trip check proves active issue and
dependency graph preservation after serialization; it does not prove that
historical prose is semantically correct.

The three small validator predicates carry explicit Fallow suppressions because
their independent field checks are the contract itself; they are not a license
to suppress unrelated history or runtime code.
