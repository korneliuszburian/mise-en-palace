# KRN Maintenance Preview

`@krn/maintenance-preview` is a contract package for maintenance job descriptions and
enqueue ports.

Current truth:

- job types and payloads are typed;
- enqueue contracts require one queue port to create a maintenance queue record and the
  matching `maintenance_queue.queued` outbox event as one adapter-owned operation;
- source-relation maintenance candidate preview can propose reviewable maintenance
  candidates without mutating source truth or Memory Core;
- memory-staleness maintenance candidate preview can propose reviewable maintenance
  candidates without mutating Memory Core;
- maintenance candidate preview can aggregate memory-staleness and
  source-relation maintenance candidates without starting autonomous maintenance
  execution;
- consensus candidate evaluation preview can preserve support/dissent/risk
  evidence and graph relation review focus without creating autonomous truth;
- job descriptions explicitly set `executionMode: "persistence_only"`.

Not built:

- no autonomous maintenance daemon;
- no background loop;
- no job executor;
- no memory compaction runtime;
- no contradiction detection runtime;
- no stale-memory expiration runtime;
- no embedding maintenance runtime;
- no source-relation maintenance executor;
- no memory-staleness maintenance executor;
- no consensus agent runtime;
- no EvalCandidate promotion contract or runtime.

Maintenance queue persistence and smoke checks prove storage/readback lifecycle only.
They do not prove job execution, production throughput, autonomous maintenance,
or Memory Core mutation.
