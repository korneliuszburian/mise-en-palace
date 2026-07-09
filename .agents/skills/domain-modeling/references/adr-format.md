# ADR Format

Use this format when a KRN operating or architecture decision should survive a
fresh agent context.

ADRs live in `docs/adr/` and use sequential numbering:

```txt
0001-short-slug.md
0002-short-slug.md
```

## Template

```md
# Short title

One to three sentences: what was the context, what did we decide, and why.
```

## Optional Sections

Add only when they carry real information:

- `Status: proposed | accepted | deprecated | superseded by ADR-NNNN`
- `Considered Options`
- `Consequences`
- `Consumer`
- `Falsifier`
- `Verification`

## Creation Test

Create an ADR only when all are true:

1. hard to reverse;
2. surprising without context;
3. a real trade-off was made;
4. a future agent is likely to rediscover or undo the decision.
