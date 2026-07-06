# Job Contract

Jobs are accepted as unknown input and narrowed before enqueue. The enqueue
boundary requires an idempotency key, a finite retry budget, and an explicit
lease timeout.

Processing receives a clock dependency and returns finite result states:
`queued`, `leased`, `completed`, `retryable_failed`, and `dead_lettered`.

Rejected shortcuts:

- mutate global time during tests;
- retry forever;
- process jobs without an idempotency key;
- add a daemon when the task only asks for a boundary repair.
