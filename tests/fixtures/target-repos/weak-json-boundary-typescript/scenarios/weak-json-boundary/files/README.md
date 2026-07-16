# Controlled User-Creation Target

This small TypeScript target accepts a JSON string and runtime configuration to
create users. Its current implementation does not satisfy the invalid-input
contract in `docs/repair-contract.md`.

Keep the repair local to the existing package. Passing the target checks proves
only the documented target behavior; it does not prove portability or product
readiness.
