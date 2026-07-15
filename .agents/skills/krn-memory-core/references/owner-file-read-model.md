# Owner-File Read Model

Load this branch for `krn init --repo`, explicit owner-file capture, or an
activation read-model trial against a target repository.

Known owner files are explicit read-model inputs, not crawler output:

```text
rtk proxy pnpm krn init --dry-run --repo <target> \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"

rtk proxy pnpm krn init --connect --repo <target> --persist \
  --owner-file "src/index.ts|src|implementation_entry|implementation entry point"
```

Each entry is `path|root|kind|reason`.

When no owner files are supplied, record `missing_owner_file_read_model` as
read-model incompleteness. It does not prove owner files are absent, filesystem
crawling is required, or activation scoring is defective.

Stop when owner-file inputs are explicit or missing data is represented as
incompleteness rather than activation proof.
