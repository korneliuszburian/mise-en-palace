# ADR-0023: Read-Only Run Readback Boundary

Status: accepted

Date: 2026-06-25

## Context

F-00 asked for a read-only external boundary after CLI readback proved useful.
The risk was product creep: building an MCP server, HTTP API, dashboard, or
write-capable integration before KRN has enough production evidence.

The repo already had a read-only DB-backed command:

```txt
krn run show --run-id <execution-run-id>
```

That command reduced ad hoc SQL usage but rendered human text only.

## Decision

Add a typed JSON mode to the existing read-only run readback command:

```txt
krn run show --run-id <execution-run-id> --json
```

The JSON resource uses:

```txt
kind: krn.run.readback.v1
access: read_only
mutation: none
```

It exposes task/run status, context counts, evidence changed-file
classification, command provenance, candidate reviewability, and proof
boundaries.

## Accepted Boundary

- CLI readback remains the only surface changed in this slice.
- The JSON resource is a read model over persisted state.
- No write endpoints, Memory Core mutation, source decision mutation, MCP tool,
  HTTP server, dashboard, or background worker is created.
- Future MCP/API surfaces must adapt typed read models; they must not become
  memory truth.

## Rejected Alternatives

- Build an MCP server now.
- Build an HTTP API now.
- Add write-capable external tools.
- Expose repository internals directly.
- Treat readback output as product readiness proof.

## Falsifier

If external consumers cannot use `krn run show --json` without parsing terminal
text, or if future integrations need direct DB access for basic run summary
state, this boundary is insufficient and should be replaced by a typed
read-model adapter.

