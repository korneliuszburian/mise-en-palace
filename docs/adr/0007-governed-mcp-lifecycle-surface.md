# Governed MCP lifecycle surface

## Status

Accepted. Supersedes ADR 0006's single read-only tool boundary while retaining
its pinned, fail-closed transport discipline.

## Decision

KRN exposes one bounded lifecycle surface over the existing MCP stdio server.
The total tool set is exactly:

- `krn_decision_packet` — read-only DecisionPacket retrieval;
- `recall` — read-only active-memory retrieval;
- `brief` — read-only deterministic, token-budgeted memory rendering;
- `remember` — SQLite-only proposal of a `proposed` memory candidate;
- `feedback` — SQLite-only packet-bound usefulness feedback for an active
  memory record.

`feedback` requires a real execution run, an issued DecisionPacket checksum, and
proof that the packet selected the target memory record. `helped` requires the
packet binding; `hurt` and `stale` additionally require a caller note as the
minimal evidence context. The operation is idempotent over the run, packet,
record, and outcome tuple and updates feedback-aware counters atomically.

The server remains pinned to MCP protocol `2025-06-18`, newline-delimited JSON
RPC over stdio, strict request and notification handling, bounded input/output,
and fail-closed argument parsing. MCP does not own ranking policy, unconstrained
capture, promotion, or source authority.

`remember` writes only through the existing repository contract and only when
the selected backend is SQLite. PostgreSQL remains read-only for this surface;
the existing SELECT-only role proof is unchanged. A candidate without accepted
project-scoped SourceClaims is intentionally proposal-only. Accepted claims,
when supplied, are verified through the source repository and become evidence
refs; MCP never creates or accepts source authority.

The lifecycle owns one store connection. SQLite read operations use the
infrastructure-owned connection-local `PRAGMA query_only` guard and restore it
in `finally`; this proves repository-path mutation denial, not an OS-level
immutable handle.

## Why this changed

MCP is now the primary agent interface, the abstention scorer exists in code,
and the SQLite governed-artifact store provides a local write boundary. ADR
0006's transport safeguards remain useful, but its single read-only product
boundary no longer describes the accepted product.

## Rejected alternatives

- A second MCP package or server: forbidden by repository and release-boundary
  policy and would create a parallel authority surface.
- Direct MemoryRecord creation, auto-promotion, event-only feedback, or
  synthetic execution-run evidence: these bypass existing Memory Core gates.
- PostgreSQL MCP writes: deferred until a least-privilege write role is
  explicitly designed and proven.

## Falsifiers

The decision is false if the registry does not expose exactly these five tools,
`feedback` accepts an unverified run/packet/record binding, `feedback` or
`remember` writes through PostgreSQL, a proposal bypasses the review gate,
read-only operations mutate domain rows/migration identity, or the server
relaxes the pinned transport/session contract.

The persisted `krn plan --backend sqlite --persist` path is the local dogfooding
entry point for this surface: it issues the run and DecisionPacket identities
that `feedback` requires, without requiring `KRN_DATABASE_URL`.
