# Config Contract

The fixture models a TypeScript service whose configuration boundary is easy to
overfit with notes:

- parse raw environment maps before reading domain config;
- narrow runtime mode to `development`, `staging`, or `production`;
- explicit config files override environment defaults;
- config readback redacts token and secret values;
- config repair should stay surgical.

Rejected paths:

- print raw secrets to debug faster;
- mutate `process.env` directly in every test;
- rewrite the framework to fix config parsing.
