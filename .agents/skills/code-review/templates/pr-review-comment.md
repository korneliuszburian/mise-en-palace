# PR Review Comment Template

Use this shape for future PR-comment back-and-forth between a checker agent and
Codex.

```md
## Finding

<bug, risk, spec drift, smell, or proof gap>

## Evidence

- File/line:
- Observed behavior or diff:
- Relevant convention/source:

## Requested Change

<smallest change or evidence needed>

## Stop Condition

<what would close this thread>
```

## Codex Response Shape

```md
## Response

<accepted / rejected with evidence / needs product decision>

## Change

<commit, diff summary, or why no code changed>

## Proof

<command output or explicit non-proof boundary>
```
