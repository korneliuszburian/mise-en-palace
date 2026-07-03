# Post-Refactor Roadmap Claude Review

Slice: `mise-en-palace-ti9s`

Review:
- Ran governed `second-opinion-claude` on the post-refactor kernel queue.
- Verdict: `approve_with_fixes`, risk `HIGH`.

Accepted findings:
- Roadmap prose in a context pack is not durable enough. Created concrete Beads:
  - `mise-en-palace-uetf`: dogfood helped retained-pattern selection through evidence feedback.
  - `mise-en-palace-3vqp`: assess activation hybrid retrieval boundary without speculative embedding work.

Rejected with evidence:
- `embeddingModelId` defect is stale: `DrizzleRetrievalRepository.searchVector/searchHybrid` require model scope and focused tests assert missing model rejection.
- Capability binding cleanup residual is stale: active `CapabilityPlan` no longer exposes the old binding-candidate types.

Proof:
- CI for `bcdba50` passed: <https://github.com/korneliuszburian/mise-en-palace/actions/runs/28688128374>.

Non-proof:
- This review does not prove product readiness, vector ranking quality, or that activation should consume vector/hybrid retrieval before an embedding input exists.
