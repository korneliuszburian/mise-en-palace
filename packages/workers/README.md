# KRN Workers

`@krn/workers` is a contract package for maintenance job descriptions and
enqueue ports.

Current truth:

- job types and payloads are typed;
- enqueue contracts can create a worker job and a `worker_job.queued` outbox
  event through caller-supplied repositories;
- job descriptions explicitly set `requiresBackgroundLoop: false`.

Not built:

- no worker daemon;
- no background loop;
- no job executor;
- no memory compaction runtime;
- no contradiction detection runtime;
- no stale-memory expiration runtime;
- no embedding worker runtime;
- no EvalCandidate promotion runtime.

Worker job persistence and smoke checks prove storage/readback lifecycle only.
They do not prove job execution, production throughput, autonomous maintenance,
or Memory Core mutation.
