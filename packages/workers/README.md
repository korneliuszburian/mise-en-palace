# KRN Workers

`@krn/workers` is a contract package for maintenance job descriptions and
enqueue ports.

Current truth:

- job types and payloads are typed;
- enqueue contracts require one queue port to create a worker job and the
  matching `worker_job.queued` outbox event as one adapter-owned operation;
- source-relation heartbeat preview can propose reviewable maintenance
  candidates without mutating source truth or Memory Core;
- memory-staleness heartbeat preview can propose reviewable maintenance
  candidates without mutating Memory Core;
- brain heartbeat preview can aggregate memory-staleness and source-relation
  maintenance candidates without starting autonomous worker execution;
- consensus candidate evaluation preview can preserve support/dissent/risk
  evidence and graph relation review focus without creating autonomous truth;
- job descriptions explicitly set `requiresBackgroundLoop: false`.

Not built:

- no worker daemon;
- no background loop;
- no job executor;
- no memory compaction runtime;
- no contradiction detection runtime;
- no stale-memory expiration runtime;
- no embedding worker runtime;
- no source-relation maintenance executor;
- no memory-staleness maintenance executor;
- no consensus agent runtime;
- no EvalCandidate promotion contract or runtime.

Worker job persistence and smoke checks prove storage/readback lifecycle only.
They do not prove job execution, production throughput, autonomous maintenance,
or Memory Core mutation.
