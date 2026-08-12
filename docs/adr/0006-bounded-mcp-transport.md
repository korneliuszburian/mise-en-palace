# MCP remains a bounded read-only protocol boundary

> **Status: Superseded by ADR 0007.** The transport discipline remains
> authoritative; the single-tool/read-only product boundary does not.

## Decision

KRN exposes one read-only DecisionPacket tool over the pinned MCP protocol
transport. JSON-RPC request IDs, notifications, invalid arguments, unknown
tools, and execution failures follow the protocol contract; the boundary does
not become a general executor or product server.

## Rejected alternative

A hand-rolled permissive protocol or additional tools would create a second
authority/execution surface and make protocol failures look like successful
product results.

## Consumer

Codex-facing DecisionPacket retrieval and its stdio integration tests.

## Falsifier

An invalid request receives a misleading successful result, a notification
produces a response, or the server exposes write/execution tools outside the
bounded read-only contract.

## Contraction / rollback

Keep the single read-only tool and remove unsupported protocol behavior rather
than widening the surface; upgrade only against an explicitly pinned protocol
version and conformance test.

The MCP transport tests and official protocol conformance are the executable
source of truth; this ADR does not prove Codex client compatibility by itself.
