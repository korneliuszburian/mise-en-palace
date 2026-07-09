# Owner-File Read Model

Use this reference for `krn init --repo`, owner-file capture, or
activation-read-model trials against a target repository.

Exact target owner files are explicit read-model inputs, not automatic crawler
output. If the bounded target task has known owner files, pass them through
`krn init`:

```sh
rtk proxy pnpm krn init --dry-run --repo <target> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

rtk proxy pnpm krn init --connect --repo <target> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"
```

Each entry is `path|root|kind|reason`.

If no owner files are provided, record `missing_owner_file_read_model` as
read-model incompleteness. Do not treat it as proof that owner files do not
exist, and do not repair activation scoring from that signal alone.

## Stop Condition

Stop when owner-file inputs are passed explicitly or the missing read model is
recorded as incompleteness, not as activation proof.
