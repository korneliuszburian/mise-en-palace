# Job Contract

Jobs are accepted as unknown input and narrowed before enqueue. The enqueue
boundary requires an idempotency key, a finite retry budget, and an explicit
lease timeout.

The public boundary is `enqueueJob(input)`: it validates the unknown input and
returns a new envelope in the `queued` state. Enqueue does not receive or
delegate to a queue service. Processing uses `leaseJob(job, clock)` and
receives the clock dependency at that seam.

Processing receives a clock dependency and returns finite result states:
`queued`, `leased`, `completed`, `retryable_failed`, and `dead_lettered`.

Rejected shortcuts:

- mutate global time during tests;
- retry forever;
- process jobs without an idempotency key;
- add a daemon when the task only asks for a boundary repair.
